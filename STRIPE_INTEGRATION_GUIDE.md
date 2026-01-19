# Stripe Integration & Usage Tracking Guide

This document explains how the Stripe payment integration and usage tracking works in the application, including all user flows from signup to verification creation.

## Overview

The system uses a **database-only usage ledger** to track verification consumption. Stripe handles billing and subscription management, while our database tracks usage limits and credit consumption. This eliminates external API calls for usage tracking and makes the system more reliable and deterministic.

## Core Concepts

### Payment Models

1. **Pay-as-You-Go (PAYG)**: $14.99 per verification, one-time payment
2. **Starter Subscription**: $59/month, 10 verifications per billing period
3. **Pro Subscription**: $129/month, 50 verifications per billing period

### Key Tables

- `users`: Stores `stripe_customer_id` linking user to Stripe customer
- `stripe_subscriptions`: Cache of active subscriptions (synced from Stripe webhooks)
- `one_time_payments`: Tracks PAYG payments ($14.99 each)
- `usage_ledger`: **Main tracking table** - records each verification consumption
- `income_verifications`: The actual verification records

---

## User Flows

### 1. New User Signup

**Flow:**
1. User signs up via Auth (Supabase Auth)
2. User record created in `users` table
3. **Stripe customer created immediately** (best effort):
   - Frontend calls `/api/stripe/create-customer` after successful signup
   - Uses `getOrCreateStripeCustomer()` which creates customer in Stripe
   - Customer ID saved to `users.stripe_customer_id`
   - **Note:** If Stripe customer creation fails, signup still succeeds (graceful degradation)
   - Customer will be created lazily on first payment/subscription if initial attempt failed

**Database State After Successful Signup:**
- `users.stripe_customer_id`: `'cus_...'` (created on signup)
- No subscription record
- No payments

**Why Create on Signup:**
- Better UX: Customer ready for immediate payments
- Consistent customer records in Stripe
- Easier tracking and support
- Prevents delays when user tries to pay

---

### 2. Creating First Verification (No Payment)

**Flow:**
1. User attempts to create verification
2. System checks for active subscription → None found
3. System checks for available PAYG payment → None found
4. **API returns 402 Payment Required**

**Response:**
```json
{
  "error": "Payment required",
  "requiresPayment": true,
  "paymentRequired": true,
  "message": "Please complete payment to create a verification."
}
```

**Next Steps:** User must either:
- Pay for one-time verification (PAYG)
- Subscribe to a plan (Starter or Pro)

---

### 3. Pay-as-You-Go (PAYG) Flow

#### Step 3a: User Clicks "Pay for One Verification"

**Flow:**
1. Frontend calls `/api/stripe/create-one-time-checkout`
2. **Stripe customer retrieved/created** (should already exist from signup, but fallback exists):
   - `getOrCreateStripeCustomer()` checks:
     - First: `stripe_subscriptions` table for existing customer
     - Then: `users.stripe_customer_id`
     - If not found: Creates new Stripe customer and saves to `users.stripe_customer_id` (fallback for edge cases)
3. **Payment record created** in `one_time_payments`:
   - `status`: `'pending'`
   - `user_id`: User ID
   - `amount`: 1499 (cents)
   - `stripe_checkout_session_id`: Session ID from Stripe
4. Stripe Checkout session created and user redirected

**Database State After:**
- `users.stripe_customer_id`: `'cus_...'` (created)
- `one_time_payments`: 1 record with `status = 'pending'`

#### Step 3b: User Completes Payment

**Webhook:** `checkout.session.completed`

**Flow:**
1. Webhook receives `checkout.session.completed` event
2. **Customer ID saved** to `users.stripe_customer_id` (if not already set)
3. **Payment record updated**:
   - `status`: `'pending'` → `'completed'`
   - `completed_at`: Timestamp set
   - `stripe_payment_intent_id`: Payment intent ID saved
4. Payment is now ready to use

**Database State:**
- `one_time_payments.status`: `'completed'`
- `one_time_payments.verification_id`: `NULL` (not used yet)

