export const dynamic = "force-dynamic";

import Link from "next/link";
import { getDb } from "@/lib/db";
import { demoDashboardData } from "@/lib/demoStore";
import { formatMoney, type DashboardData } from "@/lib/demo";
import StatusBadge from "@/components/StatusBadge";
import FadeIn from "@/components/FadeIn";

const STAGE_ORDER = [
  "DISCOVERY",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

function stageLabel(stage: string) {
  return stage.charAt(0) + stage.slice(1).toLowerCase().replace("_", " ");
}

async function getDashboard(): Promise<{ data: DashboardData; demo: boolean }> {
  const database = getDb();
  if (database) {
    try {
      const [calls, deals, openItems, contactCount] = await Promise.all([
        database.call.findMany({
          include: {
            contact: true,
            _count: { select: { actionItems: { where: { done: false } } } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        database.deal.findMany({ orderBy: { value: "desc" } }),
        database.actionItem.count({ where: { done: false } }),
        database.contact.count(),
      ]);

      const pipelineValue = deals
        .filter((d) => d.stage !== "CLOSED_LOST")
        .reduce((sum, d) => sum + d.value, 0);

      return {
        demo: false,
        data: {
          stats: [
            {
              label: "Pipeline value",
              value: formatMoney(pipelineValue),
              sub: `${deals.length} open deals`,
            },
            {
              label: "Calls logged",
              value: String(calls.length),
              sub: "most recent shown below",
            },
            {
              label: "Open action items",
              value: String(openItems),
              sub: "across all calls",
            },
            {
              label: "Active contacts",
              value: String(contactCount),
              sub: "in your network",
            },
          ],
          recentCalls: calls.map((c) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            contactName: c.contact?.name ?? "—",
            company: c.contact?.company ?? "—",
            createdAt: c.createdAt.toISOString(),
            openItems: c._count.actionItems,
          })),
          deals: deals.map((d) => ({
            id: d.id,
            title: d.title,
            company: "",
            value: d.value,
            stage: d.stage,
          })),
        },
      };
    } catch {
      // Database unreachable — fall through to the in-memory demo store.
    }
  }
  return { data: demoDashboardData(), demo: true };
}

export default async function DashboardPage() {
  const { data, demo } = await getDashboard();

  return (
    <div className="space-y-8">
      <FadeIn className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Good morning, Alex
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Here&apos;s what needs your attention today.
          </p>
        </div>
        {demo && (
          <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
            Demo mode — sample data, no database needed
          </span>
        )}
      </FadeIn>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((s, i) => (
          <FadeIn key={s.label} delay={i * 0.06}>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm transition-colors hover:border-zinc-700">
            <p className="text-sm font-medium text-zinc-400">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{s.sub}</p>
          </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.2} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <h2 className="font-semibold text-zinc-100">Recent calls</h2>
            <Link
              href="/calls"
              className="text-sm font-medium text-brand-400 hover:text-brand-300"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y divide-zinc-800">
            {data.recentCalls.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/calls/${c.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-zinc-900/5"
                >
                  <div>
                    <p className="font-medium text-zinc-100">{c.title}</p>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      {c.contactName} · {c.company} ·{" "}
                      {new Date(c.createdAt).toLocaleDateString()}
                      {c.openItems > 0 && ` · ${c.openItems} open items`}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              </li>
            ))}
            {data.recentCalls.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-zinc-400">
                No calls yet. Upload your first recording from the{" "}
                <Link href="/calls" className="text-brand-400 hover:underline">
                  Calls page
                </Link>
                .
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h2 className="font-semibold text-zinc-100">Pipeline</h2>
          </div>
          <ul className="divide-y divide-zinc-800">
            {data.deals.map((d) => (
              <li key={d.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-zinc-100">{d.title}</p>
                  <p className="font-semibold text-zinc-100">
                    {formatMoney(d.value)}
                  </p>
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {stageLabel(d.stage)}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{
                      width: `${
                        (STAGE_ORDER.indexOf(
                          d.stage as (typeof STAGE_ORDER)[number]
                        ) /
                          (STAGE_ORDER.length - 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </li>
            ))}
            {data.deals.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-zinc-400">
                No deals yet.
              </li>
            )}
          </ul>
        </div>
      </FadeIn>
    </div>
  );
}
