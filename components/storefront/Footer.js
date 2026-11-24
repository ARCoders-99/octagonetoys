import Link from "next/link";
import Image from "next/image";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";

const SOCIAL_NETWORKS = ["instagram", "facebook", "youtube", "tiktok"];

function SocialIcon({ network }) {
  const shared = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    className: "h-4 w-4",
    "aria-hidden": "true",
  };

  switch (network) {
    case "instagram":
      return (
        <svg {...shared}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...shared}>
          <path
            d="M15 3.5h-2.2A3.8 3.8 0 0 0 9 7.3V10H6.5v3H9v7.5h3V13h2.5l.5-3H12V7.3c0-.6.3-1 1-1h2V3.5Z"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg {...shared}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="m10 9.5 5 2.5-5 2.5v-5Z" strokeLinejoin="round" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...shared}>
          <path d="M14 3.5v10.7a3.3 3.3 0 1 1-3-3.3" strokeLinecap="round" />
          <path d="M14 3.5c.3 2.2 1.8 3.7 4 4" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

const POLICIES = [
  {
    title: "About Octagonetoys",
    subtitle: "Pakistan's trusted online toy store",
    accent: "#ec4899",
    body: "Octagonetoys curates safe, imaginative and screen-free toys for every stage of childhood. Every product is checked by real parents before it reaches our shelves, and we ship nationwide with cash on delivery available.",
  },
  {
    title: "Shipping Policy",
    subtitle: "Fast, reliable and secure delivery across Pakistan",
    accent: "#f59e0b",
    body: "Orders are dispatched within 1–2 working days. Delivery usually takes 2–4 working days in major cities and 4–7 working days elsewhere. Shipping is free on orders above Rs. 3,999; a flat Rs. 250 applies below that.",
  },
  {
    title: "Returns & Replacement Policy",
    subtitle: "7-day easy returns, fast refunds and trusted service",
    accent: "#10b981",
    body: "Changed your mind or received a damaged item? Contact us within 7 days of delivery with your order number. Unused items in their original packaging qualify for a return or replacement. Refunds are processed within 5 working days of inspection.",
  },
];

const HELP_LINKS = [
  ["Privacy Policy", "/policies/privacy-policy"],
  ["Returns & Exchange policy", "/policies/returns-policy"],
  ["Shipping Policy", "/policies/shipping-policy"],
  ["Terms & Conditions", "/policies/terms"],
  ["Contact Us", "/contact"],
];

const ABOUT_LINKS = [
  ["About Octagonetoys", "/about"],
  ["Our Collections", "/collections"],
  ["New Arrivals", "/shop?sort=newest"],
  ["Shop by Age", "/shop"],
];

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path
        d="M6.5 3.5h2.2l1.4 4-2 1.4a12 12 0 0 0 5 5l1.4-2 4 1.4v2.2a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrandMark({ className = "" }) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Octagonetoys"
      width={640}
      height={643}
      sizes="120px"
      className={`w-auto object-contain ${className}`}
    />
  );
}

export default function Footer({ collections = [], settings = DEFAULT_STORE_SETTINGS }) {
  const collectionLinks = collections.slice(0, 4);
  const socialLinks = SOCIAL_NETWORKS.map((network) => ({
    network,
    href: settings.socialLinks?.[network] || "",
  })).filter((item) => item.href);

  return (
    <footer className="mt-4">
      {/* ── Policy accordions ─────────────────────────────────────────── */}
      <section className="bg-white px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          {POLICIES.map((policy) => (
            <details
              key={policy.title}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white shadow-sm transition-colors duration-300 hover:border-white/20 hover:bg-slate-900"
            >
              <summary
                className="flex cursor-pointer list-none items-center justify-between gap-4 border-l-8 px-5 py-4 [&::-webkit-details-marker]:hidden"
                style={{ borderLeftColor: policy.accent }}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-black uppercase tracking-wide sm:text-base">
                    {policy.title}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium" style={{ color: policy.accent }}>
                    {policy.subtitle}
                  </span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5 shrink-0 text-white/70 transition-transform duration-300 group-open:rotate-90"
                  aria-hidden="true"
                >
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="border-l-8 px-5 pb-5" style={{ borderLeftColor: policy.accent }}>
                <p className="max-w-3xl text-sm leading-6 text-slate-300">{policy.body}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Main footer ───────────────────────────────────────────────── */}
      <div className="bg-[#470b7d] text-white">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block" aria-label="Octagonetoys home">
              <BrandMark className="h-20" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/80">
              Safe, fun and imaginative toys for curious kids. Thoughtfully selected, tested by
              real families and delivered across Pakistan.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {socialLinks.map(({ network, href }) => (
                <a
                  key={network}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                  aria-label={`Octagonetoys on ${network}`}
                  title={network[0].toUpperCase() + network.slice(1)}
                >
                  <SocialIcon network={network} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white">
              Customer Care – Help
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/80">
              {HELP_LINKS.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="transition hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white">Contact us</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li>
                <a
                  href={`mailto:${settings.storeEmail}`}
                  className="flex items-start gap-2.5 transition hover:text-white"
                >
                  <MailIcon />
                  <span className="break-all">{settings.storeEmail}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${String(settings.storePhone).replace(/[^\d+]/g, "")}`}
                  className="flex items-start gap-2.5 transition hover:text-white"
                >
                  <PhoneIcon />
                  <span>{settings.storePhone}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                >
                  <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span>{settings.storeAddress}</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-white/60">Mon – Sat, 10am – 7pm PKT</p>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white">About us</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/80">
              {ABOUT_LINKS.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="transition hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
              {collectionLinks.map((collection) => (
                <li key={collection._id}>
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="transition hover:text-white"
                  >
                    {collection.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>
              © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
            </p>
            <p>Secure checkout · Cash on delivery · Nationwide shipping</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
