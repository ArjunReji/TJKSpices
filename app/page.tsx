// app/page.tsx
"use client";

import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import PriceListPublic from "@/components/PriceListPublic";
import VarietiesGrid from "@/components/VarietiesGrid";
import VarietiesCarousel from "@/components/VarietiesCarousel";



export default function HomePage() {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-900">
        {/* HERO / OVERVIEW */}
        <section className="relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative h-10 w-10 sm:h-45 sm:w-45">
              <Image
                src="/favicon-removebg.png"   // or .jpg if you saved it that way
                alt="TJK Spices logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="text-xs sm:text-xl text-slate-700">
              <div className="font-bold">TJK Spices</div>
              <div>Nedumkandam • Cardamom Hills • Kerala</div>
            </div>
          </div>

          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pb-20 relative">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-medium mb-4">
                  Nedumkandam • Idukki • Cardamom Hills
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                  TJK Spices
                  <span className="block text-emerald-700 mt-1">
                    Green Cardamom from Kerala’s Spice Belt
                  </span>
                </h1>
                <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-xl">
                  TJK Spices, founded by <strong>Tibin Johny</strong>, is based in Nedumkandam in the Idukki district of Kerala —
                  right in the heart of the Cardamom Hills. We work closely with local farmers to supply fresh, aromatic green cardamom
                  to wholesalers and exporters across India.
                </p>

                <p className="mt-3 text-sm text-slate-600 max-w-xl">
                  With direct sourcing, careful grading by size, and controlled packing, we help ensure the natural colour and aroma
                  are preserved from plantation to end customer. Minimum order typically starts from <strong>25 kg</strong> for all-India delivery.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <a
                    href="#prices"
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    View Today’s Prices
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50"
                  >
                    Talk to TJK Spices
                  </a>
                </div>

                <div className="mt-4 text-xs text-slate-500 space-y-1">
                  <p>• Direct sourcing from farmers around Nedumkandam, Idukki</p>
                  <p>• Wholesale & export focus • All-India dispatch above 25 kg</p>
                  <p>• Daily price updates managed by TJK Spices admin</p>
                </div>
              </div>

              {/* small info card */}
              <div className="lg:pl-6">
                <div className="bg-white/80 backdrop-blur-sm border border-emerald-100 shadow-md rounded-2xl p-5 sm:p-6">
                  <h2 className="text-sm font-semibold text-slate-800 mb-3">
                    From the Cardamom Hills to your market
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                      <div className="font-semibold text-slate-800 mb-1 text-xs sm:text-sm">Farmer-linked sourcing</div>
                      <p className="text-xs text-slate-600">
                        Most lots are sourced directly from growers in and around Nedumkandam, helping us keep the cardamom fresh,
                        authentic, and traceable.
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                      <div className="font-semibold text-slate-800 mb-1 text-xs sm:text-sm">Wholesale & export oriented</div>
                      <p className="text-xs text-slate-600">
                        We typically work with traders, wholesalers, and exporters looking for consistent quality and competitive prices.
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 p-3">
                      <div className="font-semibold text-emerald-800 mb-1 text-xs sm:text-sm">Trusted for quality</div>
                      <p className="text-xs text-slate-700">
                        Customers recognise TJK Spices as a reliable supplier of high-quality green cardamom — with clear communication
                        and transparent pricing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* VARIETIES CAROUSEL (visual slides) */}
        <VarietiesCarousel />

        {/* VARIETIES WITH IMAGES */}
        <VarietiesGrid />

        {/* LIVE PRICE LIST */}
        <PriceListPublic />

        {/* HOW TO WORK WITH US */}
        <section id="how" className="py-10 border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">How TJK Spices works with buyers</h2>
            </div>

            <ol className="grid sm:grid-cols-3 gap-4 text-sm">
              <StepCard step="01" title="Share your requirement" text="Send us the varieties / sizes you need, approximate quantity, and delivery location." />
              <StepCard step="02" title="Receive today’s rates" text="We’ll respond with current prices, available lots, and packing details straight from Nedumkandam." />
              <StepCard step="03" title="Confirm and dispatch" text="Once confirmed, lots are packed and dispatched with documentation for all-India delivery." />
            </ol>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="py-10 border-t border-slate-100 bg-emerald-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Contact TJK Spices</h2>
                <p className="text-slate-700 text-sm">
                  For business inquiries, wholesale orders, or today’s detailed price list, reach out to TJK Spices directly.
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  Location: Nedumkandam, Idukki district, Kerala — heart of the Cardamom Hills.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Phone / WhatsApp</h3>

                <a
                  href="https://wa.me/917012460066"
                  className="text-slate-800 text-sm hover:underline block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +91 70124 60066
                </a>

                <a
                  href="https://wa.me/917510701246"
                  className="text-slate-800 text-sm hover:underline block mt-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +91 75107 01246
                </a>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">Email</h3>
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=tjkspices@gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-800 text-sm hover:underline"
                  >
                    tjkspices@gmail.com
                  </a>
                </div>

                <div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">Social Media</h3>

                    <div className="flex flex-col gap-2 text-sm text-slate-700">

                      {/* Instagram */}
                      <a
                        href="https://www.instagram.com/cardamom_plantation/?hl=en"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 hover:opacity-80 transition"
                      >
                        <svg className="h-4 w-4 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                          <rect x="3" y="3" width="18" height="18" rx="5" />
                          <circle cx="12" cy="12" r="4" />
                          <circle cx="17" cy="7" r="1" />
                        </svg>
                        Instagram
                      </a>

                      {/* Facebook */}
                      <a
                        href="https://www.facebook.com/tjk.spices/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 hover:opacity-80 transition"
                      >
                        <svg className="h-4 w-4 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                          <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v5h4v-5h3v-4h-3V8a1 1 0 0 1 1-1z" />
                        </svg>
                        Facebook
                      </a>

                      {/* YouTube */}
                      <a
                        href="https://www.youtube.com/@TJk_SPICES"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 hover:opacity-80 transition"
                      >
                        <svg className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M10 15l5.2-3L10 9v6z" />
                          <path d="M21.8 8s-.2-1.4-.8-2C20.4 5 19.6 5 19.2 5h-14c-.4 0-1.2 0-1.8 1-.6.6-.8 2-.8 2S2 9.4 2 11v2c0 1.6.2 3 .8 3.6.6 1 1.4 1 1.8 1h14c.4 0 1.2 0 1.8-1 .6-.6.8-2 .8-2s.2-1.4.2-3-.2-3-.2-3z" />
                        </svg>
                        YouTube
                      </a>

                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>


        {/* FOOTER */}
        <footer className="border-t border-slate-200 py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} TJK Spices • Nedumkandam, Idukki, Kerala.</p>
            <p>
              <Link href="/admin" className="underline underline-offset-2">
                Admin Login
              </Link>
            </p>
          </div>
        </footer>
      </main>
      {/* Jotform Chatbot */}
      <Script
        src="https://cdn.jotfor.ms/agent/embedjs/019a69877a3f7b43a5ec975dfb54d20dbb21/embed.js"
        strategy="afterInteractive"
      />
    </>
  );
}

function StepCard({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <li className="rounded-xl border border-slate-100 bg-white shadow-sm p-4 flex flex-col gap-1">
      <div className="text-[11px] font-semibold text-emerald-700 tracking-[0.15em]">{step}</div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <p className="text-xs text-slate-600">{text}</p>
    </li>
  );
}
