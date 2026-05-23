const { IngestionService } = require('./apps/api/dist/modules/knowledge/ingestion.service');
const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');

const prisma = new PrismaClient();
const queue = new Queue('knowledge-ingestion');

async function main() {
  const service = new IngestionService(prisma, queue);
  const chunks = ["chunk 1"];
  const atoms = await service.classify(chunks, "business-id-test");
  console.log("Classified atoms:", atoms.length, atoms);
}
main().catch(console.error).finally(() => { prisma.$disconnect(); queue.close(); });
