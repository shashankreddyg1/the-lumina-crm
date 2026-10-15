import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { transcribeAudio } from "@/lib/openai";
import { demoGetCall, demoUpdateCall } from "@/lib/demoStore";

/**
 * Transcribe a call's audio with Whisper (or mock output when no API key).
 * Sets status TRANSCRIBING → TRANSCRIBED (or FAILED on error).
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const database = getDb();
  if (!database) {
    const call = demoGetCall(params.id);
    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }
    const { transcript, mocked } = await transcribeAudio("");
    const updated = demoUpdateCall(call.id, {
      transcript,
      status: "TRANSCRIBED",
    });
    return NextResponse.json({ call: updated, mocked });
  }
  try {
    const call = await database.call.findUnique({ where: { id: params.id } });
    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    await database.call.update({
      where: { id: call.id },
      data: { status: "TRANSCRIBING" },
    });

    try {
      const { transcript, mocked } = await transcribeAudio(call.audioUrl ?? "");
      const updated = await database.call.update({
        where: { id: call.id },
        data: { transcript, status: "TRANSCRIBED" },
      });
      return NextResponse.json({ call: updated, mocked });
    } catch {
      await database.call.update({
        where: { id: call.id },
        data: { status: "FAILED" },
      });
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Database unavailable." },
      { status: 503 }
    );
  }
}
