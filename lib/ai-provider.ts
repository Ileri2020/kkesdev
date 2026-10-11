import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { decryptProviderKey, encryptProviderKey } from "@/lib/ai-provider-crypto.cjs";

export { encryptProviderKey };
export type AIProvider = "gemini" | "openrouter";
type Message = { role: "user" | "assistant"; content: string };
type KeyRecord = { id: string; provider: string; encryptedKey: string; attemptCount: number; quotaResetAt: Date | null };

const SETTINGS_ID = "global";
const DEFAULT_MODELS = { gemini: "gemini-2.5-flash", openrouter: "nvidia/nemotron-3.5-lightning:free" };
const fingerprint = (provider: AIProvider, key: string) => createHash("sha256").update(`${provider}:${key}`).digest("hex");

async function loadSettingsAndKeys() {
  const settings = await prisma.aIProviderSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (!settings) throw new Error("AI is not configured yet. Ask an administrator to add a provider API key.");

  const keys = await prisma.aIProviderKey.findMany({
    where: { settingsId: SETTINGS_ID, isEnabled: true },
    orderBy: [{ attemptCount: "asc" }, { createdAt: "asc" }],
  });
  return { settings, keys: keys as KeyRecord[] };
}

async function migrateLegacyKeys(settings: {
  geminiKeyEncrypted: string | null;
  openRouterKeyEncrypted: string | null;
}) {
  const completed: AIProvider[] = [];
  for (const [provider, encryptedKey] of [["gemini", settings.geminiKeyEncrypted], ["openrouter", settings.openRouterKeyEncrypted]] as const) {
    if (!encryptedKey) continue;
    const rawKey = decryptProviderKey(encryptedKey);
    await prisma.aIProviderKey.upsert({
      where: { fingerprint: fingerprint(provider, rawKey) },
      update: {},
      create: { settingsId: SETTINGS_ID, provider, encryptedKey, fingerprint: fingerprint(provider, rawKey) },
    });
    completed.push(provider);
  }
  if (completed.length) {
    await prisma.aIProviderSettings.update({
      where: { id: SETTINGS_ID },
      data: {
        ...(completed.includes("gemini") ? { geminiKeyEncrypted: null } : {}),
        ...(completed.includes("openrouter") ? { openRouterKeyEncrypted: null } : {}),
      },
    });
  }
}

export async function getAIProviderStatus() {
  const settings = await prisma.aIProviderSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (!settings) {
    return {
      provider: "gemini",
      model: DEFAULT_MODELS.gemini,
      openRouterModel: DEFAULT_MODELS.openrouter,
      geminiKeys: [],
      openRouterKeys: [],
    };
  }
  const keys = await prisma.aIProviderKey.findMany({ where: { settingsId: SETTINGS_ID, isEnabled: true }, orderBy: [{ attemptCount: "asc" }, { createdAt: "asc" }] }) as KeyRecord[];
  const now = Date.now();
  const view = (provider: AIProvider) => keys.filter((key) => key.provider === provider).map((key) => ({
    id: key.id,
    attempts: key.attemptCount,
    availableAt: key.quotaResetAt?.toISOString() ?? null,
    coolingDown: Boolean(key.quotaResetAt && key.quotaResetAt.getTime() > now),
  }));
  return {
    provider: settings.provider,
    model: settings.model || DEFAULT_MODELS.gemini,
    openRouterModel: settings.openRouterModel || DEFAULT_MODELS.openrouter,
    geminiKeys: view("gemini"),
    openRouterKeys: view("openrouter"),
  };
}

export async function addAIProviderKeys(input: {
  provider: AIProvider;
  activeProvider?: AIProvider;
  keys: string[];
  model?: string | null;
  openRouterModel?: string | null;
}) {
  const existingSettings = await prisma.aIProviderSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (existingSettings) await migrateLegacyKeys(existingSettings);
  const settings = await prisma.aIProviderSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {
      ...(input.activeProvider ? { provider: input.activeProvider } : {}),
      ...(input.model !== undefined ? { model: input.model } : {}),
      ...(input.openRouterModel !== undefined ? { openRouterModel: input.openRouterModel } : {}),
    },
    create: {
      id: SETTINGS_ID,
      provider: input.activeProvider ?? input.provider,
      model: input.model ?? DEFAULT_MODELS.gemini,
      openRouterModel: input.openRouterModel ?? DEFAULT_MODELS.openrouter,
    },
  });
  let added = 0;
  for (const key of [...new Set(input.keys.map((item) => item.trim()).filter(Boolean))]) {
    const hash = fingerprint(input.provider, key);
    const alreadyExists = await prisma.aIProviderKey.findUnique({ where: { fingerprint: hash }, select: { id: true } });
    await prisma.aIProviderKey.upsert({
      where: { fingerprint: hash },
      update: { isEnabled: true, quotaResetAt: null },
      create: { settingsId: settings.id, provider: input.provider, encryptedKey: encryptProviderKey(key), fingerprint: hash },
    });
    if (!alreadyExists) added++;
  }
  return added;
}

