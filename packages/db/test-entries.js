const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.knowledgeEntry.findMany();
  console.log('Entries count:', entries.length);
  for (const e of entries) {
    console.log(e.classification + ':', e.content);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
