// app/api/spicesboard-small/route.ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const SOURCE_URL =
  "https://www.indianspices.com/marketing/price/domestic/daily-price-small.html";

function parseAuctionDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  // normalize separators
  const normalized = s.replace(/\./g, "/").replace(/-/g, "/");
  const parts = normalized.split("/");
  if (parts.length !== 3) return null;

  let [d, m, y] = parts.map((v) => v.trim());
  if (y.length === 2) y = "20" + y; // just in case

  const dd = d.padStart(2, "0");
  const mm = m.padStart(2, "0");

  return `${y}-${mm}-${dd}`; // YYYY-MM-DD
}

export async function GET() {
  try {
    const res = await fetch(SOURCE_URL, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Spices Board page" },
        { status: 502 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    let archiveTable: any = null;

    $("table").each((_, elem) => {
      const text = $(elem).text().replace(/\s+/g, " ").trim();
      if (
        text.includes(
          "Sno Date of Auction Auctioneer No.of Lots Total Qty Arrived (Kgs) Qty Sold (Kgs) MaxPrice (Rs./Kg) Avg.Price (Rs./Kg)"
        )
      ) {
        archiveTable = $(elem);
        return false;
      }
    });

    if (!archiveTable) {
      const allTables = $("table");
      if (allTables.length) {
        archiveTable = allTables.last();
      }
    }

    if (!archiveTable) {
      return NextResponse.json(
        { error: "Could not locate archive table on page" },
        { status: 500 }
      );
    }

    const rows: any[] = [];
    const dbRows: any[] = [];

    archiveTable.find("tr").each((i: number, tr: any) => {
      if (i === 0) return; // header

      const tds = $(tr).find("td");
      if (tds.length < 8) return;

      const sno = $(tds[0]).text().trim();
      const dateOfAuction = $(tds[1]).text().trim();
      const auctioneer = $(tds[2]).text().trim();
      const noOfLots = $(tds[3]).text().trim();
      const totalQtyArrived = $(tds[4]).text().trim();
      const qtySold = $(tds[5]).text().trim();
      const maxPrice = $(tds[6]).text().trim();
      const avgPrice = $(tds[7]).text().trim();

      const snoNum = Number(sno) || null;
      const noLotsNum = Number(noOfLots) || null;
      const totalQtyNum = Number(totalQtyArrived) || null;
      const qtySoldNum = Number(qtySold) || null;
      const maxPriceNum = Number(maxPrice) || null;
      const avgPriceNum = Number(avgPrice) || null;

      const isoDate = parseAuctionDate(dateOfAuction);

      rows.push({
        sno: snoNum,
        dateOfAuction,
        auctioneer,
        noOfLots: noLotsNum,
        totalQtyArrivedKg: totalQtyNum,
        qtySoldKg: qtySoldNum,
        maxPricePerKg: maxPriceNum,
        avgPricePerKg: avgPriceNum,
      });

      if (isoDate) {
        dbRows.push({
          auction_date: isoDate,
          auctioneer,
          sno: snoNum,
          no_of_lots: noLotsNum,
          total_qty_arrived_kg: totalQtyNum,
          qty_sold_kg: qtySoldNum,
          max_price_per_kg: maxPriceNum,
          avg_price_per_kg: avgPriceNum,
          source_url: SOURCE_URL,
        });
      }
    });

    if (dbRows.length > 0) {
      const { error: upsertErr } = await supabaseServer
        .from("spices_auction_small")
        .upsert(dbRows, { onConflict: "auction_date,auctioneer,sno" });

      if (upsertErr) {
        console.error("Failed to upsert spices_auction_small:", upsertErr);
      }
    }

    return NextResponse.json({ source: SOURCE_URL, rows });
  } catch (err: any) {
    console.error("Spices Board scrape error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
