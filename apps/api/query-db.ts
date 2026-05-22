import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.knowledgeEntry.findMany({
    select: { content: true }
  });
  console.log("Unique contents:", Array.from(new Set(entries.map(e => e.content))));
}
main().finally(() => prisma.$disconnect());
