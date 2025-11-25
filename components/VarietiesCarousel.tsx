// components/VarietiesCarousel.tsx
"use client";

import Image from "next/image";
import { useState } from "react";

type Slide = {
  name: string;
  sizeLabel: string;
  image: string;   // path inside /public
  note: string;
};

const SLIDES: Slide[] = [
  {
    name: "6mm Below",
    sizeLabel: "Below 6mm",
    image: "/varieties-carousel/6mm-below.jpg",
    note: "Compact pods used for value-driven applications and blends.",
  },
  {
    name: "7.5mm First",
    sizeLabel: "Approx. 7.5mm",
    image: "/varieties-carousel/7-5mm-first.jpg",
    note: "Uniform pods with good colour and aroma, ideal for domestic packs.",
  },
  {
    name: "7.5mm Medium",
    sizeLabel: "Approx. 7.5mm",
    image: "/varieties-carousel/7-5mm-medium.jpg",
    note: "Balanced lot suited for wholesalers focusing on volume.",
  },
  {
    name: "7mm First",
    sizeLabel: "Around 7mm",
    image: "/varieties-carousel/7mm-first.jpg",
    note: "Clean, well-graded pods for regular trade.",
  },
  {
    name: "7mm Medium",
    sizeLabel: "Around 7mm",
    image: "/varieties-carousel/7mm-medium.jpg",
    note: "Medium selection for markets needing competitive pricing.",
  },
  {
    name: "8–10mm+ Rejection",
    sizeLabel: "8–10mm+",
    image: "/varieties-carousel/8-10mm-reject.jpg",
    note: "Economical lots from the larger grades, used for crushing and extraction.",
  },
  {
    name: "8–10mm Medium",
    sizeLabel: "8–10mm+",
    image: "/varieties-carousel/8-10mm-medium.jpg",
    note: "Medium grade pods from the bigger sizes, good everyday wholesale choice.",
  },
];

// 👉 put your real images into /public/varieties-carousel/ and update the `image` paths above.

export default function VarietiesCarousel() {
  const [index, setIndex] = useState(0);
  const total = SLIDES.length;
  const current = SLIDES[index];

  const goNext = () => setIndex((prev) => (prev + 1) % total);
  const goPrev = () => setIndex((prev) => (prev - 1 + total) % total);

  return (
    <section id="carousel" className="py-10 border-t border-slate-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Featured Cardamom Varieties</h2>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              A quick glance at some of the key grades we handle at TJK Spices. Prices for every variety are shown in the daily list below.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Swipe on mobile or use the arrows to browse varieties.
          </div>
        </div>

        <div className="relative">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-1/2 h-52 sm:h-64">
              <Image
                key={current.image}
                src={current.image}
                alt={current.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="w-full sm:w-1/2 p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-emerald-700 tracking-[0.16em] uppercase">
                  Variety
                </div>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  {current.name}
                </h3>
                <div className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 font-medium">
                  {current.sizeLabel}
                </div>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {current.note}
                </p>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                For today&apos;s firm price on this variety, please refer to the daily price list below or contact TJK Spices directly.
              </p>
            </div>
          </div>

          {/* Controls */}
          <button
            type="button"
            onClick={goPrev}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow border border-slate-200 hover:bg-slate-50"
            aria-label="Previous variety"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goNext}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow border border-slate-200 hover:bg-slate-50"
            aria-label="Next variety"
          >
            ›
          </button>

          {/* Dots */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-emerald-600" : "w-2 bg-slate-300"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
