import { PrismaClient } from '@prisma/client';
import { encryption } from '@brandflow/ai';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env['ENCRYPTION_KEY'] || 'default_dev_encryption_key_32_bytes_min!';

async function testNvidia() {
  const businessId = '00000000-0000-0000-0001-000000000001';
  const settings = await prisma.llmSettings.findUnique({ where: { businessId } });
  
  if (!settings?.apiKey) return;
  const key = encryption.decrypt(settings.apiKey, ENCRYPTION_KEY);

  const models = [
    'stabilityai/stable-diffusion-xl-base-1.0',
    'stabilityai/sdxl-turbo',
  ];

  for (const model of models) {
    console.log(`Testing model: ${model}`);
    try {
      const res = await fetch(`https://ai.api.nvidia.com/v1/genai/${model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({ text_prompts: [{ text: "A test image" }] })
      });
      const text = await res.text();
      console.log(`[${res.status}] ${text.substring(0, 100)}`);
    } catch (err) {
      console.error(err);
    }
  }
}

testNvidia()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
