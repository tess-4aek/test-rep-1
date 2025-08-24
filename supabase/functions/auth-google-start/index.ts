import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import passport from "npm:passport@0.6.0"
import { Strategy as GoogleStrategy } from "npm:passport-google-oauth20@2.0.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
}

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: Deno.env.get('GOOGLE_CLIENT_ID')!,
  clientSecret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
  callbackURL: "http://localhost:3000/auth/google/callback"
}, (accessToken: string, refreshToken: string, profile: any, done: any) => {
  return done(null, profile)
}))

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Generate Google OAuth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${Deno.env.get('GOOGLE_CLIENT_ID')}&` +
      `redirect_uri=${encodeURIComponent('http://localhost:3000/auth/google/callback')}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `state=${crypto.randomUUID()}`

    // Redirect to Google OAuth
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': authUrl
      }
    })
  } catch (error) {
    console.error('Google auth start error:', error)
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})