// app/api/update-price/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "Missing token" }, { status: 401 });
    const token = auth.split(" ")[1];

    const { data: userData, error: userErr } = await supabaseServer.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const user = userData.user;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    if (user.email !== adminEmail) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const body = await request.json();
    const { id, priceINR } = body as { id?: string; priceINR?: number };

    if (!id || typeof priceINR !== "number") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    // fetch old price first
    const { data: productRows, error: fetchErr } = await supabaseServer
      .from("products")
      .select("price_inr")
      .eq("id", id)
      .limit(1)
      .maybeSingle();

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    if (!productRows) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const oldPrice = Number((productRows as any).price_inr);

    // update product
    const { error: updateErr } = await supabaseServer
      .from("products")
      .update({ price_inr: priceINR, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // insert audit record
    const { error: auditErr } = await supabaseServer
      .from("price_changes")
      .insert({
        product_id: id,
        old_price: oldPrice,
        new_price: priceINR,
        changed_by: user.email,
      });

    if (auditErr) {
      // product updated but audit insert failed — return success but log error
      console.error("audit insert failed", auditErr);
      return NextResponse.json({ success: true, warning: "price updated but audit logging failed" }, { status: 200 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "unknown" }, { status: 500 });
  }
}
