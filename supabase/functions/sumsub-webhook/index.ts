import { createClient } from "npm:@supabase/supabase-js@2";

interface SumsubWebhookBody {
  externalUserId: string;
  reviewStatus: string;
  reviewResult?: {
    reviewAnswer?: string;
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      console.log("Non-POST request received:", req.method);
      return new Response("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          ...corsHeaders,
        },
      });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          ...corsHeaders,
        },
      });
    }

    // Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook body
    let webhookData: SumsubWebhookBody;
    try {
      webhookData = await req.json();
    } catch (error) {
      console.error("Failed to parse webhook body:", error);
      return new Response("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          ...corsHeaders,
        },
      });
    }

    // Extract required fields
    const { externalUserId, reviewStatus, reviewResult } = webhookData;

    if (!externalUserId || !reviewStatus) {
      console.error("Missing required fields in webhook:", {
        externalUserId,
        reviewStatus,
      });
      return new Response("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          ...corsHeaders,
        },
      });
    }

    // Determine KYC status to set
    const kycStatus = reviewResult?.reviewAnswer || reviewStatus;

    console.log("Processing KYC webhook:", {
      externalUserId,
      reviewStatus,
      reviewAnswer: reviewResult?.reviewAnswer,
      finalKycStatus: kycStatus,
    });

    // Update user KYC status in database
    const { data, error } = await supabase
      .from("users")
      .update({ kyc_status: kycStatus })
      .eq("id", externalUserId)
      .select();

    if (error) {
      console.error("Database update error:", error);
      return new Response("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          ...corsHeaders,
        },
      });
    }

    if (!data || data.length === 0) {
      console.warn("No user found with ID:", externalUserId);
      return new Response("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          ...corsHeaders,
        },
      });
    }

    console.log("Successfully updated KYC status for user:", {
      userId: externalUserId,
      newStatus: kycStatus,
      updatedRows: data.length,
    });

    return new Response("OK", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    
    return new Response("OK", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        ...corsHeaders,
      },
    });
  }
});