/*
  # Sumsub Webhook Handler

  This Edge Function handles webhooks from Sumsub when KYC verification status changes:
  1. Receives webhook from Sumsub with verification status
  2. Updates user KYC status in database based on webhook type
  3. Returns appropriate response to Sumsub

  ## Webhook URL:
  https://your-project.supabase.co/functions/v1/sumsub-webhook

  ## Sumsub Webhook Types:
  - applicantActivated: User passed KYC verification (set kyc_status = true)
  - applicantDeactivated: User failed/rejected KYC verification (set kyc_status = false)
  - applicantReviewed: Verification complete (GREEN = verified, RED = rejected)
  - applicantPending: Verification in progress
  - applicantOnHold: Verification on hold
  - applicantCreated: New applicant created

  ## Environment Variables Required:
  - SUPABASE_URL: Your Supabase project URL
  - SUPABASE_SERVICE_ROLE_KEY: Your service role key
  - SUMSUB_WEBHOOK_SECRET_KEY: Your Sumsub secret key for webhook verification (optional)
*/

import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-payload-digest",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔔 Received Sumsub webhook');

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

    // Get webhook payload
    const rawBody = await req.text();
    const webhookData = JSON.parse(rawBody);

    console.log('📦 Webhook payload:', JSON.stringify(webhookData, null, 2));

    // Verify webhook signature (optional but recommended)
    const sumsubSecretKey = Deno.env.get('SUMSUB_WEBHOOK_SECRET_KEY');
    if (sumsubSecretKey) {
      const receivedSignature = req.headers.get('x-payload-digest');
      if (receivedSignature) {
        const expectedSignature = createHmac('sha256', sumsubSecretKey)
          .update(rawBody)
          .digest('hex');
        
        if (receivedSignature !== expectedSignature) {
          console.error('❌ Invalid webhook signature');
          throw new Error('Invalid webhook signature');
        }
        console.log('✅ Webhook signature verified');
      }
    }

    // Extract information from webhook
    const {
      type,
      applicantId,
      externalUserId,
      reviewResult,
      reviewStatus,
      sandboxMode,
      inspectionId,
      applicantType,
      correlationId,
      levelName,
      createdAtMs,
      clientId
    } = webhookData;

    console.log(`📋 Webhook details:
      - Type: ${type}
      - Applicant ID: ${applicantId}
      - External User ID: ${externalUserId}
      - Review Status: ${reviewStatus}
      - Level Name: ${levelName}
      - Sandbox Mode: ${sandboxMode}
      - Created At: ${createdAtMs}
    `);

    // Find user by external user ID (which should be the user's UUID from our database)
    let user = null;
    let cleanExternalUserId = externalUserId;

    if (externalUserId) {
      // Remove "level-" prefix if present (Sumsub sometimes adds this)
      if (externalUserId.startsWith('level-')) {
        cleanExternalUserId = externalUserId.replace('level-', '');
        console.log(`🔧 Cleaned external user ID: ${externalUserId} → ${cleanExternalUserId}`);
      }

      // Try to find user by cleaned external user ID (should match users.id)
      const { data: userByExternalId } = await supabase
        .from('users')
        .select('*')
        .eq('id', cleanExternalUserId)
        .single();
      
      user = userByExternalId;

      // If not found with cleaned ID, try with original external user ID
      if (!user && cleanExternalUserId !== externalUserId) {
        console.log(`🔍 Trying original external user ID: ${externalUserId}`);
        const { data: userByOriginalId } = await supabase
          .from('users')
          .select('*')
          .eq('id', externalUserId)
          .single();
        
        user = userByOriginalId;
      }

      // Also try finding by sumsub_external_user_id field if it exists
      if (!user) {
        console.log(`🔍 Trying sumsub_external_user_id field with: ${externalUserId}`);
        const { data: userByStoredExternalId } = await supabase
          .from('users')
          .select('*')
          .eq('sumsub_external_user_id', externalUserId)
          .single();
        
        user = userByStoredExternalId;
      }

      // Try with cleaned external user ID in sumsub_external_user_id field
      if (!user && cleanExternalUserId !== externalUserId) {
        console.log(`🔍 Trying sumsub_external_user_id field with cleaned ID: ${cleanExternalUserId}`);
        const { data: userByCleanedStoredId } = await supabase
          .from('users')
          .select('*')
          .eq('sumsub_external_user_id', cleanExternalUserId)
          .single();
        
        user = userByCleanedStoredId;
      }
    }

    if (!user) {
      console.error(`❌ User not found after all attempts:
        - Original external user ID: ${externalUserId}
        - Cleaned external user ID: ${cleanExternalUserId}
        - Searched in: users.id, users.sumsub_external_user_id
      `);
      
      // Return success to Sumsub to avoid retries, but log the issue
      return new Response(JSON.stringify({
        success: true,
        message: 'User not found, but webhook acknowledged',
        external_user_id: externalUserId,
        cleaned_external_user_id: cleanExternalUserId,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }

    console.log(`👤 Found user: ${user.first_name || 'Unknown'} ${user.last_name || ''} (@${user.username || 'no-username'}) - ID: ${user.id}
      - Telegram ID: ${user.telegram_id}
      - Matched via: ${user.id === cleanExternalUserId ? 'cleaned external user ID' : 
                      user.id === externalUserId ? 'original external user ID' : 
                      user.sumsub_external_user_id === externalUserId ? 'stored external user ID' : 
                      user.sumsub_external_user_id === cleanExternalUserId ? 'stored cleaned external user ID' : 'unknown'}
    `);

    // Process different webhook types
    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (type) {
      case 'applicantActivated':
        // User passed KYC verification - activate KYC
        updateData.kyc_status = true;
        console.log(`✅ KYC ACTIVATED for user: @${user.username || user.telegram_id} (${user.first_name} ${user.last_name})`);
        break;

      case 'applicantDeactivated':
        // User failed/rejected KYC verification - deactivate KYC
        updateData.kyc_status = false;
        console.log(`❌ KYC DEACTIVATED for user: @${user.username || user.telegram_id} (${user.first_name} ${user.last_name})`);
        break;

      case 'applicantReviewed':
        // Legacy support: Verification complete
        const reviewAnswer = reviewResult?.reviewAnswer;
        if (reviewAnswer === 'GREEN') {
          // KYC approved
          updateData.kyc_status = true;
          console.log(`✅ KYC approved (reviewed) for user: @${user.username || user.telegram_id}`);
        } else if (reviewAnswer === 'RED') {
          // KYC rejected
          updateData.kyc_status = false;
          console.log(`❌ KYC rejected (reviewed) for user: @${user.username || user.telegram_id}`);
        } else {
          // YELLOW or other status - keep current status or set to false for safety
          updateData.kyc_status = false;
          console.log(`⚠️ KYC review inconclusive (${reviewAnswer}) for user: @${user.username || user.telegram_id}`);
        }
        break;

      case 'applicantPending':
        // Verification in progress - don't change kyc_status
        console.log(`⏳ KYC pending for user: @${user.username || user.telegram_id}`);
        break;

      case 'applicantOnHold':
        // Verification on hold - don't change kyc_status
        console.log(`⏸️ KYC on hold for user: @${user.username || user.telegram_id}`);
        break;

      case 'applicantCreated':
        // Applicant created - don't change kyc_status
        console.log(`🆕 Applicant created for user: @${user.username || user.telegram_id}`);
        // Update sumsub_external_user_id if not already set
        if (!user.sumsub_external_user_id && externalUserId) {
          updateData.sumsub_external_user_id = externalUserId;
        }
        break;

      default:
        console.log(`ℹ️ Unhandled webhook type: ${type}`);
        break;
    }

    // Update user record if there are changes
    if (Object.keys(updateData).length > 1) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update user:', updateError);
        throw new Error(`Failed to update user: ${updateError.message}`);
      }

      console.log(`💾 Updated user ${user.id} with KYC status changes:`, updateData);
    }

    // Log webhook processing for audit trail
    console.log(`📋 Webhook Summary:
      - Type: ${type}
      - User: ${user.first_name} ${user.last_name} (@${user.username || user.telegram_id})
      - User ID: ${user.id}
      - Telegram ID: ${user.telegram_id}
      - Applicant ID: ${applicantId}
      - External User ID: ${externalUserId}
      - Review Status: ${reviewStatus}
      - Review Answer: ${reviewResult?.reviewAnswer || 'N/A'}
      - Level Name: ${levelName}
      - KYC Status: ${updateData.kyc_status !== undefined ? updateData.kyc_status : user.kyc_status}
      - Sandbox Mode: ${sandboxMode}
      - Timestamp: ${new Date().toISOString()}
      - Created At: ${createdAtMs}
    `);

    // Return success response to Sumsub
    const response = {
      success: true,
      message: 'Webhook processed successfully',
      user_id: user.id,
      telegram_id: user.telegram_id,
      applicant_id: applicantId,
      external_user_id: externalUserId,
      webhook_type: type,
      review_status: reviewStatus,
      level_name: levelName,
      kyc_status: updateData.kyc_status !== undefined ? updateData.kyc_status : user.kyc_status,
      sandbox_mode: sandboxMode,
      timestamp: new Date().toISOString()
    };

    console.log(`🎉 Webhook processed successfully for user ${user.id} (${type})`);

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    console.error('💥 Webhook processing failed:', error);

    // Return error response
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
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