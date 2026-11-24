import Image from "next/image";
import Link from "next/link";
import { getActiveCollections } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Toy collections",
  description: "Explore curated toy collections by age, interest and play style.",
};

export default async function CollectionsPage() {
  let collections = [];

  try {
    collections = await getActiveCollections({ limit: 50 });
  } catch (error) {
    console.error("Collections page data error:", error.message);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600">Collections</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
          Shop by collection
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Every collection is hand-curated by our team so you can find the right toy faster —
          whether you need a first birthday gift or a rainy-day activity.
        </p>
      </div>

      {collections.length === 0 ? (
        <div className="mt-10 rounded-[2rem] border border-dashed border-amber-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-4xl">
            🗂️
          </div>
          <h2 className="mt-4 text-xl font-black text-ink-900">Collections are coming soon</h2>
          <p className="mt-1 text-sm text-slate-500">
            In the meantime, browse every toy in the shop.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex rounded-full bg-toy-orange px-6 py-3 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600"
          >
            Shop all toys
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection._id}
              href={`/collections/${collection.slug}`}
              className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-100/60"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-amber-100">
                {collection.image ? (
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 640px) 90vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-6xl">🧸</div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-ink-800 shadow-sm backdrop-blur">
                  {collection.productCount} {collection.productCount === 1 ? "toy" : "toys"}
                </span>
              </div>
              <div className="p-5">
                <h2 className="text-lg font-black text-ink-900 transition group-hover:text-toy-purple">
                  {collection.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                  {collection.description || "Explore this collection."}
                </p>
                <span className="mt-4 inline-flex text-sm font-bold text-toy-purple">
                  Explore collection →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
