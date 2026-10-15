import { isDemoMode } from "@/lib/db";

/**
 * Visible banner shown on every page while the app runs in demo mode
 * (no DATABASE_URL). Tells recruiters exactly what they're looking at.
 */
export default function DemoBanner() {
  if (!isDemoMode) return null;
  return (
    <div className="bg-amber-400 px-4 py-2 text-center text-xs font-medium text-amber-950">
      Demo mode — running on in-memory sample data with mock AI output. No
      database or API key needed; everything you click works.
    </div>
  );
}
