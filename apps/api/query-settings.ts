import { PrismaClient } from '@prisma/client';
import { encryption } from '@brandflow/ai';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env['ENCRYPTION_KEY'] || 'default_dev_encryption_key_32_bytes_min!';

async function main() {
  const businessId = '00000000-0000-0000-0001-000000000001'; // From the logs
  const settings = await prisma.llmSettings.findUnique({
    where: { businessId },
  });
  console.log('--- LLM Settings ---');
  if (settings) {
    console.log(`Provider: ${settings.provider}`);
    const key = settings.apiKey ? encryption.decrypt(settings.apiKey, ENCRYPTION_KEY) : null;
    const imgKey = settings.imageApiKey ? encryption.decrypt(settings.imageApiKey, ENCRYPTION_KEY) : null;
    console.log(`Decrypted apiKey: ${key}`);
    console.log(`Decrypted imageApiKey: ${imgKey}`);
  } else {
    console.log('No settings found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

