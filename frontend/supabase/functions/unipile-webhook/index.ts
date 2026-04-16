import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("client_id");
    
    const body = await req.json();
    console.log("Unipile webhook received:", JSON.stringify(body));

    // body: { status: "CREATION_SUCCESS", account_id: "xxx", name: "clientId" }
    if (body.status === "CREATION_SUCCESS" && body.account_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const resolvedClientId = clientId || body.name;

      const { error } = await supabase.from("unipile_accounts").upsert(
        {
          client_id: resolvedClientId,
          unipile_account_id: body.account_id,
          provider: body.account_type || "UNKNOWN",
          status: "connected",
        },
        { onConflict: "client_id,unipile_account_id" }
      );

      if (error) {
        console.error("Error saving unipile account:", error);
      } else {
        console.log("Unipile account saved for client:", resolvedClientId);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unipile webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
