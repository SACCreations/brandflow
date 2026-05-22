import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.knowledgeSource.findMany({
    include: {
      _count: {
        select: { entries: true }
      }
    }
  });
  console.table(sources.map(s => ({ name: s.name, sourceUrl: s.sourceUrl, entries: s._count.entries })));
}
main().finally(() => prisma.$disconnect());
