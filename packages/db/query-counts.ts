import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sourcesCount = await prisma.knowledgeSource.count();
  const entriesCount = await prisma.knowledgeEntry.count();
  
  console.log("Sources count:", sourcesCount);
  console.log("Entries count:", entriesCount);
}
main().finally(() => prisma.$disconnect());
