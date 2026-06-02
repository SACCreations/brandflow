import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

// Re-implement simple decrypt logic from packages/ai/src/utils/encryption.utils.ts to run standalone
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
  if (settings && settings.apiKey) {
    const dec = decrypt(settings.apiKey, ENCRYPTION_KEY);
    console.log("Decrypted API Key:", dec);
    console.log("Provider:", settings.provider);
    console.log("Model:", settings.model);
  } else {
    console.log("No settings or apiKey found in database");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
