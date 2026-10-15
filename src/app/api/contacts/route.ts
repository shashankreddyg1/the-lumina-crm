import { NextResponse } from "next/server";
import { getDb, getOrCreateDemoUser } from "@/lib/db";
import { demoCreateContact, demoListContacts } from "@/lib/demoStore";

export async function GET() {
  const database = getDb();
  if (!database) {
    return NextResponse.json(demoListContacts());
  }
  try {
    const contacts = await database.contact.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(contacts);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable." },
      { status: 503 }
    );
  }
}

export async function POST(req: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON." },
      { status: 400 }
    );
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const database = getDb();
  if (!database) {
    const contact = demoCreateContact({
      name: body.name.trim(),
      email: body.email?.trim(),
      phone: body.phone?.trim(),
      company: body.company?.trim(),
      title: body.title?.trim(),
    });
    return NextResponse.json(contact, { status: 201 });
  }
  try {
    const user = await getOrCreateDemoUser();
    const contact = await database.contact.create({
      data: {
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        company: body.company?.trim() || null,
        title: body.title?.trim() || null,
        userId: user.id,
      },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable." },
      { status: 503 }
    );
  }
}
