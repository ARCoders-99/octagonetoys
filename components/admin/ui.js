// Small presentational building blocks for the admin panel.

export function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const TONES = {
  slate: "bg-slate-100 text-slate-700",
  brand: "bg-brand-100 text-brand-800",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-700",
  info: "bg-sky-100 text-sky-700",
};

export function Badge({ tone = "slate", children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${TONES[tone] || TONES.slate}`}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, hint, icon, tone = "brand" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        {icon && (
          <span className={`grid h-9 w-9 place-items-center rounded-xl text-base ${TONES[tone] || TONES.brand}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-black tracking-tight text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function EmptyState({ icon = "📭", title, description, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 text-lg font-black text-ink-900">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>}
      {children && <div className="mt-5 flex justify-center gap-2">{children}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-sm font-semibold text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      {label}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-xs font-bold underline">
          Try again
        </button>
      )}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export const labelClass = "mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500";

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const buttonPrimary =
  "inline-flex items-center justify-center rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonSecondary =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60";

export const buttonDanger =
  "inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60";

export const buttonBrand =
  "inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-black text-ink-900 transition hover:bg-brand-400 disabled:opacity-60";
