const { IngestionService } = require('./apps/api/dist/modules/knowledge/ingestion.service');
const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');

const prisma = new PrismaClient();
const queue = new Queue('knowledge-ingestion');

async function main() {
  const service = new IngestionService(prisma, queue);
  const chunks = ["This is a test chunk.", "Another test chunk."];
  const atoms = await service.classify(chunks, "business-id-test");
  console.log("Classified atoms count:", atoms.length);
  console.log("Atoms:", JSON.stringify(atoms, null, 2));
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  queue.close();
});
