/*
  # Verify Email OTP Function

  This Edge Function verifies the 6-digit OTP code sent to user's email:
  1. Validates email and OTP code
  2. Checks if OTP exists and hasn't expired
  3. Creates or signs in user
  4. Returns session token for authentication
  5. Marks OTP as used

  ## Usage:
  POST /functions/v1/verify-email-otp
  Body: { "email": "user@example.com", "otp_code": "123456" }

  ## Environment Variables Required:
  - SUPABASE_URL: Supabase project URL
  - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔐 Starting email OTP verification process...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      throw new Error('Invalid request body: must be valid JSON');
    }

    const { email, otp_code } = body;

    if (!email || !otp_code) {
      throw new Error('Email and OTP code are required');
    }

    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!/^\d{6}$/.test(otp_code)) {
      throw new Error('OTP code must be 6 digits');
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`🔍 Verifying OTP for email: ${normalizedEmail}`);

    // Get the latest unused OTP for this email
    const { data: otpRecord, error: otpError } = await supabase
      .from('auth_attempts')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('attempt_type', 'email_otp')
      .eq('otp_used', false)
      .not('otp_code', 'is', null)
      .gte('otp_expires_at', new Date().toISOString())
      .order('attempted_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      console.log('No valid OTP found for email:', normalizedEmail);
      // Log failed attempt
      await supabase
        .from('auth_attempts')
        .insert({
          email: normalizedEmail,
          attempt_type: 'email_otp_verify',
          attempted_at: new Date().toISOString(),
          success: false,
        });

      throw new Error('Invalid or expired verification code');
    }

    // Verify the OTP code
    if (otpRecord.otp_code !== otp_code) {
      console.log(`❌ OTP mismatch for ${normalizedEmail}: expected ${otpRecord.otp_code}, got ${otp_code}`);
      
      // Log failed attempt
      await supabase
        .from('auth_attempts')
        .insert({
          email: normalizedEmail,
          attempt_type: 'email_otp_verify',
          attempted_at: new Date().toISOString(),
          success: false,
        });

      throw new Error('Invalid verification code');
    }

    // Mark OTP as used
    await supabase
      .from('auth_attempts')
      .update({ otp_used: true })
      .eq('id', otpRecord.id);

    // Check if user exists in our users table
    let { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    let user;
    
    if (!existingUser) {
      // Create new user
      console.log(`🆕 Creating new user for email: ${normalizedEmail}`);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user:', createError);
        throw new Error('Failed to create user account');
      }

      user = newUser;
      console.log(`✅ New user created: ${user.id}`);
    } else {
      user = existingUser;
      console.log(`👤 Existing user found: ${user.id}`);
    }

    // Create or sign in user using Supabase Auth
    let authResult;
    
    try {
      // Try to sign in existing user
      const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
      });

      if (signInError) {
        console.error('Failed to generate auth link:', signInError);
        throw new Error('Authentication failed');
      }

      authResult = signInData;
    } catch (error) {
      console.error('Auth error:', error);
      throw new Error('Authentication failed');
    }

    // Log successful attempt
    await supabase
      .from('auth_attempts')
      .insert({
        email: normalizedEmail,
        attempt_type: 'email_otp_verify',
        attempted_at: new Date().toISOString(),
        success: true,
      });

    console.log(`🎉 OTP verification successful for: ${normalizedEmail}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'OTP verified successfully',
      user: {
        id: user.id,
        email: user.email,
        telegram_id: user.telegram_id,
        kyc_status: user.kyc_status,
        bank_details_status: user.bank_details_status,
      },
      session: authResult.properties, // This contains the session data
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    console.error('💥 Error verifying email OTP:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});