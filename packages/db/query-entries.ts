import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.knowledgeSource.findMany();
  console.log("Sources:", sources);
  
  const entries = await prisma.knowledgeEntry.findMany({ take: 5 });
  console.log("Entries count:", await prisma.knowledgeEntry.count());
  console.log("First 5 entries:", entries);
}
main().finally(() => prisma.$disconnect());
