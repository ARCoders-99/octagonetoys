import Image from "next/image";
import Link from "next/link";
import { STORE_NAME } from "@/lib/constants";

export const metadata = {
  title: "About us",
  description: `${STORE_NAME} curates safe, imaginative and screen-free toys for Pakistani families.`,
};

const VALUES = [
  {
    title: "Parent-tested",
    body: "Every toy is opened, built and played with by real families before it goes on sale.",
    color: "#ec4899",
    emoji: "🧸",
  },
  {
    title: "Safe materials",
    body: "Non-toxic paints, rounded edges and age-appropriate small parts on everything we stock.",
    color: "#3b82f6",
    emoji: "🛡️",
  },
  {
    title: "Screen-free fun",
    body: "Open-ended toys that build imagination, problem-solving and conversation.",
    color: "#22c55e",
    emoji: "🧩",
  },
  {
    title: "Fair prices",
    body: "Carefully chosen ranges at honest prices, with free delivery over Rs. 3,999.",
    color: "#f59e0b",
    emoji: "🚚",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-[#f8f6ff]">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">
              About {STORE_NAME}
            </p>
            <h1 className="mt-2 text-4xl font-black leading-[1.02] tracking-tight text-slate-900 sm:text-5xl">
              Toys chosen by parents,
              <span className="text-toy-purple"> loved by kids.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              {STORE_NAME} started with a simple frustration: too many toys look exciting in photos
              and fall apart in real life. We set out to build a store where every product is
              checked for safety, durability and genuine play value before it earns a place.
            </p>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
              From first wooden blocks to remote-control adventures, we stock a focused range for
              every stage — and we are always happy to help you choose the right gift.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-full bg-toy-orange px-6 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-amber-600"
              >
                Shop toys
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-slate-300 px-6 py-3 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:border-slate-400"
              >
                Talk to us
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-2 rotate-3 rounded-[2rem] bg-amber-200/60" />
            <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-white shadow-xl">
              <Image
                src="/demo/blocks.jpg"
                alt="Wooden blocks from the Octagonetoys range"
                fill
                sizes="(max-width: 1024px) 90vw, 440px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h2 className="text-center text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          What we care about
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <div key={value.title} className="rounded-3xl border border-slate-200 bg-white p-6">
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
                style={{ backgroundColor: `${value.color}1a` }}
              >
                {value.emoji}
              </span>
              <h3 className="mt-4 text-sm font-black uppercase tracking-wide text-slate-900">
                {value.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{value.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
