/*
  # Email Login Endpoint

  POST /auth/email/login
  Body: { email, password }

  Features:
  - Email/password validation
  - Secure password comparison
  - Rate limiting
  - JWT token generation
  - Generic error responses (no user enumeration)
*/

import { createClient } from 'npm:@supabase/supabase-js@2';
import { compare } from 'npm:bcryptjs@2.4.3';
import { create } from 'https://deno.land/x/djwt@v2.8/mod.ts';

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
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }), {
        status: 500,
        headers: {
          ...getCorsHeaders(),
          'Content-Type': 'application/json',
        },
      });
    }
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Rate limiting: 5 attempts per 10 minutes
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes in ms

async function handleLogin(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, code: 'METHOD_NOT_ALLOWED' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const jwtSecret = Deno.env.get('JWT_SECRET');

    if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, code: 'INVALID_JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return new Response(JSON.stringify({ ok: false, code: 'MISSING_FIELDS' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Check rate limiting
    const tenMinutesAgo = new Date(Date.now() - RATE_LIMIT_WINDOW);
    const { data: recentAttempts } = await supabase
      .from('auth_attempts')
      .select('id')
      .or(`ip_address.eq.${clientIP},email.ilike.${normalizedEmail}`)
      .eq('attempt_type', 'login')
      .gte('attempted_at', tenMinutesAgo.toISOString());

    if (recentAttempts && recentAttempts.length >= RATE_LIMIT_ATTEMPTS) {
      return new Response(JSON.stringify({ ok: false, code: 'RATE_LIMITED' }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '600' // 10 minutes
        }
      });
    }

    // Log attempt (initially as failed)
    const { data: attemptRecord } = await supabase
      .from('auth_attempts')
      .insert({
        ip_address: clientIP,
        email: normalizedEmail,
        attempt_type: 'login',
        success: false
      })
      .select('id')
      .single();

    // Find user by email
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, password_hash')
      .ilike('email', normalizedEmail)
      .single();

    // Generic error for security (no user enumeration)
    if (!user || !user.password_hash) {
      return new Response(JSON.stringify({ ok: false, code: 'INVALID_CREDENTIALS' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Compare password
    const passwordMatch = await compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return new Response(JSON.stringify({ ok: false, code: 'INVALID_CREDENTIALS' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mark attempt as successful
    if (attemptRecord) {
      await supabase
        .from('auth_attempts')
        .update({ success: true })
        .eq('id', attemptRecord.id);
    }

    // Generate JWT
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      provider: 'password',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    const token = await create({ alg: 'HS256', typ: 'JWT' }, payload, key);

    return new Response(JSON.stringify({ ok: true, token }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ ok: false, code: 'INTERNAL_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Export the CORS-wrapped handler
Deno.serve(withCors(handleLogin));