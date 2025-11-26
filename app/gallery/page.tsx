// app/gallery/page.tsx

import Image from "next/image";
import Link from "next/link";

export default function GalleryPage() {
  // Google Drive embedded folder view URL
  const driveFolderEmbedUrl =
    "https://drive.google.com/embeddedfolderview?id=150C0Zo4Ctm4nygBkX_ZvA8qX5kdqOhQh#grid";

  const driveFolderLink =
    "https://drive.google.com/drive/folders/150C0Zo4Ctm4nygBkX_ZvA8qX5kdqOhQh?usp=sharing";

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.25em] text-emerald-700 uppercase">
              TJK Spices
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Gallery of Our Cardamom Varieties
            </h1>
            <p className="text-sm md:text-base text-slate-700 max-w-2xl">
              Explore real photos and videos of our cardamom grades – from 6mm
              and 7mm up to premium 8–10mm lots. All media is captured directly
              from our plantations and grading centre in Nedumkandam, Idukki.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Logo (optional – make sure /public/tjk-logo.png exists) */}
            <div className="hidden sm:block">
              <div className="relative w-20 h-20 rounded-2xl bg-white border border-emerald-100 shadow-sm flex items-center justify-center">
                <Image
                  src="/favicon-removebg.png"
                  alt="TJK Spices Logo"
                  fill
                  className="object-contain p-2"
                />
              </div>
            </div>
            <div className="text-xs sm:text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Direct from source</p>
              <p>Real footage of sorting, grading & packing.</p>
            </div>
          </div>
        </header>

        {/* Info cards */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              What you&apos;ll see here
            </h2>
            <ul className="mt-1 text-xs md:text-sm text-slate-700 space-y-1">
              <li>• Close-up photos of each cardamom grade.</li>
              <li>• Videos from our cardamom plantations and processing.</li>
              <li>• Visual comparison of size, colour and finish.</li>
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              For wholesale buyers
            </h2>
            <p className="mt-1 text-xs md:text-sm text-slate-700">
              Use this gallery to check real quality before placing bulk orders.
              For current prices, visit the{" "}
              <Link
                href="/"
                className="text-emerald-700 font-semibold hover:underline"
              >
                Daily Price List
              </Link>{" "}
              or contact us directly on WhatsApp.
            </p>
          </div>
        </section>

        {/* Embedded Google Drive folder */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base md:text-lg font-semibold text-slate-900">
              Gallery (Google Drive)
            </h2>
            <Link
              href={driveFolderLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs md:text-sm text-emerald-700 hover:underline"
            >
              Open in Google Drive →
            </Link>
          </div>

          <p className="text-xs md:text-sm text-slate-600">
            If the gallery does not load properly on your device, you can open
            the folder directly in Google Drive using the link above.
          </p>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="w-full h-[480px] sm:h-[600px]">
              <iframe
                src={driveFolderEmbedUrl}
                className="w-full h-full border-0"
                aria-label="TJK Spices cardamom gallery"
              />
            </div>
          </div>
        </section>

        {/* Small footer note */}
        <section className="border-t border-slate-200 pt-4 text-xs text-slate-600">
          <p>
            Note: This gallery is updated periodically as new harvests and lots
            arrive. For a live video call to view current stock, please contact
            us via WhatsApp.
          </p>
        </section>
      </div>
    </main>
  );
}
