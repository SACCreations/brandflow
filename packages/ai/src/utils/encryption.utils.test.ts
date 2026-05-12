import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './encryption.utils';

describe('Encryption Utils', () => {
  const validKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 32 bytes hex
  const invalidKey = 'short-key';

  it('should encrypt and decrypt a string correctly', () => {
    const text = 'my-secret-api-key';
    const encrypted = encrypt(text, validKey);
    
    expect(encrypted).not.toBe(text);
    expect(encrypted.split(':')).toHaveLength(3);

    const decrypted = decrypt(encrypted, validKey);
    expect(decrypted).toBe(text);
  });

  it('should throw error if key is too short', () => {
    expect(() => encrypt('test', invalidKey)).toThrow('Encryption key must be a 32-byte hex string');
  });

  it('should fail to decrypt if tag is tampered with', () => {
    const text = 'test';
    const encrypted = encrypt(text, validKey);
    const parts = encrypted.split(':');
    
    // Change last character of tag
    const tamperedTag = parts[2]!.substring(0, parts[2]!.length - 1) + (parts[2]!.endsWith('0') ? '1' : '0');
    const tamperedEncrypted = `${parts[0]}:${parts[1]}:${tamperedTag}`;

    expect(() => decrypt(tamperedEncrypted, validKey)).toThrow();
  });

  it('should produce different ciphertexts for same input (different IVs)', () => {
    const text = 'test';
    const enc1 = encrypt(text, validKey);
    const enc2 = encrypt(text, validKey);
    
    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1, validKey)).toBe(text);
    expect(decrypt(enc2, validKey)).toBe(text);
  });
});
