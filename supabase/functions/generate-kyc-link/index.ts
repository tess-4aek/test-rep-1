/*
  # Generate KYC Verification Link Function

  This Edge Function generates KYC verification links for users:
  1. Creates a new user in the Supabase database if not exists
  2. Creates Sumsub applicant if not exists
  3. Generates verification permalink using Sumsub API
  4. Updates user record with verification details
  5. Returns the verification link

  ## Usage:
  POST /functions/v1/send-kyc-verification
  Body: { "user_id": "uuid" }

  ## Environment Variables Required:
  - SUMSUB_APP_TOKEN: Your Sumsub app token
  - SUMSUB_SECRET_KEY: Your Sumsub secret key
  - SUMSUB_BASE_URL: Sumsub API base URL (default: https://api.sumsub.com)
  - SUMSUB_LEVEL_NAME: Verification level name (e.g., "basic-kyc")
  - SUPABASE_URL: Supabase project URL
  - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
*/ import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
// Проверка валидности UUID
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
Deno.serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    console.log('🔗 Starting KYC verification link generation process...');
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
    // Get Sumsub configuration
    const sumsubAppToken = Deno.env.get('SUMSUB_APP_TOKEN');
    const sumsubSecretKey = Deno.env.get('SUMSUB_SECRET_KEY');
    const sumsubBaseUrl = Deno.env.get('SUMSUB_BASE_URL') || 'https://api.sumsub.com';
    const sumsubLevelName = Deno.env.get('SUMSUB_LEVEL_NAME') || 'Individuals';
    console.log('🔍 Sumsub configuration:', {
      hasAppToken: !!sumsubAppToken,
      hasSecretKey: !!sumsubSecretKey,
      baseUrl: sumsubBaseUrl,
      levelName: sumsubLevelName
    });
    if (!sumsubAppToken || !sumsubSecretKey) {
      throw new Error('Sumsub API credentials not configured');
    }
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      throw new Error('Invalid request body: must be valid JSON');
    }
    const { user_id } = body;
    if (!user_id) {
      throw new Error('user_id is required');
    }
    // Validate UUID format
    if (!isValidUUID(user_id)) {
      throw new Error('Invalid user_id: must be a valid UUID');
    }
    console.log(`👤 Processing KYC verification for user: ${user_id}`);
    // Get or create user
    let user;
    let { data, error: userError } = await supabase.from('users').select('*').eq('id', user_id).single();
    if (userError || !data) {
      console.log(`🆕 User not found, creating new user: ${user_id}`);
      const { data: newUser, error: createError } = await supabase.from('users').insert({
        id: user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select().single();
      if (createError) {
        console.error('❌ Failed to create user:', createError);
        throw new Error(`Failed to create user: ${createError.message}`);
      }
      user = newUser;
      console.log(`✅ New user created: ${user_id}`);
    } else {
      user = data;
    }
    console.log(`📋 User details: ${user.id}`);
    // Check if user already has KYC verified
    if (user.kyc_verified) {
      console.log(`✅ User already has KYC verified`);
      return new Response(JSON.stringify({
        success: false,
        error: 'User already has KYC verified',
        user_id: user.id,
        kyc_verified: true
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    // Use the user's own ID as the external user ID for easy identification in webhooks
    const externalUserId = user.id;
    console.log(`🆔 Using user ID as external user ID: ${externalUserId}`);
    // Update user with external user ID if not already set
    if (user.sumsub_external_user_id !== externalUserId) {
      const { error: updateError } = await supabase.from('users').update({
        sumsub_external_user_id: externalUserId,
        updated_at: new Date().toISOString()
      }).eq('id', user.id);
      if (updateError) {
        console.error('Failed to update user with external user ID:', updateError);
      } else {
        console.log(`💾 Updated user with external user ID: ${externalUserId}`);
      }
    }
    // Create Sumsub permalink using the official API
    console.log(`🔗 Creating Sumsub permalink for level: ${sumsubLevelName}`);
    const permalinkResponse = await createSumsubPermalink(sumsubLevelName, externalUserId, sumsubAppToken, sumsubSecretKey, sumsubBaseUrl);
    if (!permalinkResponse.success) {
      console.error('❌ Sumsub permalink creation failed:', permalinkResponse);
      throw new Error(`Failed to create Sumsub permalink: ${permalinkResponse.error}`);
    }
    const verificationUrl = permalinkResponse.data.url;
    console.log(`✅ Generated Sumsub permalink: ${verificationUrl}`);
    // Update user with verification details
    const { error: updateVerificationError } = await supabase.from('users').update({
      kyc_verification_url: verificationUrl,
      kyc_requested_at: new Date().toISOString(),
      sumsub_external_user_id: externalUserId,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);
    if (updateVerificationError) {
      console.error('Failed to update user verification details:', updateVerificationError);
    }
    console.log(`🎉 KYC verification link generated successfully`);
    return new Response(JSON.stringify({
      success: true,
      message: 'KYC verification link generated successfully',
      data: {
        user_id: user.id,
        external_user_id: externalUserId,
        verification_url: verificationUrl,
        level_name: sumsubLevelName
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('💥 Error generating KYC verification link:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace'
    });
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'An unexpected error occurred',
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
/**
 * Create Sumsub permalink using the official API
 */ async function createSumsubPermalink(levelName, externalUserId, appToken, secretKey, baseUrl) {
  try {
    // API endpoint for creating permalinks
    const path = `/resources/sdkIntegrations/levels/${levelName}/websdkLink`;
    const queryParams = new URLSearchParams({
      ttlInSecs: '86400',
      externalUserId: externalUserId,
      lang: 'en'
    });
    const fullPath = `${path}?${queryParams.toString()}`;
    const url = `${baseUrl}${fullPath}`;
    // Create signature for Sumsub API
    const timestamp = Math.floor(Date.now() / 1000);
    const method = 'POST';
    const bodyString = '{}'; // Empty JSON body as per documentation
    const signatureString = `${timestamp}${method}${fullPath}${bodyString}`;
    const signature = createHmac('sha256', secretKey).update(signatureString).digest('hex');
    const headers = {
      'X-App-Token': appToken,
      'X-App-Access-Sig': signature,
      'X-App-Access-Ts': timestamp.toString(),
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    console.log(`🌐 Making Sumsub permalink request: ${method} ${fullPath}`);
    console.log(`🔑 External User ID: ${externalUserId}`);
    console.log(`🔍 Request details:`, {
      url,
      method,
      headers: {
        ...headers,
        'X-App-Token': 'masked',
        'X-App-Access-Sig': 'masked'
      }
    });
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), 10000); // 10 seconds timeout
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: bodyString,
        signal: controller.signal
      });
      const responseData = await response.json();
      console.log(`📄 Sumsub API response:`, {
        status: response.status,
        ok: response.ok,
        data: responseData
      });
      if (!response.ok) {
        console.error(`❌ Sumsub permalink API error (${response.status}):`, responseData);
        return {
          success: false,
          error: responseData.description || responseData.message || 'Unknown Sumsub API error',
          status: response.status
        };
      }
      console.log(`✅ Sumsub permalink created successfully for external user: ${externalUserId}`);
      return {
        success: true,
        data: responseData
      };
    } finally{
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('💥 Sumsub permalink request failed:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}
