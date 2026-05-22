const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const logs = await prisma.knowledgeIngestionLog.findMany({
    where: { sourceId: '662f4c5d-e141-41d1-baf6-390db6f34698' },
    orderBy: { createdAt: 'desc' }
  });
  console.log("PDF logs:", JSON.stringify(logs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
