"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Sparkles } from "lucide-react";

type Status = {
  provider: "gemini" | "openrouter";
  model: string;
  openRouterModel: string;
  geminiKeys: { id: string; attempts: number; availableAt: string | null; coolingDown: boolean }[];
  openRouterKeys: { id: string; attempts: number; availableAt: string | null; coolingDown: boolean }[];
  encryptionConfigured: boolean;
};

export function AIProviderSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [provider, setProvider] = useState<"gemini" | "openrouter">("gemini");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [openRouterModel, setOpenRouterModel] = useState("nvidia/nemotron-3.5-lightning:free");
  const [geminiKeys, setGeminiKeys] = useState("");
  const [openRouterKeys, setOpenRouterKeys] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/ai-settings", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load provider settings.");
        setStatus(data);
        setProvider(data.provider);
        setModel(data.model || "gemini-2.5-flash");
        setOpenRouterModel(data.openRouterModel || "nvidia/nemotron-3.5-lightning:free");
      })
      .catch((error: unknown) => setFeedback({ ok: false, text: error instanceof Error ? error.message : "Unable to load settings." }));
  }, []);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, openRouterModel, geminiKeys, openRouterKeys }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save settings.");
      setGeminiKeys("");
      setOpenRouterKeys("");
      setFeedback({ ok: true, text: data.message });
      const refreshed = await fetch("/api/admin/ai-settings", { cache: "no-store" }).then((result) => result.json());
      setStatus(refreshed);
    } catch (error) {
      setFeedback({ ok: false, text: error instanceof Error ? error.message : "Unable to save settings." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-7 text-white shadow-xl sm:p-9">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-amber-300"><Sparkles size={23} /></span>
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Server-side AI configuration</p><h2 className="mt-2 text-2xl font-bold">Student AI provider keys</h2><p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/80">Keys are encrypted before they are stored. The browser only submits a provider request and never receives a provider secret.</p></div>
        </div>
      </section>

      {!status?.encryptionConfigured && (
        <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          The server loads its encryption key from <strong>utils/ai-secret-config.json</strong>. The config file is tracked with the app so deployments receive it. Do not expose this repository publicly: anyone who can read the file can decrypt the provider key stored in the database.
        </div>
      )}

      <form onSubmit={saveSettings} className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Active provider
            <select value={provider} onChange={(event) => setProvider(event.target.value as "gemini" | "openrouter")} className="rounded-xl border border-border bg-background px-3 py-3 font-normal">
              <option value="gemini">Google Gemini</option><option value="openrouter">OpenRouter</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">Gemini model
            <input value={model} onChange={(event) => setModel(event.target.value)} maxLength={120} placeholder="gemini-2.5-flash" className="rounded-xl border border-border bg-background px-3 py-3 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">OpenRouter model
            <input value={openRouterModel} onChange={(event) => setOpenRouterModel(event.target.value)} maxLength={120} placeholder="provider/model-name" className="rounded-xl border border-border bg-background px-3 py-3 font-normal" />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold">Add Gemini API keys
          <span className="text-xs font-normal text-muted-foreground">Enter one key per line. Existing keys are kept; duplicate entries are ignored.</span>
          <textarea autoComplete="off" value={geminiKeys} onChange={(event) => setGeminiKeys(event.target.value)} rows={4} placeholder="Paste Gemini keys here, one per line" className="rounded-xl border border-border bg-background px-3 py-3 font-mono text-sm font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">Add OpenRouter API keys
          <span className="text-xs font-normal text-muted-foreground">Enter one key per line. Existing keys are kept; duplicate entries are ignored.</span>
          <textarea autoComplete="off" value={openRouterKeys} onChange={(event) => setOpenRouterKeys(event.target.value)} rows={4} placeholder="Paste OpenRouter keys here, one per line" className="rounded-xl border border-border bg-background px-3 py-3 font-mono text-sm font-normal" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {(["gemini", "openrouter"] as const).map((name) => {
            const keys = name === "gemini" ? status?.geminiKeys ?? [] : status?.openRouterKeys ?? [];
            const label = name === "gemini" ? "Gemini" : "OpenRouter";
            return <section key={name} className="rounded-xl border border-border p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold"><KeyRound size={15} />{label}: {keys.length} key(s)</h3>
              {keys.length ? <ul className="mt-3 space-y-2 text-xs text-muted-foreground">{keys.map((key, index) => <li key={key.id} className="flex justify-between gap-2"><span>Key {index + 1}{key.coolingDown ? " · cooling down" : " · available"}</span><span>{key.attempts} attempts</span></li>)}</ul> : <p className="mt-3 text-xs text-muted-foreground">No keys saved.</p>}
            </section>;
          })}
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck size={14} /> Keys encrypted at rest; server tries least-used Gemini keys, then OpenRouter.</span>
        </div>
        {feedback && <p role={feedback.ok ? "status" : "alert"} className={`rounded-xl p-3 text-sm ${feedback.ok ? "bg-emerald-50 text-emerald-800" : "bg-destructive/10 text-destructive"}`}>{feedback.text}</p>}
        <button disabled={busy || !status?.encryptionConfigured} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Saving securely…" : "Save AI settings"}</button>
      </form>
    </div>
  );
}
