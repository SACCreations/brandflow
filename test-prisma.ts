import { PrismaClient } from './packages/database/node_modules/@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.knowledgeEntry.findMany();
  console.log("Total entries:", entries.length);
  if (entries.length > 0) {
    console.log("Sample:", entries[0]);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
