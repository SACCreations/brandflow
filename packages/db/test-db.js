const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const entries = await prisma.knowledgeEntry.findMany({ take: 5 });
  console.log('Entries count:', entries.length);
  entries.forEach(e => console.log(e.content));
}
main().catch(console.error).finally(() => prisma.$disconnect());
