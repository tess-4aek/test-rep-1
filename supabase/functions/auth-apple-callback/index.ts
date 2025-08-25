import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"

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
    const formData = await req.formData()
    const code = formData.get('code')?.toString()
    const error = formData.get('error')?.toString()
    const user = formData.get('user')?.toString()

    if (error) {
      throw new Error(`OAuth error: ${error}`)
    }

    if (!code) {
      throw new Error('No authorization code received')
    }

    // Parse user data if provided (only on first auth)
    let userData = null
    if (user) {
      try {
        userData = JSON.parse(user)
      } catch (e) {
        console.warn('Failed to parse user data:', e)
      }
    }

    // Create client secret JWT for Apple
    const now = Math.floor(Date.now() / 1000)
    const clientSecretPayload = {
      iss: Deno.env.get('APPLE_TEAM_ID'),
      iat: now,
      exp: now + 3600, // 1 hour
      aud: 'https://appleid.apple.com',
      sub: Deno.env.get('APPLE_CLIENT_ID')
    }

    // Note: In production, you'd need to sign this with your Apple private key
    // For now, we'll use a placeholder
    const clientSecret = 'placeholder_client_secret'

    // Exchange code for access token
    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('APPLE_CLIENT_ID')!,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/auth/apple/callback'
      })
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.id_token) {
      throw new Error('Failed to get ID token')
    }

    // Decode ID token (simplified - in production use proper JWT verification)
    const idTokenParts = tokenData.id_token.split('.')
    const payload = JSON.parse(atob(idTokenParts[1]))

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Upsert user in database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .upsert({
        id: crypto.randomUUID(),
        email: payload.email,
        first_name: userData?.name?.firstName || 'Apple',
        last_name: userData?.name?.lastName || 'User',
        apple_id: payload.sub,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email',
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

    const jwtPayload = {
      sub: dbUser.id,
      email: payload.email,
      name: `${userData?.name?.firstName || 'Apple'} ${userData?.name?.lastName || 'User'}`,
      provider: 'apple',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }

    const jwt = await create({ alg: "HS256", typ: "JWT" }, jwtPayload, key)

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
                type: 'AUTH_SUCCESS',
                token: '${jwt}',
                user: {
                  id: '${dbUser.id}',
                  email: '${payload.email}',
                  name: '${userData?.name?.firstName || 'Apple'} ${userData?.name?.lastName || 'User'}',
                  provider: 'apple'
                }
              }));
            } else {
              // Fallback for testing in browser
              console.log('Auth success:', {
                token: '${jwt}',
                user: {
                  id: '${dbUser.id}',
                  email: '${payload.email}',
                  name: '${userData?.name?.firstName || 'Apple'} ${userData?.name?.lastName || 'User'}',
                  provider: 'apple'
                }
              });
            }
          </script>
        </body>
      </html>
    `

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html'
      }
    })

  } catch (error) {
    console.error('Apple callback error:', error)
    
    const errorHtml = `
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
              <p>${error.message}</p>
            </div>
          </div>
          <script>
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'AUTH_ERROR',
                error: '${error.message}'
              }));
            }
          </script>
        </body>
      </html>
    `

    return new Response(errorHtml, {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html'
      }
    })
  }
})