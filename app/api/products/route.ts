// app/api/products/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, price_inr, sort_order")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });


  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    sku: r.sku ?? "",
    priceINR: Number(r.price_inr),
  }));

  return NextResponse.json(rows, { status: 200 });
}
