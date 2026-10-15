const styles: Record<string, string> = {
  UPLOADED: "bg-slate-100 text-slate-700",
  TRANSCRIBING: "bg-amber-100 text-amber-800",
  TRANSCRIBED: "bg-sky-100 text-sky-800",
  ANALYZED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
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
