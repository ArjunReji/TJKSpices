// app/api/exchange-rate/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/INR");
    if (!r.ok) {
      return NextResponse.json({ error: "Rate provider error" }, { status: 502 });
    }

    const json = await r.json();

    return NextResponse.json(
      {
        rates: {
          USD: json.rates.USD,
          EUR: json.rates.EUR,
          AED: json.rates.AED,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}
