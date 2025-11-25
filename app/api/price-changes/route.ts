// app/api/price-changes/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient"; // read-only anon is fine

export async function GET(request: Request) {
  try {
    // optional query param: ?limit=50
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

    // join price_changes with products to show product names
    const { data, error } = await supabase
      .from("price_changes")
      .select(`id, product_id, old_price, new_price, changed_by, changed_at, products (name)`)
      .order("changed_at", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // normalize response
    const rows = (data ?? []).map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.products?.name ?? null,
      old_price: Number(r.old_price),
      new_price: Number(r.new_price),
      changed_by: r.changed_by,
      changed_at: r.changed_at,
    }));

    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "unknown" }, { status: 500 });
  }
}
