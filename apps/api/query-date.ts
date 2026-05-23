import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.knowledgeEntry.findMany({
    select: { content: true, createdAt: true }
  });
  console.log("Entries:", entries.length);
  if (entries.length > 0) {
    console.log(entries[0]);
  }
}
main().finally(() => prisma.$disconnect());
