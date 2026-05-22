import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.knowledgeSource.findMany();
  const entries = await prisma.knowledgeEntry.count();
  console.log("Sources count:", sources.length);
  console.log("Entries count:", entries);
  if (sources.length > 0) {
    console.log("First source created at:", sources[0].createdAt);
  }
}
main().finally(() => prisma.$disconnect());
