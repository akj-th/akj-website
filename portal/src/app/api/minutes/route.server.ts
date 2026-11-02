// 회의록 정리 API — 전사본을 Claude 로 보내 AKJ 회의록 형식(JSON)으로 받는다.
// 키는 서버 환경변수(ANTHROPIC_API_KEY)에서만 읽는다. 클라이언트로 보내지 않는다.
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { MINUTES_SYSTEM, minutesUserMessage, type MinutesRequest } from "@/lib/minutes/prompt";
import { MINUTES_SCHEMA, type MinutesDraft } from "@/lib/minutes/schema";

const MODEL = "claude-opus-5-5";
// 2시간 회의 전사 ≈ 수만 자. 이보다 길면 나눠서 올리게 한다 (조용히 자르지 않는다)
const MAX_CHARS = 200_000;

const fail = (status: number, error: string, hint?: string) => NextResponse.json({ error, hint }, { status });

export async function POST(req: Request) {
  let body: MinutesRequest;
  try {
    body = (await req.json()) as MinutesRequest;
  } catch {
    return fail(400, "요청 형식이 잘못됐습니다");
  }
  if (!body.transcript?.trim()) return fail(400, "전사본이 비어 있습니다");
  if (body.transcript.length > MAX_CHARS) {
    return fail(413, `전사본이 너무 깁니다 (${body.transcript.length.toLocaleString()}자)`, "회의를 앞뒤로 나눠 두 번 정리하세요");
  }

  let client: Anthropic;
  try {
    client = new Anthropic();
  } catch {
    return fail(503, "AI 키가 설정되지 않았습니다", "portal/.env.local 에 ANTHROPIC_API_KEY 를 넣고 서버를 다시 켜세요");
  }

  try {
    // 응답이 길어질 수 있어 스트림으로 받고 마지막 메시지만 쓴다
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      // 안전 분류기가 오판해 거절하면 Anthropic 권장 모델로 자동 재시도
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high", format: { type: "json_schema", schema: MINUTES_SCHEMA } },
      system: [{ type: "text", text: MINUTES_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: minutesUserMessage(body) }],
    });
    const msg = await stream.finalMessage();

    if (msg.stop_reason === "refusal") {
      return fail(422, "AI가 이 전사본 정리를 거절했습니다", msg.stop_details?.explanation ?? undefined);
    }
    if (msg.stop_reason === "max_tokens") {
      return fail(502, "결과가 너무 길어 중간에 끊겼습니다", "회의를 나눠서 정리하세요");
    }
    const text = msg.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return fail(502, "AI 응답에 결과가 없습니다");

    const minutes = JSON.parse(text.text) as MinutesDraft;
    return NextResponse.json({
      minutes,
      model: msg.model,
      usage: {
        input: msg.usage.input_tokens,
        output: msg.usage.output_tokens,
        cacheRead: msg.usage.cache_read_input_tokens ?? 0,
      },
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return fail(503, "AI 키가 잘못됐거나 없습니다", "portal/.env.local 의 ANTHROPIC_API_KEY 를 확인하세요");
    }
    if (e instanceof Anthropic.RateLimitError) return fail(429, "요청이 많아 잠시 막혔습니다", "1분 뒤 다시 시도하세요");
    if (e instanceof Anthropic.BadRequestError) return fail(400, "요청이 거부됐습니다", e.message);
    if (e instanceof Anthropic.APIError) return fail(502, `AI 서버 오류 (${e.status ?? "연결"})`, e.message);
    if (e instanceof Anthropic.AnthropicError) {
      // 인증 수단을 찾지 못한 경우 등 — 요청 전에 SDK 가 던진다
      return fail(503, "AI 키가 설정되지 않았습니다", "portal/.env.local 에 ANTHROPIC_API_KEY 를 넣고 서버를 다시 켜세요");
    }
    if (e instanceof SyntaxError) return fail(502, "AI 결과를 읽지 못했습니다");
    throw e;
  }
}
