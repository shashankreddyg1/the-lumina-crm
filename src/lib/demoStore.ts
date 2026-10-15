/**
 * In-memory data store used when no DATABASE_URL is set (demo mode).
 * Seeded with realistic sales calls, contacts, and deals so the UI is alive
 * on first load, and fully mutable so the whole pipeline — upload, transcribe,
 * extract, toggle — works end to end with zero config.
 *
 * Stored on globalThis so it survives Next.js dev HMR; on serverless each
 * instance keeps its own copy (documented in the README).
 */

import {
  demoCallSeed,
  demoContacts,
  demoDealSeed,
  formatMoney,
  type DashboardData,
  type DemoActionItem,
  type DemoCallDetail,
  type DemoCallSummary,
  type DemoContact,
  type MockActionItem,
} from "./demo";

export type StoredCall = DemoCallDetail & { contactId: string | null };

type Store = {
  calls: StoredCall[];
  contacts: DemoContact[];
  seq: number;
};

/** Seed linkage: which demo contact each demo call belongs to. */
const CALL_CONTACT: Record<string, string> = {
  "demo-call-1": "demo-contact-1",
  "demo-call-2": "demo-contact-2",
  "demo-call-3": "demo-contact-3",
};

function seedStore(): Store {
  return {
    calls: demoCallSeed().map((c) => ({
      ...c,
      contactId: CALL_CONTACT[c.id] ?? null,
    })),
    contacts: demoContacts.map((c) => ({ ...c })),
    seq: 100,
  };
}

const g = globalThis as unknown as { __luminaDemoStore?: Store };

export function demoStore(): Store {
  if (!g.__luminaDemoStore) g.__luminaDemoStore = seedStore();
  return g.__luminaDemoStore;
}

/** Reset to the seed data (used by tests / manual reset). */
export function resetDemoStore(): void {
  g.__luminaDemoStore = seedStore();
}

const nextId = (s: Store, prefix: string) => `${prefix}-${s.seq++}`;

function contactById(s: Store, id: string | null): DemoContact | undefined {
  return s.contacts.find((c) => c.id === id);
}

function toSummary(s: Store, c: StoredCall): DemoCallSummary {
  const contact = contactById(s, c.contactId);
  return {
    id: c.id,
    title: c.title,
    status: c.status,
    contactName: contact?.name ?? "—",
    company: contact?.company ?? "—",
    createdAt: c.createdAt,
    openItems: c.actionItems.filter((a) => !a.done).length,
  };
}

/* ------------------------------------------------------------------ */
/* Calls                                                               */
/* ------------------------------------------------------------------ */

export function demoCallSummaries(): DemoCallSummary[] {
  const s = demoStore();
  return [...s.calls]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((c) => toSummary(s, c));
}

export function demoGetCall(id: string): StoredCall | undefined {
  return demoStore().calls.find((c) => c.id === id);
}

export function demoCreateCall(
  title: string,
  contactId?: string | null
): StoredCall {
  const s = demoStore();
  const call: StoredCall = {
    id: nextId(s, "demo-call"),
    title,
    status: "UPLOADED",
    audioUrl: null,
    transcript: null,
    createdAt: new Date().toISOString(),
    contactName: null,
    contactCompany: null,
    contactId: contactId ?? null,
    actionItems: [],
  };
  const contact = contactById(s, call.contactId);
  if (contact) {
    call.contactName = contact.name;
    call.contactCompany = contact.company;
  }
  s.calls.push(call);
  return call;
}

export function demoUpdateCall(
  id: string,
  patch: Partial<Pick<StoredCall, "status" | "transcript" | "audioUrl" | "title">>
): StoredCall | undefined {
  const call = demoGetCall(id);
  if (!call) return undefined;
  Object.assign(call, patch);
  return call;
}

export function demoAddActionItems(
  callId: string,
  items: MockActionItem[]
): DemoActionItem[] | undefined {
  const s = demoStore();
  const call = s.calls.find((c) => c.id === callId);
  if (!call) return undefined;
  const created: DemoActionItem[] = items.map((item) => ({
    id: nextId(s, "demo-item"),
    text: item.text,
    owner: item.owner ?? null,
    done: false,
    dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : null,
  }));
  call.actionItems.push(...created);
  return created;
}

export function demoToggleActionItem(
  itemId: string,
  done: boolean
): DemoActionItem | undefined {
  const s = demoStore();
  for (const call of s.calls) {
    const item = call.actionItems.find((a) => a.id === itemId);
    if (item) {
      item.done = done;
      return item;
    }
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Contacts                                                            */
/* ------------------------------------------------------------------ */

export function demoListContacts(): DemoContact[] {
  return demoStore().contacts;
}

export function demoCreateContact(data: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
}): DemoContact {
  const s = demoStore();
  const contact: DemoContact = {
    id: nextId(s, "demo-contact"),
    name: data.name,
    email: data.email ?? "",
    phone: data.phone ?? "",
    company: data.company ?? "",
    title: data.title ?? "",
  };
  s.contacts.push(contact);
  return contact;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export function demoDashboardData(): DashboardData {
  const s = demoStore();
  const deals = demoDealSeed();
  const openItems = s.calls
    .flatMap((c) => c.actionItems)
    .filter((a) => !a.done).length;
  const pipelineValue = deals
    .filter((d) => d.stage !== "CLOSED_LOST")
    .reduce((sum, d) => sum + d.value, 0);
  return {
    stats: [
      {
        label: "Pipeline value",
        value: formatMoney(pipelineValue),
        sub: `${deals.length} open deals`,
      },
      {
        label: "Calls logged",
        value: String(s.calls.length),
        sub: "most recent shown below",
      },
      {
        label: "Open action items",
        value: String(openItems),
        sub: "across all calls",
      },
      {
        label: "Active contacts",
        value: String(s.contacts.length),
        sub: "in your network",
      },
    ],
    recentCalls: demoCallSummaries().slice(0, 5),
    deals,
  };
}
