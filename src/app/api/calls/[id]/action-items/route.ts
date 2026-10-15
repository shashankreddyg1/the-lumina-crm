import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { extractActionItems } from "@/lib/openai";
import {
  demoAddActionItems,
  demoGetCall,
  demoUpdateCall,
} from "@/lib/demoStore";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const database = getDb();
  if (!database) {
    const call = demoGetCall(params.id);
    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }
    return NextResponse.json(call.actionItems);
  }
  try {
    const items = await database.actionItem.findMany({
      where: { callId: params.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable." },
      { status: 503 }
    );
  }
}

/**
 * Extract action items from the call's transcript with an LLM
 * (or mock output when no API key). Sets call status to ANALYZED.
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
    if (!call.transcript) {
      return NextResponse.json(
        { error: "Transcribe the call before extracting action items" },
        { status: 400 }
      );
    }
    const { items, mocked } = await extractActionItems(call.transcript);
    const created = demoAddActionItems(call.id, items) ?? [];
    demoUpdateCall(call.id, { status: "ANALYZED" });
    return NextResponse.json({ items: created, mocked });
  }
  try {
    const call = await database.call.findUnique({ where: { id: params.id } });
    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }
    if (!call.transcript) {
      return NextResponse.json(
        { error: "Transcribe the call before extracting action items" },
        { status: 400 }
      );
    }

    const { items, mocked } = await extractActionItems(call.transcript);

    const created = await database.$transaction(
      items.map((item) =>
        database.actionItem.create({
          data: {
            text: item.text,
            owner: item.owner ?? null,
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            callId: call.id,
          },
        })
      )
    );

    await database.call.update({
      where: { id: call.id },
      data: { status: "ANALYZED" },
    });

    return NextResponse.json({ items: created, mocked });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable." },
      { status: 503 }
    );
  }
}
