export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { demoGetCall } from "@/lib/demoStore";
import type { DemoCallDetail } from "@/lib/demo";
import ActionItemsPanel from "@/components/ActionItemsPanel";
import StatusBadge from "@/components/StatusBadge";

type CallView = Omit<DemoCallDetail, "actionItems"> & { demoMode: boolean };
type ItemView = DemoCallDetail["actionItems"][number];

async function getCall(
  id: string
): Promise<{ call: CallView; items: ItemView[] } | null> {
  const database = getDb();
  if (database) {
    try {
      const call = await database.call.findUnique({
        where: { id },
        include: {
          contact: true,
          actionItems: { orderBy: { createdAt: "asc" } },
        },
      });
      if (call) {
        return {
          call: {
            id: call.id,
            title: call.title,
            status: call.status,
            audioUrl: call.audioUrl,
            transcript: call.transcript,
            createdAt: call.createdAt.toISOString(),
            contactName: call.contact?.name ?? null,
            contactCompany: call.contact?.company ?? null,
            demoMode: false,
          },
          items: call.actionItems.map((a) => ({
            id: a.id,
            text: a.text,
            owner: a.owner,
            done: a.done,
            dueDate: a.dueDate?.toISOString() ?? null,
          })),
        };
      }
    } catch {
      // Database unreachable — fall through to the in-memory demo store.
    }
  }
  const demo = demoGetCall(id);
  if (!demo) return null;
  const { actionItems, ...rest } = demo;
  return { call: { ...rest, demoMode: true }, items: actionItems };
}

export default async function CallDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getCall(params.id);
  if (!data) notFound();
  const { call, items } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/calls"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to calls
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {call.title}
          </h1>
          <StatusBadge status={call.status} />
          {call.demoMode && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              Demo mode
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {call.contactName ?? "No contact"}
          {call.contactCompany ? ` · ${call.contactCompany}` : ""} ·{" "}
          {new Date(call.createdAt).toLocaleDateString()}
        </p>
      </div>

      {call.audioUrl && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Recording</h2>
          <audio controls src={call.audioUrl} className="w-full" />
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Transcript</h2>
        {call.transcript ? (
          <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {call.transcript}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No transcript yet. Run transcription to generate one from the
            recording.
          </p>
        )}
      </div>

      <ActionItemsPanel
        callId={call.id}
        status={call.status}
        hasTranscript={Boolean(call.transcript)}
        initialItems={items}
        demoMode={call.demoMode}
      />
    </div>
  );
}
