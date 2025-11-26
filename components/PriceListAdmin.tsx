// components/PriceListAdmin.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import FocusTrap from "focus-trap-react";
import AuctionAvgPriceChart from "@/components/AuctionAvgPriceChart";

type Product = { id: string; name: string; sku: string; priceINR: number };

type PriceChange = {
  id: string;
  product_id: string;
  product_name: string | null;
  old_price: number;
  new_price: number;
  changed_by: string;
  changed_at: string;
};

type Currency = "INR" | "USD" | "EUR";

type AuctionRow = {
  sno: number | null;
  dateOfAuction: string;
  auctioneer: string;
  noOfLots: number | null;
  totalQtyArrivedKg: number | null;
  qtySoldKg: number | null;
  maxPricePerKg: number | null;
  avgPricePerKg: number | null;
};

type AuctionHistoryRow = {
  auction_date: string;
  auctioneer: string;
  no_of_lots: number | null;
  total_qty_arrived_kg: number | null;
  qty_sold_kg: number | null;
  max_price_per_kg: number | null;
  avg_price_per_kg: number | null;
};

// Gradient themes for canvas (no CSS color functions, hex only)
const CARD_THEMES = [
  {
    // green → lime → gold
    colors: ["#22c55e", "#a3e635", "#facc15"],
  },
  {
    // teal → sky → indigo
    colors: ["#14b8a6", "#0ea5e9", "#6366f1"],
  },
  {
    // amber → orange → rose
    colors: ["#f59e0b", "#fb923c", "#f97373"],
  },
  {
    // violet → purple → sky
    colors: ["#8b5cf6", "#a855f7", "#0ea5e9"],
  },
];

