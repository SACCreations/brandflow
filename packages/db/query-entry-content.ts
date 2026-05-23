import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.knowledgeEntry.findMany({
    take: 5,
    select: { content: true }
  });
  console.log("Entry contents:");
  entries.forEach(e => console.log("---", e.content.substring(0, 200)));
}
main().finally(() => prisma.$disconnect());
