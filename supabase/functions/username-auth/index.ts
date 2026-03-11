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
    const { action, username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Missing username or password" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return new Response(
        JSON.stringify({ error: "Username must be 3-20 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return new Response(
        JSON.stringify({ error: "Username can only contain lowercase letters, numbers, and underscores" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const fakeEmail = `${username}@fettiswap.local`;

    if (action === "signup") {
      // Check if username already exists
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("wallet_address", username)
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: "Username already taken" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create auth user
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password: password,
        email_confirm: true,
      });

      if (signUpError) {
        return new Response(
          JSON.stringify({ error: "Failed to create account: " + signUpError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert into public.users table (wallet_address stores username)
      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert({ id: signUpData.user.id, wallet_address: username });

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
          .update({ assigned: true, assigned_to_wallet: username })
          .eq("address", availableAddr.address);

        await supabaseAdmin
          .from("users")
          .update({ assigned_bep20_address: availableAddr.address })
          .eq("id", signUpData.user.id);
      }

      // Sign in
      const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
        email: fakeEmail,
        password: password,
      });

      return new Response(
        JSON.stringify({ session: signInData?.session }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "login") {
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: fakeEmail,
        password: password,
      });

      if (signInError || !signInData?.session) {
        return new Response(
          JSON.stringify({ error: "Invalid username or password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ session: signInData.session }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'login' or 'signup'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Username auth error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
