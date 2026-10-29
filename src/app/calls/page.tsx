export const dynamic = "force-dynamic";

import Link from "next/link";
import { getDb } from "@/lib/db";
import { demoCallSummaries } from "@/lib/demoStore";
import type { DemoCallSummary } from "@/lib/demo";
import StatusBadge from "@/components/StatusBadge";
import UploadCallForm from "@/components/UploadCallForm";

async function getCalls(): Promise<{ calls: DemoCallSummary[]; demo: boolean }> {
  const database = getDb();
  if (database) {
    try {
      const calls = await database.call.findMany({
        include: {
          contact: true,
          _count: { select: { actionItems: { where: { done: false } } } },
        },
        orderBy: { createdAt: "desc" },
      });
      return {
        demo: false,
        calls: calls.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          contactName: c.contact?.name ?? "—",
          company: c.contact?.company ?? "—",
          createdAt: c.createdAt.toISOString(),
          openItems: c._count.actionItems,
        })),
      };
    } catch {
      // Database unreachable — fall through to the in-memory demo store.
    }
  }
  return { calls: demoCallSummaries(), demo: true };
}

export default async function CallsPage() {
  const { calls, demo } = await getCalls();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Calls
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Upload a recording, transcribe it with AI, and extract action items.
          </p>
        </div>
        {demo && (
          <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
            Demo mode
          </span>
        )}
      </div>

      <UploadCallForm />

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm">
        <ul className="divide-y divide-zinc-800">
          {calls.map((c) => (
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
                    {c.openItems > 0 && ` · ${c.openItems} open action items`}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            </li>
          ))}
          {calls.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-zinc-400">
              No calls yet — upload your first recording above.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
