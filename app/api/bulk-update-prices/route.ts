// app/api/bulk-update-prices/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
    try {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer "))
            return NextResponse.json({ error: "Missing token" }, { status: 401 });

        const token = auth.split(" ")[1];

        const { data: userData, error: userErr } = await supabaseServer.auth.getUser(
            token
        );
        if (userErr || !userData?.user)
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const user = userData.user;
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail)
            return NextResponse.json(
                { error: "Server not configured" },
                { status: 500 }
            );
        if (user.email !== adminEmail)
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });

        const body = await request.json();
        const {
            productIds,
            mode,
            amount,
        }: { productIds?: string[]; mode?: "add" | "subtract"; amount?: number } =
            body;

        if (!productIds || productIds.length === 0)
            return NextResponse.json(
                { error: "No product IDs provided" },
                { status: 400 }
            );
        if (mode !== "add" && mode !== "subtract")
            return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
        if (typeof amount !== "number" || amount <= 0)
            return NextResponse.json(
                { error: "Amount must be a number > 0" },
                { status: 400 }
            );

        // Get current prices
        const { data: products, error: fetchErr } = await supabaseServer
            .from("products")
            .select("id, name, sku, price_inr")
            .in("id", productIds);


        if (fetchErr)
            return NextResponse.json({ error: fetchErr.message }, { status: 500 });

        if (!products || products.length === 0)
            return NextResponse.json(
                { error: "No matching products found" },
                { status: 404 }
            );

        const now = new Date().toISOString();

        // Build updates + audit rows
        const updates: {
            id: string;
            name: string;
            sku?: string | null;
            price_inr: number;
            updated_at: string;
        }[] = [];

        const audits: {
            product_id: string;
            old_price: number;
            new_price: number;
            changed_by: string;
            changed_at?: string;
        }[] = [];

        for (const p of products as any[]) {
            const oldPrice = Number(p.price_inr);
            const delta = mode === "add" ? amount : -amount;
            const newPriceRaw = oldPrice + delta;
            const newPrice = newPriceRaw < 0 ? 0 : newPriceRaw;

            updates.push({
                id: p.id,
                name: p.name,       // keep existing name so NOT NULL is satisfied
                sku: p.sku ?? null, // safe even if sku is nullable
                price_inr: newPrice,
                updated_at: now,
            });


            audits.push({
                product_id: p.id,
                old_price: oldPrice,
                new_price: newPrice,
                changed_by: user.email!,
                changed_at: now,
            });
        }

        // Update products (using upsert with primary key id)
        const { error: upsertErr } = await supabaseServer
            .from("products")
            .upsert(updates, { onConflict: "id" });

        if (upsertErr)
            return NextResponse.json({ error: upsertErr.message }, { status: 500 });

        // Insert audit rows
        const { error: auditErr } = await supabaseServer
            .from("price_changes")
            .insert(audits);

        if (auditErr) {
            console.error("bulk audit insert failed", auditErr);
            return NextResponse.json(
                { success: true, warning: "Prices updated, audit logging failed" },
                { status: 200 }
            );
        }

        return NextResponse.json({ success: true, count: updates.length }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message ?? "unknown error" },
            { status: 500 }
        );
    }
}
