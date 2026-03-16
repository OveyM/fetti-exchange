import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, username, password, recovery_code } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ error: "Missing username" }),
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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const fakeEmail = `${username}@fettiswap.local`;

    if (action === "signup") {
      if (!password || password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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

      const recoveryCode = generateRecoveryCode();

      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert({ id: signUpData.user.id, wallet_address: username, recovery_code: recoveryCode });

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

      const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
        email: fakeEmail,
        password: password,
      });

      return new Response(
        JSON.stringify({ session: signInData?.session, recovery_code: recoveryCode }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "login") {
      if (!password) {
        return new Response(
          JSON.stringify({ error: "Password required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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

    if (action === "recover") {
      if (!recovery_code) {
        return new Response(
          JSON.stringify({ error: "Recovery code required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find user by username and recovery code
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("id, recovery_code")
        .eq("wallet_address", username)
        .single();

      if (!userData || userData.recovery_code !== recovery_code) {
        return new Response(
          JSON.stringify({ error: "Invalid username or recovery code" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate a temporary password, update the auth user, and sign in
      const tempPassword = "recovery_" + crypto.randomUUID();

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userData.id, {
        password: tempPassword,
      });

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Recovery failed: " + updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: fakeEmail,
        password: tempPassword,
      });

      if (signInError || !signInData?.session) {
        return new Response(
          JSON.stringify({ error: "Recovery login failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate new recovery code after use
      const newRecoveryCode = generateRecoveryCode();
      await supabaseAdmin
        .from("users")
        .update({ recovery_code: newRecoveryCode })
        .eq("id", userData.id);

      return new Response(
        JSON.stringify({ session: signInData.session, new_recovery_code: newRecoveryCode }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'login', 'signup', or 'recover'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Username auth error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