#### Step 3c: User Creates Verification with PAYG Payment

**Flow:**
1. User creates verification → `/api/verifications/create`
2. System finds available payment:
   ```sql
   SELECT * FROM one_time_payments
   WHERE user_id = ? 
     AND status = 'completed'
     AND verification_id IS NULL
   ORDER BY completed_at ASC
   LIMIT 1
   ```
3. **Verification created** in `income_verifications`
4. **Ledger entry created** in `usage_ledger`:
   - `source`: `'payg'`
   - `one_time_payment_id`: Payment ID
   - `verification_id`: New verification ID
   - `user_id`: User ID
5. **Payment marked as used**:
   - `one_time_payments.verification_id`: Set to verification ID
   - `one_time_payments.used_at`: Timestamp set
6. **Audit log created** in `audit_logs`

**Database State:**
- `income_verifications`: 1 record created
- `usage_ledger`: 1 entry with `source = 'payg'`
- `one_time_payments.verification_id`: Set (payment consumed)

#### Step 3d: User Cancels PAYG Verification

**Flow:**
1. User cancels verification (only allowed if status is `'pending'` or `'in_progress'`)
2. **Ledger entry reversed**:
   - `usage_ledger.reversed_at`: Timestamp set
   - `usage_ledger.reversal_reason`: `'verification_canceled'`
   - `usage_ledger.reversal_metadata`: Contains cancellation details
3. **Payment released** (can be reused):
   - `one_time_payments.verification_id`: Set back to `NULL`
   - `one_time_payments.used_at`: Set back to `NULL`
4. **Verification status updated**: `'pending'` → `'canceled'`
5. **Audit log created** with refund details

**Database State:**
- `usage_ledger.reversed_at`: Set (credit refunded)
- `one_time_payments.verification_id`: `NULL` (payment available again)
- `income_verifications.status`: `'canceled'`

**Result:** User can create a new verification using the same payment.

---

### 4. Subscription Flow

#### Step 4a: User Subscribes to Starter or Pro Plan

**Flow:**
1. User clicks "Subscribe" → `/api/stripe/create-checkout`
2. **Stripe customer retrieved** (should already exist from signup, but fallback creates if missing)
3. Stripe Checkout session created with:
   - `mode`: `'subscription'`
   - `price_id`: Starter or Pro recurring price
   - `metadata.user_id`: User ID (for webhook)
4. User redirected to Stripe Checkout

**Database State:**
- `users.stripe_customer_id`: `'cus_...'` (created if new)
- No subscription record yet (created by webhook)

#### Step 4b: User Completes Subscription

**Webhooks:**
1. `checkout.session.completed` → Saves customer ID
2. `customer.subscription.created` → Creates subscription record
3. `customer.subscription.updated` → Syncs subscription details

**Flow (`customer.subscription.created/updated`):**
1. Webhook receives subscription event
2. **Subscription record created/updated** in `stripe_subscriptions`:
   - `user_id`: User ID
   - `stripe_subscription_id`: Subscription ID from Stripe
   - `stripe_customer_id`: Customer ID
   - `stripe_price_id`: Price ID (Starter or Pro)
   - `status`: `'active'`, `'trialing'`, etc.
   - `plan_tier`: `'starter'` or `'pro'`
   - `current_period_start`: Start of billing period
   - `current_period_end`: End of billing period
3. **Customer ID saved** to `users.stripe_customer_id` (if not already)

**Database State:**
- `stripe_subscriptions`: 1 active subscription
- `users.stripe_customer_id`: Set
- `usage_ledger`: Empty (no verifications yet)

#### Step 4c: User Creates Verification with Subscription

**Flow:**
1. User creates verification → `/api/verifications/create`
2. **Active subscription found** via `getActiveSubscription()`
3. **Current usage checked** via `getCurrentPeriodUsage()`:
   ```sql
   SELECT COUNT(*) FROM usage_ledger
   WHERE user_id = ?
     AND source = 'subscription'
     AND stripe_subscription_id = ?
     AND period_start = current_period_start
     AND reversed_at IS NULL
   ```
