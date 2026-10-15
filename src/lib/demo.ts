/**
 * Realistic demo content used when no database is configured (DATABASE_URL unset
 * or unreachable) and when no OpenAI key is set. Keeps the UI fully explorable
 * out of the box.
 */

export type MockActionItem = {
  text: string;
  owner?: string;
  dueDate?: string; // YYYY-MM-DD
};

export type DemoActionItem = {
  id: string;
  text: string;
  owner: string | null;
  done: boolean;
  dueDate: string | null; // ISO string
};

export type DemoContact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
};

export type DemoCallSummary = {
  id: string;
  title: string;
  status: "UPLOADED" | "TRANSCRIBING" | "TRANSCRIBED" | "ANALYZED" | "FAILED";
  contactName: string;
  company: string;
  createdAt: string;
  openItems: number;
};

export type DemoCallDetail = {
  id: string;
  title: string;
  status: DemoCallSummary["status"];
  audioUrl: string | null;
  transcript: string | null;
  createdAt: string;
  contactName: string | null;
  contactCompany: string | null;
  actionItems: DemoActionItem[];
};

export type DemoDeal = {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: "DISCOVERY" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";
};

export type DashboardData = {
  stats: { label: string; value: string; sub: string }[];
  recentCalls: DemoCallSummary[];
  deals: DemoDeal[];
};

const daysFromNow = (n: number) =>
  new Date(Date.now() + n * 86400000).toISOString();

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86400000).toISOString();

export const mockTranscript = `[00:00] Alex (Lumina): Hi Maya, thanks for making time today. Before we dive in — how is Northwind's team handling call follow-ups right now?

[00:14] Maya (Northwind): Honestly? It's our biggest time sink. Reps spend Friday afternoons writing up notes instead of selling. We've tried templates, but nobody fills them in consistently.

[00:38] Alex: That's exactly what we hear. Lumina records the call, transcribes it, and pulls out the action items automatically — owners and due dates included. Your reps just review and click approve.

[01:05] Maya: That would be huge. What about our existing CRM? We're on HubSpot and I am not ripping that out.

[01:18] Alex: You don't have to. We sync contacts, deals, and activities back into HubSpot — two-way. Lumina becomes the capture layer, HubSpot stays the system of record.

[01:40] Maya: Okay, pricing — what does this look like for a team of 25?

[01:52] Alex: Team plans start at $49 per seat per month, billed annually. For 25 seats with onboarding, you're looking at roughly $16k for the first year. I can send a formal proposal with the exact breakdown.

[02:15] Maya: Send that over. I'd also want our RevOps lead, Daniel, on a technical call — he'll ask about security, SOC 2, data retention, all of it.

[02:32] Alex: Absolutely. I'll include our security whitepaper and SOC 2 report with the proposal. If Daniel gives the green light, we could run a two-week pilot with five reps.

[02:51] Maya: Let's do this: proposal by Friday, tech deep-dive next Tuesday if the numbers work. I'll confirm the stakeholder list for the pilot by end of week.

[03:08] Alex: Perfect. I'll send the proposal and the security docs today, and I'll hold Tuesday 2pm for the deep-dive. Thanks Maya — talk soon.`;

export const mockActionItems: MockActionItem[] = [
  {
    text: "Send Maya the formal pricing proposal for 25 seats",
    owner: "Alex Rivera",
    dueDate: daysFromNow(3).slice(0, 10),
  },
  {
    text: "Share the security whitepaper and SOC 2 report with Northwind",
    owner: "Alex Rivera",
    dueDate: daysFromNow(2).slice(0, 10),
  },
  {
    text: "Schedule technical deep-dive with Daniel (RevOps) for Tuesday 2pm",
    owner: "Alex Rivera",
    dueDate: daysFromNow(5).slice(0, 10),
  },
  {
    text: "Maya to confirm pilot stakeholder list by end of week",
    owner: "Maya Chen",
    dueDate: daysFromNow(4).slice(0, 10),
  },
];

