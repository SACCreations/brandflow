import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import type { Prisma } from '@brandflow/db';
import { QUEUES } from '@brandflow/shared';
import { LLMGateway, TextSplitter, VectorService } from '@brandflow/ai';
import { PrismaService } from '../../common/database/prisma.service';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as Sentry from '@sentry/node';
import * as crypto from 'crypto';
import { WebConnector } from './connectors/web.connector';
import { KnowledgeAtom, KnowledgeEntryClassification } from '@brandflow/shared';

interface IngestionJobData {
  sourceId: string;
  businessId: string;
  type: string;
  sourceUrl?: string;
  text?: string;
}

enum IngestionStage {
  INTAKE = 'intake',
  EXTRACTION = 'extraction',
  CLEANING = 'cleaning',
  CLASSIFICATION = 'classification',
  INDEXING = 'indexing',
}

@Processor(QUEUES.KNOWLEDGE_INGESTION)
export class KnowledgeProcessor extends WorkerHost {
  private readonly logger = new Logger(KnowledgeProcessor.name);
  private readonly aiGateway: LLMGateway;
  private readonly vectorService: VectorService;
  private readonly splitter: TextSplitter;
  private readonly webConnector: WebConnector;

  constructor(private readonly prisma: PrismaService) {
    super();
    this.aiGateway = new LLMGateway({ defaultProvider: 'openai' });
    this.vectorService = new VectorService();
    this.splitter = new TextSplitter(1000, 200);
    this.webConnector = new WebConnector();
  }

