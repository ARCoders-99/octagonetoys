import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/storefront/ProductCard";
import { getCollectionBySlug } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const result = await getCollectionBySlug(slug);
    if (!result) return { title: "Collection not found" };
    return {
      title: result.collection.name,
      description:
        result.collection.description ||
        `Shop the ${result.collection.name} collection at Octagonetoys.`,
    };
  } catch {
    return { title: "Collection" };
  }
}

export default async function CollectionDetailPage({ params }) {
  const { slug } = await params;

  let result = null;
  try {
    result = await getCollectionBySlug(slug);
  } catch (error) {
    console.error("Collection detail data error:", error.message);
  }

  if (!result) notFound();

  const { collection, products } = result;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-amber-100 bg-amber-50/50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-toy-pink/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr] lg:px-8">
          <div>
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              <Link href="/" className="hover:text-toy-purple">Home</Link>
              <span>/</span>
              <Link href="/collections" className="hover:text-toy-purple">Collections</Link>
              <span>/</span>
              <span className="text-ink-800">{collection.name}</span>
            </nav>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                {collection.description}
              </p>
            )}
            <p className="mt-4 inline-flex rounded-full bg-white px-3.5 py-1.5 text-xs font-black text-amber-700 shadow-sm ring-1 ring-amber-200">
              {products.length} {products.length === 1 ? "toy" : "toys"} in this collection
            </p>
          </div>

          <div className="relative aspect-[16/9] overflow-hidden rounded-[2rem] border-4 border-white bg-amber-100 shadow-xl shadow-amber-100/60">
            {collection.image ? (
              <Image
                src={collection.image}
                alt={collection.name}
                fill
                priority
                sizes="(max-width: 768px) 90vw, 45vw"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-7xl">🧸</div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-amber-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-4xl">
              📦
            </div>
            <h2 className="mt-4 text-xl font-black text-ink-900">This collection is empty</h2>
            <p className="mt-1 text-sm text-slate-500">New toys are on the way. Check back soon.</p>
            <Link
              href="/shop"
              className="mt-5 inline-flex rounded-full bg-toy-orange px-6 py-3 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-amber-200 transition hover:bg-amber-600"
            >
              Browse all toys
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product._id} product={product} priority={index < 4} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
