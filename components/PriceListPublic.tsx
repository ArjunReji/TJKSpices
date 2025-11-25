// components/PriceListPublic.tsx
"use client";

import React, { useEffect, useState } from "react";

type Product = { id: string; name: string; sku: string; priceINR: number };
type Currency = "INR" | "USD" | "EUR";

export default function PriceListPublic() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [currency, setCurrency] = useState<Currency>("INR");
    const [rates, setRates] = useState<Record<string, number>>({ USD: 0.012, EUR: 0.011 });

    useEffect(() => {
        fetchProducts();
        fetchRates();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        try {
            const res = await fetch("/api/products");
            if (!res.ok) throw new Error("Failed to fetch products");
            const data: Product[] = await res.json();
            setProducts(data);
        } catch (err) {
            console.error("fetchProducts error", err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchRates() {
        try {
            const r = await fetch("/api/exchange-rate");
            const json = await r.json();
            if (json?.rates) setRates(json.rates);
        } catch (err) {
            console.warn("fetchRates error", err);
        }
    }

    function convert(inr: number) {
        if (currency === "INR") return inr;
        const rate = rates[currency] ?? 0;
        return Number((inr * rate).toFixed(2));
    }

    return (
        <section id="prices" className="py-10 border-t border-slate-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Daily Cardamom Prices</h2>
                        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                            Live wholesale prices for our cardamom varieties. Rates are updated by TJK Spices admin as the market moves.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 bg-white border rounded-md px-3 py-2 shadow-sm">
                        <label htmlFor="currency-public" className="text-xs text-slate-600">
                            Currency
                        </label>
                        <select
                            id="currency-public"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as Currency)}
                            className="text-xs sm:text-sm outline-none"
                        >
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                        </select>
                        <button
                            onClick={fetchRates}
                            className="ml-2 inline-flex items-center gap-1 bg-slate-800 text-white px-2 py-1 rounded-md text-xs sm:text-sm hover:bg-slate-700"
                        >
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Desktop/tablet table */}
                <div className="hidden md:block">
                    <div className="mx-auto max-w-2xl bg-white border rounded-lg shadow-sm overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-800">
                                        Variety / Grade
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-800">
                                        Price ({currency})
                                    </th>

                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={2} className="p-6 text-center text-slate-500 text-sm">
                                            Loading prices…
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="p-6 text-center text-slate-500 text-sm">
                                            No varieties found.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((p) => (
                                        <tr key={p.id} className="border-t last:border-b hover:bg-slate-50">
                                            <td className="px-6 py-3 text-sm font-medium text-slate-900">{p.name}</td>
                                            <td className="px-6 py-3 text-right text-lg font-bold text-slate-900">
                                                {currency === "INR" ? `₹${p.priceINR}` : `${currency} ${convert(p.priceINR)}`}
                                            </td>

                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3 max-w-md mx-auto">
                    {loading ? (
                        <div className="p-4 bg-white border rounded-md text-center text-slate-500 text-sm">Loading prices…</div>
                    ) : products.length === 0 ? (
                        <div className="p-4 bg-white border rounded-md text-center text-slate-500 text-sm">No varieties found.</div>
                    ) : (
                        products.map((p) => (
                            <article key={p.id} className="bg-white border rounded-lg p-4 shadow-sm flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">{p.name}</h3>
                                </div>
                                <div className="text-right text-base font-bold text-slate-900">
                                    {currency === "INR" ? `₹${p.priceINR}` : `${currency} ${convert(p.priceINR)}`}
                                </div>

                            </article>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
