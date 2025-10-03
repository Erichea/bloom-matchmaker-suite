/**
 * Supabase Edge Function - Notification Service
 *
 * Handles server-side communication with NotificationAPI
 * Routes:
 * - POST / with action=get-config: Returns VAPID public key
 * - POST / with action=subscribe: Registers user with NotificationAPI
 * - POST / with action=unsubscribe: Unregisters user
 * - POST / with action=send: Sends notification via NotificationAPI
 *
 * Environment Variables Required:
 * - NOTIFICATION_API_CLIENT_ID: NotificationAPI client ID
 * - NOTIFICATION_API_SECRET: NotificationAPI server secret
 * - VAPID_PUBLIC_KEY: Web Push VAPID public key
 * - VAPID_PRIVATE_KEY: Web Push VAPID private key (optional, may use NotificationAPI's)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NOTIFICATION_API_BASE_URL = Deno.env.get("NOTIFICATION_API_BASE_URL") || "https://api.notificationapi.com";
const CLIENT_ID = Deno.env.get("NOTIFICATION_API_CLIENT_ID")!;
const SECRET_KEY = Deno.env.get("NOTIFICATION_API_SECRET")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";

interface NotificationPayload {
  action: "get-config" | "subscribe" | "unsubscribe" | "send";
  userId?: string;
  subscription?: PushSubscriptionJSON;
  channels?: ("push" | "email" | "sms")[];
  templateId?: string;
  payload?: Record<string, any>;
  // Direct web_push support (no template required)
  web_push?: {
    title: string;
    message: string;
    icon?: string;
    url?: string;
  };
}

// Helper: Create Supabase client with auth context
function createSupabaseClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: { Authorization: authHeader }
      }
    }
  );
}

// Helper: Validate authenticated user
async function validateAuth(req: Request): Promise<{ userId: string; error?: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return {
      userId: "",
      error: new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: corsHeaders() }
      )
    };
  }

  const supabase = createSupabaseClient(authHeader);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      userId: "",
      error: new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: corsHeaders() }
      )
    };
  }

  return { userId: user.id };
}

// Helper: Add CORS headers to response
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Content-Type": "application/json"
  };
}

// Action: Get configuration (VAPID key)
function handleGetConfig(): Response {
  console.log("[notify] VAPID_PUBLIC_KEY:", VAPID_PUBLIC_KEY ? "SET" : "EMPTY");
  console.log("[notify] VAPID_PUBLIC_KEY length:", VAPID_PUBLIC_KEY?.length || 0);
  console.log("[notify] Environment check:", {
    hasBaseUrl: !!NOTIFICATION_API_BASE_URL,
    hasClientId: !!CLIENT_ID,
    hasSecretKey: !!SECRET_KEY,
    clientIdFirst5: CLIENT_ID?.substring(0, 5),
    secretKeyFirst5: SECRET_KEY?.substring(0, 5)
  });

  return new Response(
    JSON.stringify({
      success: true,
      vapidPublicKey: VAPID_PUBLIC_KEY
    }),
    { headers: corsHeaders() }
  );
}

// Action: Subscribe user to NotificationAPI
async function handleSubscribe(
  userId: string,
  subscription: PushSubscriptionJSON,
  channels: string[]
): Promise<Response> {
  try {
    const apiUrl = `${NOTIFICATION_API_BASE_URL}/${CLIENT_ID}/users/${userId}`;
    console.log("[notify] Subscribing user to NotificationAPI:", {
      url: apiUrl,
      baseUrl: NOTIFICATION_API_BASE_URL,
      clientIdLength: CLIENT_ID?.length || 0,
      secretKeyLength: SECRET_KEY?.length || 0,
      hasSubscription: !!subscription
    });

    const requestBody = {
      id: userId,
      webPushTokens: [
        {
          sub: {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          }
        }
      ]
    };

    console.log("[notify] Request body:", JSON.stringify(requestBody, null, 2));

    // Register user with NotificationAPI
    // Docs: https://www.notificationapi.com/docs/server/users/identify
    const identifyResponse = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${CLIENT_ID}:${SECRET_KEY}`)}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!identifyResponse.ok) {
      const errorText = await identifyResponse.text();
      console.error("[notify] NotificationAPI identify failed:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to register with NotificationAPI" }),
        { status: 500, headers: corsHeaders() }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[notify] Subscribe error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Action: Unsubscribe user
async function handleUnsubscribe(userId: string): Promise<Response> {
  try {
    // Delete user's web push subscription from NotificationAPI
    const response = await fetch(
      `${NOTIFICATION_API_BASE_URL}/${CLIENT_ID}/users/${userId}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Basic ${btoa(`${CLIENT_ID}:${SECRET_KEY}`)}`
        }
      }
    );

    return new Response(
      JSON.stringify({ success: true }),
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[notify] Unsubscribe error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Action: Send notification via NotificationAPI
async function handleSend(
  userId: string,
  templateId: string | undefined,
  payload: Record<string, any>,
  channels: string[],
  webPush?: { title: string; message: string; icon?: string; url?: string }
): Promise<Response> {
  try {
    // Build request body based on whether template or direct web_push is used
    let requestBody: any;

    if (webPush) {
      // Direct web_push sending (no template required)
      requestBody = {
        type: 'send',
        to: { id: userId },
        web_push: webPush
      };
    } else if (templateId) {
      // Template-based sending
      requestBody = {
        notificationId: templateId,
        user: { id: userId },
        mergeTags: payload
      };
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Either templateId or web_push must be provided" }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // Send notification via NotificationAPI
    // Docs: https://www.notificationapi.com/docs/server/sending
    const sendResponse = await fetch(
      `${NOTIFICATION_API_BASE_URL}/${CLIENT_ID}/notifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${btoa(`${CLIENT_ID}:${SECRET_KEY}`)}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error("[notify] NotificationAPI send failed:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send notification", details: errorText }),
        { status: 500, headers: corsHeaders() }
      );
    }

    const result = await sendResponse.json();
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[notify] Send error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Main handler
serve(async (req: Request) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type"
      }
    });
  }

  try {
    const body: NotificationPayload = await req.json();
    const { action } = body;

    console.log("[notify] Request received:", { action, method: req.method });

    // Get config doesn't require auth
    if (action === "get-config") {
      return handleGetConfig();
    }

    // Validate auth for all other actions
    const { userId, error } = await validateAuth(req);
    if (error) return error;

    // Route to appropriate handler
    switch (action) {
      case "subscribe":
        return await handleSubscribe(
          body.userId || userId,
          body.subscription!,
          body.channels || ["push"]
        );

      case "unsubscribe":
        return await handleUnsubscribe(body.userId || userId);

      case "send":
        return await handleSend(
          body.userId || userId,
          body.templateId,
          body.payload || {},
          body.channels || ["push"],
          body.web_push
        );

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action" }),
          { status: 400, headers: corsHeaders() }
        );
    }
  } catch (error) {
    console.error("[notify] Error:", error);
    console.error("[notify] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.name
      }),
      { status: 500, headers: corsHeaders() }
    );
  }
});
