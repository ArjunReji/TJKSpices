"use client";
import React, { useEffect, useMemo, useState } from "react";

/**
 * TJK Spices — Starter Shop (TypeScript, strict)
 * - Client component (use client)
 * - Stores edited prices in localStorage under key 'tjk_products_v1'
 * - Default seeded products come from the uploaded image PRICES
 */

/* ---------- Types ---------- */
type Currency = "INR" | "USD" | "EUR";

interface Product {
  id: number;
  name: string;
  sku: string;
  priceINR: number; // canonical source of truth for price (in INR)
}

/* ---------- Seed data (14 grades) ---------- */
const SEED_PRODUCTS: Product[] = [
  { id: 1, name: "8-10MM+ PREMIUM", sku: "PREMIUM_8_10", priceINR: 2800 },
  { id: 2, name: "8-10MM+ MEDIUM", sku: "MEDIUM_8_10", priceINR: 2750 },
  { id: 3, name: "8-10MM+ FRUIT", sku: "FRUIT_8_10", priceINR: 2675 },
  { id: 4, name: "8-10MM+ SPLIT", sku: "SPLIT_8_10", priceINR: 2625 },
  { id: 5, name: "8-10MM+ REJECT", sku: "REJECT_8_10", priceINR: 2550 },
  { id: 6, name: "7.5+ FIRST (7.5-10)", sku: "FIRST_7_5_PLUS", priceINR: 2675 },
  { id: 7, name: "7.5MM FIRST", sku: "FIRST_7_5", priceINR: 2625 },
  { id: 8, name: "7-8MM FIRST", sku: "FIRST_7_8", priceINR: 2575 },
  { id: 9, name: "7-8MM MEDIUM", sku: "MEDIUM_7_8", priceINR: 2525 },
  { id: 10, name: "7 MM FIRST", sku: "FIRST_7_MM", priceINR: 2525 },
  { id: 11, name: "7-8MM FRUIT", sku: "FRUIT_7_8", priceINR: 2500 },
  { id: 12, name: "6-7MM CLEAN", sku: "CLEAN_6_7", priceINR: 2425 },
  { id: 13, name: "BULK REJEC (6-10)", sku: "BULK_REJ_6_10", priceINR: 2350 },
  { id: 14, name: "6MM BELOW", sku: "BELOW_6_MM", priceINR: 2300 },
];

/* ---------- Local Storage helpers ---------- */
const LOCAL_KEY = "tjk_products_v1";
const LOCAL_CURRENCY_KEY = "tjk_currency_v1";
const LOCAL_EXRATE_KEY = "tjk_exrate_v1";

function readLocalProducts(): Product[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    // Basic validation and coercion (to satisfy strictness)
    return parsed.map((p) => ({
      id: Number((p as any).id),
      name: String((p as any).name),
      sku: String((p as any).sku),
      priceINR: Number((p as any).priceINR),
    })) as Product[];
  } catch {
    return null;
  }
}

function writeLocalProducts(products: Product[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(products));
}

