// components/VarietiesGrid.tsx
"use client";

import Image from "next/image";

type Variety = {
  name: string;
  sizeLabel: string;
  image: string;      // path inside /public
  note: string;
};

const VARIETIES: Variety[] = [
  {
    name: "Premium Green Cardamom",
    sizeLabel: "8–10mm+",
    image: "/varieties/8-10-premium.jpg",
    note: "Bold, uniform pods with strong aroma — preferred by exporters and premium brands.",
  },
  {
    name: "First Quality",
    sizeLabel: "7–8mm",
    image: "/varieties/7-8-first.jpg",
    note: "Consistent size and colour — ideal for domestic wholesale and branded packs.",
  },
  {
    name: "Cleaned Trade Grade",
    sizeLabel: "6–7mm",
    image: "/varieties/6-7-clean.jpg",
    note: "Clean, sorted pods — value-focused buyers for masala blends and bulk supply.",
  },
  {
    name: "Bulk / Mixed Lots",
    sizeLabel: "Mixed sizes",
    image: "/varieties/bulk.jpg",
    note: "Economical lots suitable for extraction, crushing, and high-volume applications.",
  },
  // ➜ Add more items here with your real images and names
];

export default function VarietiesGrid() {
  return (
    <section id="varieties" className="py-10 border-t border-slate-100 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Our Cardamom Varieties</h2>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              TJK Spices supplies carefully graded green cardamom from the Cardamom Hills of Idukki — each lot selected for aroma, colour, and size.
            </p>
          </div>
          <p className="text-xs text-slate-500 max-w-xs">
            All images shown here are indicative of our standard quality. For today’s exact lots and prices, please refer to the daily price list below.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VARIETIES.map((v) => (
            <article key={v.name} className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="relative h-32 sm:h-36">
                <Image
                  src={v.image}
                  alt={v.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-3 sm:p-4 flex flex-col gap-1">
                <div className="text-sm font-semibold text-slate-900">{v.name}</div>
                <div className="text-xs text-emerald-700 font-medium">{v.sizeLabel}</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{v.note}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
