import { PrismaClient } from '@prisma/client';
import { encryption } from '@brandflow/ai';
import { ConfigService } from '@nestjs/config';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env['ENCRYPTION_KEY'] || 'default_dev_encryption_key_32_bytes_min!'; // Replace if needed

async function testFlux() {
  const businessId = '00000000-0000-0000-0001-000000000001';
  const settings = await prisma.llmSettings.findUnique({ where: { businessId } });
  
  if (!settings?.fluxApiKey) {
    console.log('No flux key found');
    return;
  }
  
  let fluxKey = '';
  try {
    fluxKey = encryption.decrypt(settings.fluxApiKey, ENCRYPTION_KEY);
    console.log(`Decrypted Flux Key: ${fluxKey.slice(0, 5)}...`);
  } catch (err) {
    console.error('Failed to decrypt:', err);
    return;
  }

  console.log('Testing FLUX API connection...');
  try {
    const submitRes = await fetch('https://api.bfl.ml/v1/flux-dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Key': fluxKey,
      },
      body: JSON.stringify({
        prompt: "A simple test image",
        width: 512,
        height: 512,
        steps: 28,
      }),
    });

    if (!submitRes.ok) {
      console.error(`Submit failed: ${submitRes.status} - ${await submitRes.text()}`);
      return;
    }

    const json = await submitRes.json();
    console.log('Submit Success! Task ID:', json.id);
  } catch (err) {
    console.error('API request error:', err);
  }
}

testFlux()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
