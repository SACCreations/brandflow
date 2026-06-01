/**
 * Encrypts a string using AES-256-GCM.
 * The result is a colon-separated string: iv:content:tag
 */
export declare function encrypt(text: string, keyHex: string): string;
/**
 * Decrypts a string previously encrypted with AES-256-GCM.
 */
export declare function decrypt(encryptedText: string, keyHex: string): string;
//# sourceMappingURL=encryption.utils.d.ts.map