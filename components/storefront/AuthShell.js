export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  perks = [],
  children,
  footer,
}) {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-fuchsia-200/35 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:items-center lg:py-16">
        <aside className="hidden overflow-hidden rounded-[2.5rem] bg-toy-purple p-10 text-white shadow-2xl shadow-[#7232dc]/20 lg:block">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
            Octagonetoys
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight">
            Toys that spark big imaginations.
          </h2>
          <ul className="mt-8 space-y-4">
            {perks.map((perk) => (
              <li key={perk.title} className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/15 text-lg">
                  {perk.icon}
                </span>
                <span>
                  <span className="block text-sm font-bold">{perk.title}</span>
                  <span className="block text-xs leading-5 text-white/70">{perk.body}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-xs text-white/60">
            Trusted by thousands of Pakistani families.
          </p>
        </aside>

        <section className="rounded-[2rem] border border-amber-200/70 bg-white p-6 shadow-xl shadow-amber-100/50 sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-ink-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}

          {children}

          {footer}
        </section>
      </div>
    </div>
  );
}
