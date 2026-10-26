/**
 * ProfitShield - Cryptographic Service for Server-Side Secret Storage
 * 
 * Provides AES-256-GCM authenticated encryption for Shopify OAuth Access Tokens
 * and sensitive merchant credentials. Secrets are never stored in plaintext and
 * are never transmitted to browser bundles or public API responses.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

// Derive a 256-bit encryption key from environment secrets
function getDerivedKey(): Buffer {
  const secretSource =
    process.env.ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    'profitshield-standalone-software-default-key-32ch';

  return crypto.scryptSync(secretSource, 'profitshield-salt-salt-99', 32);
}

/**
 * Encrypt a plaintext secret using AES-256-GCM
 * Returns formatted string: iv_hex:authTag_hex:ciphertext_hex
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return '';
  try {
    const key = getDerivedKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err: any) {
    console.error('[EncryptionService] Encryption failure:', err.message);
    throw new Error('Failed to encrypt secret token');
  }
}

/**
 * Decrypt an AES-256-GCM encrypted secret string
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  
  // If not formatted as iv:authTag:ciphertext, return empty or fallback
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    // Legacy plaintext fallback check
    if (encryptedPayload.startsWith('shpat_') || encryptedPayload.startsWith('shpca_')) {
      return encryptedPayload;
    }
    return '';
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;

  try {
    const key = getDerivedKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err: any) {
    console.error('[EncryptionService] Decryption failure (invalid key or tampered payload):', err.message);
    return '';
  }
}

/**
 * Sanitize store object before sending to browser/client:
 * Strips all access tokens and secrets while preserving connection booleans.
 */
export function sanitizeStoreForClient<T extends Record<string, any>>(store: T | null | undefined): (T & { has_token: boolean; is_connected: boolean }) | null {
  if (!store) return null;
  
  const hasToken = Boolean(
    store.access_token ||
    store.access_token_encrypted ||
    store.has_token ||
    (store.is_connected && !store.is_demo)
  );

  const sanitized: Record<string, any> = { ...store };
  delete sanitized.access_token;
  delete sanitized.access_token_encrypted;
  
  sanitized.has_token = hasToken;
  sanitized.is_connected = store.is_demo ? false : hasToken;

  return sanitized as (T & { has_token: boolean; is_connected: boolean });
}
