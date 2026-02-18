import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ERC20 Transfer event topic
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

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
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
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

    // Get user's wallet and assigned address
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

    // Insert as pending
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

    // Verify on BSC
    const bscRpc = Deno.env.get("BSC_RPC_URL") || "https://bsc-dataseed.binance.org/";
    const usdtContract = Deno.env.get("USDT_BEP20_CONTRACT") || "0x55d398326f99059fF775485246999027B3197955";

    let verified = false;
    let onChainAmount = 0;

    try {
      const receiptRes = await fetch(bscRpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getTransactionReceipt",
          params: [tx_hash],
          id: 1,
        }),
      });

      const receiptData = await receiptRes.json();
      const receipt = receiptData.result;

      if (receipt && receipt.status === "0x1") {
        // Look for USDT Transfer event to user's assigned address
        for (const log of receipt.logs || []) {
          if (
            log.address.toLowerCase() === usdtContract.toLowerCase() &&
            log.topics[0] === TRANSFER_TOPIC
          ) {
            const toAddress = "0x" + log.topics[2].slice(26);
            if (toAddress.toLowerCase() === userData.assigned_bep20_address.toLowerCase()) {
              // USDT has 18 decimals on BSC
              onChainAmount = parseInt(log.data, 16) / 1e18;
              verified = true;
              break;
            }
          }
        }
      }
    } catch (rpcErr) {
      console.error("BSC RPC error:", rpcErr);
    }

    if (verified && onChainAmount >= usdt_amount * 0.99) {
      // Update transaction status
      await supabaseAdmin
        .from("transactions")
        .update({ status: "confirmed" })
        .eq("id", txRecord.id);

      // Credit user balance
      const { data: currentUser } = await supabaseAdmin
        .from("users")
        .select("balances")
        .eq("id", user.id)
        .single();

      const balances = currentUser?.balances as Record<string, number> || {};
      balances[coin] = (balances[coin] || 0) + coin_amount;

      await supabaseAdmin
        .from("users")
        .update({ balances })
        .eq("id", user.id);

      return new Response(JSON.stringify({ status: "confirmed", coin_amount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Mark as failed if can't verify
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", txRecord.id);

      return new Response(
        JSON.stringify({ status: "failed", error: "Could not verify transaction on-chain" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("verify-tx error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
