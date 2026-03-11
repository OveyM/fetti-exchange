import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Solana USDT (SPL Token) - verification is simplified for now
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tx_hash, coin, usdt_amount, coin_amount } = await req.json();

    if (!tx_hash || !coin || !usdt_amount || !coin_amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's username and assigned address
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("wallet_address, assigned_bep20_address")
      .eq("id", user.id)
      .single();

    if (!userData?.assigned_bep20_address) {
      return new Response(JSON.stringify({ error: "No deposit address assigned" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check duplicate tx
    const { data: existingTx } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("tx_hash", tx_hash)
      .single();

    if (existingTx) {
      return new Response(JSON.stringify({ error: "Transaction already processed" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert as pending (wallet_address stores the username)
    const { data: txRecord, error: insertErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        wallet_address: userData.wallet_address,
        type: "swap",
        coin,
        usdt_amount,
        coin_amount,
        tx_hash,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr) {
      return new Response(JSON.stringify({ error: "Failed to record transaction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For Solana tx verification, you would verify via Solana RPC here.
    // For now, transactions are recorded as pending for admin review.
    // Admin can confirm them via the admin panel.

    return new Response(
      JSON.stringify({ 
        status: "pending", 
        message: "Transaction recorded. It will be verified and confirmed shortly.",
        tx_id: txRecord.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-tx error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
