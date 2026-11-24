"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// Category cards. Add an `image` URL to any entry and it replaces the emoji.
const CATEGORIES = [
  { label: "Toy Guns", query: "toy gun", emoji: "🔫", tint: "#ffe4e6" },
  { label: "Potty Chairs", query: "potty chair", emoji: "🪑", tint: "#fce7f3" },
  { label: "Shopping Carts", query: "shopping cart", emoji: "🛒", tint: "#fdf2f8" },
  { label: "Basketball", query: "basketball", emoji: "🏀", tint: "#fce7f3" },
  { label: "Rockers", query: "rocker", emoji: "🐎", tint: "#ffe4e6" },
  { label: "Rocking Chairs", query: "rocking chair", emoji: "🪑", tint: "#fdf2f8" },
  { label: "Bather", query: "bather", emoji: "🛁", tint: "#fce7f3" },
  { label: "Learning Boards", query: "learning board", emoji: "📒", tint: "#fdf2f8" },
  { label: "Teddy Bears", query: "teddy bear", emoji: "🧸", tint: "#ffe4e6" },
  { label: "RC Cars", query: "rc car", emoji: "🚗", tint: "#fce7f3" },
  { label: "Puzzles", query: "puzzle", emoji: "🧩", tint: "#fdf2f8" },
  { label: "Building Blocks", query: "building block", emoji: "🧱", tint: "#ffe4e6" },
  { label: "Space Toys", query: "space toy", emoji: "🚀", tint: "#fce7f3" },
  { label: "Arts & Crafts", query: "arts crafts", emoji: "🎨", tint: "#fdf2f8" },
  { label: "Science Kits", query: "science kit", emoji: "🔬", tint: "#ffe4e6" },
  { label: "Dollhouses", query: "dollhouse", emoji: "🏠", tint: "#fce7f3" },
  { label: "Board Games", query: "board game", emoji: "🎲", tint: "#fdf2f8" },
  { label: "Outdoor Play", query: "outdoor play", emoji: "🪁", tint: "#ffe4e6" },
  { label: "Robots", query: "robot", emoji: "🤖", tint: "#fce7f3" },
  { label: "Baby Toys", query: "baby toy", emoji: "👶", tint: "#fdf2f8" },
];

const PER_PAGE = { sm: 2, md: 4, lg: 8 };
const BREAKPOINTS = { sm: 640, md: 768, lg: 1024 };

