#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const { createHash } = require("node:crypto");
const { encryptProviderKey, hasEncryptionKey } = require("../lib/ai-provider-crypto.cjs");
const requireFromProject = createRequire(path.join(__dirname, "..", "package.json"));
const dotenv = requireFromProject("dotenv");

function readEnvFiles() {
  const root = path.resolve(__dirname, "..");
  const combined = {};
  for (const filename of [".env", ".env.local"]) {
    const filePath = path.join(root, filename);
    if (!fs.existsSync(filePath)) continue;
    Object.assign(combined, dotenv.parse(fs.readFileSync(filePath)));
  }
  return combined;
}

function firstValue(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function collectProviderKeys(prefix, runtimeEnv, fileEnv) {
  const merged = { ...fileEnv, ...runtimeEnv };
  const entries = Object.entries(merged)
    .map(([name, value]) => ({ name, value, match: name.match(new RegExp(`^${prefix}_API_KEY(?:_(\\d+))?$`, "i")) }))
    .filter((entry) => entry.match && typeof entry.value === "string" && entry.value.trim())
    .sort((left, right) => Number(left.match[1] || 0) - Number(right.match[1] || 0));
  return [...new Set(entries.map((entry) => entry.value.trim()))];
}

async function main() {
  // The master key comes from the tracked utility config (or a host secret),
  // never from project dotenv files.
  const envFileValues = readEnvFiles();
  if (envFileValues.AI_KEYS_ENCRYPTION_KEY) {
    throw new Error("Remove AI_KEYS_ENCRYPTION_KEY from .env/.env.local. Provide it only through the server or shell secret store.");
  }
  if (!hasEncryptionKey()) {
    throw new Error("Configure the key in utils/ai-secret-config.json or the server environment.");
  }

  const runtimeEnv = process.env;
  const geminiKeys = collectProviderKeys("GEMINI", runtimeEnv, envFileValues);
  const openRouterKeys = collectProviderKeys("OPENROUTER", runtimeEnv, envFileValues);
  if (!geminiKeys.length && !openRouterKeys.length) {
    throw new Error("No GEMINI_API_KEY or OPENROUTER_API_KEY was found in process environment, .env, or .env.local.");
  }

  const providerValue = firstValue(runtimeEnv.AI_PROVIDER, envFileValues.AI_PROVIDER).toLowerCase();
  const provider = providerValue || (geminiKeys.length ? "gemini" : "openrouter");
  if (provider !== "gemini" && provider !== "openrouter") {
    throw new Error("AI_PROVIDER must be either gemini or openrouter.");
  }
  if (provider === "gemini" && !geminiKeys.length) throw new Error("AI_PROVIDER is gemini but Gemini API keys are missing.");
  if (provider === "openrouter" && !openRouterKeys.length) throw new Error("AI_PROVIDER is openrouter but OpenRouter API keys are missing.");

  const model = firstValue(runtimeEnv.AI_MODEL, envFileValues.AI_MODEL) || "gemini-2.5-flash";
  const openRouterModel = firstValue(runtimeEnv.OPENROUTER_MODEL, envFileValues.OPENROUTER_MODEL) || "nvidia/nemotron-3.5-lightning:free";
  const databaseUrl = firstValue(runtimeEnv.MONGODB_URL, envFileValues.MONGODB_URL);
  if (!databaseUrl) throw new Error("MONGODB_URL is not configured in the process environment or .env/.env.local.");

  // Database credentials may be loaded from local dotenv files, but the master
  // encryption secret above is never copied from dotenv into process.env.
  process.env.MONGODB_URL = databaseUrl;
  const { PrismaClient } = requireFromProject("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const current = await prisma.aIProviderSettings.findUnique({ where: { id: "global" } });
    await prisma.aIProviderSettings.upsert({
      where: { id: "global" },
      update: { provider, model, openRouterModel },
      create: { id: "global", provider, model, openRouterModel },
    });

    let added = 0;
    for (const [keyProvider, keys] of [["gemini", geminiKeys], ["openrouter", openRouterKeys]]) {
      for (const key of keys) {
        const keyFingerprint = createHash("sha256").update(`${keyProvider}:${key}`).digest("hex");
        const exists = await prisma.aIProviderKey.findUnique({ where: { fingerprint: keyFingerprint }, select: { id: true } });
        await prisma.aIProviderKey.upsert({
          where: { fingerprint: keyFingerprint },
          update: { isEnabled: true, quotaResetAt: null },
          create: {
            settingsId: "global",
            provider: keyProvider,
            encryptedKey: encryptProviderKey(key),
            fingerprint: keyFingerprint,
          },
        });
        if (!exists) added++;
      }
    }

    console.log(`AI provider settings saved. Active provider: ${provider}; Gemini model: ${model}; OpenRouter model: ${openRouterModel}.`);
    console.log(`Added ${added} new provider key(s); existing keys and attempt counters were retained.`);
    console.log("Provider key values and the encryption key were not printed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`AI key import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
});
