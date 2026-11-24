import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import { effectivePrice, formatPrice, isSaleActive, salePercent, stockLabel } from "@/lib/format";

function Star({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 3.4l2.6 5.3 5.9.86-4.27 4.16 1.01 5.87L12 16.82l-5.24 2.77 1.01-5.87L3.5 9.56l5.9-.86z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Stars({ rating = 0, count = 0 }) {
  const filled = Math.round(Number(rating) || 0);
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="flex items-center gap-0.5 text-amber-400">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} filled={i < filled} />
        ))}
      </span>
      <span className="text-[12px] font-medium text-slate-500">
        {count > 0 ? `${count} ${count === 1 ? "review" : "reviews"}` : "0 reviews"}
      </span>
    </div>
  );
}

export default function ProductCard({ product, priority = false }) {
  const image = product?.images?.[0]?.url || "";
  const alt = product?.images?.[0]?.alt || product?.name || "Toy";
  const sale = isSaleActive(product);
  const percent = salePercent(product);
  const price = effectivePrice(product);
  const stock = stockLabel(product?.stock, product?.lowStockThreshold);
  const soldOut = stock.tone === "danger";

  return (
    <article className="group flex flex-col">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-2xl border border-slate-100 bg-white"
      >
        {image ? (
          <Image
            src={image}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50 text-5xl">
            🧸
          </div>
        )}

        {/* Discount badge */}
        {sale && percent > 0 && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-toy-purple px-2.5 py-1 text-[11px] font-black leading-none text-white shadow-md">
            -{percent}%
          </span>
        )}

        {/* Featured badge */}
        {product.isFeatured && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-toy-yellow px-2.5 py-1 text-[10px] font-black uppercase tracking-wide leading-none text-slate-900 shadow-sm">
            Featured
          </span>
        )}

        {/* Stock warning */}
        {stock.tone !== "success" && (
          <span
            className={`absolute bottom-2.5 left-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold leading-none shadow-sm ${
              soldOut ? "bg-slate-900 text-white" : "bg-amber-100 text-amber-800"
            }`}
          >
            {stock.label}
          </span>
        )}

        {soldOut && (
          <span className="absolute inset-0 bg-white/45 backdrop-blur-[1px]" aria-hidden="true" />
        )}
      </Link>

      <div className="flex flex-1 flex-col px-0.5 pt-3">
        <Link href={`/product/${product.slug}`} className="text-center">
          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-slate-900 transition group-hover:text-toy-purple sm:text-sm font-sans">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2">
          <Stars rating={product.ratingAverage || 0} count={product.ratingCount || 0} />
        </div>

        <div className="mt-auto flex items-baseline justify-center gap-2 pt-2.5">
          <p className="text-[15px] font-black text-red-600 sm:text-base">{formatPrice(price)}</p>
          {sale && (
            <p className="text-[12px] font-medium text-slate-400 line-through">
              {formatPrice(product.price)}
            </p>
          )}
        </div>

        <div className="mt-3">
          <AddToCartButton product={{ ...product, price }} compact />
        </div>
      </div>
    </article>
  );
}