export default function PriceListAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [currency, setCurrency] = useState<Currency>("INR");
  const [rates, setRates] = useState<Record<string, number>>({
    USD: 0.012,
    EUR: 0.011,
  });

  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [history, setHistory] = useState<PriceChange[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // bulk selection + bulk update
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAmount, setBulkAmount] = useState<string>("");
  const [bulkMode, setBulkMode] = useState<"add" | "subtract">("add");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Spices Board live page rows
  const [auctionRows, setAuctionRows] = useState<AuctionRow[]>([]);
  const [auctionLoading, setAuctionLoading] = useState(false);
  const [auctionError, setAuctionError] = useState<string | null>(null);

  // Spices Board historical rows from Supabase
  const [auctionHistory, setAuctionHistory] = useState<AuctionHistoryRow[]>([]);
  const [auctionHistoryLoading, setAuctionHistoryLoading] = useState(false);
  const [auctionHistoryError, setAuctionHistoryError] = useState<string | null>(
    null
  );
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const lastActiveElementRef = useRef<HTMLElement | null>(null);


  useEffect(() => {
    // 🔥 Set default date range = last 1 month
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    setHistoryTo(now.toISOString().slice(0, 10));
    setHistoryFrom(oneMonthAgo.toISOString().slice(0, 10));
    fetchProducts();
    fetchRates();
    fetchHistory();
    fetchAuctionData();
    fetchAuctionHistory(
      {
        from: oneMonthAgo.toISOString().slice(0, 10),
        to: now.toISOString().slice(0, 10),
      });

    supabase.auth.getSession().then((r) => {
      if (r.data.session) setSession(r.data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const rows: Product[] = await res.json();
      setProducts(rows);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
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
      console.warn("fetchRates failed", err);
    }
  }

  async function fetchHistory() {
    setHistoryLoading(true);
    try {
      const r = await fetch("/api/price-changes?limit=25");
      if (!r.ok) throw new Error("Failed to fetch history");
      const rows: PriceChange[] = await r.json();
      setHistory(rows);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function fetchAuctionData() {
    setAuctionLoading(true);
    setAuctionError(null);
    try {
      const res = await fetch("/api/spicesboard-small");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch auction data");
      }
      setAuctionRows(json.rows || []);
    } catch (err: any) {
      console.error(err);
      setAuctionError(err.message || "Failed to load auction data");
    } finally {
      setAuctionLoading(false);
    }
  }

  async function fetchAuctionHistory(opts?: { from?: string; to?: string }) {
    setAuctionHistoryLoading(true);
    setAuctionHistoryError(null);
    try {
      const params = new URLSearchParams();
      const from = opts?.from || historyFrom;
      const to = opts?.to || historyTo;

      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const qs = params.toString();
      const url = qs
        ? `/api/spicesboard-history?${qs}`
        : "/api/spicesboard-history";

      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch auction history");
      }
      setAuctionHistory(json.rows || []);
    } catch (err: any) {
      console.error(err);
      setAuctionHistoryError(err.message || "Failed to load auction history");
    } finally {
      setAuctionHistoryLoading(false);
    }
  }

  function convert(inr: number) {
    if (currency === "INR") return inr;
    const rate = rates[currency] ?? 0;
    return Number((inr * rate).toFixed(2));
  }

  // auth
  async function signInAdmin() {
    if (!email || !password) return toast.error("Enter email and password");
    const t = toast.loading("Signing in…");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    toast.dismiss(t);
    if (error) {
      console.error(error);
      return toast.error("Login failed: " + error.message);
    }
    setSession(data.session);
    toast.success("Signed in");
  }

  async function signOutAdmin() {
    await supabase.auth.signOut();
    setSession(null);
    setSelectedIds([]);
    toast.success("Signed out");
  }

  // edit flow
  function openEdit(p: Product) {
    lastActiveElementRef.current = document.activeElement as HTMLElement;
    setEditingProduct(p);
    setEditPriceInput(String(p.priceINR));
    setShowConfirm(false);

    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>("#edit-price-input");
      el?.focus();
      el?.select();
    }, 40);
  }

  function closeEdit() {
    setEditingProduct(null);
    setEditPriceInput("");
    setShowConfirm(false);
    setTimeout(() => lastActiveElementRef.current?.focus(), 40);
  }

  async function confirmAndSave() {
    if (!editingProduct) return;
    const parsed = Number(editPriceInput);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return toast.error("Enter a valid price (number > 0)");
    }

    const token = session?.access_token;
    if (!token) return toast.error("You must be signed in as admin");

    setIsSaving(true);
    const t = toast.loading("Saving price…");

    try {
      const res = await fetch("/api/update-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: editingProduct.id, priceINR: parsed }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("update-price error", json);
        toast.dismiss(t);
        toast.error("Update failed: " + (json.error ?? "unknown"));
        setIsSaving(false);
        setShowConfirm(false);
        return;
      }
      toast.dismiss(t);
      toast.success("Price updated");
      closeEdit();
      await fetchProducts();
      await fetchHistory();
    } catch (err) {
      console.error(err);
      toast.dismiss(t);
      toast.error("Update failed");
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
    }
  }

  // selection helpers
  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  }

  async function applyBulk(scope: "selected" | "all") {
    if (!session?.access_token) {
      toast.error("You must be signed in as admin");
      return;
    }
    const ids =
      scope === "all" ? products.map((p) => p.id) : selectedIds.slice();
    if (!ids.length) {
      toast.error("No varieties selected");
      return;
    }
    const amt = Number(bulkAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount (> 0)");
      return;
    }

    setBulkLoading(true);
    const t = toast.loading("Updating prices…");
    try {
      const res = await fetch("/api/bulk-update-prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          productIds: ids,
          mode: bulkMode,
          amount: amt,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("bulk-update error", json);
        toast.dismiss(t);
        toast.error("Bulk update failed: " + (json.error ?? "unknown"));
      } else {
        toast.dismiss(t);
        toast.success("Prices updated");
        setSelectedIds([]);
        await fetchProducts();
        await fetchHistory();
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(t);
      toast.error("Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  }

  const allSelected =
    products.length > 0 && selectedIds.length === products.length;

  // ✅ New: Canvas-based image generation (no html2canvas)
  async function downloadPriceImage() {
    if (!session?.user?.email) {
      toast.error("Only admins can download the price image");
      return;
    }

    if (!products.length) {
      toast.error("No products to include in the price list");
      return;
    }

    try {
      // Canvas size: 1080x1920 (portrait)
      const width = 1080;
      const height = 1920;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("Canvas not supported");
        return;
      }

      // Pick random gradient theme
      const theme =
        CARD_THEMES[Math.floor(Math.random() * CARD_THEMES.length)];

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      const [c1, c2, c3] = theme.colors;
      gradient.addColorStop(0, c1);
      gradient.addColorStop(0.5, c2);
      gradient.addColorStop(1, c3);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Helper: load logo image
      const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = "/tjk-logo.png"; // must exist in public/
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
      }).catch(() => null as any);

      // Draw logo (if loaded)
      if (logo) {
        const logoSize = 280;
        const logoX = width / 2 - logoSize / 2;
        const logoY = 80;
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      }

      ctx.textAlign = "center";

      // Big title: TJK SPICES
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 80px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("TJK SPICES", width / 2, 460);

      // Subtitle: TODAY'S PRICE LIST
      ctx.font = "bold 52px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("TODAY'S PRICE LIST", width / 2, 540);

      // Tagline
      ctx.font = "500 40px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Premium Green Cardamom", width / 2, 600);

      // White card for prices
      const cardMarginX = 120;
      const cardTop = 680;
      const cardBottom = 1620;
      const cardWidth = width - cardMarginX * 2;
      const cardHeight = cardBottom - cardTop;
      const radius = 40;

      // Rounded rect background
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.moveTo(cardMarginX + radius, cardTop);
      ctx.lineTo(cardMarginX + cardWidth - radius, cardTop);
      ctx.quadraticCurveTo(
        cardMarginX + cardWidth,
        cardTop,
        cardMarginX + cardWidth,
        cardTop + radius
      );
      ctx.lineTo(cardMarginX + cardWidth, cardTop + cardHeight - radius);
      ctx.quadraticCurveTo(
        cardMarginX + cardWidth,
        cardTop + cardHeight,
        cardMarginX + cardWidth - radius,
        cardTop + cardHeight
      );
      ctx.lineTo(cardMarginX + radius, cardTop + cardHeight);
      ctx.quadraticCurveTo(
        cardMarginX,
        cardTop + cardHeight,
        cardMarginX,
        cardTop + cardHeight - radius
      );
      ctx.lineTo(cardMarginX, cardTop + radius);
      ctx.quadraticCurveTo(
        cardMarginX,
        cardTop,
        cardMarginX + radius,
        cardTop
      );
      ctx.closePath();
      ctx.fill();

      // Headers in card
      ctx.textAlign = "left";
      ctx.fillStyle = "#4b5563";
      ctx.font = "600 32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Variety / Grade", cardMarginX + 40, cardTop + 60);
      ctx.textAlign = "right";
      ctx.fillText(
        "Price (₹/kg)",
        cardMarginX + cardWidth - 40,
        cardTop + 60
      );

      // Price rows
      const startY = cardTop + 110;
      const rowHeight = 60;
      ctx.font = "600 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

      products.forEach((p, index) => {
        const y = startY + index * rowHeight;
        if (y > cardTop + cardHeight - 40) return; // safety

        ctx.textAlign = "left";
        ctx.fillStyle = "#0f172a";
        const name = p.name.length > 28 ? p.name.slice(0, 25) + "…" : p.name;
        ctx.fillText(name, cardMarginX + 40, y);

        ctx.textAlign = "right";
        ctx.fillStyle = "#047857";
        ctx.font = "800 38px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(`₹${p.priceINR}`, cardMarginX + cardWidth - 40, y);
        ctx.font = "600 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      });

      // Bottom texts
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
      ctx.font = "600 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Rate valid for only 12 hours", width / 2, 1710);

      ctx.font = "500 30px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(
        "+5% GST & transportation extra • Minimum order 25 kg",
        width / 2,
        1765
      );

      ctx.fillText(
        "Nedumkandam, Idukki • All-India wholesale supply",
        width / 2,
        1820
      );

      // Export PNG
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png", 0.92)
      );
      if (!blob) {
        toast.error("Failed to generate image");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `tjk-price-list-${today}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate image");
    }
  }


  return (
    <>
      <Toaster position="top-right" />

      <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* header + admin login */}
          <header className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  TJK Spices – Admin Panel
                </h1>
                <p className="mt-1 text-sm text-slate-700">
                  Manage TJK product prices and view Small Cardamom market data
                  from Spices Board India.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 bg-white border border-slate-300 rounded-md px-3 py-2 shadow-sm self-start">
                <label
                  htmlFor="currency-admin"
                  className="text-xs text-slate-700 mr-1"
                >
                  Currency
                </label>
                <select
                  id="currency-admin"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="text-xs sm:text-sm outline-none text-slate-900"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
                <button
                  onClick={fetchRates}
                  className="ml-1 inline-flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded-md text-xs hover:bg-slate-800"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs sm:text-sm">
              {session?.user?.email ? (
                <>
                  <span className="text-slate-800">
                    Signed in as{" "}
                    <strong className="font-semibold">
                      {session.user.email}
                    </strong>
                  </span>
                  <button
                    onClick={signOutAdmin}
                    className="ml-auto px-3 py-1.5 rounded-md bg-red-600 text-white text-xs sm:text-sm font-semibold hover:bg-red-700 shadow"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <span className="text-slate-800 font-semibold">
                    Admin login:
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin email"
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white"
                  />
                  <button
                    onClick={signInAdmin}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-700 shadow"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>

            {/* bulk controls */}
            {session?.user?.email && (
              <div className="bg-white border border-emerald-200 rounded-xl px-4 py-4 text-sm shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    %
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Bulk price adjustment
                    </p>
                    <p className="text-xs text-slate-600">
                      Quickly add or subtract a fixed amount (₹) from multiple
                      varieties at once.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-700">Action</span>
                    <select
                      value={bulkMode}
                      onChange={(e) =>
                        setBulkMode(e.target.value as "add" | "subtract")
                      }
                      className="border border-slate-300 rounded-md px-3 py-2 text-xs sm:text-sm bg-white text-slate-900"
                    >
                      <option value="add">Add (+)</option>
                      <option value="subtract">Subtract (−)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-700">Amount (₹)</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={bulkAmount}
                      onChange={(e) => setBulkAmount(e.target.value)}
                      placeholder="e.g. 50"
                      className="px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm w-32 bg-white text-slate-900"
                    />
                  </div>

                  <div className="flex-1 text-xs text-slate-600">
                    Use the checkboxes in the list to pick specific varieties,
                    or apply to all.
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => applyBulk("selected")}
                    disabled={bulkLoading}
                    className="px-3 py-2 rounded-md bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 shadow disabled:opacity-50"
                  >
                    Apply to selected ({selectedIds.length})
                  </button>
                  <button
                    onClick={() => applyBulk("all")}
                    disabled={bulkLoading}
                    className="px-3 py-2 rounded-md bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-700 shadow disabled:opacity-50"
                  >
                    Apply to all ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkAmount("");
                      setSelectedIds([]);
                    }}
                    className="px-3 py-2 rounded-md border border-slate-300 text-xs sm:text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            )}

            {session?.user?.email && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={downloadPriceImage}
                  className="px-3 py-2 rounded-md bg-sky-600 text-white text-xs sm:text-sm font-semibold hover:bg-sky-700 shadow"
                >
                  Download price list image
                </button>
                <span className="text-[11px] text-slate-600">
                  Exports today&apos;s INR prices as a colourful shareable image.
                </span>
              </div>
            )}
          </header>

          {/* price list - centered like public */}
          {session?.user?.email && (
            <section>
              {/* desktop/tablet table */}
              <div className="hidden md:block">
                <div className="mx-auto max-w-3xl bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100/80">
                      <tr>
                        {session?.user?.email && (
                          <th className="px-3 py-3 text-center text-sm font-semibold text-slate-800">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={toggleSelectAll}
                            />
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-800">
                          Variety / Grade
                        </th>
                        {session?.user?.email && (
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-800">
                            SKU
                          </th>
                        )}
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                          Price ({currency})
                        </th>
                        {session?.user?.email && (
                          <th className="px-4 py-3 text-center text-sm font-semibold text-slate-800">
                            Edit
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={session?.user?.email ? 5 : 2}
                            className="p-6 text-center text-slate-600 text-sm"
                          >
                            Loading prices…
                          </td>
                        </tr>
                      ) : products.length === 0 ? (
                        <tr>
                          <td
                            colSpan={session?.user?.email ? 5 : 2}
                            className="p-6 text-center text-slate-600 text-sm"
                          >
                            No varieties found.
                          </td>
                        </tr>
                      ) : (
                        products.map((p) => (
                          <tr
                            key={p.id}
                            className="border-t last:border-b hover:bg-slate-100/80"
                          >
                            {session?.user?.email && (
                              <td className="px-3 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(p.id)}
                                  onChange={() => toggleSelect(p.id)}
                                />
                              </td>
                            )}
                            <td className="px-4 py-3 text-base font-semibold text-slate-900">
                              {p.name}
                            </td>
                            {session?.user?.email && (
                              <td className="px-4 py-3 text-xs text-slate-700">
                                {p.sku}
                              </td>
                            )}
                            <td className="px-4 py-3 text-right text-lg font-extrabold text-slate-900">
                              {currency === "INR"
                                ? `₹${p.priceINR}`
                                : `${currency} ${convert(p.priceINR)}`}
                            </td>
                            {session?.user?.email && (
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => openEdit(p)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-xs sm:text-sm shadow"
                                >
                                  Edit
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* mobile cards */}
              <div className="md:hidden space-y-3 max-w-md mx-auto">
                {loading ? (
                  <div className="p-4 bg-white border border-slate-200 rounded-md text-center text-slate-600 text-sm">
                    Loading prices…
                  </div>
                ) : products.length === 0 ? (
                  <div className="p-4 bg-white border border-slate-200 rounded-md text-center text-slate-600 text-sm">
                    No varieties found.
                  </div>
                ) : (
                  products.map((p) => (
                    <article
                      key={p.id}
                      className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2">
                        {session?.user?.email && (
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => toggleSelect(p.id)}
                          />
                        )}
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            {p.name}
                          </h3>
                          {session?.user?.email && (
                            <div className="text-[11px] text-slate-600 mt-1">
                              {p.sku}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-slate-900">
                          {currency === "INR"
                            ? `₹${p.priceINR}`
                            : `${currency} ${convert(p.priceINR)}`}
                        </div>
                        {session?.user?.email && (
                          <button
                            onClick={() => openEdit(p)}
                            className="mt-2 w-full inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-xs shadow"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          {/* price change history */}
          {session?.user?.email && (
            <section className="mt-8">
              <div className="mx-auto max-w-3xl bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Recent price changes
                  </h2>
                  <button
                    onClick={fetchHistory}
                    className="text-xs text-slate-600 hover:underline"
                  >
                    Refresh
                  </button>
                </div>
                {historyLoading ? (
                  <div className="text-sm text-slate-700">
                    Loading history…
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-sm text-slate-700">
                    No recent changes.
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-56 overflow-auto text-sm">
                    {history.map((h) => (
                      <li
                        key={h.id}
                        className="border-b last:border-b-0 pb-2 last:pb-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">
                              {h.product_name ?? "Product"}
                            </div>
                            <div className="text-xs text-slate-600">
                              {h.changed_by} • {fmtDate(h.changed_at)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">
                              ₹{h.new_price}
                            </div>
                            <div className="text-xs text-slate-600">
                              was ₹{h.old_price}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          {/* Spices Board auction data table (admin only) */}
          {session?.user?.email && (
            <section className="mt-8">
              <div className="mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      Spices Board – Small Cardamom Auction (archive)
                    </h2>
                    <p className="text-[11px] md:text-xs text-slate-600">
                      Data from Spices Board India – Daily Auction Price of
                      Small Cardamom.
                    </p>
                  </div>
                  <button
                    onClick={fetchAuctionData}
                    className="text-xs md:text-sm text-emerald-700 hover:underline font-medium"
                  >
                    Refresh
                  </button>
                </div>

                {auctionLoading ? (
                  <div className="text-sm text-slate-700">
                    Loading auction data…
                  </div>
                ) : auctionError ? (
                  <div className="text-sm text-red-600">
                    Failed to load auction data: {auctionError}
                  </div>
                ) : auctionRows.length === 0 ? (
                  <div className="text-sm text-slate-700">
                    No auction rows found.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96 mt-3">
                    <table className="w-full text-[11px] sm:text-xs md:text-sm">
                      <thead className="bg-slate-100">
                        <tr className="text-slate-900">
                          <th className="px-2 py-2 text-left font-semibold">
                            Date of Auction
                          </th>
                          <th className="px-2 py-2 text-left font-semibold">
                            Auctioneer
                          </th>
                          <th className="px-2 py-2 text-right font-semibold">
                            No. of Lots
                          </th>
                          <th className="px-2 py-2 text-right font-semibold">
                            Total Qty Arrived (kg)
                          </th>
                          <th className="px-2 py-2 text-right font-semibold">
                            Qty Sold (kg)
                          </th>
                          <th className="px-2 py-2 text-right font-semibold">
                            Max Price (₹/kg)
                          </th>
                          <th className="px-2 py-2 text-right font-semibold">
                            Avg Price (₹/kg)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-800">
                        {auctionRows.map((row) => (
                          <tr
                            key={`${row.dateOfAuction}-${row.auctioneer}-${row.sno}`}
                            className="border-t odd:bg-slate-50"
                          >
                            <td className="px-2 py-2 whitespace-nowrap">
                              {row.dateOfAuction}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              {row.auctioneer}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {row.noOfLots ?? ""}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {row.totalQtyArrivedKg != null
                                ? row.totalQtyArrivedKg.toLocaleString()
                                : ""}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {row.qtySoldKg != null
                                ? row.qtySoldKg.toLocaleString()
                                : ""}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {row.maxPricePerKg != null
                                ? `₹${row.maxPricePerKg.toLocaleString()}`
                                : ""}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {row.avgPricePerKg != null
                                ? `₹${row.avgPricePerKg.toLocaleString()}`
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}


          {/* Average price chart from stored history (admin only) */}
          {session?.user?.email && (
            <section className="mt-6">
              <div className="mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      Small Cardamom – Average Auction Price Trend
                    </h2>
                    <p className="text-[11px] md:text-xs text-slate-600">
                      Select a date range to zoom into a specific period. Uses
                      data stored in your Supabase history.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-700">From</span>
                      <input
                        type="date"
                        value={historyFrom}
                        onChange={(e) => setHistoryFrom(e.target.value)}
                        className="border border-slate-300 rounded-md px-2 py-1 bg-white text-slate-900"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-700">To</span>
                      <input
                        type="date"
                        value={historyTo}
                        onChange={(e) => setHistoryTo(e.target.value)}
                        className="border border-slate-300 rounded-md px-2 py-1 bg-white text-slate-900"
                      />
                    </div>
                    <button
                      onClick={() => fetchAuctionHistory({})}
                      className="px-2 py-1 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => {
                        const now = new Date();
                        const oneMonthAgo = new Date();
                        oneMonthAgo.setMonth(now.getMonth() - 1);

                        const to = now.toISOString().slice(0, 10);
                        const from = oneMonthAgo.toISOString().slice(0, 10);

                        setHistoryFrom(from);
                        setHistoryTo(to);
                        fetchAuctionHistory({ from, to });
                      }}
                      className="px-2 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Reset
                    </button>

                  </div>
                </div>

                {auctionHistoryLoading ? (
                  <div className="text-sm text-slate-700">
                    Loading chart data…
                  </div>
                ) : auctionHistoryError ? (
                  <div className="text-sm text-red-600">
                    Failed to load auction history: {auctionHistoryError}
                  </div>
                ) : auctionHistory.length === 0 ? (
                  <div className="text-sm text-slate-700">
                    No historical auction data stored yet.
                  </div>
                ) : (
                  <AuctionAvgPriceChart data={auctionHistory} />

                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Edit modal */}
      <AnimatePresence>
        {editingProduct && (
          <FocusTrap
            active
            focusTrapOptions={{
              clickOutsideDeactivates: true,
              escapeDeactivates: true,
              allowOutsideClick: true,
            }}
          >
            <motion.div
              key="edit-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            >
              <motion.div
                initial={{ y: -12, scale: 0.98, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 8, scale: 0.98, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-white rounded-lg max-w-lg w-full p-5 shadow-lg"
                role="dialog"
                aria-modal="true"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">
                      Edit price
                    </h4>
                    <p className="mt-1 text-base text-slate-800">
                      {editingProduct.name}
                    </p>
                  </div>
                  <button
                    onClick={closeEdit}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4">
                  <label className="block text-sm text-slate-800">
                    Price (INR)
                  </label>
                  <input
                    id="edit-price-input"
                    type="number"
                    inputMode="numeric"
                    value={editPriceInput}
                    onChange={(e) => setEditPriceInput(e.target.value)}
                    className="mt-2 w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 bg-white shadow-sm"
                  />
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    onClick={closeEdit}
                    className="px-4 py-2 border border-slate-300 rounded-md text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-md font-semibold hover:bg-slate-800 shadow"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </FocusTrap>
        )}
      </AnimatePresence>

      {/* Confirm modal */}
      <AnimatePresence>
        {showConfirm && editingProduct && (
          <FocusTrap
            active
            focusTrapOptions={{
              clickOutsideDeactivates: true,
              escapeDeactivates: true,
              allowOutsideClick: true,
            }}
          >
            <motion.div
              key="confirm-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-4"
            >
              <motion.div
                initial={{ y: 8, scale: 0.98, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: -8, scale: 0.98, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white rounded-lg max-w-sm w-full p-5 shadow-lg text-center"
                role="dialog"
                aria-modal="true"
              >
                <h4 className="text-lg font-semibold text-slate-900">
                  Are you sure?
                </h4>
                <p className="mt-2 text-base text-slate-800">
                  Change price of{" "}
                  <strong>{editingProduct.name}</strong> to{" "}
                  <strong>₹{editPriceInput}</strong>?
                </p>

                <div className="mt-5 flex justify-center gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 border border-slate-300 rounded-md text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAndSave}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 shadow"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving…" : "Yes, update"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </FocusTrap>
        )}
      </AnimatePresence>
    </>
  );
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}
