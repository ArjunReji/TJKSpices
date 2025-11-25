// scripts/backfillSpicesAuction.js
require("dotenv").config();
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BASE_URL =
  "https://www.indianspices.com/marketing/price/domestic/daily-price-small.html";

// parse "25-Nov-2025" → "2025-11-25"
function parseAuctionDate(raw) {
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

async function fetchPage(page) {
  const url = page === 1 ? BASE_URL : `${BASE_URL}?page=${page}`;
  console.log(`Fetching page ${page} → ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  let archiveTable = null;

  $("table").each((_, elem) => {
    const text = $(elem).text().replace(/\s+/g, " ").trim();
    if (
      text.includes(
        "Sno Date of Auction Auctioneer No.of Lots Total Qty Arrived (Kgs) Qty Sold (Kgs) MaxPrice (Rs./Kg) Avg.Price (Rs./Kg)"
      )
    ) {
      archiveTable = $(elem);
      return false; // break
    }
  });

  if (!archiveTable) {
    const allTables = $("table");
    if (allTables.length) {
      archiveTable = allTables.last();
    }
  }

  if (!archiveTable) {
    console.warn(`No archive table found on page ${page}`);
    return [];
  }

  const rows = [];

  archiveTable.find("tr").each((i, tr) => {
    if (i === 0) return; // skip header

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
    const noLotsNum = Number(noOfLots.replace(/,/g, "")) || null;
    const totalQtyNum = Number(totalQtyArrived.replace(/,/g, "")) || null;
    const qtySoldNum = Number(qtySold.replace(/,/g, "")) || null;
    const maxPriceNum = Number(maxPrice.replace(/,/g, "")) || null;
    const avgPriceNum = Number(avgPrice.replace(/,/g, "")) || null;

    const isoDate = parseAuctionDate(dateOfAuction);

    if (!isoDate) {
      console.warn(`Could not parse date "${dateOfAuction}" on page ${page}`);
    }

    rows.push({
      auction_date: isoDate,
      auctioneer,
      sno: snoNum,
      no_of_lots: noLotsNum,
      total_qty_arrived_kg: totalQtyNum,
      qty_sold_kg: qtySoldNum,
      max_price_per_kg: maxPriceNum,
      avg_price_per_kg: avgPriceNum,
      source_url: url,
    });
  });

  console.log(`Parsed ${rows.length} rows from page ${page}`);
  return rows;
}

async function upsertRows(rows) {
  if (!rows.length) return;
  const { error } = await supabase
    .from("spices_auction_small")
    .upsert(rows, { onConflict: "auction_date,auctioneer,sno" });

  if (error) {
    console.error("Upsert error:", error.message);
    throw error;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // You can change these or pass via CLI args
  const startPage = Number(process.argv[2] || "1");
  const endPage = Number(process.argv[3] || "50"); // e.g. 50 pages first

  console.log(
    `Backfilling Spices Board small cardamom auctions, pages ${startPage} → ${endPage}`
  );

  for (let page = startPage; page <= endPage; page++) {
    try {
      const rows = await fetchPage(page);
      if (!rows.length) {
        console.log(`No rows on page ${page}, stopping.`);
        break;
      }
      await upsertRows(rows);
      console.log(`Saved ${rows.length} rows from page ${page} into Supabase.`);
    } catch (err) {
      console.error(`Error on page ${page}:`, err.message);
    }

    // be polite to their server
    await sleep(1500);
  }

  console.log("Done backfilling.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
