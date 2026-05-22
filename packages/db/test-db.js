const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.knowledgeEntry.findMany();
  console.log("Total entries:", entries.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
