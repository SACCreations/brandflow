import { PrismaClient } from '@prisma/client';
import { encryption, NvidiaImageProvider } from '@brandflow/ai';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env['ENCRYPTION_KEY'] || 'default_dev_encryption_key_32_bytes_min!';

async function testNvidia() {
  const businessId = '00000000-0000-0000-0001-000000000001';
  
  // 1. Get current settings
  let settings = await prisma.llmSettings.findUnique({ where: { businessId } });
  if (!settings?.apiKey) {
    console.error('No api key found');
    return;
  }
  const key = encryption.decrypt(settings.apiKey, ENCRYPTION_KEY);

  // 2. Update nvidiaTaskModels in settings with imageGeneration
  console.log('--- Updating LLM settings task models in Database ---');
  const existingTaskModels = (settings.nvidiaTaskModels as any) || {};
  const updatedTaskModels = {
    ...existingTaskModels,
    imageGeneration: 'black-forest-labs/flux.2-klein-4b',
  };

  settings = await prisma.llmSettings.update({
    where: { businessId },
    data: {
      nvidiaTaskModels: updatedTaskModels,
    },
  });

  console.log('Persisted settings.nvidiaTaskModels:', settings.nvidiaTaskModels);

  // 3. Resolve the model dynamically as done in image-job.processor.ts
  const resolvedModel = (settings.nvidiaTaskModels as any)?.imageGeneration || 'black-forest-labs/flux.2-klein-4b';
  console.log(`Resolved model for generation: ${resolvedModel}`);

  // 4. Test image generation using the resolved model
  console.log('--- Testing image generation via NvidiaImageProvider class using resolved model ---');
  try {
    const provider = new NvidiaImageProvider(key);
    const result = await provider.generate({
      prompt: "A beautiful futuristic brand logo, high resolution",
      width: 1024,
      height: 1024,
      businessId,
      model: resolvedModel,
    });
    console.log('Success! Result payload:', {
      costCents: result.costCents,
      provider: result.provider,
      model: result.model,
      imageCount: result.images.length,
      firstImagePrefix: result.images[0].base64?.substring(0, 100),
    });
  } catch (err) {
    console.error('Provider generation failed:', err);
  }
}

testNvidia()
  .catch(console.error)
  .finally(() => prisma.$disconnect());




