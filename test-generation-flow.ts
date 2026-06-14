import { PrismaClient } from '@prisma/client';
import { ImageGateway, encryption } from './packages/ai/src/index';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env['ENCRYPTION_KEY'] || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

async function run() {
  const businessId = '00000000-0000-0000-0001-000000000001';
  
  const settings = await prisma.llmSettings.findUnique({ where: { businessId } });
  if (!settings) {
    console.error("No settings found for business");
    return;
  }

  const resolvedProvider = settings.provider ?? 'openai';
  console.log("LLM Settings Provider:", resolvedProvider);

  // Decrypt keys exactly like image-job.processor.ts does:
  let openaiKey: string | null = null;
  if (settings.imageApiKey) {
    openaiKey = encryption.decrypt(settings.imageApiKey, ENCRYPTION_KEY);
  } else if (settings.apiKey && (settings.provider === 'openai' || settings.provider === 'nvidia')) {
    openaiKey = encryption.decrypt(settings.apiKey, ENCRYPTION_KEY);
  }

  const nvidiaKey = resolvedProvider === 'nvidia' && settings.apiKey
    ? encryption.decrypt(settings.apiKey, ENCRYPTION_KEY)
    : null;

  let fluxApiKey: string | null = null;
  if (settings.fluxApiKey) {
    fluxApiKey = encryption.decrypt(settings.fluxApiKey, ENCRYPTION_KEY);
  }

  console.log("Resolved openaiKey:", openaiKey ? `${openaiKey.substring(0, 12)}...` : null);
  console.log("Resolved nvidiaKey:", nvidiaKey ? `${nvidiaKey.substring(0, 12)}...` : null);
  console.log("Resolved fluxApiKey:", fluxApiKey ? `${fluxApiKey.substring(0, 8)}...` : null);

  const keys = {
    openai: openaiKey || null,
    flux: fluxApiKey || null,
    stability: null,
    nvidia: nvidiaKey || null,
  };

  const gateway = new ImageGateway(
    { defaultProvider: 'openai', fallbackProvider: 'stability' },
    keys
  );

  console.log("Registered providers:", gateway.registeredProviders());
  console.log("Has real provider:", gateway.hasRealProvider());

  console.log("Testing generation with OpenAI...");
  try {
    const res = await gateway.generate('openai', {
      prompt: 'Marketing poster creative, graphic design composition, minimalist business flyer, blue and white colors, 8K detail',
      width: 1024,
      height: 1024,
      businessId,
    });
    console.log("GENERATION SUCCESS:", res);
  } catch (err: any) {
    console.error("GENERATION FAILURE:", err.message);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
