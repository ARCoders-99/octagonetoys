import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";
import CategoryCarousel from "@/components/storefront/CategoryCarousel";
import HeroSlider from "@/components/storefront/HeroSlider";
import { getActiveCollections, getFeaturedProducts, getNewArrivals } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Toys that spark big imaginations",
  description:
    "Shop safe, fun and imaginative toys for every age. Explore categories, shop by age, discover new arrivals and browse collections with fast delivery across Pakistan.",
};

const AGE_BUCKETS = [
  { value: "0-1", age: "0 – 1", label: "Babies", color: "#f59e0b" },
  { value: "1-3", age: "1 – 3", label: "Toddlers", color: "#3b82f6" },
  { value: "3-6", age: "3 – 6", label: "Preschool", color: "#22c55e" },
  { value: "6-plus", age: "6+", label: "Big kids", color: "#a855f7" },
];

export default async function HomePage() {
  let featured = [];
  let arrivals = [];
  let collections = [];

  try {
    const result = await Promise.all([
      getFeaturedProducts(8),
      getNewArrivals(8),
      getActiveCollections({ limit: 8 }),
    ]);
    featured = result[0];
    arrivals = result[1];
    collections = result[2];
  } catch (error) {
    console.error("Home page data error:", error.message);
  }

  const heroSlides = collections.slice(0, 5).map((collection) => ({
    id: collection._id,
    image: collection.image,
    title: collection.name,
    description:
      collection.description ||
      "Safe, imaginative, screen-free toys selected by real parents — delivered fast across Pakistan.",
    href: `/collections/${collection.slug}`,
  }));

  if (heroSlides.length === 0) {
    const heroProduct = featured[0] || arrivals[0];
    heroSlides.push({
      id: heroProduct?._id || "fallback",
      image: heroProduct?.images?.[0]?.url || "",
      title: heroProduct?.name || "Big Fun For Little Humans",
      description:
        heroProduct?.description ||
        "Safe, imaginative, screen-free toys selected by real parents — delivered fast across Pakistan.",
      href: heroProduct ? `/product/${heroProduct.slug}` : "/shop",
    });
  }

  return (
    <div>
      {/* ── Explore categories ─────────────────────────────────────────── */}
      <CategoryCarousel />

      {/* ── Hero slider ─────────────────────────────────────────────────── */}
      <HeroSlider slides={heroSlides} />

      {/* ── Shop by age ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Shop by Age
          </h2>
          <p className="mt-2 text-sm italic text-slate-500">
            Every toy, perfectly matched to your child&apos;s stage
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 justify-items-center gap-x-4 gap-y-8 sm:grid-cols-4">
          {AGE_BUCKETS.map((bucket) => (
            <Link
              key={bucket.value}
              href={`/shop?age=${bucket.value}`}
              className="group flex flex-col items-center text-center"
            >
              <span
                className="grid h-28 w-28 place-items-center rounded-full text-white shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 sm:h-36 sm:w-36"
                style={{ backgroundColor: bucket.color, boxShadow: `0 14px 30px -12px ${bucket.color}` }}
              >
                <span className="flex flex-col items-center leading-none">
                  <span className="text-2xl font-black sm:text-3xl">{bucket.age}</span>
                  <span className="mt-1 text-[10px] font-black uppercase tracking-[0.22em]">Years</span>
                </span>
              </span>
              <span className="mt-3 text-sm font-bold text-slate-800 group-hover:text-amber-600">
                {bucket.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── New arrivals ────────────────────────────────────────────────── */}
      {arrivals.length > 0 && (
        <section className="bg-amber-50/40">
          <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Check What Arrived Today
              </h2>
              <p className="mt-2 text-sm italic text-slate-500">
                Little Luxuries That Make Every Day Better
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {arrivals.map((product, index) => (
                <ProductCard key={product._id} product={product} priority={index < 4} />
              ))}
            </div>

            <div className="mt-9 flex justify-center">
              <Link
                href="/shop?sort=newest"
                className="inline-flex items-center gap-2 rounded-full bg-toy-orange px-7 py-4 text-xs font-black uppercase tracking-[0.12em] text-white shadow-md shadow-amber-200 transition hover:bg-amber-600"
              >
                View all
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

    
      {/* ── Collections ─────────────────────────────────────────────────── */}
      {collections.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Explore All Our Collections
            </h2>
            <p className="mt-2 text-sm italic text-slate-500">Discover A World Of Toy</p>
          </div>

          <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
            {collections.map((collection) => (
              <Link
                key={collection._id}
                href={`/collections/${collection.slug}`}
                className="group relative block aspect-[4/3] w-[280px] shrink-0 snap-start overflow-hidden rounded-3xl bg-slate-100 sm:w-[calc((100%_-_1rem)/2)] lg:w-auto lg:shrink"
              >
                {collection.image ? (
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 640px) 300px, 520px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#ede9fe]" />
                )}
                <div className="absolute inset-0 bg-slate-950/55" />

                <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-5 sm:p-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-toy-yellow">
                      {collection.productCount} {collection.productCount === 1 ? "toy" : "toys"}
                    </p>
                    <h3 className="mt-1 text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl font-sans">
                      {collection.name}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-600 transition group-hover:bg-toy-orange group-hover:text-white">
                    Shop now
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 rounded-full bg-toy-orange px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-white shadow-md shadow-amber-200 transition hover:bg-amber-600"
            >
              View all
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      )}

      {/* ── Gift help banner ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-toy-purple px-6 py-9 text-center text-white sm:flex-row sm:justify-between sm:px-10 sm:text-left">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80">
              Can&apos;t decide?
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              We&apos;ll help you pick the perfect gift.
            </h2>
            <p className="mt-1 max-w-xl text-sm text-white/85">
              Tell us the child&apos;s age and interests and we&apos;ll suggest toys that are safe,
              fun and actually get played with.
            </p>
          </div>
          <Link
            href="/shop"
            className="shrink-0 rounded-full bg-white px-7 py-3 text-xs font-black uppercase tracking-[0.12em] text-purple-700 transition hover:bg-amber-50"
          >
            Start exploring
          </Link>
        </div>
      </section>

      {/* ── Welcome to Octagonetoys ─────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1000px] px-5 text-center sm:px-6 lg:px-8">
          <Image
            src="/brand/logo.png"
            alt="Octagonetoys"
            width={640}
            height={643}
            className="mx-auto h-20 w-auto object-contain sm:h-24 lg:h-28"
          />

          <h2 className="mt-9 text-[28px] font-black leading-[1.15] tracking-tight text-slate-900 sm:mt-12 sm:text-4xl lg:text-[46px]">
            Welcome to <span className="text-toy-purple">OctagoneToys</span> – Your Destination for{" "}
            <span className="text-toy-purple">Fun, Learning &amp; Quality Toys</span>
          </h2>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-toy-purple" />

          <p className="mx-auto mt-6 max-w-[900px] text-sm font-medium leading-7 text-slate-600 sm:text-base sm:leading-8">
            Welcome to OctagoneToys, your destination for discovering exciting toys for kids of all
            ages. Explore a variety of toys designed to encourage creativity, imagination, learning,
            and endless fun. From entertaining playtime essentials to educational toys, we make it
            easy to find something special for every little one. Discover your next favourite toy at
            OctagoneToys!
          </p>
        </div>
      </section>
    </div>
  );
}
