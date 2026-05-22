import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.knowledgeEntry.findMany({
    take: 5,
    select: { content: true, createdAt: true }
  });
  console.log(entries);
}
main().finally(() => prisma.$disconnect());
