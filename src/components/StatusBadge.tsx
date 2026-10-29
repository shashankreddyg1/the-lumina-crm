const styles: Record<string, string> = {
  UPLOADED: "bg-zinc-800 text-zinc-300",
  TRANSCRIBING: "bg-amber-400/10 text-amber-300",
  TRANSCRIBED: "bg-sky-400/10 text-sky-300",
  ANALYZED: "bg-emerald-400/10 text-emerald-300",
  FAILED: "bg-red-400/10 text-red-300",
};

export default function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? styles.UPLOADED
      }`}
    >
      {label}
    </span>
  );
}
