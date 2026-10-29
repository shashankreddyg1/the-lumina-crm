export const dynamic = "force-dynamic";

import { getDb } from "@/lib/db";
import { demoListContacts } from "@/lib/demoStore";
import type { DemoContact } from "@/lib/demo";
import AddContactForm from "@/components/AddContactForm";

async function getContacts(): Promise<{
  contacts: DemoContact[];
  demo: boolean;
}> {
  const database = getDb();
  if (database) {
    try {
      const contacts = await database.contact.findMany({
        orderBy: { createdAt: "desc" },
      });
      return {
        demo: false,
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email ?? "",
          phone: c.phone ?? "",
          company: c.company ?? "",
          title: c.title ?? "",
        })),
      };
    } catch {
      // Database unreachable — fall through to the in-memory demo store.
    }
  }
  return { contacts: demoListContacts(), demo: true };
}

export default async function ContactsPage() {
  const { contacts, demo } = await getContacts();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Contacts
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            People and companies in your sales network.
          </p>
        </div>
        {demo && (
          <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
            Demo mode
          </span>
        )}
      </div>

      <AddContactForm />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {c.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <div>
                <p className="font-medium text-zinc-100">{c.name}</p>
                <p className="text-sm text-zinc-400">{c.title}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-sm text-zinc-400">
              <p className="font-medium text-zinc-300">{c.company}</p>
              {c.email && <p>{c.email}</p>}
              {c.phone && <p>{c.phone}</p>}
            </div>
          </div>
        ))}
        {contacts.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center text-sm text-zinc-400">
            No contacts yet — add your first one above.
          </p>
        )}
      </div>
    </div>
  );
}
