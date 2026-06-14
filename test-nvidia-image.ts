import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

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
  if (!settings || !settings.apiKey) {
    console.error("No apiKey settings found in database");
    return;
  }
  const key = decrypt(settings.apiKey, ENCRYPTION_KEY);
  console.log("Using decrypted key:", key ? `${key.substring(0, 15)}...` : null);

  const modelToUse = 'black-forest-labs/flux.2-klein-4b';
  const payload = {
    prompt: 'Marketing poster creative, graphic design composition, modern premium workspace corporate, balanced square layout, dominant brand color palette: #cc0000, 8K detail',
    seed: 0,
    steps: 4,
    width: 1024,
    height: 1024,
    samples: 1,
  };

  console.log(`Sending request to NVIDIA genai endpoint with model: ${modelToUse}...`);
  try {
    const response = await fetch(`https://ai.api.nvidia.com/v1/genai/${modelToUse}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("Response status:", response.status);
    const text = await response.text();
    console.log("Response text:", text.slice(0, 1000));
  } catch (err: any) {
    console.error("Fetch failed:", err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
