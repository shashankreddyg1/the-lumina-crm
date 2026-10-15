"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadCallForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function useSampleCall() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/calls/sample", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create sample call");
      router.push(`/calls/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create sample call");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose an audio file first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("audio", file);
      form.append("title", title.trim() || file.name);
      const res = await fetch("/api/calls/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      router.push(`/calls/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="font-semibold text-slate-900">Upload a call recording</h2>
      <p className="mt-1 text-sm text-slate-500">
        MP3, WAV, or M4A. After upload, run transcription and action-item
        extraction from the call page.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Call title, e.g. Discovery call — Acme Corp"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
        <button
          type="button"
          onClick={useSampleCall}
          disabled={busy}
          title="Create a sample call to try the transcribe → extract pipeline"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Use a sample call
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
