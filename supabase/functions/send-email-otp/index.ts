/*
  # Send Email OTP Function

  This Edge Function sends a 6-digit verification code to user's email:
  1. Validates email address
  2. Generates 6-digit numeric OTP
  3. Stores OTP in database with expiration time
  4. Sends email with OTP code
  5. Returns success/error response

  ## Usage:
  POST /functions/v1/send-email-otp
  Body: { "email": "user@example.com" }

  ## Environment Variables Required:
  - RESEND_API_KEY: Your Resend API key for sending emails
  - SENDER_EMAIL: Email address to send from (must be verified in Resend)
  - SUPABASE_URL: Supabase project URL
  - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    console.log('📧 Starting email OTP send process...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    });

    // Get email service configuration
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const senderEmail = Deno.env.get('SENDER_EMAIL') || 'onboarding@resend.dev';

    if (!resendApiKey) {
      console.warn('⚠️ RESEND_API_KEY not configured, using mock email sending');
      // For development, we'll simulate email sending
      console.log(`📧 [MOCK] Would send OTP ${otpCode} to ${normalizedEmail}`);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Verification code sent successfully (mock)',
        email: normalizedEmail,
        expires_in: 600,
        dev_otp: otpCode, // Include OTP in response for development
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      throw new Error('Invalid request body: must be valid JSON');
    }

    const { email } = body;

    if (!email) {
      throw new Error('Email is required');
    }

    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`📧 Processing OTP request for email: ${normalizedEmail}`);

    // Generate OTP and expiration time
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Rate limiting: Check recent attempts
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('auth_attempts')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('attempt_type', 'email_otp')
      .gte('attempted_at', fiveMinutesAgo);

    if (recentAttempts && recentAttempts.length >= 3) {
      throw new Error('Too many attempts. Please wait 5 minutes before requesting another code.');
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    console.log(`🔢 Generated OTP: ${otpCode} (expires at ${expiresAt.toISOString()})`);

    // Store OTP in database
    const { error: storeError } = await supabase
      .from('auth_attempts')
      .insert({
        email: normalizedEmail,
        attempt_type: 'email_otp',
        attempted_at: new Date().toISOString(),
        success: false,
        otp_code: otpCode,
        otp_expires_at: expiresAt.toISOString(),
        otp_used: false,
      });

    if (storeError) {
      console.error('Failed to store OTP:', storeError);
      // Continue anyway - don't fail the request just because we couldn't log it
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [normalizedEmail],
        subject: 'Your verification code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0C1E3C; text-align: center;">Your Verification Code</h2>
            <div style="background: #F4F6F9; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
              <h1 style="font-size: 32px; letter-spacing: 8px; color: #3D8BFF; margin: 0;">${otpCode}</h1>
            </div>
            <p style="color: #6B7280; text-align: center;">
              This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error('Failed to send email:', emailError);
      throw new Error('Failed to send verification code. Please try again.');
    }

    console.log(`✅ OTP sent successfully to: ${normalizedEmail}`);

    // For development/testing, you might want to log the OTP
    // Remove this in production!
    console.log(`🔍 [DEV] OTP Code for ${normalizedEmail}: ${otpCode}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Verification code sent successfully',
      email: normalizedEmail,
      expires_in: 600, // 10 minutes in seconds
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    console.error('💥 Error sending email OTP:', error);

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