/* ---------- Currency formatting ---------- */
function formatCurrency(value: number, currency: Currency): string {
  // For INR we want 'en-IN' locale with INR symbol
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

/* ---------- Main Component ---------- */
const TjkStarterShop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    // initial value from seed (sync)
    return SEED_PRODUCTS;
  });

  const [currency, setCurrency] = useState<Currency>(() => {
    if (typeof window === "undefined") return "INR";
    const stored = localStorage.getItem(LOCAL_CURRENCY_KEY);
    return (stored as Currency) || "INR";
  });

  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    // exchangeRate means: 1 INR = exchangeRate (<currency unit>)
    const stored = localStorage.getItem(LOCAL_EXRATE_KEY);
    return stored ? Number(stored) || 1 : 1;
  });

  const [adminMode, setAdminMode] = useState<boolean>(false);
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editedPriceInput, setEditedPriceInput] = useState<string>("");

  // Load from localStorage once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = readLocalProducts();
    if (saved && saved.length > 0) {
      setProducts(saved);
    } else {
      setProducts(SEED_PRODUCTS);
      writeLocalProducts(SEED_PRODUCTS);
    }
    const savedCurrency = localStorage.getItem(LOCAL_CURRENCY_KEY) as Currency | null;
    if (savedCurrency) setCurrency(savedCurrency);
    const savedRate = localStorage.getItem(LOCAL_EXRATE_KEY);
    if (savedRate) {
      const n = Number(savedRate);
      if (!Number.isNaN(n) && isFinite(n)) setExchangeRate(n);
    }
  }, []);

  // Persist products to local storage whenever they change
  useEffect(() => {
    writeLocalProducts(products);
  }, [products]);

  // Persist currency & rate
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_CURRENCY_KEY, currency);
  }, [currency]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_EXRATE_KEY, String(exchangeRate));
  }, [exchangeRate]);

  /* ---------- Business logic ---------- */
  const convertPrice = (inr: number): number => {
    if (currency === "INR") return inr;
    // convert 1 INR -> exchangeRate <currency unit>
    return Number((inr * exchangeRate).toFixed(2));
  };

  const startEdit = (p: Product) => {
    setEditingPriceId(p.id);
    setEditedPriceInput(String(p.priceINR));
  };

  const saveEdit = () => {
    if (editingPriceId === null) return;
    const parsed = Number(editedPriceInput);
    if (Number.isNaN(parsed)) return;
    setProducts((prev) =>
      prev.map((x) => (x.id === editingPriceId ? { ...x, priceINR: Math.round(parsed) } : x))
    );
    setEditingPriceId(null);
    setEditedPriceInput("");
  };

  const cancelEdit = () => {
    setEditingPriceId(null);
    setEditedPriceInput("");
  };

  const applyBulkIncrease = (id: number, percent: number) => {
    setProducts((prev) =>
      prev.map((x) => (x.id === id ? { ...x, priceINR: Math.round(x.priceINR * (1 + percent / 100)) } : x))
    );
  };

  const resetToSeed = () => {
    setProducts(SEED_PRODUCTS);
    writeLocalProducts(SEED_PRODUCTS);
  };

  const copyJsonToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(products, null, 2));
      // UI feedback could be added
    } catch {
      // ignore
    }
  };

  const productsSorted = useMemo(() => {
    // stable copy sorted by id
    return [...products].sort((a, b) => a.id - b.id);
  }, [products]);

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">TJK Spices — Price List</h1>
            <p className="text-sm text-gray-600">Default currency: INR. Admins can edit prices.</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="px-2 py-1 border rounded"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>

            {currency !== "INR" && (
              <input
                value={String(exchangeRate)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setExchangeRate(Number.isFinite(v) && v > 0 ? v : 1);
                }}
                className="w-28 px-2 py-1 border rounded ml-2"
                placeholder="1 INR -> ?"
                type="number"
                step="0.0001"
                min="0"
              />
            )}

            <button
              onClick={() => setAdminMode((m) => !m)}
              className={`px-3 py-2 rounded ${adminMode ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}
            >
              {adminMode ? "Exit Admin" : "Admin Mode"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {productsSorted.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-2xl shadow flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{p.name}</div>
                <div className="text-xs text-gray-500">SKU: {p.sku}</div>
              </div>

              <div className="text-right">
                <div className="font-bold text-xl">
                  {formatCurrency(convertPrice(p.priceINR), currency)}
                </div>

                {adminMode && (
                  <div className="mt-2 flex items-center gap-2 justify-end">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-sm px-2 py-1 border rounded"
                      aria-label={`Edit ${p.name}`}
                    >
                      Edit INR
                    </button>

                    <button
                      onClick={() => applyBulkIncrease(p.id, 5)}
                      className="text-sm px-2 py-1 border rounded"
                      aria-label={`Increase ${p.name} by 5%`}
                    >
                      +5%
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {adminMode && (
          <div className="mt-6 bg-white p-4 rounded-2xl shadow">
            <h3 className="font-semibold mb-3">Admin Panel</h3>

            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => {
                  if (confirm("Reset all prices to seed defaults?")) resetToSeed();
                }}
                className="px-3 py-2 bg-yellow-500 rounded text-white"
              >
                Reset to seed
              </button>

              <button
                onClick={() => copyJsonToClipboard()}
                className="px-3 py-2 bg-slate-700 rounded text-white"
              >
                Copy JSON
              </button>

              <button
                onClick={() =>
                  alert(
                    "To persist edits to a real DB, replace the localStorage logic with Supabase or your backend API. I can scaffold that for you."
                  )
                }
                className="px-3 py-2 bg-indigo-600 rounded text-white"
              >
                How to persist?
              </button>
            </div>

            <div className="text-sm text-gray-600">Quick edit a price (INR):</div>
            <div className="mt-3 flex gap-2 items-center">
              <input
                type="number"
                value={editedPriceInput}
                onChange={(e) => setEditedPriceInput(e.target.value)}
                className="px-2 py-1 border rounded w-40"
                placeholder="Enter INR price"
              />
              <button onClick={saveEdit} className="px-3 py-2 bg-emerald-600 rounded text-white">
                Save
              </button>
              <button onClick={cancelEdit} className="px-3 py-2 bg-gray-300 rounded">
                Cancel
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Tip: Use "Copy JSON" to get the updated list and import into Supabase or your backend.
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editingPriceId !== null && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded w-96">
              <h4 className="font-semibold">Edit price (INR)</h4>
              <div className="mt-2">Product: {products.find((x) => x.id === editingPriceId)?.name}</div>
              <input
                type="number"
                value={editedPriceInput}
                onChange={(e) => setEditedPriceInput(e.target.value)}
                className="mt-3 px-2 py-2 border rounded w-full"
                autoFocus
              />
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={cancelEdit} className="px-3 py-1 border rounded">
                  Cancel
                </button>
                <button onClick={saveEdit} className="px-3 py-1 bg-emerald-600 text-white rounded">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TjkStarterShop;
