import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/storefront/ProductCard";
import ProductGallery from "@/components/storefront/ProductGallery";
import ProductActions from "@/components/storefront/ProductActions";
import ReviewForm from "@/components/storefront/ReviewForm";
import { getProductBySlug, getRelatedProducts } from "@/lib/server/data";
import { effectivePrice, formatDate, formatPrice, isSaleActive, salePercent, stockLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const result = await getProductBySlug(slug);
    if (!result) return { title: "Product not found" };
    const product = result.product;
    const firstImage = product.images?.[0]?.url;
    return {
      title: product.metaTitle || product.name,
      description:
        product.metaDescription ||
        product.shortDescription ||
        `Buy ${product.name} at Octagonetoys with fast delivery across Pakistan.`,
      openGraph: firstImage ? { images: [{ url: firstImage }] } : undefined,
    };
  } catch {
    return { title: "Product" };
  }
}

function Stars({ rating = 0, size = "text-base" }) {
  const rounded = Math.round(Number(rating) || 0);
  return (
    <span className={`${size} tracking-tight text-toy-orange`} aria-hidden="true">
      {"★★★★★".slice(0, rounded)}
      <span className="text-slate-200">{"★★★★★".slice(rounded)}</span>
    </span>
  );
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;

  let result = null;
  try {
    result = await getProductBySlug(slug);
  } catch (error) {
    console.error("Product detail data error:", error.message);
  }

  if (!result) notFound();

  const { product, collections, reviews } = result;
  const related = await getRelatedProducts(product, 4).catch(() => []);

  const sale = isSaleActive(product);
  const percent = salePercent(product);
  const price = effectivePrice(product);
  const stock = stockLabel(product.stock, product.lowStockThreshold);
  const inStock = Number(product.stock) > 0;

  const ratingCount = product.ratingCount || 0;
  const ratingAverage = product.ratingAverage || 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-amber-600">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-amber-600">Shop</Link>
        {collections[0] && (
          <>
            <span>/</span>
            <Link href={`/collections/${collections[0].slug}`} className="hover:text-amber-600">
              {collections[0].name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="truncate text-ink-800">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images || []} name={product.name} salePercent={percent} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {collections.map((collection) => (
              <Link
                key={collection._id}
                href={`/collections/${collection.slug}`}
                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100"
              >
                {collection.name}
              </Link>
            ))}
            {product.isFeatured && (
              <span className="rounded-full bg-toy-yellow px-3 py-1 text-xs font-bold text-slate-900">
                Featured
              </span>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-ink-900 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Stars rating={ratingAverage} />
            <span className="text-sm text-slate-500">
              {ratingCount > 0
                ? `${ratingAverage.toFixed(1)} · ${ratingCount} review${ratingCount === 1 ? "" : "s"}`
                : "No reviews yet"}
            </span>
            {product.sku && (
              <span className="text-xs font-semibold text-slate-400">SKU: {product.sku}</span>
            )}
          </div>

          {product.shortDescription && (
            <p className="mt-4 text-base leading-7 text-slate-600">{product.shortDescription}</p>
          )}

          <div className="mt-6 rounded-3xl border border-slate-200 bg-amber-50/50 p-5">
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-3xl font-black text-ink-900">{formatPrice(price)}</p>
              {sale && (
                <>
                  <p className="text-base font-semibold text-slate-400 line-through">
                    {formatPrice(product.price)}
                  </p>
                  <span className="rounded-full bg-toy-purple px-2.5 py-1 text-xs font-black text-white">
                    Save {percent}%
                  </span>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  inStock ? (stock.tone === "warning" ? "bg-amber-500" : "bg-emerald-500") : "bg-rose-500"
                }`}
              />
              <span
                className={`font-bold ${
                  inStock ? (stock.tone === "warning" ? "text-amber-700" : "text-emerald-700") : "text-rose-600"
                }`}
              >
                {stock.label}
              </span>
              {product.soldCount > 0 && (
                <span className="text-slate-400">· {product.soldCount} sold</span>
              )}
            </div>

            <div className="mt-5">
              <ProductActions
                product={{
                  productId: product._id,
                  _id: product._id,
                  slug: product.slug,
                  name: product.name,
                  price,
                  image: product.images?.[0]?.url || "",
                  stock: product.stock,
                }}
              />
            </div>

            <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <li className="flex items-center gap-2">🚚 Free delivery on orders over Rs 3,999</li>
              <li className="flex items-center gap-2">💳 Cash on delivery available</li>
              <li className="flex items-center gap-2">↩️ 7-day easy returns</li>
            </ul>
          </div>

          {product.description && (
            <div className="mt-6">
              <h2 className="text-lg font-black text-ink-900">Product details</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                {product.description}
              </p>
            </div>
          )}

          {product.tags?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/shop?q=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-toy-orange hover:text-amber-600"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <section id="reviews" className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="text-2xl font-black text-ink-900">Customer reviews</h2>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-black text-ink-900">
                  {ratingCount > 0 ? ratingAverage.toFixed(1) : "—"}
                </p>
                <Stars rating={ratingAverage} />
                <p className="mt-1 text-xs text-slate-500">
                  {ratingCount} review{ratingCount === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex-1 space-y-1.5">
                {distribution.map((row) => {
                  const width = ratingCount > 0 ? Math.round((row.count / ratingCount) * 100) : 0;
                  return (
                    <div key={row.star} className="flex items-center gap-2 text-xs">
                      <span className="w-8 font-semibold text-slate-500">{row.star}★</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-toy-orange" style={{ width: `${width}%` }} />
                      </div>
                      <span className="w-6 text-right text-slate-400">{row.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
              {reviews.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No approved reviews yet. Be the first to share your experience.
                </p>
              ) : (
                reviews.map((review) => (
                  <article key={review._id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-ink-900">{review.authorName}</p>
                      <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                    </div>
                    <Stars rating={review.rating} size="text-sm" />
                    {review.title && (
                      <p className="mt-1 text-sm font-bold text-ink-800">{review.title}</p>
                    )}
                    {review.comment && (
                      <p className="mt-1 text-sm leading-6 text-slate-600">{review.comment}</p>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        <ReviewForm productId={product._id} />
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-2xl font-black text-ink-900">You may also like</h2>
            <Link href="/shop" className="text-sm font-bold text-amber-600 hover:text-amber-700">
              Shop all →
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