export const demoContacts: DemoContact[] = [
  {
    id: "demo-contact-1",
    name: "Maya Chen",
    email: "maya.chen@northwind.example.com",
    phone: "+1 (415) 555-0132",
    company: "Northwind Traders",
    title: "VP of Sales",
  },
  {
    id: "demo-contact-2",
    name: "David Okafor",
    email: "david.okafor@acme.example.com",
    phone: "+1 (312) 555-0188",
    company: "Acme Logistics",
    title: "CTO",
  },
  {
    id: "demo-contact-3",
    name: "Sofia Ramirez",
    email: "sofia@brightline.example.com",
    phone: "+1 (512) 555-0117",
    company: "Brightline Health",
    title: "Founder & CEO",
  },
];

const demoActionItems: DemoActionItem[] = mockActionItems.map((item, i) => ({
  id: `demo-item-${i + 1}`,
  text: item.text,
  owner: item.owner ?? null,
  done: i < 1,
  dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : null,
}));

const demoCallDetails: DemoCallDetail[] = [
  {
    id: "demo-call-1",
    title: "Discovery call — Northwind Traders",
    status: "ANALYZED",
    audioUrl: null,
    transcript: mockTranscript,
    createdAt: daysAgo(1),
    contactName: "Maya Chen",
    contactCompany: "Northwind Traders",
    actionItems: demoActionItems,
  },
  {
    id: "demo-call-2",
    title: "Pricing discussion — Acme Logistics",
    status: "TRANSCRIBED",
    audioUrl: null,
    transcript:
      "[00:00] Alex: Thanks for the walkthrough last week, David. I wanted to dig into the enterprise tier pricing we discussed.\n\n[00:19] David: Sure. The per-seat model works for the sales team, but our support org is 60 people — we need something flatter.\n\n[00:41] Alex: Understood. We can do a platform fee plus a smaller per-seat for support. I'll model both options and send them over tomorrow.",
    createdAt: daysAgo(3),
    contactName: "David Okafor",
    contactCompany: "Acme Logistics",
    actionItems: [],
  },
  {
    id: "demo-call-3",
    title: "Intro call — Brightline Health",
    status: "UPLOADED",
    audioUrl: null,
    transcript: null,
    createdAt: daysAgo(5),
    contactName: "Sofia Ramirez",
    contactCompany: "Brightline Health",
    actionItems: [],
  },
];

const demoDeals: DemoDeal[] = [
  {
    id: "demo-deal-1",
    title: "Northwind Traders — 25 seats",
    company: "Northwind Traders",
    value: 48000,
    stage: "PROPOSAL",
  },
  {
    id: "demo-deal-2",
    title: "Acme Logistics — Enterprise",
    company: "Acme Logistics",
    value: 120000,
    stage: "NEGOTIATION",
  },
  {
    id: "demo-deal-3",
    title: "Brightline Health — Team plan",
    company: "Brightline Health",
    value: 16000,
    stage: "DISCOVERY",
  },
];

export function demoDashboard(): DashboardData {
  return {
    stats: [
      { label: "Pipeline value", value: "$184,000", sub: "3 open deals" },
      { label: "Calls this week", value: "6", sub: "4 transcribed" },
      { label: "Open action items", value: "9", sub: "3 due this week" },
      { label: "Active contacts", value: "24", sub: "across 11 companies" },
    ],
    recentCalls: demoCallDetails.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      contactName: c.contactName ?? "—",
      company: c.contactCompany ?? "—",
      createdAt: c.createdAt,
      openItems: c.actionItems.filter((a) => !a.done).length,
    })),
    deals: demoDeals,
  };
}

export function demoCallSummaries(): DemoCallSummary[] {
  return demoDashboard().recentCalls;
}

export function getDemoCall(id: string): DemoCallDetail | undefined {
  return demoCallDetails.find((c) => c.id === id);
}

/** Deep-cloned seed of all demo calls (for the mutable in-memory demo store). */
export function demoCallSeed(): DemoCallDetail[] {
  return demoCallDetails.map((c) => ({
    ...c,
    actionItems: c.actionItems.map((a) => ({ ...a })),
  }));
}

/** Deep-cloned seed of all demo deals (for the mutable in-memory demo store). */
export function demoDealSeed(): DemoDeal[] {
  return demoDeals.map((d) => ({ ...d }));
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
