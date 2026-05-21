import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find matching Brands
  const brands = await prisma.brand.findMany({
    where: {
      OR: [
        { website: { contains: 'rentasst', mode: 'insensitive' } },
        { website: { contains: 'processdrive', mode: 'insensitive' } },
        { name: { contains: 'rentasst', mode: 'insensitive' } },
        { name: { contains: 'processdrive', mode: 'insensitive' } },
      ],
    },
  });
  const brandIds = brands.map(b => b.id);

  // Find matching KnowledgeSources and those belonging to the matching brands
  const ks = await prisma.knowledgeSource.findMany({
    where: {
      OR: [
        { sourceUrl: { contains: 'rentasst', mode: 'insensitive' } },
        { sourceUrl: { contains: 'processdrive', mode: 'insensitive' } },
        { brandId: { in: brandIds.length > 0 ? brandIds : ['impossible-id'] } }
      ],
    },
  });
  const ksIds = ks.map(k => k.id);

  if (ksIds.length > 0) {
    console.log(`Found ${ksIds.length} KnowledgeSources to clean up.`);

    // KnowledgeChunks -> KnowledgeEmbeddings (assuming chunk cascade or no cascade)
    // First find chunks to delete embeddings if needed
    const chunks = await prisma.knowledgeChunk.findMany({
      where: { sourceId: { in: ksIds } }
    });
    const chunkIds = chunks.map(c => c.id);
    if (chunkIds.length > 0) {
      await prisma.knowledgeEmbedding.deleteMany({
        where: { chunkId: { in: chunkIds } }
      }).catch(() => {});
      await prisma.knowledgeChunk.deleteMany({
        where: { sourceId: { in: ksIds } }
      }).catch(() => {});
    }

    // Other KS dependencies
    await prisma.knowledgeIngestionLog.deleteMany({ where: { sourceId: { in: ksIds } } }).catch(() => {});
    await prisma.knowledgeSyncHistory.deleteMany({ where: { sourceId: { in: ksIds } } }).catch(() => {});
    await prisma.knowledgeFailedRecord.deleteMany({ where: { sourceId: { in: ksIds } } }).catch(() => {});
    
    // KnowledgeEntry dependencies (citations, reviews, relationships)
    const entries = await prisma.knowledgeEntry.findMany({ where: { sourceId: { in: ksIds } } });
    const entryIds = entries.map(e => e.id);
    if (entryIds.length > 0) {
      await prisma.knowledgeCitation.deleteMany({ where: { entryId: { in: entryIds } } }).catch(() => {});
      await prisma.knowledgeReview.deleteMany({ where: { entryId: { in: entryIds } } }).catch(() => {});
      await prisma.knowledgeRelationship.deleteMany({ where: { fromEntryId: { in: entryIds } } }).catch(() => {});
      await prisma.knowledgeRelationship.deleteMany({ where: { toEntryId: { in: entryIds } } }).catch(() => {});
      await prisma.knowledgeEntry.deleteMany({ where: { sourceId: { in: ksIds } } }).catch(() => {});
    }

    await prisma.knowledgeJob.deleteMany({ where: { sourceId: { in: ksIds } } }).catch(() => {});
    await prisma.knowledgeAudit.deleteMany({ where: { sourceId: { in: ksIds } } }).catch(() => {});

    // Finally delete KnowledgeSources
    const deletedKs = await prisma.knowledgeSource.deleteMany({
      where: { id: { in: ksIds } }
    });
    console.log('KnowledgeSources deleted:', deletedKs.count);
  }

  if (brandIds.length > 0) {
    console.log(`Found ${brandIds.length} Brands to clean up.`);
    
    // Brand dependencies
    // Contents
    const contents = await prisma.content.findMany({ where: { brandId: { in: brandIds } } });
    const contentIds = contents.map(c => c.id);
    if (contentIds.length > 0) {
      await prisma.contentVersion.deleteMany({ where: { contentId: { in: contentIds } } }).catch(() => {});
      await prisma.approval.deleteMany({ where: { contentId: { in: contentIds } } }).catch(() => {});
      await prisma.qualityCheck.deleteMany({ where: { contentId: { in: contentIds } } }).catch(() => {});
      await prisma.publishJob.deleteMany({ where: { contentId: { in: contentIds } } }).catch(() => {});
      await prisma.schedule.deleteMany({ where: { contentId: { in: contentIds } } }).catch(() => {});
      await prisma.content.deleteMany({ where: { brandId: { in: brandIds } } }).catch(() => {});
    }

    await prisma.asset.deleteMany({ where: { brandId: { in: brandIds } } }).catch(() => {});
    await prisma.generatedImage.deleteMany({ where: { brandId: { in: brandIds } } }).catch(() => {});
    await prisma.imageGenerationJob.deleteMany({ where: { brandId: { in: brandIds } } }).catch(() => {});
    
    // Delete Brands
    const result = await prisma.brand.deleteMany({
      where: { id: { in: brandIds } }
    });
    console.log('Brands deleted:', result.count);
  }

  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
