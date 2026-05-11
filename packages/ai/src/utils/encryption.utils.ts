import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Encrypts a string using AES-256-GCM.
 * The result is a colon-separated string: iv:content:tag
 */
export function encrypt(text: string, keyHex: string): string {
  if (!keyHex || keyHex.length < 64) {
    throw new Error('Encryption key must be a 32-byte hex string (64 characters)');
  }

  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

/**
 * Decrypts a string previously encrypted with AES-256-GCM.
 */
export function decrypt(encryptedText: string, keyHex: string): string {
  if (!keyHex || keyHex.length < 64) {
    throw new Error('Encryption key must be a 32-byte hex string (64 characters)');
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const [ivHex, contentHex, tagHex] = parts;
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex!, 'hex');
  const content = Buffer.from(contentHex!, 'hex');
  const tag = Buffer.from(tagHex!, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(content),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
