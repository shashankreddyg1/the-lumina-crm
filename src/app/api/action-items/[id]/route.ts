import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { demoToggleActionItem } from "@/lib/demoStore";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  let body: { done?: boolean };
  try {
    body = (await req.json()) as { done?: boolean };
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON." },
      { status: 400 }
    );
  }
  if (typeof body.done !== "boolean") {
    return NextResponse.json(
      { error: "done (boolean) is required" },
      { status: 400 }
    );
  }
  const database = getDb();
  if (!database) {
    const item = demoToggleActionItem(params.id, body.done);
    if (!item) {
      return NextResponse.json(
        { error: "Action item not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(item);
  }
  try {
    const item = await database.actionItem.update({
      where: { id: params.id },
      data: { done: body.done },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable or item not found." },
      { status: 503 }
    );
  }
}