function quotaError(status: number, text: string) {
  return status === 429 || /quota|resource_exhausted|rate.?limit|too many requests/i.test(text);
}

function cooldownMs(text: string, retryAfter: string | null) {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
    const until = Date.parse(retryAfter) - Date.now();
    if (until > 0) return until;
  }
  const m = text.match(/retry\s+in\s+(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m)?\s*(?:(\d+(?:\.\d+)?)\s*s)?/i);
  if (m) {
    const ms = (Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0)) * 1000;
    if (ms > 0) return ms;
  }
  return 60 * 60 * 1000;
}

async function callGemini(model: string, apiKey: string, system: string, messages: Message[]) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] })),
      generationConfig: { temperature: 0.35, maxOutputTokens: 1800 },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const body = await response.json() as { error?: { message?: string }; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  if (!response.ok) {
    const error = new Error(body.error?.message || `Gemini failed (${response.status}).`);
    Object.assign(error, { status: response.status, retryAfter: response.headers.get("retry-after") });
    throw error;
  }
  const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

async function callOpenRouter(model: string, apiKey: string, system: string, messages: Message[]) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "https://kkesdev.vercel.app",
      "X-Title": "Kith & Kin Student AI",
    },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, ...messages], temperature: 0.35, max_tokens: 1800 }),
    signal: AbortSignal.timeout(45_000),
  });
  const body = await response.json() as { error?: { message?: string }; choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }> };
  if (!response.ok) {
    const error = new Error(body.error?.message || `OpenRouter failed (${response.status}).`);
    Object.assign(error, { status: response.status, retryAfter: response.headers.get("retry-after") });
    throw error;
  }
  const content = body.choices?.[0]?.message?.content;
  const text = Array.isArray(content) ? content.map((part) => part.text || "").join("").trim() : content?.trim();
  if (!text) throw new Error("OpenRouter returned an empty response.");
  return text;
}

export async function requestAIText(systemPrompt: string, messages: Message[]) {
  const { settings, keys } = await loadSettingsAndKeys();
  const now = new Date();
  const available = keys.filter((key) => !key.quotaResetAt || key.quotaResetAt <= now);
  const coolKeys = keys.filter((key) => key.quotaResetAt && key.quotaResetAt > now);
  const failures: string[] = [];

  // Do not return credentials to the client. The server tries every Gemini key
  // in least-used order, then every OpenRouter key in least-used order.
  for (const provider of ["gemini", "openrouter"] as const) {
    const providerKeys = available.filter((key) => key.provider === provider).sort((a, b) => a.attemptCount - b.attemptCount);
    const model = provider === "gemini"
      ? settings.model || DEFAULT_MODELS.gemini
      : settings.openRouterModel || DEFAULT_MODELS.openrouter;
    for (const keyRecord of providerKeys) {
      await prisma.aIProviderKey.update({
        where: { id: keyRecord.id },
        data: { attemptCount: { increment: 1 }, lastAttemptAt: new Date() },
      });
      try {
        const apiKey = decryptProviderKey(keyRecord.encryptedKey);
        return provider === "gemini"
          ? await callGemini(model, apiKey, systemPrompt, messages)
          : await callOpenRouter(model, apiKey, systemPrompt, messages);
      } catch (caught) {
        const error = caught as Error & { status?: number; retryAfter?: string | null };
        failures.push(`${provider} key …${keyRecord.id.slice(-4)}: ${error.message}`);
        const status = error.status || 0;
        if (quotaError(status, error.message) || status === 401 || status === 403 || status >= 500 || status === 0) {
          const delay = quotaError(status, error.message) ? cooldownMs(error.message, error.retryAfter ?? null) : 5 * 60 * 1000;
          await prisma.aIProviderKey.update({ where: { id: keyRecord.id }, data: { quotaResetAt: new Date(Date.now() + delay) } });
        }
      }
    }
  }

  if (available.length === 0 && coolKeys.length) {
    const firstAvailable = coolKeys.map((key) => key.quotaResetAt!).sort((a, b) => a.getTime() - b.getTime())[0];
    throw new Error(`All AI keys are cooling down. Try again after ${firstAvailable.toLocaleString()}.`);
  }
  if (!keys.length) throw new Error("AI is not configured yet. Add Gemini or OpenRouter keys in administrator AI settings.");
  throw new Error(`All configured AI keys failed or are quota-limited. ${failures.slice(-3).join(" | ")}`);
}
