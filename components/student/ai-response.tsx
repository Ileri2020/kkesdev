const ALLOWED_TAGS = new Set([
  "p", "br", "ol", "ul", "li", "strong", "b", "em", "i", "sub", "sup",
]);

function escapeText(text: string) {
  return text
    .replace(/&(?!(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[\da-f]+);)/gi, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeAIHtml(value: string) {
  return value
    .split(/(<[^>]*>)/g)
    .map((part) => {
      const tag = part.match(/^<\s*(\/?)\s*([a-z0-9]+)\s*\/?\s*>$/i);
      if (!tag) return escapeText(part).replace(/\r?\n/g, "<br>");
      const name = tag[2].toLowerCase();
      if (!ALLOWED_TAGS.has(name)) return escapeText(part);
      if (name === "br") return "<br>";
      return `<${tag[1] ? "/" : ""}${name}>`;
    })
    .join("");
}

export function AIResponse({ content, className = "" }: { content: string; className?: string }) {
  return (
    <div
      className={`ai-response break-words text-sm leading-7 text-foreground [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_p]:my-2 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeAIHtml(content) }}
    />
  );
}