  async process(job: Job<IngestionJobData>): Promise<void> {
    const { sourceId, businessId, type, sourceUrl, text } = job.data;
    this.logger.log(`[INGESTION] Starting source ${sourceId} (${type})`);

    // Create tracking job
    const knowledgeJob = await this.prisma.client.knowledgeJob.create({
      data: {
        businessId,
        sourceId,
        status: 'processing',
        stage: IngestionStage.INTAKE,
        startedAt: new Date(),
      },
    });

    await this.prisma.client.knowledgeSource.update({
      where: { id: sourceId },
      data: { status: 'processing' },
    });

    try {
      // 1. INTAKE
      await this.updateJob(knowledgeJob.id, IngestionStage.INTAKE, 10);
      const rawData = await this.runIntake(type, sourceUrl, text);

      // 2. EXTRACTION
      await this.updateJob(knowledgeJob.id, IngestionStage.EXTRACTION, 30);
      const extractedText = await this.runExtraction(type, rawData);

      // 3. CLEANING
      await this.updateJob(knowledgeJob.id, IngestionStage.CLEANING, 50);
      const cleanedText = await this.runCleaning(extractedText);

      // 4. CLASSIFICATION
      await this.updateJob(knowledgeJob.id, IngestionStage.CLASSIFICATION, 70);
      const atoms = await Sentry.startSpan({ name: 'Knowledge Ingestion: Classification', op: 'ingestion.classification' }, async () => {
        return await this.runClassification(cleanedText, businessId);
      });

      // 5. INDEXING
      await this.updateJob(knowledgeJob.id, IngestionStage.INDEXING, 90);
      await Sentry.startSpan({ name: 'Knowledge Ingestion: Indexing', op: 'ingestion.index' }, async () => {
        await this.runIndexing(sourceId, businessId, atoms);
      });

      // COMPLETE
      await this.prisma.client.knowledgeJob.update({
        where: { id: knowledgeJob.id },
        data: {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
        },
      });

      await this.prisma.client.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: 'completed', lastIngested: new Date() },
      });

      this.logger.log(`[INGESTION] Completed source ${sourceId}: ${atoms.length} atoms indexed`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`[INGESTION] Failed for ${sourceId}:`, errorMessage);

      await this.prisma.client.knowledgeJob.update({
        where: { id: knowledgeJob.id },
        data: { status: 'failed', error: errorMessage },
      });

      await this.prisma.client.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: 'failed' },
      });

      throw err;
    }
  }

  private async updateJob(jobId: string, stage: IngestionStage, progress: number) {
    await this.prisma.client.knowledgeJob.update({
      where: { id: jobId },
      data: { stage, progress },
    });
  }

  private async runIntake(type: string, sourceUrl?: string, text?: string): Promise<any> {
    this.logger.debug(`Stage: Intake (${type})`);
    if (type === 'url' && sourceUrl) {
      return await this.webConnector.crawl(sourceUrl);
    }
    return text ?? '';
  }

  private async runExtraction(type: string, rawData: any, contentType?: string): Promise<string> {
    this.logger.debug(`Stage: Extraction (${contentType})`);
    
    if (contentType === 'application/pdf') {
      const data = await pdf(rawData);
      return data.text;
    }
    
    if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const data = await mammoth.extractRawText({ buffer: rawData });
      return data.value;
    }

    return typeof rawData === 'string' ? rawData : 'Extracted content';
  }

  private async runCleaning(text: string): Promise<string> {
    this.logger.debug(`Stage: Cleaning`);
    // Remove boilerplate, navigation, excessive whitespace
    return text.replace(/\s+/g, ' ').trim();
  }

  private async runClassification(text: string, businessId: string): Promise<KnowledgeAtom[]> {
    this.logger.debug(`Stage: Classification`);
    
    // Use improved semantic chunking (Structural + Recursive)
    const chunks = this.splitter.split(text);

    // Identity Atom Extraction
    const prompt = `
      You are an expert Brand Intelligence Engineer. Your task is to extract "Identity Atoms" from the provided text.
      An Identity Atom is an atomic, independent fact about a brand, product, audience, or guideline.
      
      Classify each atom as one of:
      [product, feature, faq, claim, pricing, testimonial, audience, objective, guideline, legal, fact].
      
      Guidelines:
      - Each atom should be self-contained (carry enough context to be understood on its own).
      - If a chunk contains multiple facts, split them into multiple atoms.
      - Assign a confidence score (0.0 - 1.0) based on how explicit the fact is.
      - Do NOT hallucinate. If no clear facts are present, return an empty list.
      
      Return ONLY a JSON array of objects: 
      { "type": "KnowledgeEntryClassification", "content": "string", "confidence": number }
      
      Text to analyze:
      ${chunks.join('\n---\n')}
    `;

    try {
      const { response } = await this.aiGateway.complete(
        "You are a Brand Knowledge Extractor. You only output valid JSON arrays.",
        prompt,
        { model: 'gpt-4o-mini', jsonMode: true }
      );

      const atoms = JSON.parse(response.content);
      return Array.isArray(atoms) ? atoms : chunks.map((c: string) => ({ 
        type: 'fact' as KnowledgeEntryClassification, 
        content: c, 
        confidence: 0.8 
      }));
    } catch (err) {
      this.logger.warn(`AI Classification failed, falling back to basic chunks: ${err}`);
      return chunks.map((c: string) => ({ 
        type: 'fact' as KnowledgeEntryClassification, 
        content: c, 
        confidence: 0.5 
      }));
    }
  }

  private async runIndexing(sourceId: string, businessId: string, atoms: KnowledgeAtom[]) {
    this.logger.debug(`Stage: Indexing ${atoms.length} atoms`);

    const indexedAtoms: any[] = [];

    for (const atom of atoms) {
      const contentHash = crypto.createHash('md5').update(atom.content).digest('hex');

      // Check for existing atom with same hash for this business
      const existing = await this.prisma.client.knowledgeEntry.findFirst({
        where: { businessId, contentHash },
      });

      if (existing) {
        this.logger.debug(`Skipping duplicate atom: ${contentHash}`);
        continue;
      }

      const embedding = await this.vectorService.generateEmbedding(atom.content);
      indexedAtoms.push({
        businessId,
        sourceId,
        classification: atom.type,
        content: atom.content,
        contentHash,
        confidence: atom.confidence ?? 0.8,
        version: 1,
        metadata: {
          extractionDate: new Date().toISOString(),
          sourceType: 'automated',
          ...atom.metadata
        } as any,
        embedding: this.vectorService.formatForStorage(embedding),
      });
    }

    if (indexedAtoms.length > 0) {
      await this.prisma.client.knowledgeEntry.createMany({
        data: indexedAtoms,
      });
    }

    this.logger.debug(`Successfully indexed ${indexedAtoms.length} new atoms`);
  }
}
