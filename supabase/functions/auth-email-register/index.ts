/*
  # Email Registration Endpoint

  POST /auth/email/register
  Body: { email, password, name? }

  Features:
  - Email format validation
  - Password strength validation (≥8 chars)
  - Duplicate email handling
  - Social user password setting
  - Rate limiting
  - Secure password hashing
  - JWT token generation
*/

import { createClient } from 'npm:@supabase/supabase-js@2';
import { hash } from 'npm:bcryptjs@2.4.3';
import { create } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Rate limiting: 5 attempts per 10 minutes
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes in ms

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, code: 'METHOD_NOT_ALLOWED' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return new Response(JSON.stringify({ ok: false, code: 'MISSING_FIELDS' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return new Response(JSON.stringify({ ok: false, code: 'INVALID_EMAIL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate password length
    if (password.length < 8) {
      return new Response(JSON.stringify({ ok: false, code: 'PASSWORD_TOO_SHORT' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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
      .eq('attempt_type', 'register')
      .gte('attempted_at', tenMinutesAgo.toISOString());

    if (recentAttempts && recentAttempts.length >= RATE_LIMIT_ATTEMPTS) {
      return new Response(JSON.stringify({ ok: false, code: 'RATE_LIMITED' }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '600' // 10 minutes
        }
      });
    }

    // Log attempt
    await supabase
      .from('auth_attempts')
      .insert({
        ip_address: clientIP,
        email: normalizedEmail,
        attempt_type: 'register',
        success: false
      });

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, password_hash, google_id, apple_id')
      .ilike('email', normalizedEmail)
      .single();

    if (existingUser) {
      // If user has password_hash, email is taken
      if (existingUser.password_hash) {
        return new Response(JSON.stringify({ ok: false, code: 'EMAIL_TAKEN' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Social user without password - allow setting password
      const passwordHash = await hash(password, 12);
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: passwordHash,
          name: name || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select('id, email, name')
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw new Error('Failed to update user');
      }

      // Mark attempt as successful
      await supabase
        .from('auth_attempts')
        .update({ success: true })
        .eq('email', normalizedEmail)
        .eq('attempt_type', 'register')
        .gte('attempted_at', tenMinutesAgo.toISOString());

      // Generate JWT
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(jwtSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const payload = {
        sub: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        provider: 'password',
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      };

      const token = await create({ alg: 'HS256', typ: 'JWT' }, payload, key);

      return new Response(JSON.stringify({ ok: true, token }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create new user
    const passwordHash = await hash(password, 12);
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,
        name: name || null,
        password_hash: passwordHash,
        created_at: new Date().toISOString()
      })
      .select('id, email, name')
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      throw new Error('Failed to create user');
    }

    // Mark attempt as successful
    await supabase
      .from('auth_attempts')
      .update({ success: true })
      .eq('email', normalizedEmail)
      .eq('attempt_type', 'register')
      .gte('attempted_at', tenMinutesAgo.toISOString());

    // Generate JWT
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      name: newUser.name,
      provider: 'password',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    const token = await create({ alg: 'HS256', typ: 'JWT' }, payload, key);

    return new Response(JSON.stringify({ ok: true, token }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ ok: false, code: 'INTERNAL_ERROR' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});