import { NextResponse } from "next/server";
import { requestAIText } from "@/lib/ai-provider";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const explanationInstructions = [
  "You are a patient tutor explaining a JAMB multiple-choice question to a secondary-school student.",
  "Explain the underlying idea in clear, numbered steps suitable for a learner who may be seeing it for the first time.",
  "Explain why the correct option is correct and briefly why the other options are not.",
  "Be accurate, supportive, age-appropriate, and define unfamiliar terms. Do not assume prior knowledge.",
  "Use simple HTML formatting when helpful: <p>, <br>, <ol>, <ul>, <li>, <strong>, <em>, <sub>, and <sup> only. Do not include scripts, styles, links, or any other HTML tags.",
].join(" ");

const assistantInstructions = [
  "You are a supportive learning assistant for secondary-school students.",
  "Answer in clear, ordered steps, explain unfamiliar terms, and show working for calculations.",
  "Use simple HTML formatting when useful: <p>, <br>, <ol>, <ul>, <li>, <strong>, <em>, <sub>, and <sup> only.",
  "Do not include scripts, styles, links, or any other HTML tags. If unsure, say so clearly.",
].join(" ");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "explain") {
      const questionId = typeof body.questionId === "string" ? body.questionId.trim() : "";
      if (!questionId) return NextResponse.json({ error: "A question ID is required." }, { status: 400 });
      const question = await prisma.question.findFirst({
        where: { id: questionId, examType: { equals: "jamb", mode: "insensitive" } },
        include: { options: { orderBy: { label: "asc" } } },
      });
      if (!question) return NextResponse.json({ error: "JAMB question not found." }, { status: 404 });
      if (question.aiExplanation?.trim()) {
        return NextResponse.json({ explanation: question.aiExplanation, cached: true });
      }

      const options = question.options.length
        ? question.options.map((option) => `${option.label}. ${option.text}`)
        : [question.option1, question.option2, question.option3, question.option4, question.option5].filter((option): option is string => Boolean(option?.trim()));
      const prompt = [
        `Subject: ${question.subject || "JAMB"}`,
        question.passage ? `Passage/context:\n${question.passage}` : question.context ? `Context:\n${question.context}` : "",
        `Question:\n${question.prompt}`,
        `Options:\n${options.join("\n")}`,
        `Stored answer key: ${question.answer || "Not available"}`,
        "Explain the question and options now. Do not merely repeat the answer key.",
      ].filter(Boolean).join("\n\n");
      const explanation = await requestAIText(explanationInstructions, [{ role: "user", content: prompt }]);
      await prisma.question.update({ where: { id: question.id }, data: { aiExplanation: explanation } });
      return NextResponse.json({ explanation, cached: false });
    }

    if (body.action === "chat") {
      const incoming = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
      const messages = incoming
        .filter((item: unknown): item is { role: string; content: string } =>
          Boolean(item && typeof item === "object" && "role" in item && "content" in item)
        )
        .filter((item: { role: string; content: string }) =>
          (item.role === "user" || item.role === "assistant") && typeof item.content === "string" && item.content.trim().length > 0
        )
        .map((item: { role: "user" | "assistant"; content: string }) => ({
          role: item.role,
          content: item.content.trim().slice(0, 4000),
        }));
      if (!messages.length || messages.at(-1)?.role !== "user") {
        return NextResponse.json({ error: "Enter a question for the assistant." }, { status: 400 });
      }
      const answer = await requestAIText(assistantInstructions, messages);
      return NextResponse.json({ answer });
    }

    return NextResponse.json({ error: "Unknown AI action." }, { status: 400 });
  } catch (error) {
    console.error("Student AI request failed:", error);
    const message = error instanceof Error ? error.message : "The AI request failed.";
    const status = message.startsWith("All AI keys are cooling down") ? 429 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