function IconArrow({ direction = "right", className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className={className}
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

export default function CategoryCarousel() {
  const trackRef = useRef(null);
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [perPage, setPerPage] = useState(PER_PAGE.lg);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(CATEGORIES.length / perPage);

  const updatePerPage = useCallback(() => {
    const w = window.innerWidth;
    if (w >= BREAKPOINTS.lg) setPerPage(PER_PAGE.lg);
    else if (w >= BREAKPOINTS.md) setPerPage(PER_PAGE.md);
    else setPerPage(PER_PAGE.sm);
  }, []);

  const syncEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = Math.max(track.scrollWidth - track.clientWidth, 1);
    setAtStart(track.scrollLeft <= 2);
    setAtEnd(track.scrollLeft >= maxScroll - 2);
    const firstCard = track.querySelector("a");
    const gap = parseFloat(getComputedStyle(track.firstElementChild).columnGap || "0") || 16;
    const cardWidth = (firstCard?.getBoundingClientRect().width || 190) + gap;
    const pages = Math.ceil(CATEGORIES.length / perPage);
    const page = Math.min(pages - 1, Math.max(0, Math.round(track.scrollLeft / (cardWidth * perPage))));
    setCurrentPage(page);
  }, [perPage]);

  useEffect(() => {
    updatePerPage();
    syncEdges();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", () => {
      updatePerPage();
      syncEdges();
    });
    return () => {
      track.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", updatePerPage);
    };
  }, [syncEdges, updatePerPage]);

  const scrollByPage = useCallback(
    (direction) => {
      const track = trackRef.current;
      if (!track) return;
      const firstCard = track.querySelector("a");
      if (!firstCard) return;
      const cardRect = firstCard.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      const gap = 24; // lg gap; roughly matches Tailwind gap
      const cardWidth = cardRect.width || (trackRect.width / perPage);
      const distance = Math.round((cardWidth + gap) * perPage);
      track.scrollBy({ left: direction === "right" ? distance : -distance, behavior: "smooth" });
    },
    [perPage]
  );

  const goToPage = useCallback(
    (page) => {
      const track = trackRef.current;
      if (!track) return;
      const firstCard = track.querySelector("a");
      if (!firstCard) return;
      const gap = parseFloat(getComputedStyle(track.firstElementChild).columnGap || "0") || 16;
      const cardWidth = firstCard.getBoundingClientRect().width + gap;
      track.scrollTo({ left: cardWidth * perPage * page, behavior: "smooth" });
    },
    [perPage]
  );

  const goTo = useCallback(
    (index, e) => {
      if (e) e.preventDefault();
      setActiveIndex(index);
      const track = trackRef.current;
      const card = track?.querySelectorAll("a")[index];
      if (!track || !card) return;
      const centerOffset = track.clientWidth / 2 - card.getBoundingClientRect().width / 2;
      const scrollLeft =
        card.getBoundingClientRect().left -
        track.getBoundingClientRect().left +
        track.scrollLeft -
        centerOffset;
      track.scrollTo({ left: scrollLeft, behavior: "smooth" });
    },
    []
  );

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-pink-600 shadow-sm backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
            Shop by category
          </span>
          <h2 className="mt-5 text-[30px] font-black leading-[1.1] tracking-tight text-slate-900 sm:text-4xl lg:text-[46px]">
            Explore Your Favourite{" "}
            <span className="text-[#ec4899]">
              Category
            </span>
          </h2>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollByPage("left")}
            disabled={atStart}
            aria-label="Previous categories"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 grid h-12 w-12 place-items-center rounded-full border border-white bg-toy-orange text-white shadow-xl transition hover:scale-105 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 sm:h-14 sm:w-14"
          >
            <IconArrow direction="left" className="h-5 w-5" />
          </button>

          <div
            ref={trackRef}
            className="overflow-x-hidden"
            style={{ scrollBehavior: "smooth" }}
          >
            <div
              ref={containerRef}
              className="flex gap-4 sm:gap-6 lg:gap-8"
            >
              {CATEGORIES.map((category, index) => {
                const active = activeIndex === index;
                return (
                  <Link
                    key={category.label}
                    href={`/shop?q=${encodeURIComponent(category.query)}`}
                    onClick={(e) => goTo(index, e)}
                    className={`shrink-0 snap-start flex w-[150px] sm:w-[170px] lg:w-[190px] flex-col overflow-hidden rounded-[24px] border bg-white shadow-sm transition-all duration-300 ${
                      active
                        ? "ring-2 ring-pink-500 bg-pink-50 shadow-[0_20px_40px_-12px_rgba(236,72,153,0.35)]"
                        : "border-transparent hover:border-pink-100 hover:shadow-md hover:-translate-y-1"
                    }`}
                  >
                    <div className="relative aspect-[5/4] w-full overflow-hidden bg-pink-50/40">
                      <div className="absolute inset-0 grid place-items-center text-[44px] sm:text-[52px] drop-shadow-[0_10px_14px_rgba(0,0,0,0.08)]">
                        <span className="animate-float" aria-hidden="true">
                          {category.emoji}
                        </span>
                      </div>
                      {active && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-2 w-8 rounded-full bg-pink-500" />
                      )}
                    </div>
                    <h3 className="mt-3 text-center text-[14px] font-extrabold leading-tight text-slate-900 sm:text-[16px] font-sans">
                      {category.label}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => scrollByPage("right")}
            disabled={atEnd}
            aria-label="Next categories"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 grid h-12 w-12 place-items-center rounded-full border border-white bg-toy-orange text-white shadow-xl transition hover:scale-105 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 sm:h-14 sm:w-14"
          >
            <IconArrow direction="right" className="h-5 w-5" />
          </button>
        </div>

        {/* Page dots: highlight the current page. */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, page) => (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              aria-label={`Go to category page ${page + 1}`}
              aria-current={currentPage === page ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentPage === page
                  ? "w-8 bg-toy-orange"
                  : "w-2.5 bg-slate-300 hover:bg-toy-orange/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
