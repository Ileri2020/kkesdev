import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addAIProviderKeys, getAIProviderStatus } from "@/lib/ai-provider";
import { hasEncryptionKey } from "@/lib/ai-provider-crypto.cjs";
import { prisma } from "@/lib/prisma";

async function isAdmin() {
  const session = await auth();
  return String(session?.user?.role || "").toUpperCase() === "ADMIN";
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  try {
    const status = await getAIProviderStatus();
    return NextResponse.json({ ...status, encryptionConfigured: hasEncryptionKey() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load AI settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  if (!hasEncryptionKey()) {
    return NextResponse.json({ error: "Configure the AI encryption key in utils/ai-secret-config.json or the server environment." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const provider = body.provider === "openrouter" ? "openrouter" : body.provider === "gemini" ? "gemini" : null;
    if (!provider) return NextResponse.json({ error: "Choose Gemini or OpenRouter." }, { status: 400 });
    const model = typeof body.model === "string" ? body.model.trim().slice(0, 120) : "";
    const openRouterModel = typeof body.openRouterModel === "string" ? body.openRouterModel.trim().slice(0, 120) : "";
    for (const candidate of [model, openRouterModel]) {
      if (candidate && !/^[a-zA-Z0-9._:/-]+$/.test(candidate)) {
        return NextResponse.json({ error: "A model identifier contains unsupported characters." }, { status: 400 });
      }
    }

    const parseKeys = (value: unknown, legacyValue: unknown) => {
      const rawKeys = Array.isArray(value)
        ? value
        : typeof value === "string"
          ? value.split(/[\r\n,]+/)
          : typeof legacyValue === "string" && legacyValue.trim()
            ? [legacyValue]
            : [];
      return rawKeys.filter((key): key is string => typeof key === "string").map((key) => key.trim()).filter(Boolean);
    };
    const geminiKeys = parseKeys(body.geminiKeys, body.geminiKey);
    const openRouterKeys = parseKeys(body.openRouterKeys, body.openRouterKey);
    if ([...geminiKeys, ...openRouterKeys].some((key) => key.length > 500)) {
      return NextResponse.json({ error: "Each API key must be 500 characters or fewer." }, { status: 400 });
    }

    const existing = await prisma.aIProviderSettings.findUnique({ where: { id: "global" } });
    if (!existing && !geminiKeys.length && !openRouterKeys.length) {
      return NextResponse.json({ error: "Add at least one Gemini or OpenRouter API key." }, { status: 400 });
    }

    if (geminiKeys.length || !existing) {
      await addAIProviderKeys({ provider: "gemini", activeProvider: provider, keys: geminiKeys, model: model || null, openRouterModel: openRouterModel || null });
    }
    if (openRouterKeys.length || !existing) {
      await addAIProviderKeys({ provider: "openrouter", activeProvider: provider, keys: openRouterKeys, model: model || null, openRouterModel: openRouterModel || null });
    }
    if (existing && !geminiKeys.length && !openRouterKeys.length) {
      await addAIProviderKeys({ provider, activeProvider: provider, keys: [], model: model || null, openRouterModel: openRouterModel || null });
    }

    return NextResponse.json({ success: true, message: "Settings saved. New keys are encrypted, never returned, and requests are load-balanced across configured keys." });
  } catch (error) {
    console.error("AI settings update failed:", error);
    return NextResponse.json({ error: "Unable to save AI settings." }, { status: 500 });
  }
}
