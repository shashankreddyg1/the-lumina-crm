import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getDb, getOrCreateDemoUser } from "@/lib/db";
import { demoCreateCall } from "@/lib/demoStore";

/**
 * Accepts multipart form data: `audio` (file) + `title` (string).
 * Stores the file under public/uploads and creates a Call record.
 * Note: on serverless hosts this storage is ephemeral — use S3/R2 in production.
 *
 * In demo mode (no DATABASE_URL) the file bytes are accepted and discarded;
 * the call is tracked in the in-memory demo store and transcription returns
 * mock output, so the full pipeline works with zero config.
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "An audio file is required" },
      { status: 400 }
    );
  }
  const file = form.get("audio") as File | null;
  const title = ((form.get("title") as string) || "").trim();

  if (!file || file.size === 0) {
    return NextResponse.json(
      { error: "An audio file is required" },
      { status: 400 }
    );
  }

  const database = getDb();
  if (!database) {
    // Consume the upload so the request completes; nothing is persisted.
    await file.arrayBuffer();
    const call = demoCreateCall(title || file.name);
    return NextResponse.json(call, { status: 201 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "recording";
    const filename = `${randomUUID()}-${safeName}`;
    await writeFile(path.join(dir, filename), bytes);

    const user = await getOrCreateDemoUser();
    const call = await database.call.create({
      data: {
        title: title || file.name,
        audioUrl: `/uploads/${filename}`,
        userId: user.id,
        status: "UPLOADED",
      },
    });
    return NextResponse.json(call, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Upload failed. Is the database configured?" },
      { status: 500 }
    );
  }
}
