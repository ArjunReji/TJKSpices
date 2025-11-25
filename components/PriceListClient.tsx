// components/PriceListClient.tsx
"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Product = { id: string; name: string; sku: string; priceINR: number };
type Currency = "INR" | "USD" | "EUR";

export default function PriceListClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [currency, setCurrency] = useState<Currency>("INR");
    const [rates, setRates] = useState<Record<string, number>>({ USD: 0.012, EUR: 0.011 });

    const [session, setSession] = useState<any>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<number | "">("");

    useEffect(() => {
        fetchProducts();
        fetchRates();
        supabase.auth.getSession().then(r => { if (r.data.session) setSession(r.data.session); });
    }, []);

    async function fetchProducts() {
        setLoading(true);
        try {
            const res = await fetch("/api/products");
            const rows = await res.json();
            setProducts(rows);
        } catch (err) {
            console.error(err);
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
            console.warn(err);
        }
    }


    function convert(inr: number) {
        if (currency === "INR") return inr;
        const rate = rates[currency] ?? 0;
        return Number((inr * rate).toFixed(2));
    }

    function startEdit(p: Product) {
        setEditingId(p.id);
        setEditPrice(p.priceINR);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditPrice("");
    }

    async function submitUpdate() {
        if (!editingId || typeof editPrice !== "number" || !session?.access_token) {
            return alert("Ensure you're logged in and price is a number.");
        }
        const res = await fetch("/api/update-price", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ id: editingId, priceINR: editPrice }),
        });
        const json = await res.json();
        if (!res.ok) return alert("Update failed: " + (json.error ?? "unknown"));
        alert("Price updated");
        cancelEdit();
        fetchProducts();
    }

    async function signOut() {
        await supabase.auth.signOut();
        setSession(null);
        alert("Signed out");
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Live Price List</h2>
                <div className="flex items-center gap-2">
                    <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="border px-2 py-1">
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                    </select>
                    <button onClick={() => fetchRates()} className="px-2 py-1 bg-slate-700 text-white rounded">Refresh Rates</button>
                </div>
            </div>

            <div className="bg-white rounded shadow overflow-auto">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3 text-left">Grade</th>
                            <th className="p-3 text-left">SKU</th>
                            <th className="p-3 text-right">Price ({currency})</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="p-4 text-center">Loading…</td></tr>
                        ) : (
                            products.map(p => (
                                <tr key={p.id} className="border-t last:border-b">
                                    <td className="p-3">{p.name}</td>
                                    <td className="p-3 text-slate-600">{p.sku}</td>
                                    <td className="p-3 text-right font-semibold">
                                        {currency === "INR" ? `₹${p.priceINR}` : `${currency} ${convert(p.priceINR)}`}
                                    </td>
                                    <td className="p-3">
                                        {session?.user?.email ? (
                                            editingId === p.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input type="number" value={String(editPrice)} onChange={e => setEditPrice(Number(e.target.value))} className="border px-2 py-1 w-28" />
                                                    <button onClick={submitUpdate} className="px-2 py-1 bg-emerald-600 text-white rounded">Save</button>
                                                    <button onClick={cancelEdit} className="px-2 py-1 border rounded">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEdit(p)} className="px-2 py-1 border rounded">Edit</button>
                                            )
                                        ) : (
                                            <div className="text-xs text-slate-500">Login to edit</div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 bg-slate-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Admin (sign in to edit prices)</h3>
                <AdminForm setSession={setSession} />
                <div className="mt-2">
                    {session?.user?.email && <div>Signed in as <strong>{session.user.email}</strong> <button onClick={signOut} className="ml-3 text-sm underline">Sign out</button></div>}
                </div>
            </div>
        </div>
    );
}

// small internal admin form component:
function AdminForm({ setSession }: { setSession: (s: any) => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function signIn() {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return alert("Login failed: " + error.message);
        setSession(data.session);
        alert("Logged in");
    }

    return (
        <div className="flex gap-2 items-center">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin email" className="px-2 py-1 border" />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="password" type="password" className="px-2 py-1 border" />
            <button onClick={signIn} className="px-3 py-1 bg-emerald-600 text-white rounded">Sign In</button>
        </div>
    );
}
