import Link from "next/link";
import ContactForm from "@/components/storefront/ContactForm";
import { STORE_NAME } from "@/lib/constants";
import { getSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact us",
  description: `Get in touch with ${STORE_NAME}. We are happy to help with orders, sizing, gifts and returns.`,
};

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Most orders arrive in 2–4 working days in major cities and 4–7 working days elsewhere. You will receive tracking information as soon as your parcel ships.",
  },
  {
    q: "Can I pay cash on delivery?",
    a: "Yes. Cash on delivery is available nationwide. Please keep the exact amount ready for the courier.",
  },
  {
    q: "Can I return an item?",
    a: "Unused items in their original packaging can be returned within 7 days. See our returns policy for full details.",
  },
  {
    q: "Do you gift wrap?",
    a: "We are happy to include a handwritten gift note on request. Just mention it in the order notes at checkout.",
  },
];

export default async function ContactPage() {
  const settings = await getSettings();
  const phoneDigits = String(settings.storePhone || "").replace(/[^\d+]/g, "");
  const whatsappDigits = String(settings.whatsappNumber || settings.storePhone || "").replace(/[^\d]/g, "");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">
          We are here to help
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Contact us
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Questions about an order, a gift idea or a return? Send us a message and our team will
          reply within one working day.
        </p>
      </div>

      <div className="mt-9 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <a
            href={`mailto:${settings.storeEmail}`}
            className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <rect x="3" y="5" width="18" height="14" rx="2.5" />
                <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="mt-4 text-sm font-black uppercase tracking-wide text-slate-900">Email</h2>
            <p className="mt-1 break-all text-sm text-slate-600 group-hover:text-amber-700">
              {settings.storeEmail}
            </p>
          </a>

          <a
            href={`tel:${phoneDigits}`}
            className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path
                  d="M6.5 3.5h2.2l1.4 4-2 1.4a12 12 0 0 0 5 5l1.4-2 4 1.4v2.2a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <h2 className="mt-4 text-sm font-black uppercase tracking-wide text-slate-900">Phone</h2>
            <p className="mt-1 text-sm text-slate-600 group-hover:text-emerald-700">
              {settings.storePhone}
            </p>
            <p className="mt-1 text-xs text-slate-400">Mon – Sat, 10am – 7pm PKT</p>
          </a>

          {whatsappDigits && (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-teal-300 hover:shadow-lg hover:shadow-teal-100"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-100 text-teal-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path
                    d="M20 11.5a8 8 0 0 1-11.9 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z"
                    strokeLinejoin="round"
                  />
                  <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" strokeLinecap="round" />
                </svg>
              </span>
              <h2 className="mt-4 text-sm font-black uppercase tracking-wide text-slate-900">WhatsApp</h2>
              <p className="mt-1 text-sm text-slate-600 group-hover:text-teal-700">
                Chat with our toy experts
              </p>
            </a>
          )}

          {settings.storeAddress && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <h2 className="mt-4 text-sm font-black uppercase tracking-wide text-slate-900">Address</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{settings.storeAddress}</p>
            </div>
          )}
        </div>

        <ContactForm />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Quick answers</h2>
        <div className="mt-5 space-y-3">
          {FAQS.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-slate-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-bold text-slate-800">{item.q}</span>
                <span className="text-lg leading-none text-slate-400 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-3xl bg-slate-950 p-7 text-white sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Still need a hand?</h2>
          <p className="mt-1 text-sm text-slate-400">
            Browse our policies or start a return request.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
          <Link
            href="/policies/returns-policy"
            className="rounded-full bg-toy-orange px-5 py-2.5 text-[11px] font-black uppercase tracking-wide text-white transition hover:bg-amber-600"
          >
            Returns policy
          </Link>
          <Link
            href="/policies/shipping-policy"
            className="rounded-full border border-white/20 px-5 py-2.5 text-[11px] font-black uppercase tracking-wide text-white transition hover:bg-white/10"
          >
            Shipping
          </Link>
        </div>
      </div>
    </div>
  );
}
