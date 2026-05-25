const { PrismaClient } = require('@prisma/client');
const { encryption } = require('@brandflow/ai');

async function run() {
  const prisma = new PrismaClient();
  const settings = await prisma.llmSettings.findFirst({ where: { provider: 'nvidia' } });
  
  const encryptionKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const apiKey = encryption.decrypt(settings.apiKey, encryptionKey);
  console.log(apiKey);
}
run();
