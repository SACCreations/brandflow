import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting full knowledge wipe...');
  
  // Try to delete children first just in case cascades aren't on everything
  await prisma.knowledgeEmbedding.deleteMany();
  await prisma.knowledgeChunk.deleteMany();
  await prisma.knowledgeIngestionLog.deleteMany();
  await prisma.knowledgeSyncHistory.deleteMany();
  await prisma.knowledgeFailedRecord.deleteMany();
  await prisma.knowledgeJob.deleteMany();
  await prisma.knowledgeAudit.deleteMany();
  await prisma.knowledgeCitation.deleteMany();
  await prisma.knowledgeRelationship.deleteMany();
  await prisma.knowledgeReview.deleteMany();
  await prisma.knowledgeEntry.deleteMany();
  
  // Finally delete sources
  const deletedSources = await prisma.knowledgeSource.deleteMany();
  console.log(`Successfully wiped ${deletedSources.count} Knowledge Sources and all associated data.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
