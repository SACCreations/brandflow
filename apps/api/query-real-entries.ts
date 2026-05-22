import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.knowledgeEntry.findMany({
    select: { sourceId: true, content: true }
  });
  console.log("Total entries in DB:", entries.length);
  if (entries.length > 0) {
    console.log("First entry sourceId:", entries[0].sourceId);
    console.log("First entry content preview:", entries[0].content.substring(0, 50));
  }
}
main().finally(() => prisma.$disconnect());
