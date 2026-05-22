import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.knowledgeSource.findMany({
    where: { sourceUrl: { contains: 'pdf' } }
  });
  console.log("PDF Sources:", sources.map(s => s.id));
  
  if (sources.length > 0) {
    const count = await prisma.knowledgeEntry.count({
      where: { sourceId: sources[0].id }
    });
    console.log("Entries for first PDF source:", count);
  }
}
main().finally(() => prisma.$disconnect());
