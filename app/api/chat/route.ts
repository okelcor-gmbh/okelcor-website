import { NextRequest, NextResponse } from "next/server";
import { rateLimit, retryAfter, getClientIp, rateLimitResponse, warnRateLimit } from "@/lib/rate-limit";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// "openrouter/free" auto-routes to the best available free model and always
// supports system prompts — no maintenance needed when specific models are removed.
const MODEL = "openrouter/free";

// ── Types ─────────────────────────────────────────────────────────────────────

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

function buildSystemPrompt(currentPage: string): string {
  return `You are a helpful sales assistant for Okelcor, a B2B tyre wholesale company.
We supply PCR, TBR, OTR and Used tyres from brands like Michelin, Bridgestone, Continental, Goodyear, Pirelli and Dunlop.
We serve wholesale buyers, fleet operators and logistics companies across Europe.
Keep answers short, professional and helpful. Maximum 3 sentences per reply.
If asked about pricing or placing an order, direct them to our quote form at /quote
If they want to talk to a person, give them WhatsApp (+49 156 786 05800) or suggest the /contact page.
Current page the user is on: ${currentPage}`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`chat:${ip}`, 30, 15 * 60 * 1000)) {
    warnRateLimit("/api/chat", "POST", ip, req.headers.get("user-agent") ?? "");
    return rateLimitResponse(retryAfter(`chat:${ip}`));
  }

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "Chat is not configured." },
      { status: 503 }
    );
  }

  let body: { messages?: Message[]; currentPage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { messages, currentPage = "/" } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array is required." }, { status: 400 });
  }

  // Sanitise: only allow role/content, strip anything else
  const sanitised: Message[] = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, 2000),
    }));

  const payload = {
    model: MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt(currentPage) },
      ...sanitised,
    ],
    max_tokens: 300,
    temperature: 0.7,
  };

  let openRouterRes: Response;
  try {
    openRouterRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://okelcor.com",
        "X-Title": "Okelcor Chat Assistant",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the AI service. Please try again." },
      { status: 502 }
    );
  }

  if (!openRouterRes.ok) {
    const errText = await openRouterRes.text().catch(() => "");
    console.error("[chat] OpenRouter error", openRouterRes.status, errText);
    return NextResponse.json(
      { error: "AI service returned an error. Please try again." },
      { status: 502 }
    );
  }

  const data = await openRouterRes.json().catch(() => null);
  const reply: string =
    data?.choices?.[0]?.message?.content?.trim() ??
    "Sorry, I couldn't generate a response. Please try again or contact us directly.";

  return NextResponse.json({ reply });
}
