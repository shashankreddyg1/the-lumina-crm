import OpenAI from "openai";
import { mockActionItems, mockTranscript, type MockActionItem } from "./demo";

export type ExtractedActionItem = MockActionItem;

const hasKey = () => Boolean(process.env.OPENAI_API_KEY);

/**
 * Transcribe a sales call recording with Whisper.
 * Without OPENAI_API_KEY, returns clearly-labeled mock output so the demo
 * pipeline works end to end with no setup.
 */
export async function transcribeAudio(
  audioUrl: string
): Promise<{ transcript: string; mocked: boolean }> {
  if (!hasKey()) {
    return { transcript: mockTranscript, mocked: true };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error("Could not download audio for transcription");
  }
  const blob = await response.blob();
  const file = new File([blob], "call-audio", {
    type: blob.type || "audio/mpeg",
  });
  const result = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });
  return { transcript: result.text, mocked: false };
}

/**
 * Extract action items (text, owner, due date) from a call transcript.
 * Without OPENAI_API_KEY, returns clearly-labeled mock output.
 */
export async function extractActionItems(
  transcript: string
): Promise<{ items: ExtractedActionItem[]; mocked: boolean }> {
  if (!hasKey()) {
    return { items: mockActionItems, mocked: true };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a sales assistant. Extract concrete action items from a sales call transcript. " +
          'Return JSON of the form {"items": [{"text": string, "owner": string|null, "dueDate": string|null}]}. ' +
          "dueDate must be an ISO date (YYYY-MM-DD) or null. Keep each item to one clear sentence.",
      },
      { role: "user", content: transcript.slice(0, 12000) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{"items": []}';
  const parsed = JSON.parse(raw) as { items?: ExtractedActionItem[] };
  return { items: parsed.items ?? [], mocked: false };
}

/** True when the app is running on mock AI output (no API key configured). */
export function isDemoMode(): boolean {
  return !hasKey();
}
