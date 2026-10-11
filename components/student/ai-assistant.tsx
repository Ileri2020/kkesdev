"use client";

import { FormEvent, useRef, useState } from "react";
import { Bot, Send, Sparkles, UserRound } from "lucide-react";
import { AIResponse } from "@/components/student/ai-response";

type Message = { role: "user" | "assistant"; content: string };

export function StudentAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = prompt.trim();
    if (!question || busy) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setPrompt("");
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/student/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chat", messages: nextMessages.slice(-10) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The assistant could not answer right now.");
      setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The assistant could not answer right now.");
      // Let students retry without retyping; the unserved message is removed from context.
      setMessages((current) => current.slice(0, -1));
      setPrompt(question);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-6 text-white sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Sparkles size={23} className="text-amber-300" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Your learning companion</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Ask the AI study assistant</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/80">Ask for a concept explanation, step-by-step calculation, or help understanding a JAMB topic. Always check important facts against your class materials.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-[26rem] max-w-4xl flex-col p-4 sm:p-7">
        <div className="flex-1 space-y-5 pb-5" aria-live="polite">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-background p-8 text-center">
              <Bot size={28} className="mx-auto text-primary" />
              <h3 className="mt-3 font-semibold">What are you studying today?</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Try asking: “Explain photosynthesis in simple steps” or “Show me how to solve simultaneous equations.”</p>
            </div>
          )}
          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Bot size={18} /></span>}
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-background"}`}>
                {message.role === "user" ? <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p> : <AIResponse content={message.content} />}
              </div>
              {message.role === "user" && <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"><UserRound size={18} /></span>}
            </article>
          ))}
          {busy && <div className="flex items-center gap-3 text-sm text-muted-foreground"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Bot size={18} /></span><span className="animate-pulse">Working through your question…</span></div>}
          <div ref={bottomRef} />
        </div>

        {error && <p role="alert" className="mb-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        <form onSubmit={sendMessage} className="sticky bottom-2 rounded-2xl border border-border bg-card p-2 shadow-lg">
          <label htmlFor="student-ai-prompt" className="sr-only">Ask the student AI assistant</label>
          <div className="flex items-end gap-2">
            <textarea
              id="student-ai-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={4000}
              rows={2}
              placeholder="Type your question… (Enter to send, Shift+Enter for a new line)"
              className="max-h-40 min-h-12 flex-1 resize-y rounded-xl border-0 bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
            />
            <button type="submit" disabled={busy || !prompt.trim()} aria-label="Send question" className="mb-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"><Send size={17} /></button>
          </div>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">AI responses can be inaccurate. Never share personal or sensitive information.</p>
      </div>
    </section>
  );
}
