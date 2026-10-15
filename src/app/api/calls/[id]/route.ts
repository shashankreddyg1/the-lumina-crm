import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { demoGetCall, demoListContacts } from "@/lib/demoStore";

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
    const contact = demoListContacts().find((c) => c.id === call.contactId) ?? null;
    return NextResponse.json({ ...call, contact });
  }
  try {
    const call = await database.call.findUnique({
      where: { id: params.id },
      include: {
        contact: true,
        actionItems: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }
    return NextResponse.json(call);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable." },
      { status: 503 }
    );
  }
}
