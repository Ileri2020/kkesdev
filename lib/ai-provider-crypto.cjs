"use strict";

const { createCipheriv, createDecipheriv, createHash, randomBytes } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function getEncryptionSecret() {
  // The tracked server-side utility config is the source of truth, so a normal
  // Git deployment includes the same key needed to decrypt database values.
  const configPath = path.resolve(process.cwd(), "utils/ai-secret-config.json");
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (typeof config.AI_KEYS_ENCRYPTION_KEY === "string" && config.AI_KEYS_ENCRYPTION_KEY.length >= 32) {
      return config.AI_KEYS_ENCRYPTION_KEY;
    }
  } catch {
    // Allow deployments to provide the key through a host secret as fallback.
  }

  const fromEnvironment = process.env.AI_KEYS_ENCRYPTION_KEY;
  return typeof fromEnvironment === "string" ? fromEnvironment : "";
}

function hasEncryptionKey() {
  return getEncryptionSecret().length >= 32;
}

function encryptionKey() {
  const secret = getEncryptionSecret();
  if (!secret || secret.length < 32) {
    throw new Error("The AI encryption key must be configured in utils/ai-secret-config.json (or the server environment) and contain at least 32 characters.");
  }
  return createHash("sha256").update(secret).digest();
}

function encryptProviderKey(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), ciphertext.toString("base64")].join(".");
}

function decryptProviderKey(value) {
  const [ivPart, tagPart, ciphertextPart] = value.split(".");
  if (!ivPart || !tagPart || !ciphertextPart) throw new Error("Stored AI provider credential is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

module.exports = { encryptProviderKey, decryptProviderKey, hasEncryptionKey };
