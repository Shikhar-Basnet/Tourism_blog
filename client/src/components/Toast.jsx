import { CheckCircle2, AlertCircle, X } from "lucide-react";

// Renders every currently-active toast, stacked top-right, each animating
// in on arrival and fading/sliding out independently on dismiss — so
// several actions fired in quick succession are each visibly distinct.
export default function Toast({ toasts, onDismiss }) {
  if (!toasts?.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[1100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg ring-1 ring-black/5 transition-all duration-200 ease-out animate-in fade-in slide-in-from-top-2 ${
            toast.leaving ? "translate-x-2 opacity-0" : "translate-x-0 opacity-100"
          } ${
            toast.type === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-red-100 bg-red-50 text-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
            className="shrink-0 text-current opacity-50 transition-opacity hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}