// app/api/spicesboard-history/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to");     // YYYY-MM-DD

    let query = supabaseServer
      .from("spices_auction_small")
      .select(
        "auction_date, auctioneer, no_of_lots, total_qty_arrived_kg, qty_sold_kg, max_price_per_kg, avg_price_per_kg"
      );

    if (from) {
      query = query.gte("auction_date", from);
    }
    if (to) {
      query = query.lte("auction_date", to);
    }

    query = query.order("auction_date", { ascending: true });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rows: data ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
