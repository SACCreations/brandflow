const { decrypt } = require('../../ai/dist/utils/encryption.utils');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const encryptionKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

async function main() {
  const settings = await prisma.llmSettings.findFirst();
  if (settings && settings.apiKey) {
    const decrypted = decrypt(settings.apiKey, encryptionKey);
    console.log('Decrypted API key matches:', decrypted === 'sk-mock-openai-key-for-testing-purposes-only' ? 'YES!' : 'NO: ' + decrypted);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
