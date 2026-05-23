import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { QUEUES } from '@brandflow/shared';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';
import * as crypto from 'crypto';
import { WebConnector } from './connectors/web.connector';
import { LLMGateway, TextSplitter, VectorService } from '@brandflow/ai';

type KnowledgeEntryClassification =
  | 'product'
  | 'feature'
  | 'faq'
  | 'claim'
  | 'pricing'
  | 'testimonial'
  | 'audience'
  | 'objective'
  | 'guideline'
  | 'legal'
  | 'fact';

interface KnowledgeAtom {
  type: KnowledgeEntryClassification;
  content: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Token-based text chunker
// ---------------------------------------------------------------------------
const CHUNK_SIZE = 500;    // approximate tokens
const CHUNK_OVERLAP = 100;

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly webConnector = new WebConnector();
  private readonly aiGateway = new LLMGateway({ defaultProvider: 'openai' });
  private readonly splitter = new TextSplitter(CHUNK_SIZE, CHUNK_OVERLAP);
  private readonly vectorService = new VectorService();

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.KNOWLEDGE_INGESTION) private readonly queue: Queue,
  ) {}

  // -------------------------------------------------------------------------
  // Enqueue a source for background ingestion
  // -------------------------------------------------------------------------
  async enqueue(sourceId: string, businessId: string, text?: string) {
    const source = await this.prisma.client.knowledgeSource.findUniqueOrThrow({
      where: { id: sourceId },
    });

    const job = await this.prisma.client.knowledgeJob.create({
      data: { sourceId, businessId, status: 'pending' },
    });

    await this.queue.add(
      'process-knowledge',
      {
        sourceId,
        businessId,
        jobId: job.id,
        type: source.type,
        sourceUrl: source.sourceUrl ?? undefined,
        text,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 50,
        removeOnFail: { age: 604800 }, // 7 days retention for observability
      },
    );

    await this.prisma.client.knowledgeSource.update({
      where: { id: sourceId },
      data: { status: 'processing' },
    });

    return job;
  }

  // -------------------------------------------------------------------------
  // Run the full ingestion pipeline for a single source
  // Called directly from KnowledgeProcessor.process()
  // -------------------------------------------------------------------------
  async runPipeline(jobId: string, sourceId: string, businessId: string, type: string, sourceUrl?: string, text?: string) {
    await this.log(sourceId, 'INFO', `Pipeline started for source=${sourceId} type=${type}`);

    try {
      // 1. INTAKE — fetch raw content
      await this.updateJobStage(jobId, 'intake', 10);
      await this.log(sourceId, 'INFO', 'Stage: INTAKE');
      const rawContent = await this.intake(type, sourceUrl, text);

      // 2. EXTRACTION — convert to plain text
      await this.updateJobStage(jobId, 'extraction', 30);
      await this.log(sourceId, 'INFO', 'Stage: EXTRACTION');
      const source = await this.prisma.client.knowledgeSource.findUniqueOrThrow({ where: { id: sourceId } });
      const mimeType = (source.metadata as any)?.mimeType ?? '';
      const plainText = await this.extract(type, rawContent, mimeType);

      // 3. CLEANING
      await this.updateJobStage(jobId, 'cleaning', 50);
      await this.log(sourceId, 'INFO', 'Stage: CLEANING');
      const cleaned = this.clean(plainText);

      // 4. CHUNKING + DEDUPLICATION
      await this.updateJobStage(jobId, 'chunking', 60);
      await this.log(sourceId, 'INFO', 'Stage: CHUNKING');
      const chunks = this.splitter.split(cleaned);
      await this.log(sourceId, 'INFO', `Produced ${chunks.length} chunks`);

      // 5. CLASSIFICATION
      await this.updateJobStage(jobId, 'classification', 70);
      await this.log(sourceId, 'INFO', 'Stage: CLASSIFICATION');
      const atoms = await this.classify(chunks, businessId);

      // 6. INDEXING (dedup + persist atoms + embeddings)
      await this.updateJobStage(jobId, 'indexing', 85);
      await this.log(sourceId, 'INFO', 'Stage: INDEXING');
      const indexed = await this.index(sourceId, businessId, atoms);
      await this.log(sourceId, 'INFO', `Indexed ${indexed} new atoms`);

      // 7. RECORD SYNC HISTORY
      await this.prisma.client.knowledgeSyncHistory.create({
        data: { sourceId, details: `${indexed} atoms indexed, ${chunks.length} chunks processed` },
      });

      // 8. COMPLETE
      await this.prisma.client.knowledgeJob.update({
        where: { id: jobId },
        data: { status: 'completed', progress: 100, completedAt: new Date() },
      });
      await this.prisma.client.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: 'completed', lastIngested: new Date() },
      });
      await this.log(sourceId, 'INFO', 'Pipeline completed successfully');
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      this.logger.error(`Pipeline failed for ${sourceId}: ${msg}`);
      await this.log(sourceId, 'ERROR', `Pipeline failed: ${msg}`);

      // Persist failed record
      await this.prisma.client.knowledgeFailedRecord.create({
        data: { sourceId, error: msg },
      });

      await this.prisma.client.knowledgeJob.update({
        where: { id: jobId },
        data: { status: 'failed', error: msg },
      });
      await this.prisma.client.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: 'failed' },
      });

      // Avoid re-throwing if we want the queue to just mark it as failed gracefully,
      // but BullMQ needs the throw to trigger retries.
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // INTAKE: fetch raw bytes / text from source
  // -------------------------------------------------------------------------
  private async intake(type: string, sourceUrl?: string, text?: string): Promise<any> {
    switch (type) {
      case 'url':
        if (!sourceUrl) throw new Error('sourceUrl is required for URL source type');
        return this.webConnector.crawl(sourceUrl);

      case 'pdf':
      case 'docx':
      case 'xlsx':
      case 'csv':
      case 'txt':
      case 'pptx':
        if (!text) throw new Error(`text (base64) is required for file type: ${type}`);
        // Strip data-URL prefix if present
        const b64 = text.includes('base64,') ? text.split('base64,')[1]! : text;
        const buffer = Buffer.from(b64, 'base64');
        // Enforce 50MB file size limit
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (buffer.length > MAX_FILE_SIZE) {
          throw new Error(`File exceeds maximum size of 50MB (received ${Math.round(buffer.length / 1024 / 1024)}MB)`);
        }
        return buffer;

      case 'text':
      case 'manual':
        return text ?? '';

      default:
        return text ?? sourceUrl ?? '';
    }
  }

  // -------------------------------------------------------------------------
  // EXTRACTION: convert raw bytes → plain text
  // -------------------------------------------------------------------------
  private async extract(type: string, raw: any, mimeType?: string): Promise<string> {
    const effectiveType = type || this.mimeToType(mimeType ?? '');

    if (Buffer.isBuffer(raw)) {
      if (effectiveType === 'pdf' || mimeType === 'application/pdf') {
        const result = await pdf(raw);
        return result.text;
      }
      if (effectiveType === 'docx' || mimeType?.includes('wordprocessingml')) {
        const result = await mammoth.extractRawText({ buffer: raw });
        return result.value;
      }
      if (effectiveType === 'xlsx' || mimeType?.includes('spreadsheetml')) {
        const wb = XLSX.read(raw, { type: 'buffer' });
        return wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name]!;
          return XLSX.utils.sheet_to_csv(ws);
        }).join('\n\n');
      }
      if (effectiveType === 'csv' || mimeType === 'text/csv') {
        const text = raw.toString('utf-8');
        const records = csvParse(text, { skip_empty_lines: true }) as string[][];
        return records.map((row) => row.join(' | ')).join('\n');
      }
      if (effectiveType === 'pptx' || mimeType?.includes('presentationml')) {
        // pptx is a ZIP archive — extract XML slide content
        try {
          const { extractPptxText } = await import('./utils/pptx-extractor.js');
          return await extractPptxText(raw);
        } catch {
          // Fallback: try reading as UTF-8 and extracting text nodes
          const text = raw.toString('utf-8');
          const matches = text.match(/<a:t>(.*?)<\/a:t>/g) ?? [];
          return matches.map((m: string) => m.replace(/<[^>]+>/g, '')).join(' ');
        }
      }
      // Generic: try to read as UTF-8 text
      return raw.toString('utf-8');
    }

    if (typeof raw === 'string') return raw;
    return String(raw);
  }

  // -------------------------------------------------------------------------
  // CLEANING: strip boilerplate, normalise whitespace
  // -------------------------------------------------------------------------
  private clean(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // -------------------------------------------------------------------------
  // CLASSIFICATION via LLM (with fallback to raw chunks)
  // -------------------------------------------------------------------------
  public async classify(chunks: string[], businessId: string): Promise<KnowledgeAtom[]> {
    const allAtoms: KnowledgeAtom[] = [];
    const BATCH_SIZE = 5;
    const CONCURRENCY = 5;

    // Group chunks into batches
    const batches: string[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      batches.push(chunks.slice(i, i + BATCH_SIZE));
    }

    // Process batches with a concurrency limit
    for (let i = 0; i < batches.length; i += CONCURRENCY) {
      const concurrentBatches = batches.slice(i, i + CONCURRENCY);
      
      const results = await Promise.all(
        concurrentBatches.map(async (batchChunks) => {
          const text = batchChunks.join('\n---\n');
          const prompt = `
You are an expert Brand Intelligence Engineer.
Extract "Identity Atoms" from the text below.
An Identity Atom is an atomic, self-contained fact about a brand, product, audience, or guideline.

Classify each atom as one of EXACTLY these strings:
[product, feature, faq, claim, pricing, testimonial, audience, objective, guideline, legal, fact]

Rules:
- Each atom must be self-contained.
- Assign confidence 0.0–1.0 based on how explicit the fact is.
- Do NOT hallucinate.
- Return ONLY a valid JSON object containing an "atoms" array. Example: {"atoms": [{"type":"<classification_from_list>","content":"...","confidence":0.9}]}

Text:
${text}
          `.trim();

          try {
            const { response } = await this.aiGateway.complete(
              'You are a Brand Knowledge Extractor. You only output valid JSON objects.',
              prompt,
              { model: 'gpt-4o-mini', jsonMode: true },
            );
            
            // Strip markdown fences just in case
            const cleanContent = response.content.replace(/```json/gi, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanContent);
            
            // Find the array no matter what the key is
            let atoms: any[] = [];
            if (Array.isArray(data)) {
              atoms = data;
            } else if (data && typeof data === 'object') {
              for (const val of Object.values(data)) {
                if (Array.isArray(val)) {
                  atoms = val;
                  break;
                }
              }
            }
            
            if (atoms.length > 0) {
              return atoms.map((a: any) => ({
                type: (a.type || a.classification || a.category || 'fact').toLowerCase(),
                content: a.content || a.text || a.fact || '',
                confidence: a.confidence ?? 0.8
              })).filter((a: any) => a.content.trim().length > 0);
            }
          } catch (err: any) {
            this.logger.warn(`AI classification failed for batch: ${err?.message}`);
          }

          // Fallback: raw chunks as atoms for this batch
          return batchChunks.map((c) => ({
            type: 'fact' as KnowledgeEntryClassification,
            content: c,
            confidence: 0.6,
          }));
        })
      );

      for (const res of results) {
        allAtoms.push(...res);
      }
    }

    return allAtoms;
  }

  // -------------------------------------------------------------------------
  // INDEXING: dedup + persist KnowledgeEntry + embedding
  // -------------------------------------------------------------------------
  private async index(sourceId: string, businessId: string, atoms: KnowledgeAtom[]): Promise<number> {
    // Batch dedup: compute all hashes upfront, then do a single DB query
    const atomsWithHashes = atoms.map(atom => ({
      atom,
      hash: crypto.createHash('md5').update(atom.content).digest('hex'),
    }));

    const allHashes = atomsWithHashes.map(a => a.hash);
    const existingEntries = await this.prisma.client.knowledgeEntry.findMany({
      where: { businessId, contentHash: { in: allHashes } },
      select: { contentHash: true },
    });
    const existingHashSet = new Set(existingEntries.map(e => e.contentHash));

    const newAtoms = atomsWithHashes.filter(({ hash }) => !existingHashSet.has(hash));

    const rows: any[] = [];
    const CONCURRENCY = 10;

    // Generate embeddings concurrently
    for (let i = 0; i < newAtoms.length; i += CONCURRENCY) {
      const batch = newAtoms.slice(i, i + CONCURRENCY);
      
      const batchRows = await Promise.all(
        batch.map(async ({ atom, hash }) => {
          let embedding: string | undefined;
          try {
            const vec = await this.vectorService.generateEmbedding(atom.content);
            embedding = this.vectorService.formatForStorage(vec);
          } catch {
            // embedding is optional — proceed without
          }

          return {
            businessId,
            sourceId,
            classification: atom.type,
            content: atom.content,
            contentHash: hash,
            confidence: atom.confidence ?? 0.8,
            version: 1,
            embedding: embedding ? JSON.stringify(embedding) : null,
            metadata: { extractionDate: new Date().toISOString() },
          };
        })
      );
      
      rows.push(...batchRows);
    }

    if (rows.length > 0) {
      await this.prisma.client.knowledgeEntry.createMany({ data: rows });
    }

    return rows.length;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  private async updateJobStage(jobId: string, stage: string, progress: number) {
    await this.prisma.client.knowledgeJob.update({
      where: { id: jobId },
      data: { stage, progress },
    });
  }

  private async log(sourceId: string, level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string) {
    try {
      await this.prisma.client.knowledgeIngestionLog.create({
        data: { sourceId, level: level as any, message },
      });
    } catch { /* non-critical */ }
    this.logger[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](message);
  }

  private mimeToType(mime: string): string {
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('wordprocessingml')) return 'docx';
    if (mime.includes('spreadsheetml')) return 'xlsx';
    if (mime === 'text/csv') return 'csv';
    if (mime.includes('presentationml')) return 'pptx';
    return 'text';
  }

  // -------------------------------------------------------------------------
  // Public: get per-source ingestion logs for the monitoring UI
  // -------------------------------------------------------------------------
  async getLogs(sourceId: string, businessId: string) {
    // Validate ownership
    await this.prisma.client.knowledgeSource.findFirstOrThrow({
      where: { id: sourceId, businessId },
      select: { id: true },
    });
    return this.prisma.client.knowledgeIngestionLog.findMany({
      where: { sourceId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getFailedRecords(businessId: string) {
    const sources = await this.prisma.client.knowledgeSource.findMany({
      where: { businessId },
      select: { id: true },
    });
    return this.prisma.client.knowledgeFailedRecord.findMany({
      where: { sourceId: { in: sources.map((s) => s.id) } },
      orderBy: { failedAt: 'desc' },
      take: 100,
    });
  }

  async getSyncHistory(sourceId: string, businessId: string) {
    await this.prisma.client.knowledgeSource.findFirstOrThrow({
      where: { id: sourceId, businessId },
      select: { id: true },
    });
    return this.prisma.client.knowledgeSyncHistory.findMany({
      where: { sourceId },
      orderBy: { syncedAt: 'desc' },
    });
  }
}
