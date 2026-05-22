import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const entries = await prisma.knowledgeEntry.findMany();
  console.log('Total entries:', entries.length);
  if (entries.length > 0) console.log('Sample:', entries[0].content, 'Business:', entries[0].businessId);
  
  const sources = await prisma.knowledgeSource.findMany();
  console.log('Total sources:', sources.length);
  if (sources.length > 0) console.log('Source sample:', sources[0].brandId);
}
run().finally(() => prisma.$disconnect());
