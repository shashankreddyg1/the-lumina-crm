import { NextResponse } from "next/server";
import { getDb, getOrCreateDemoUser } from "@/lib/db";
import { demoCreateCall, demoListContacts } from "@/lib/demoStore";

/**
 * Creates a sample call without requiring an audio file, so visitors can
 * try the transcribe → extract pipeline in one click (demo mode or live).
 */
export async function POST() {
  const database = getDb();
  if (!database) {
    const contact = demoListContacts()[0];
    const call = demoCreateCall(
      "Sample discovery call — Northwind Traders",
      contact?.id ?? null
    );
    return NextResponse.json(call, { status: 201 });
  }
  try {
    const user = await getOrCreateDemoUser();
    const call = await database.call.create({
      data: {
        title: "Sample discovery call",
        userId: user.id,
        status: "UPLOADED",
      },
    });
    return NextResponse.json(call, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable." },
      { status: 503 }
    );
  }
}
