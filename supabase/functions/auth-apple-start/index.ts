import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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
        ...corsHeaders,
        'Location': authUrl
      }
    })
  } catch (error) {
    console.error('Apple auth start error:', error)
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})