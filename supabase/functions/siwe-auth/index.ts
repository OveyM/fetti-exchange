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
    const { wallet_address, message, signature } = await req.json();

    if (!wallet_address || !message || !signature) {
      return new Response(
        JSON.stringify({ error: "Missing wallet_address, message, or signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the SIWE signature using ethers
    // We'll do a simple ecrecover check
    const { ethers } = await import("https://esm.sh/ethers@6.13.4");
    
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== wallet_address.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Signature verification failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use wallet address as email-like identifier for Supabase auth
    const fakeEmail = `${wallet_address.toLowerCase()}@wallet.local`;
    const password = `siwe_${wallet_address.toLowerCase()}_${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.slice(0, 8)}`;

    // Try to sign in first
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: fakeEmail,
      password: password,
    });

    if (signInData?.session) {
      return new Response(
        JSON.stringify({ session: signInData.session }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If sign in fails, create the user
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password: password,
      email_confirm: true,
    });

    if (signUpError) {
      return new Response(
        JSON.stringify({ error: "Failed to create user: " + signUpError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert into public.users table
    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert({ id: signUpData.user.id, wallet_address: wallet_address.toLowerCase() });

    if (insertError) {
      console.error("Insert user error:", insertError);
    }

    // Assign a deposit address
    const { data: availableAddr } = await supabaseAdmin
      .from("deposit_addresses")
      .select("address")
      .eq("assigned", false)
      .limit(1)
      .single();

    if (availableAddr) {
      await supabaseAdmin
        .from("deposit_addresses")
        .update({ assigned: true, assigned_to_wallet: wallet_address.toLowerCase() })
        .eq("address", availableAddr.address);

      await supabaseAdmin
        .from("users")
        .update({ assigned_bep20_address: availableAddr.address })
        .eq("id", signUpData.user.id);
    }

    // Sign in with the newly created user
    const { data: newSignIn } = await supabaseAdmin.auth.signInWithPassword({
      email: fakeEmail,
      password: password,
    });

    return new Response(
      JSON.stringify({ session: newSignIn?.session }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("SIWE auth error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
