import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts"

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
      return new Response(getErrorHtml('Authentication failed'), {
        status: 500,
        headers: {
          ...getCorsHeaders(),
          'Content-Type': 'text/html',
        },
      });
    }
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

function getErrorHtml(errorMessage: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authentication Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <h2>Authentication Failed</h2>
            <p>${errorMessage}</p>
          </div>
        </div>
        <script>
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              ok: false,
              error: '${errorMessage}'
            }));
          }
          setTimeout(() => { window.close?.(); }, 300);
        </script>
      </body>
    </html>
  `;
}

async function handleGoogleCallback(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error) {
      throw new Error(`OAuth error: ${error}`)
    }

    if (!code) {
      throw new Error('No authorization code received')
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/auth/google/callback'
      })
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }

    // Get user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    const profile = await profileResponse.json()

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Upsert user in database
    const { data: user, error: dbError } = await supabase
      .from('users')
      .upsert({
        id: crypto.randomUUID(),
        email: profile.email,
        name: profile.name,
        google_id: profile.id,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'google_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save user')
    }

    // Create JWT
    const jwtSecret = Deno.env.get('JWT_SECRET')!
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    )

    const payload = {
      sub: user.id,
      email: profile.email,
      name: profile.name,
      provider: 'google',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }

    const jwt = await create({ alg: "HS256", typ: "JWT" }, payload, key)

    // Return HTML that posts message to React Native WebView
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Success</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
              <h2>Authentication Successful</h2>
              <p>Redirecting back to app...</p>
            </div>
          </div>
          <script>
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                ok: true,
                token: '${jwt}',
                user: {
                  id: '${user.id}',
                  email: '${profile.email}',
                  name: '${profile.name}',
                  provider: 'google'
                }
              }));
            } else {
              // Fallback for testing in browser
              console.log('Auth success:', {
                ok: true,
                token: '${jwt}',
                user: {
                  id: '${user.id}',
                  email: '${profile.email}',
                  name: '${profile.name}',
                  provider: 'google'
                }
              });
            }
            setTimeout(() => { window.close?.(); }, 300);
          </script>
        </body>
      </html>
    `

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    })

  } catch (error) {
    console.error('Google callback error:', error)
    
    return new Response(getErrorHtml(error.message), {
      status: 500,
      headers: {
        'Content-Type': 'text/html'
      }
    })
  }
}

// Export the CORS-wrapped handler
serve(withCors(handleGoogleCallback));