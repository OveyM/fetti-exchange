import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminPassword = Deno.env.get("ADMIN_PASSWORD") || "password";
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const body = req.method === "POST" ? await req.json() : {};
    const providedPassword = body.password || url.searchParams.get("password");

    if (providedPassword !== adminPassword) {
      return new Response(JSON.stringify({ error: "Invalid admin password" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (action) {
      case "list-users": {
        const { data } = await supabaseAdmin.from("users").select("*");
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list-transactions": {
        const { data } = await supabaseAdmin
          .from("transactions")
          .select("*")
          .order("created_at", { ascending: false });
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update-balance": {
        const { user_id, coin, amount } = body;
        const { data: userData } = await supabaseAdmin
          .from("users")
          .select("balances")
          .eq("id", user_id)
          .single();

        if (!userData) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const balances = userData.balances as Record<string, number>;
        balances[coin] = amount;

        await supabaseAdmin
          .from("users")
          .update({ balances })
          .eq("id", user_id);

        return new Response(JSON.stringify({ success: true, balances }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update-tx-status": {
        const { tx_id, status } = body;
        await supabaseAdmin
          .from("transactions")
          .update({ status })
          .eq("id", tx_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add-addresses": {
        const { addresses } = body;
        const rows = addresses.map((a: string) => ({ address: a, assigned: false }));
        const { error } = await supabaseAdmin.from("deposit_addresses").insert(rows);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ success: true, count: rows.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list-addresses": {
        const { data } = await supabaseAdmin.from("deposit_addresses").select("*");
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action. Use: list-users, list-transactions, update-balance, update-tx-status, add-addresses, list-addresses" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
