import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.knowledgeEntry.findMany({
    take: 5,
    include: { source: { select: { sourceUrl: true } } }
  });
  entries.forEach(e => {
    console.log(`Source: ${e.source?.sourceUrl} | Content: ${e.content.substring(0, 100)}`);
  });
}
main().finally(() => prisma.$disconnect());
