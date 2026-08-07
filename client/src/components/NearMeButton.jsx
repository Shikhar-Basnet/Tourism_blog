import { Navigation2, Loader2, X } from "lucide-react";

export default function NearMeButton({ active, loading, onClick, onClear }) {
  if (active) {
    return (
      <button
        type="button"
        onClick={onClear}
        className="flex items-center gap-2 rounded-full border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <X size={14} /> Clear nearby results
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Navigation2 size={14} />}
      {loading ? "Finding nearby spots..." : "Destinations near me"}
    </button>
  );
}