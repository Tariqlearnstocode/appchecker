import { stripe } from './client';

/**
 * Create or get the verifications meter
 * This should be run once to set up the meter in Stripe
 */
export async function createVerificationsMeter() {
  try {
    // Check if meter already exists
    const meters = await stripe.billing.meters.list({
      limit: 100,
    });

    const existingMeter = meters.data.find(
      (m) => m.event_name === 'verification.created'
    );

    if (existingMeter) {
      console.log('Meter already exists:', existingMeter.id);
      return existingMeter;
    }

    // Create new meter
    const meter = await stripe.billing.meters.create({
      event_name: 'verification.created',
      display_name: 'Income Checkers',
      default_aggregation: {
        formula: 'sum',
      },
      value_settings: {
        event_payload_key: 'value',
      },
    });

    console.log('Created meter:', meter.id);
    return meter;
  } catch (error) {
    console.error('Error creating meter:', error);
    throw error;
  }
}

/**
 * Get meter ID from environment or create it
 */
export async function getMeterId(): Promise<string> {
  if (process.env.STRIPE_METER_ID) {
    return process.env.STRIPE_METER_ID;
  }

  // If not set, try to find existing meter
  const meters = await stripe.billing.meters.list({
    limit: 100,
  });

  const meter = meters.data.find(
    (m) => m.event_name === 'verification.created'
  );

  if (meter) {
    return meter.id;
  }

  throw new Error(
    'STRIPE_METER_ID not set and no existing meter found. Run createVerificationsMeter() first.'
  );
}