4. **Limit checked**:
   - Starter: 10 verifications
   - Pro: 50 verifications
5. If usage >= limit → **403 Forbidden** (limit reached)
6. If usage < limit:
   - **Verification created** in `income_verifications`
   - **Ledger entry created** in `usage_ledger`:
     - `source`: `'subscription'`
     - `stripe_subscription_id`: Subscription ID
     - `period_start`: Current period start
     - `period_end`: Current period end
     - `verification_id`: New verification ID
   - **Audit log created**

**Database State:**
- `income_verifications`: 1 record
- `usage_ledger`: 1 entry with `source = 'subscription'`
- Usage count: 1/10 (Starter) or 1/50 (Pro)

#### Step 4d: User Hits Subscription Limit

**Flow:**
1. User tries to create verification
2. `getCurrentPeriodUsage()` returns count >= limit (10 or 50)
3. **API returns 403**:
   ```json
   {
     "error": "Verification limit reached",
     "limitReached": true,
     "currentUsage": 10,
     "limit": 10,
     "plan": "starter"
   }
   ```
4. User must either:
   - Wait for next billing period (usage resets)
   - Upgrade to higher tier (Pro = 50 limit)
   - Purchase one-time verification (PAYG)

#### Step 4e: Subscription Period Renewal

**Webhook:** `invoice.payment_succeeded` or `customer.subscription.updated`

**Flow:**
1. Stripe processes monthly payment
2. Subscription period advances
3. Webhook syncs new `current_period_start` and `current_period_end` to database
4. **Usage resets automatically**:
   - New period has `period_start = new_period_start`
   - Old period entries still in ledger (historical data)
   - Usage count query filters by new period dates

**Result:** User can create verifications again (0/X usage for new period)

#### Step 4f: User Cancels Subscription Verification

**Flow:**
1. User cancels verification (only if `'pending'` or `'in_progress'`)
2. **Ledger entry reversed**:
   - `usage_ledger.reversed_at`: Timestamp set
   - `usage_ledger.reversal_reason`: `'verification_canceled'`
   - `reversal_metadata`: Period info, original status, etc.
3. **Verification status**: `'pending'` → `'canceled'`
4. **Usage count decreases**: Now 9/10 instead of 10/10

**Note:** Payment is NOT refunded (subscription covers unlimited cancellations within period)

**Database State:**
- `usage_ledger.reversed_at`: Set
- Usage count: 9/10 (can create one more)

#### Step 4g: User Cancels Subscription

**Webhook:** `customer.subscription.deleted`

**Flow:**
1. Subscription status updated to `'canceled'` in database
2. **No verification limit** (subscription ended)
3. User becomes PAYG-only user

**Database State:**
- `stripe_subscriptions.status`: `'canceled'`
- No active subscription found
- Must use PAYG for future verifications

---

## Usage Tracking Details

### How Usage is Counted

**For Subscriptions:**
```sql
SELECT COUNT(*) FROM usage_ledger
WHERE user_id = ?
  AND source = 'subscription'
  AND stripe_subscription_id = ?
  AND period_start = current_period_start  -- Current billing period
  AND reversed_at IS NULL                  -- Exclude canceled verifications
```

