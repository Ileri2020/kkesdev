#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const { decryptProviderKey, hasEncryptionKey } = require("../lib/ai-provider-crypto.cjs");
const requireFromProject = createRequire(path.join(__dirname, "..", "package.json"));
const dotenv = requireFromProject("dotenv");

async function main() {
  const root = path.resolve(__dirname, "..");
  const fileEnv = {};
  for (const filename of [".env", ".env.local"]) {
    const filePath = path.join(root, filename);
    if (fs.existsSync(filePath)) Object.assign(fileEnv, dotenv.parse(fs.readFileSync(filePath)));
  }
  process.env.MONGODB_URL ||= fileEnv.MONGODB_URL;
  if (!hasEncryptionKey()) {
    throw new Error("AI_KEYS_ENCRYPTION_KEY is unavailable in the server environment and local utility config.");
  }

  const { PrismaClient } = requireFromProject("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const settings = await prisma.aIProviderSettings.findUnique({ where: { id: "global" } });
    if (!settings) throw new Error("No AI provider settings were found in the database.");
    const provider = settings.provider === "openrouter" ? "openrouter" : "gemini";
    const providerKeys = await prisma.aIProviderKey.findMany({
      where: { settingsId: "global", isEnabled: true },
      orderBy: [{ provider: "asc" }, { attemptCount: "asc" }],
    });
    const providerSummary = { gemini: 0, openrouter: 0, allKeysDecrypt: true };
    for (const providerKey of providerKeys) {
      decryptProviderKey(providerKey.encryptedKey);
      if (providerKey.provider === "gemini" || providerKey.provider === "openrouter") {
        providerSummary[providerKey.provider]++;
      }
    }
    if (process.argv.includes("--check-key-only")) {
      console.log(JSON.stringify({ databaseConfigured: true, provider, perKeyRecordsDecrypt: providerSummary.allKeysDecrypt, keys: providerSummary }));
      return;
    }

    const encryptedKey = provider === "gemini" ? settings.geminiKeyEncrypted : settings.openRouterKeyEncrypted;
    if (!encryptedKey) throw new Error(`The active ${provider} key is missing from the database.`);
    const key = decryptProviderKey(encryptedKey);
    const model = settings.model || (provider === "gemini" ? "gemini-2.5-flash" : "nvidia/nemotron-3.5-lightning:free");

    let response;
    if (provider === "gemini") {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Reply with exactly OK." }] }],
          generationConfig: { maxOutputTokens: 8, temperature: 0 },
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } else {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXTAUTH_URL || "https://kkesdev.vercel.app",
          "X-Title": "Kith & Kin AI configuration check",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Reply with exactly OK." }],
          max_tokens: 8,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(30_000),
      });
    }

    console.log(JSON.stringify({ databaseConfigured: true, keyDecrypts: true, provider, model, httpStatus: response.status, aiRequestSucceeded: response.ok }));
    if (!response.ok) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`AI provider verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
});
