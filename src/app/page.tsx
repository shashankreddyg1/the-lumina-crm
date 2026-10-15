export const dynamic = "force-dynamic";

import Link from "next/link";
import { getDb } from "@/lib/db";
import { demoDashboardData } from "@/lib/demoStore";
import { formatMoney, type DashboardData } from "@/lib/demo";
import StatusBadge from "@/components/StatusBadge";

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Good morning, Alex
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what needs your attention today.
          </p>
        </div>
        {demo && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Demo mode — sample data, no database needed
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent calls</h2>
            <Link
              href="/calls"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.recentCalls.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/calls/${c.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{c.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
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
              <li className="px-5 py-8 text-center text-sm text-slate-500">
                No calls yet. Upload your first recording from the{" "}
                <Link href="/calls" className="text-brand-600 hover:underline">
                  Calls page
                </Link>
                .
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Pipeline</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.deals.map((d) => (
              <li key={d.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{d.title}</p>
                  <p className="font-semibold text-slate-900">
                    {formatMoney(d.value)}
                  </p>
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  {stageLabel(d.stage)}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
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
              <li className="px-5 py-8 text-center text-sm text-slate-500">
                No deals yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
