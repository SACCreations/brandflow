import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const brand = await prisma.brand.findFirst({ where: { name: 'RentAsst' } });
  if (!brand) return;
  
  const sources = await prisma.knowledgeSource.findMany({ where: { brandId: brand.id } });
  const sourceIds = sources.map(s => s.id);
  const entries = await prisma.knowledgeEntry.findMany({ where: { sourceId: { in: sourceIds } } });
  
  console.log('Entries for RentAsst:', entries.length);
  for (let i = 0; i < Math.min(3, entries.length); i++) {
    console.log(entries[i].content);
  }
}
run().finally(() => prisma.$disconnect());
