import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fetti special pricing: LTC gets a $17 discount
const FETTI_DISCOUNTS: Record<string, number> = {
  litecoin: 17,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cgUrl =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,tether&vs_currencies=usd&include_24hr_change=true";

    const res = await fetch(cgUrl);
    const data = await res.json();

    const prices = [
      {
        coin: "BTC",
        marketPrice: data.bitcoin?.usd || 0,
        fettiPrice: data.bitcoin?.usd || 0,
        change24h: parseFloat((data.bitcoin?.usd_24h_change || 0).toFixed(2)),
      },
      {
        coin: "ETH",
        marketPrice: data.ethereum?.usd || 0,
        fettiPrice: data.ethereum?.usd || 0,
        change24h: parseFloat((data.ethereum?.usd_24h_change || 0).toFixed(2)),
      },
      {
        coin: "LTC",
        marketPrice: data.litecoin?.usd || 0,
        fettiPrice: Math.max(0, (data.litecoin?.usd || 0) - (FETTI_DISCOUNTS.litecoin || 0)),
        change24h: parseFloat((data.litecoin?.usd_24h_change || 0).toFixed(2)),
      },
      {
        coin: "USDT",
        marketPrice: data.tether?.usd || 1,
        fettiPrice: data.tether?.usd || 1,
        change24h: parseFloat((data.tether?.usd_24h_change || 0).toFixed(2)),
      },
    ];

    return new Response(JSON.stringify(prices), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Prices error:", err);
    // Return fallback prices
    return new Response(
      JSON.stringify([
        { coin: "BTC", marketPrice: 67432, fettiPrice: 67432, change24h: 0 },
        { coin: "ETH", marketPrice: 3521, fettiPrice: 3521, change24h: 0 },
        { coin: "LTC", marketPrice: 84, fettiPrice: 67, change24h: 0 },
        { coin: "USDT", marketPrice: 1, fettiPrice: 1, change24h: 0 },
      ]),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
