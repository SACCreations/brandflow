import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const brand = await prisma.brand.findFirst();
  if (!brand) return console.log('no brand');
  const sources = await prisma.knowledgeSource.findMany({ where: { brandId: brand.id } });
  const sourceIds = sources.map(s => s.id);
  const entries = await prisma.knowledgeEntry.findMany({ where: { sourceId: { in: sourceIds } } });
  console.log('Brand:', brand.name, 'Entries:', entries.length);
  if (entries.length > 0) {
    console.log('Sample entry:', entries[0].content);
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
