"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const SLIDE_DURATION = 4000;

function IconArrow({ direction = "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {direction === "right" ? (
        <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M19 12H5m6 6-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default function HeroSlider({ slides = [] }) {
  const items = slides.length
    ? slides
    : [
        {
          id: "fallback",
          image: "",
          title: "Big Fun For Little Humans",
          description:
            "Safe, imaginative, screen-free toys selected by real parents — delivered fast across Pakistan.",
          href: "/shop",
        },
      ];

  const [index, setIndex] = useState(0);
  const total = items.length;

  useEffect(() => {
    if (total < 2) return;
    const timer = setTimeout(() => {
      setIndex((current) => (current + 1) % total);
    }, SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [index, total]);

  const goTo = (next) => setIndex(((next % total) + total) % total);

  return (
    <section
      className="mt-5 sm:mt-7"
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div className="relative h-[380px] w-full overflow-hidden bg-slate-900 sm:h-[480px] lg:h-[560px]">
        <div
          className="flex h-full transition-transform duration-700 ease-in-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((slide, slideIndex) => (
            <article
              key={slide.id || slideIndex}
              className="relative h-full w-full shrink-0"
              aria-hidden={slideIndex !== index}
              aria-label={`${slideIndex + 1} of ${total}: ${slide.title}`}
            >
              {slide.image ? (
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={slideIndex === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-toy-purple" />
              )}
              <div className="absolute inset-0 bg-slate-950/60" />

              <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-4xl flex-col items-center px-4 pb-14 text-center sm:pb-16">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-toy-yellow" />
                  Pakistan&apos;s trusted toy store
                </span>
                <h1 className="mt-4 text-4xl font-black uppercase leading-[0.95] tracking-tight text-toy-yellow drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl">
                  {slide.title}
                </h1>
                <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
                  {slide.description}
                </p>
                <Link
                  href={slide.href}
                  tabIndex={slideIndex === index ? 0 : -1}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-toy-orange px-7 py-3 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-amber-900/30 transition hover:bg-amber-600"
                >
                  Shop the collection
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35 sm:grid"
            >
              <IconArrow direction="left" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35 sm:grid"
            >
              <IconArrow direction="right" />
            </button>

            <div
              className="absolute inset-x-0 bottom-4 mx-auto flex max-w-xl items-center justify-center gap-2 px-4"
              role="tablist"
              aria-label="Choose a featured collection"
            >
              {items.map((slide, slideIndex) => (
                <button
                  key={slide.id || slideIndex}
                  type="button"
                  role="tab"
                  aria-selected={slideIndex === index}
                  aria-label={`Show ${slide.title}`}
                  onClick={() => goTo(slideIndex)}
                  className="group h-3 flex-1 rounded-full py-1"
                >
                  <span className="block h-1 w-full overflow-hidden rounded-full bg-white/45 transition group-hover:bg-white/70">
                    <span
                      key={`${slideIndex}-${index}`}
                      className={`block h-full w-full origin-left rounded-full bg-toy-yellow ${
                        slideIndex === index ? "hero-progress-bar" : ""
                      }`}
                      style={slideIndex === index ? undefined : { transform: "scaleX(0)" }}
                    />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
