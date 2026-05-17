const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.llmSettings.findMany({
    take: 10
  });
  console.log('LLM Settings entries in database:', JSON.stringify(settings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
