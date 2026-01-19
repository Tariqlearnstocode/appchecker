import { stripe } from './client';

/**
 * Create products and prices in Stripe
 * This should be run once to set up pricing
 */
export async function setupProductsAndPrices() {
  try {
    // Create or get product
    const productSearch = await stripe.products.search({
      query: 'name:"IncomeChecker.com"',
    });

    let productId: string;
    if (productSearch.data.length === 0) {
      const newProduct = await stripe.products.create({
        name: 'IncomeChecker.com',
        description: 'Bank-verified income verification service',
      });
      productId = newProduct.id;
    } else {
      productId = productSearch.data[0].id;
    }
    console.log('Product ID:', productId);

    // Create prices
    const prices = {
      payAsYouGo: null as any,
      starterRecurring: null as any,
      proRecurring: null as any,
    };

    // Pay-as-you-go (one-time)
    const payAsYouGoPrice = await stripe.prices.create({
      product: productId,
      unit_amount: 1499, // $14.99
      currency: 'usd',
      metadata: {
        type: 'pay_as_you_go',
      },
    });
    prices.payAsYouGo = payAsYouGoPrice;
    console.log('Pay-as-you-go price:', payAsYouGoPrice.id);

    // Starter recurring ($59/mo)
    const starterRecurring = await stripe.prices.create({
      product: productId,
      unit_amount: 5900, // $59.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        type: 'starter_recurring',
        included_quantity: '10',
      },
    });
    prices.starterRecurring = starterRecurring;
    console.log('Starter recurring price:', starterRecurring.id);

    // Pro recurring ($129/mo)
    const proRecurring = await stripe.prices.create({
      product: productId,
      unit_amount: 12900, // $129.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        type: 'pro_recurring',
        included_quantity: '50',
      },
    });
    prices.proRecurring = proRecurring;
    console.log('Pro recurring price:', proRecurring.id);

    return {
      productId,
      prices,
    };
  } catch (error) {
    console.error('Error setting up products and prices:', error);
    throw error;
  }
}

/**
 * Get price IDs from environment variables
 */
export function getPriceIds() {
  return {
    payAsYouGo: process.env.STRIPE_PRICE_PAY_AS_YOU_GO,
    starterRecurring: process.env.STRIPE_PRICE_STARTER_RECURRING,
    proRecurring: process.env.STRIPE_PRICE_PRO_RECURRING,
  };
}

/**
 * Validate that all required price IDs are set
 */
export function validatePriceIds() {
  const prices = getPriceIds();
  const missing: string[] = [];

  if (!prices.payAsYouGo) missing.push('STRIPE_PRICE_PAY_AS_YOU_GO');
  if (!prices.starterRecurring) missing.push('STRIPE_PRICE_STARTER_RECURRING');
  if (!prices.proRecurring) missing.push('STRIPE_PRICE_PRO_RECURRING');

  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe price IDs: ${missing.join(', ')}`
    );
  }

  return prices;
}
