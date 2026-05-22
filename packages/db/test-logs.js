const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const logs = await prisma.knowledgeIngestionLog.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' }
  });
  console.log("Recent logs:", JSON.stringify(logs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
