import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import OpenAI from 'openai';

function decrypt(encryptedText: string, keyHex: string): string {
  try {
    const [ivHex, encryptedHex, authTagHex] = encryptedText.split(':');
    if (!ivHex || !encryptedHex || !authTagHex) {
      throw new Error('Invalid encrypted format');
    }
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err: any) {
    return 'Decryption failed: ' + err.message;
  }
}

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

async function main() {
  const settings = await prisma.llmSettings.findFirst();
  if (!settings || !settings.imageApiKey) {
    console.error("No imageApiKey settings found in database");
    return;
  }
  const key = decrypt(settings.imageApiKey, ENCRYPTION_KEY);
  console.log("Using decrypted imageApiKey:", key ? `${key.substring(0, 15)}...` : null);

  const client = new OpenAI({ apiKey: key });
  const modelsToTry = ['chatgpt-image-latest', 'gpt-image-1'];
  for (const model of modelsToTry) {
    console.log(`\n--- Testing image generation with model: ${model} ---`);
    try {
      const response = await client.images.generate({
        model: model,
        prompt: 'A beautiful marketing poster of a high-tech modern office space, abstract geometric shapes, 8K detail',
        n: 1,
        size: '1024x1024',
      });
      console.log(`Success with ${model}:`, response.data);
    } catch (err: any) {
      console.error(`Failed with ${model}:`, err.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
