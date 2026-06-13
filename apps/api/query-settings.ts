import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const businessId = '00000000-0000-0000-0001-000000000001'; // From the logs
  const settings = await prisma.llmSettings.findUnique({
    where: { businessId },
  });
  console.log('--- LLM Settings ---');
  if (settings) {
    console.log(`Provider: ${settings.provider}`);
    console.log(`Has API Key: ${!!settings.apiKey}`);
    console.log(`Has Image API Key: ${!!settings.imageApiKey}`);
    console.log(`Has Flux API Key: ${!!settings.fluxApiKey}`);
  } else {
    console.log('No settings found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
