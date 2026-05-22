import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.knowledgeEntry.findMany({
    select: { content: true }
  });
  const uniqueContents = new Set(entries.map(e => e.content));
  console.log("Total entries:", entries.length);
  console.log("Unique contents:", uniqueContents.size);
  console.log(Array.from(uniqueContents));
}
main().finally(() => prisma.$disconnect());
