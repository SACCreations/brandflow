const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.knowledgeEntry.findMany();
  console.log("Entries count:", entries.length);
  if (entries.length > 0) {
    console.log("Sample:", entries[1].content);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
