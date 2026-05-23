const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sources = await prisma.knowledgeSource.findMany();
  console.log("Total sources:", sources.length);
  if (sources.length > 0) {
    console.log("Sources:", sources);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
