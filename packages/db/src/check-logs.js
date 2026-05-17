const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.aIRequestLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('AI Request Logs:', JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
