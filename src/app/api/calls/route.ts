import { NextResponse } from "next/server";
import { getDb, getOrCreateDemoUser } from "@/lib/db";
import { demoCallSummaries, demoCreateCall } from "@/lib/demoStore";

export async function GET() {
  const database = getDb();
  if (!database) {
    return NextResponse.json(demoCallSummaries());
  }
  try {
    const calls = await database.call.findMany({
      include: {
        contact: true,
        _count: { select: { actionItems: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(calls);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable. Set DATABASE_URL and run `npx prisma db push`." },
      { status: 503 }
    );
  }
}

export async function POST(req: Request) {
  let body: { title?: string; contactId?: string };
  try {
    body = (await req.json()) as { title?: string; contactId?: string };
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const database = getDb();
  if (!database) {
    const call = demoCreateCall(body.title.trim(), body.contactId || null);
    return NextResponse.json(call, { status: 201 });
  }
  try {
    const user = await getOrCreateDemoUser();
    const call = await database.call.create({
      data: {
        title: body.title.trim(),
        contactId: body.contactId || null,
        userId: user.id,
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