**Key Points:**
- Only counts entries for **current billing period**
- **Excludes reversed** entries (canceled verifications don't count toward limit)
- Each verification = 1 entry in ledger
- Usage resets when period renews (new `period_start`)

**For PAYG:**
- Usage not counted per period
- Each payment = 1 verification
- Payments tracked separately in `one_time_payments`

### Ledger Entry Lifecycle

1. **Created**: When verification is created
   - `reversed_at`: `NULL`
   - Entry counts toward usage limit

2. **Reversed**: When verification is canceled
   - `reversed_at`: Timestamp set
   - `reversal_reason`: `'verification_canceled'`
   - Entry **does NOT count** toward usage limit

3. **Historical**: Entries from previous periods remain for audit trail

---

## Customer Management

### Customer Creation Strategy

**Function:** `getOrCreateStripeCustomer()`

**Lookup Order:**
1. Check `stripe_subscriptions` table (source of truth for subscribers)
2. Check `users.stripe_customer_id` (for PAYG users)
3. Verify customer exists in Stripe (handle deleted customers)
4. If not found: Create new customer and save to `users` table

**Why This Order:**
- Subscriptions table is most reliable (synced from webhooks)
- Users table needed for PAYG users without subscriptions
- Prevents creating duplicate customers

---

## Webhook Events

### Critical Webhooks

1. **`checkout.session.completed`**
   - Saves customer ID to `users` table
   - For PAYG: Marks payment as `'completed'`

2. **`customer.subscription.created`**
   - Creates subscription record in database

3. **`customer.subscription.updated`**
   - Syncs subscription status and period dates
   - **Critical for usage tracking** (period dates determine usage period)

4. **`customer.subscription.deleted`**
   - Updates subscription status to `'canceled'`

5. **`invoice.payment_succeeded`**
   - Payment processed (handled by subscription update)

6. **`invoice.payment_failed`**
   - Updates subscription status to `'past_due'`

---

## Migration from Meter System

### What Changed

**Old System:**
- Used Stripe billing meters
- Reported usage via `stripe.billing.meterEvents.create()`
- Tracked in `meter_events` table

**New System:**
- Database-only tracking via `usage_ledger`
- No external API calls for usage tracking
- More reliable, deterministic, faster

### Impact on Existing Users

**Existing Subscriptions:**
- ✅ Still active and working
- ✅ Subscription limits still enforced
- ✅ Usage count starts at 0 (fresh start with new system)
- ✅ New verifications tracked correctly going forward

**Existing Payments:**
- ✅ PAYG payments still work
- ✅ Completed payments still usable

**No Data Loss:**
- Old `meter_events` table preserved (reference only)
- All subscriptions still active
- All payments still valid

---

## Common Scenarios

### Scenario 1: User with Both Subscription and PAYG Payment

**Flow:**
1. User has active Starter subscription (5/10 used)
2. User purchases one-time verification
3. **Subscription takes priority** - verification uses subscription credit
4. PAYG payment remains unused (available for later)

**Logic:** Subscription checked first, PAYG only if no subscription

### Scenario 2: User Upgrades Mid-Period

**Flow:**
1. User has Starter subscription (10/10 used - limit reached)
2. User upgrades to Pro
3. Webhook updates subscription: `plan_tier = 'pro'`
4. Limit immediately increases to 50
5. User can create 40 more verifications this period

**Note:** Usage doesn't reset, only limit increases

### Scenario 3: User Cancels Verification After Period Ends

**Flow:**
1. User canceled verification in previous period
2. Ledger entry has old `period_start`
3. Current usage query filters by **current** `period_start`
4. Canceled verification doesn't affect current period usage

**Result:** Each period is independent

---

## API Endpoints

### Verification Creation
- **Endpoint:** `POST /api/verifications/create`
- **Checks:** Subscription status, usage limits, available payments
- **Creates:** Verification + Ledger entry + Audit log

### Subscription Status
- **Endpoint:** `GET /api/stripe/subscription-status`
- **Returns:** Subscription info, current usage, limits, period dates

### Cancel Verification
- **Endpoint:** `DELETE /api/verifications/delete`
- **Checks:** Status (only `'pending'` or `'in_progress'` allowed)
- **Actions:** Reverses ledger entry, releases payment (if PAYG), updates status to `'canceled'`

---

## Summary

The system provides a clean, database-driven approach to tracking verification usage:

- **Stripe handles**: Billing, subscriptions, payments
- **Database handles**: Usage limits, credit tracking, cancellation
- **Benefits**: Fast, reliable, deterministic, easy to audit

All user flows are supported:
- ✅ New users → PAYG customers
- ✅ PAYG customers → Subscription customers
- ✅ Subscription usage tracking with period boundaries
- ✅ Verification cancellation with credit refunds
- ✅ Mixed scenarios (subscription + PAYG)

The usage ledger provides a complete audit trail of where every credit goes and when it's consumed or refunded.
