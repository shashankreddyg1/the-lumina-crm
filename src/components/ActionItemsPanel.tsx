"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = {
  id: string;
  text: string;
  owner: string | null;
  done: boolean;
  dueDate: string | null;
};

type Props = {
  callId: string;
  status: string;
  hasTranscript: boolean;
  initialItems: Item[];
  demoMode: boolean;
};

export default function ActionItemsPanel({
  callId,
  status,
  hasTranscript,
  initialItems,
  demoMode,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runPipeline(path: string, label: string) {
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  async function toggle(item: Item) {
    setError(null);
    const res = await fetch(`/api/action-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !item.done }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Update failed");
      return;
    }
    router.refresh();
  }

  const canTranscribe = !hasTranscript;
  const canExtract = hasTranscript && status !== "ANALYZED";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-zinc-100">Action items</h2>
        <div className="flex gap-2">
          <button
            onClick={() =>
              runPipeline(`/api/calls/${callId}/transcribe`, "transcribe")
            }
            disabled={!canTranscribe || busy !== null}
            title={
              demoMode
                ? "Transcribe with mock AI output (demo mode)"
                : "Transcribe with Whisper"
            }
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-900/5 disabled:opacity-50"
          >
            {busy === "transcribe" ? "Transcribing…" : "Transcribe"}
          </button>
          <button
            onClick={() =>
              runPipeline(`/api/calls/${callId}/action-items`, "extract")
            }
            disabled={!canExtract || busy !== null}
            title={
              demoMode
                ? "Extract action items with mock AI output (demo mode)"
                : "Extract action items with AI"
            }
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy === "extract" ? "Extracting…" : "Extract action items"}
          </button>
        </div>
      </div>

      {demoMode && (
        <p className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
          Demo mode: transcription and extraction run on mock AI output, so you
          can try the full pipeline with no API key. Add{" "}
          <code className="font-mono">OPENAI_API_KEY</code> to use Whisper + GPT
          for real.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {initialItems.length > 0 ? (
        <ul className="mt-4 divide-y divide-zinc-800">
          {initialItems.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-3">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggle(item)}
                className="mt-1 h-4 w-4 rounded border-zinc-700 text-brand-400 focus:ring-brand-500"
              />
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    item.done
                      ? "text-zinc-500 line-through"
                      : "text-zinc-200"
                  }`}
                >
                  {item.text}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {item.owner ? `Owner: ${item.owner}` : "No owner"}
                  {item.dueDate
                    ? ` · Due ${new Date(item.dueDate).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-zinc-400">
          No action items yet.{" "}
          {hasTranscript
            ? "Click “Extract action items” to generate them from the transcript."
            : "Transcribe the call first, then extract action items."}
        </p>
      )}
    </div>
  );
}
