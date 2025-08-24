import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers for development
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// CORS wrapper for handlers
function withCors(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(),
      });
    }

    try {
      const response = await handler(req);
      
      // Add CORS headers to all responses
      const corsHeaders = getCorsHeaders();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    } catch (error) {
      console.error('Handler error:', error);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 500,
        headers: {
          ...getCorsHeaders(),
          'Content-Type': 'application/json',
        },
      });
    }
  };
}

const corsHeaders = getCorsHeaders();

  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
}

async function handleAppleStart(req: Request): Promise<Response> {
  try {
    // Generate Apple OAuth URL
    const authUrl = `https://appleid.apple.com/auth/authorize?` +
      `client_id=${Deno.env.get('APPLE_CLIENT_ID')}&` +
      `redirect_uri=${encodeURIComponent('http://localhost:3000/auth/apple/callback')}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('name email')}&` +
      `response_mode=form_post&` +
      `state=${crypto.randomUUID()}`

    // Redirect to Apple OAuth
    return new Response(null, {
      status: 302,
      headers: {
        'Location': authUrl
      }
    })
  } catch (error) {
    console.error('Apple auth start error:', error)
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Export the CORS-wrapped handler
serve(withCors(handleAppleStart));