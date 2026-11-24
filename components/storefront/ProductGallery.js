"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({ images = [], name = "Product", salePercent = 0 }) {
  const [selected, setSelected] = useState(0);

  if (!images.length) {
    return (
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 text-7xl">
        🧸
      </div>
    );
  }

  const active = images[selected] || images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <Image
          src={active.url}
          alt={active.alt || name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        {salePercent > 0 && (
          <span className="absolute right-4 top-4 rounded-full bg-toy-purple px-3 py-1.5 text-[11px] font-black leading-none text-white shadow-md">
            -{salePercent}%
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setSelected(index)}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-white transition ${
                index === selected ? "border-toy-orange" : "border-transparent hover:border-slate-300"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={image.alt || `${name} image ${index + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
