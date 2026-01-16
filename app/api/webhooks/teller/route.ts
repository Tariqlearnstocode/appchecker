import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/utils/supabase/admin';

/**
 * Verify Teller webhook signature
 * Per Teller docs: https://teller.io/docs/api/webhooks
 */
function verifyTellerSignature(
  rawBody: string,
  signatureHeader: string,
  signingSecrets: string[]
): { valid: boolean; timestamp?: number } {
  if (!signatureHeader) {
    return { valid: false };
  }

  // Parse signature header: t=<timestamp>,v1=<sig1>,v1=<sig2>,...
  const parts = signatureHeader.split(',');
  let timestamp: number | undefined;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      timestamp = parseInt(value, 10);
    } else if (key === 'v1') {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return { valid: false };
  }

  // Reject if timestamp is older than 3 minutes (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  if (age > 180) {
    // 3 minutes = 180 seconds
    console.warn(`Teller webhook rejected: timestamp too old (${age}s ago)`);
    return { valid: false, timestamp };
  }

  // Create signed message: <timestamp>.<raw_body>
  const signedMessage = `${timestamp}.${rawBody}`;

  // Try each signing secret (support secret rotation)
  for (const secret of signingSecrets) {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedMessage)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    for (const receivedSig of signatures) {
      if (crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(receivedSig))) {
        return { valid: true, timestamp };
      }
    }
  }

  return { valid: false, timestamp };
}

/**
 * Store webhook event in database for auditing and debugging
 */
async function storeWebhookEvent(event: TellerWebhookEvent, rawBody: string) {
  try {
    const eventTimestamp = event.timestamp ? new Date(event.timestamp).toISOString() : null;

    // Type assertion needed - table exists after migration runs
    const { error } = await (supabaseAdmin as any)
      .from('teller_webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        enrollment_id: event.data?.enrollment_id || null,
        account_id: event.data?.account_id || null,
        event_data: event.data || {},
        full_payload: JSON.parse(rawBody),
        event_timestamp: eventTimestamp,
      } as any);

    if (error) {
      console.error('Error storing webhook event:', error);
      throw error;
    }

    console.log(`Stored webhook event ${event.id} (${event.type}) in database`);
  } catch (err: any) {
    // Log but don't throw - we want to continue processing even if storage fails
    console.error('Failed to store webhook event:', err);
    throw err;
  }
}

interface TellerWebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  data: {
    enrollment_id?: string;
    account_id?: string;
    reason?: string;
    status?: string;
    transactions?: any[];
    [key: string]: any;
  };
}

export async function POST(request: NextRequest) {
  console.log('Teller webhook endpoint hit');
  
  const body = await request.text();
  const signatureHeader = request.headers.get('teller-signature');

  console.log('Teller webhook request received', {
    hasBody: !!body,
    bodyLength: body.length,
    hasSignature: !!signatureHeader,
    signaturePreview: signatureHeader ? signatureHeader.substring(0, 20) + '...' : null,
    headers: Object.fromEntries(request.headers.entries()),
  });

  if (!signatureHeader) {
    console.error('Teller webhook: No signature header');
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  // Get signing secrets from environment
  // Teller may have multiple active secrets during rotation
  // Format: TELLER_WEBHOOK_SECRET or TELLER_WEBHOOK_SECRETS (comma-separated)
  const webhookSecretsEnv = process.env.TELLER_WEBHOOK_SECRETS || process.env.TELLER_WEBHOOK_SECRET;
  if (!webhookSecretsEnv) {
    console.error('TELLER_WEBHOOK_SECRET(S) is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  const signingSecrets = webhookSecretsEnv.split(',').map(s => s.trim()).filter(Boolean);

  // Verify signature
  const verification = verifyTellerSignature(body, signatureHeader, signingSecrets);
  if (!verification.valid) {
    console.error('Teller webhook signature verification failed', {
      timestamp: verification.timestamp,
    });
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  let event: TellerWebhookEvent;
  try {
    event = JSON.parse(body);
  } catch (err) {
    console.error('Teller webhook: Failed to parse JSON', err);
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  console.log(`Teller webhook received: ${event.type}`, {
    id: event.id,
    timestamp: event.timestamp,
    enrollment_id: event.data?.enrollment_id,
    account_id: event.data?.account_id,
  });

  // Store webhook event in database for auditing/debugging
  try {
    await storeWebhookEvent(event, body);
  } catch (storeError: any) {
    console.error('Failed to store webhook event in database:', storeError);
    // Continue processing even if storage fails
  }

  try {
    switch (event.type) {
      case 'enrollment.disconnected': {
        await handleEnrollmentDisconnected(event);
        break;
      }

      case 'transactions.processed': {
        await handleTransactionsProcessed(event);
        break;
      }

      case 'account.number_verification.processed': {
        await handleAccountVerificationProcessed(event);
        break;
      }

      case 'webhook.test': {
        console.log('Teller webhook test received - verification successful');
        break;
      }

      default:
        console.log(`Unhandled Teller webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling Teller webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle enrollment.disconnected webhook
 * Triggered when an enrollment loses connection to the institution
 */
async function handleEnrollmentDisconnected(event: TellerWebhookEvent) {
  const { enrollment_id, reason } = event.data;

  if (!enrollment_id) {
    console.error('enrollment.disconnected: Missing enrollment_id');
    return;
  }

  console.error('Teller enrollment disconnected:', {
    enrollment_id,
    reason,
    event_id: event.id,
    timestamp: event.timestamp,
  });

  // Log disconnection reason for debugging
  // Common reasons: credentials_invalid, mfa_required, account_locked, etc.
  const reasonMessages: Record<string, string> = {
    'credentials_invalid': 'Bank credentials are invalid or expired',
    'mfa_required': 'Bank requires multi-factor authentication',
    'account_locked': 'Bank account is locked',
    'user_action.captcha_required': 'Bank requires captcha verification',
    'enrollment_inactive': 'Enrollment became inactive',
    'disconnected': 'Generic disconnection',
  };

  const reasonMessage = reasonMessages[reason || ''] || reason || 'Unknown reason';
  
  console.log(`Enrollment ${enrollment_id} disconnected: ${reasonMessage}`);

  // Note: We don't need to update our database here since we delete enrollments
  // immediately after fetching data. But logging helps with debugging.
}

/**
 * Handle transactions.processed webhook
 * Triggered when Teller discovers new transactions (at least once per 24h)
 */
async function handleTransactionsProcessed(event: TellerWebhookEvent) {
  const { enrollment_id, transactions } = event.data;

  if (!enrollment_id) {
    console.error('transactions.processed: Missing enrollment_id');
    return;
  }

  console.log('Teller transactions processed:', {
    enrollment_id,
    transaction_count: transactions?.length || 0,
    event_id: event.id,
    timestamp: event.timestamp,
  });

  // Note: We don't need to process this since we delete enrollments immediately
  // after fetching. This webhook is more useful for ongoing account monitoring.
  // But logging helps with visibility.
}

/**
 * Handle account.number_verification.processed webhook
 * Triggered after microdeposit verification succeeds or expires
 */
async function handleAccountVerificationProcessed(event: TellerWebhookEvent) {
  const { account_id, status } = event.data;

  if (!account_id) {
    console.error('account.number_verification.processed: Missing account_id');
    return;
  }

  console.log('Teller account verification processed:', {
    account_id,
    status,
    event_id: event.id,
    timestamp: event.timestamp,
  });

  // Note: We don't currently use account number verification,
  // but logging helps for future features.
}
