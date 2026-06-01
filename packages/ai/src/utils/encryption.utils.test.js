"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const encryption_utils_1 = require("./encryption.utils");
(0, vitest_1.describe)('Encryption Utils', () => {
    const validKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 32 bytes hex
    const invalidKey = 'short-key';
    (0, vitest_1.it)('should encrypt and decrypt a string correctly', () => {
        const text = 'my-secret-api-key';
        const encrypted = (0, encryption_utils_1.encrypt)(text, validKey);
        (0, vitest_1.expect)(encrypted).not.toBe(text);
        (0, vitest_1.expect)(encrypted.split(':')).toHaveLength(3);
        const decrypted = (0, encryption_utils_1.decrypt)(encrypted, validKey);
        (0, vitest_1.expect)(decrypted).toBe(text);
    });
    (0, vitest_1.it)('should throw error if key is too short', () => {
        (0, vitest_1.expect)(() => (0, encryption_utils_1.encrypt)('test', invalidKey)).toThrow('Encryption key must be a 32-byte hex string');
    });
    (0, vitest_1.it)('should fail to decrypt if tag is tampered with', () => {
        const text = 'test';
        const encrypted = (0, encryption_utils_1.encrypt)(text, validKey);
        const parts = encrypted.split(':');
        // Change last character of tag
        const tamperedTag = parts[2].substring(0, parts[2].length - 1) + (parts[2].endsWith('0') ? '1' : '0');
        const tamperedEncrypted = `${parts[0]}:${parts[1]}:${tamperedTag}`;
        (0, vitest_1.expect)(() => (0, encryption_utils_1.decrypt)(tamperedEncrypted, validKey)).toThrow();
    });
    (0, vitest_1.it)('should produce different ciphertexts for same input (different IVs)', () => {
        const text = 'test';
        const enc1 = (0, encryption_utils_1.encrypt)(text, validKey);
        const enc2 = (0, encryption_utils_1.encrypt)(text, validKey);
        (0, vitest_1.expect)(enc1).not.toBe(enc2);
        (0, vitest_1.expect)((0, encryption_utils_1.decrypt)(enc1, validKey)).toBe(text);
        (0, vitest_1.expect)((0, encryption_utils_1.decrypt)(enc2, validKey)).toBe(text);
    });
});
//# sourceMappingURL=encryption.utils.test.js.map