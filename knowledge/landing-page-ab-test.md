# Landing Page A/B Test Plan

*Income Checker - Informational vs. Interactive Landing Page*
*Last updated: 2026-01-28*

---

## Test Overview

**Hypothesis:** An interactive, "get-started" landing page that lets visitors experience the product before signing up will convert at a higher rate than a traditional informational page that explains features and benefits.

**Test Name:** `landing_page_v1`
**Duration:** 4-6 weeks (or until statistical significance)
**Traffic Split:** 50/50

---

## 1. Variant Definitions

### Variant A: Informational Landing Page (Control)

The traditional SaaS landing page approach: explain what the product does, build trust, then ask for signup.

#### Wireframe / Section Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│  NAVBAR: Logo | How It Works | Pricing | FAQ | Sign In     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HERO SECTION                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Headline: Stop Chasing Pay Stubs.                   │   │
│  │           Get Income Data in Minutes.               │   │
│  │                                                     │   │
│  │ Subhead: Applicants connect their bank via Plaid.   │   │
│  │          You get a detailed income report.          │   │
│  │          No paperwork. No waiting.                  │   │
│  │                                                     │   │
│  │ [Get Started - It's Free to Try]  [See Sample Report]│  │
│  │                                                     │   │
│  │ Trust: "10,000+ verifications" | "256-bit encryption"│  │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  PROBLEM SECTION                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Headline: The Old Way is Broken                     │   │
│  │                                                     │   │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │ │ Problem 1│ │ Problem 2│ │ Problem 3│            │   │
│  │ │ Fake pay │ │ Days of  │ │ Manual   │            │   │
│  │ │ stubs    │ │ back and │ │ review   │            │   │
│  │ │          │ │ forth    │ │ errors   │            │   │
│  │ └──────────┘ └──────────┘ └──────────┘            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  HOW IT WORKS SECTION                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3-Step Visual Process                               │   │
│  │                                                     │   │
│  │ 1. Invite Applicant → 2. They Connect Bank →       │   │
│  │    3. Get Report in Minutes                         │   │
│  │                                                     │   │
│  │ [Animated or static illustration]                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  SAMPLE REPORT PREVIEW                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Screenshot of actual report with fake data          │   │
│  │ Callouts: "Monthly income trends"                   │   │
│  │           "Account balance history"                 │   │
│  │           "Transaction categories"                  │   │
│  │                                                     │   │
│  │ [View Full Sample Report]                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  TRUST/SECURITY SECTION                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Bank-Level Security"                               │   │
│  │                                                     │   │
│  │ - Powered by Plaid (trusted by Venmo, Robinhood)   │   │
│  │ - We never see login credentials                   │   │
│  │ - 256-bit encryption                               │   │
│  │ - SOC 2 compliance (Plaid)                         │   │
│  │                                                     │   │
│  │ [Plaid logo] [Security badges]                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  PRICING SECTION                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Simple, Transparent Pricing                         │   │
│  │                                                     │   │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐              │   │
│  │ │ Pay Per │ │ Starter │ │ Pro     │              │   │
│  │ │ $14.99  │ │ $59/mo  │ │ $129/mo │              │   │
│  │ │ 1 check │ │ 10/mo   │ │ 50/mo   │              │   │
│  │ └─────────┘ └─────────┘ └─────────┘              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FAQ SECTION                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - What banks are supported?                         │   │
│  │ - How long does verification take?                  │   │
│  │ - Is this a credit check?                          │   │
│  │ - What if my applicant refuses?                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FINAL CTA SECTION                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Ready to Stop Guessing About Income?                │   │
│  │                                                     │   │
│  │ [Start Your First Verification - Free]             │   │
│  │                                                     │   │
│  │ "No credit card required for first verification"   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER                                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Copy Structure

**Hero:**
- Headline: "Stop Chasing Pay Stubs. Get Income Data in Minutes."
- Subhead: "Applicants connect their bank securely via Plaid. You get a detailed income report. No paperwork. No employer verification. No waiting."
- Primary CTA: "Get Started - It's Free to Try"
- Secondary CTA: "See Sample Report"

**Problem Section:**
- Headline: "Income Verification is Broken"
- Pain Point 1: "Fake Documents" - "Pay stubs are easy to forge. You can't trust what you can't verify."
- Pain Point 2: "Endless Back-and-Forth" - "Requesting documents, waiting for responses, asking for more... it takes days."
- Pain Point 3: "Manual Review Errors" - "Scanning through bank statements is tedious and error-prone."

**How It Works:**
- Step 1: "Send an Invite" - "Enter applicant email. They get a secure link."
- Step 2: "Applicant Connects Bank" - "They log in via Plaid. Takes 2 minutes. You never see their credentials."
- Step 3: "Get Your Report" - "Income analysis delivered instantly. PDF export available."

**Trust Elements:**
- "Powered by Plaid" badge
- "256-bit encryption" badge
- "We never store bank credentials"
- "Trusted by 10,000+ landlords" (once you have this data)

**CTAs:**
- Hero: "Get Started - It's Free to Try" (links to signup)
- Mid-page: "View Sample Report" (links to /report/example)
- Final: "Start Your First Verification - Free"

---

### Variant B: Interactive / Get-Started Landing Page

A "product-first" approach: let visitors experience the product immediately, reducing the distance between landing and conversion.

#### What "Interactive" Means for Income Checker

Since you cannot demo a bank connection without real credentials, "interactive" means:

1. **Instant Demo Flow** - Walk through the verification process with simulated data
2. **Calculator/Estimator** - "How many verifications do you do per month?" -> personalized pricing
3. **Sample Report Deep-Dive** - Interactive report exploration with tooltips explaining each section
4. **Email Capture + Instant Value** - Get their email, immediately show them something useful

**Recommended Approach:** Combine a "Try the Demo" flow with an inline sample report explorer.

#### Wireframe / Section Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│  NAVBAR: Logo | Pricing | Sign In                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HERO SECTION (Compact)                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Headline: See What Your Applicants Really Earn      │   │
│  │                                                     │   │
│  │ Subhead: Try it now. No signup required.            │   │
│  │                                                     │   │
│  │ [START DEMO →]                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  INTERACTIVE DEMO SECTION (Primary Focus)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │  STEP INDICATOR: [1] → [2] → [3]              │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  STEP 1: Enter Applicant Email                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │  "In your workflow, you'd enter your          │ │   │
│  │  │   applicant's email here."                    │ │   │
│  │  │                                               │ │   │
│  │  │  [demo@example.com] (pre-filled, disabled)    │ │   │
│  │  │                                               │ │   │
│  │  │  [Continue →]                                 │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  STEP 2: Applicant Receives Link (Simulated)       │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │  [Email mockup showing what applicant sees]   │ │   │
│  │  │                                               │ │   │
│  │  │  "Your applicant clicks the secure link       │ │   │
│  │  │   and connects their bank via Plaid."         │ │   │
│  │  │                                               │ │   │
│  │  │  [Plaid UI mockup - bank selection]           │ │   │
│  │  │                                               │ │   │
│  │  │  [See The Report →]                           │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  STEP 3: You Get The Report (Interactive)          │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │  [FULL INTERACTIVE SAMPLE REPORT]             │ │   │
│  │  │                                               │ │   │
│  │  │  - Click income sources for details           │ │   │
│  │  │  - Hover over transactions                    │ │   │
│  │  │  - Toggle between views                       │ │   │
│  │  │                                               │ │   │
│  │  │  Sticky CTA: [Send Your First Real Invite]    │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  SOCIAL PROOF BAR (Compact)                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Powered by Plaid" | "Bank-level security" |        │   │
│  │ "No credit check" | "$14.99/verification"           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  SIGNUP SECTION (Appears after demo completion)             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Ready to verify real applicants?"                  │   │
│  │                                                     │   │
│  │ Email: [________________]                           │   │
│  │                                                     │   │
│  │ [Create Free Account]  or  [Sign in with Google]   │   │
│  │                                                     │   │
│  │ "First verification is on us. No card required."   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  MINIMAL FOOTER                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Key Differences from Variant A

| Aspect | Variant A (Informational) | Variant B (Interactive) |
|--------|--------------------------|------------------------|
| Primary Action | "Get Started" (to signup) | "Start Demo" (no signup) |
| Page Length | Long-form (~6-8 sections) | Focused (~3-4 sections) |
| Copy Weight | Heavy - explains everything | Light - shows everything |
| Trust Building | Dedicated trust section | Inline during demo |
| Pricing | Full pricing table | Brief mention + link |
| Time to Value | After signup | Immediate |

#### "Try Before You Buy" Experience

The demo flow should:

1. **Require zero signup** - Start immediately on button click
2. **Mirror real workflow** - Same steps, but simulated
3. **Show real data format** - Use realistic (but obviously fake) sample data
4. **Gate lightly** - Ask for email only after they've seen the report
5. **Track engagement** - Which demo steps do they complete?

**Sample Data for Demo:**
- Applicant: "Alex Johnson"
- Monthly income: $4,850 (realistic, not perfect round number)
- Income sources: Direct deposits from "Midwest Distribution Co."
- Bank: "Chase" or generic
- Transactions: Mix of payroll, transfers, typical expenses

---

## 2. Technical Implementation

### File Structure

```
app/
├── (public)/
│   ├── landing/
│   │   ├── page.tsx              # Variant router (checks cookie, serves A or B)
│   │   ├── variant-a/
│   │   │   └── page.tsx          # Informational variant
│   │   ├── variant-b/
│   │   │   └── page.tsx          # Interactive variant
│   │   └── components/
│   │       ├── DemoFlow.tsx      # Interactive demo for Variant B
│   │       └── SampleReportExplorer.tsx
├── middleware.ts                  # A/B assignment logic
```

### Middleware-Based Traffic Splitting

Update `middleware.ts` to handle A/B assignment:

```typescript
// middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

const AB_TEST_COOKIE = 'ab_landing_v1';
const VARIANTS = ['a', 'b'] as const;

function getRandomVariant(): 'a' | 'b' {
  return Math.random() < 0.5 ? 'a' : 'b';
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Only run A/B logic for landing page
  if (request.nextUrl.pathname === '/landing' || request.nextUrl.pathname === '/') {
    let variant = request.cookies.get(AB_TEST_COOKIE)?.value as 'a' | 'b' | undefined;

    // Assign variant if not already assigned
    if (!variant || !VARIANTS.includes(variant)) {
      variant = getRandomVariant();
    }

    // Set cookie on response (30 days expiry)
    response.cookies.set(AB_TEST_COOKIE, variant, {
      httpOnly: false, // Allow client-side reading for analytics
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Rewrite to appropriate variant
    const url = request.nextUrl.clone();
    url.pathname = `/landing/variant-${variant}`;

    return NextResponse.rewrite(url, {
      headers: response.headers,
    });
  }

  return response;
}
```

### Landing Page Router Component

```typescript
// app/(public)/landing/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  // Middleware handles routing, but this is a fallback
  const cookieStore = await cookies();
  const variant = cookieStore.get('ab_landing_v1')?.value || 'a';

  // This shouldn't be reached if middleware is working
  redirect(`/landing/variant-${variant}`);
}
```

### Cookie/Session Handling

```typescript
// utils/ab-testing.ts

export const AB_TESTS = {
  landing_v1: {
    name: 'landing_page_v1',
    cookieName: 'ab_landing_v1',
    variants: ['a', 'b'] as const,
    startDate: '2026-01-28',
    endDate: null, // Set when test concludes
  },
} as const;

/**
 * Get current variant for a user (client-side)
 */
export function getVariant(testName: keyof typeof AB_TESTS): string | null {
  if (typeof document === 'undefined') return null;

  const test = AB_TESTS[testName];
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === test.cookieName) {
      return value;
    }
  }

  return null;
}

/**
 * Get variant from server-side cookies
 */
export function getVariantFromCookies(
  cookieStore: { get: (name: string) => { value: string } | undefined },
  testName: keyof typeof AB_TESTS
): string | null {
  const test = AB_TESTS[testName];
  return cookieStore.get(test.cookieName)?.value || null;
}
```

### Tracking Variant Through Conversion

Every important action should include the variant:

```typescript
// utils/analytics.ts - Updated

export const analytics = {
  // ... existing methods

  // A/B Test tracking
  abTestExposure: (testName: string, variant: string) =>
    trackEvent('ab_test_exposure', {
      test_name: testName,
      variant,
      timestamp: new Date().toISOString(),
    }),

  abTestConversion: (testName: string, variant: string, conversionType: string) =>
    trackEvent('ab_test_conversion', {
      test_name: testName,
      variant,
      conversion_type: conversionType,
    }),
};
```

### Supabase Event Logging (Optional but Recommended)

Create a table for A/B test events:

```sql
-- supabase/migrations/YYYYMMDD_ab_test_events.sql

CREATE TABLE ab_test_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  test_name TEXT NOT NULL,
  variant TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'exposure', 'click', 'signup', 'conversion'
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT, -- Anonymous session tracking
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT
);

-- Index for efficient querying
CREATE INDEX idx_ab_test_events_test_variant
ON ab_test_events(test_name, variant, event_type);

CREATE INDEX idx_ab_test_events_created_at
ON ab_test_events(created_at);
```

Server-side logging function:

```typescript
// lib/ab-testing.ts

import { createClient } from '@/utils/supabase/server';

export async function logAbTestEvent(params: {
  testName: string;
  variant: string;
  eventType: 'exposure' | 'cta_click' | 'signup_start' | 'signup_complete' | 'first_verification';
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) return;

    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

    await supabaseAdmin.from('ab_test_events').insert({
      test_name: params.testName,
      variant: params.variant,
      event_type: params.eventType,
      user_id: params.userId || null,
      session_id: params.sessionId || null,
      metadata: params.metadata || {},
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    });
  } catch (error) {
    console.error('Failed to log A/B test event:', error);
  }
}
```

---

## 3. Metrics to Track

### Primary Metric (North Star)

**Signup Completion Rate**
- Definition: Visitors who complete account creation / Total unique visitors exposed to variant
- Why: Direct measure of landing page effectiveness
- Target: 3-5% baseline, looking for 20%+ relative improvement

### Secondary Metrics

| Metric | Definition | Tracking Method | Why It Matters |
|--------|------------|-----------------|----------------|
| **CTA Click Rate** | Clicks on primary CTA / Exposures | GA4 event | Measures initial interest |
| **Demo Completion Rate** (Variant B) | Completed all demo steps / Started demo | GA4 events | Is interactive experience engaging? |
| **Sample Report Views** | Views of sample report / Exposures | GA4 event | Content engagement |
| **Signup Start Rate** | Started signup / Exposures | GA4 event | Mid-funnel engagement |
| **Time on Page** | Avg session duration on landing | GA4 | Engagement depth |
| **Bounce Rate** | Single-page sessions / Total sessions | GA4 | Page relevance |
| **First Verification Rate** | Completed first verification / Signups | Supabase | True conversion quality |
| **Paid Conversion Rate** | Made first payment / Signups | Stripe + Supabase | Revenue quality |

### Tracking Implementation

**GA4 Events to Configure:**

```typescript
// Track on each variant page load
analytics.abTestExposure('landing_page_v1', variant);

// Track CTA clicks
analytics.ctaClicked({
  cta_name: 'hero_get_started',
  location: 'landing_hero',
  ab_variant: variant
});

// Track demo progress (Variant B)
analytics.demoStepCompleted({ step: 1, variant });
analytics.demoStepCompleted({ step: 2, variant });
analytics.demoStepCompleted({ step: 3, variant });

// Track signup initiation
analytics.signupStarted({ source: 'landing', variant });

// Track signup completion (in auth callback)
analytics.abTestConversion('landing_page_v1', variant, 'signup_complete');
```

### Sample Size Calculation

**Assumptions:**
- Baseline conversion rate: 3%
- Minimum detectable effect: 25% relative improvement (3% → 3.75%)
- Statistical significance: 95% (p < 0.05)
- Statistical power: 80%

**Required Sample Size:**

Using standard sample size formula:
- ~5,500 visitors per variant
- **Total: ~11,000 visitors**

**Timeline Estimate:**
- If landing page gets 500 visitors/week: ~22 weeks (too long)
- If landing page gets 2,000 visitors/week: ~5.5 weeks (acceptable)
- If landing page gets 5,000 visitors/week: ~2.2 weeks (ideal)

**Recommendation:** Run for minimum 4 weeks regardless of sample size to account for day-of-week effects and visitor quality variations.

### When to Stop the Test

**Stop conditions:**
1. Statistical significance reached (p < 0.05) AND minimum 4 weeks elapsed
2. Maximum duration (8 weeks) reached regardless of significance
3. One variant is clearly harmful (>30% worse with p < 0.01) - stop early

**Analysis SQL Query:**

```sql
-- Conversion rate by variant
SELECT
  variant,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'exposure') as exposures,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'signup_complete') as signups,
  ROUND(
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'signup_complete')::numeric /
    NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'exposure'), 0) * 100,
    2
  ) as conversion_rate
FROM ab_test_events
WHERE test_name = 'landing_page_v1'
  AND created_at >= '2026-01-28'
GROUP BY variant
ORDER BY variant;
```

---

## 4. Hypothesis

### What We Expect to Happen

**Primary Hypothesis:**
Variant B (Interactive) will have a **higher signup rate** than Variant A (Informational) because:

1. **Reduced cognitive load** - Showing beats telling; visitors understand the product faster
2. **Reciprocity principle** - We give value (demo) before asking for anything
3. **Commitment escalation** - Each demo step is a micro-commitment toward signup
4. **Self-discovery** - Visitors who "figure it out themselves" have higher intent

**Expected Outcome:** Variant B signup rate 15-30% higher than Variant A

### Counter-Hypothesis (Why Variant A Might Win)

1. **Information asymmetry** - B2B buyers need details to justify purchase to stakeholders
2. **Trust gap** - Without explaining security/compliance, visitors may hesitate
3. **Demo fatigue** - If demo is too long, drop-off could exceed Variant A bounce
4. **Wrong audience** - Property managers may prefer scanning info to clicking through steps

**Expected Outcome if A Wins:** Variant A signup rate 10-20% higher, with Variant B having higher bounce rate

### Downstream Effects to Monitor

Even if Variant B has higher signup rate, watch for:
- **Lower first-verification rate** - Signups may be lower quality
- **Higher churn** - Users may not understand product value
- **Support ticket increase** - Less informed users may have more questions

**Quality Check:** Compare 30-day retention and first-verification rate between variants, not just signup.

### When to Call the Test

| Condition | Action |
|-----------|--------|
| Variant B wins signup by 20%+ with p < 0.05, AND first-verification rate is equal or better | **Declare B winner, roll out** |
| Variant A wins signup by 20%+ with p < 0.05 | **Declare A winner, optimize A** |
| No significant difference after 8 weeks | **Declare tie, pick B for innovation** |
| Variant B wins signup but first-verification rate is 20%+ worse | **Run follow-up test with modified B** |

---

## 5. Implementation Checklist

### Phase 1: Foundation (Days 1-3)

- [ ] **Create database migration** for `ab_test_events` table
- [ ] **Create `utils/ab-testing.ts`** with variant assignment and tracking utilities
- [ ] **Update `middleware.ts`** with A/B routing logic
- [ ] **Update `utils/analytics.ts`** with A/B-specific events
- [ ] **Create folder structure** for landing variants
- [ ] **Set up GA4 custom dimensions** for `ab_variant`

### Phase 2: Variant A - Informational (Days 4-7)

- [ ] **Build hero section** with headline, subhead, dual CTAs
- [ ] **Build problem section** with 3-column pain points
- [ ] **Build how-it-works section** with 3-step visual
- [ ] **Build sample report preview** section
- [ ] **Build trust/security section** with badges
- [ ] **Build pricing section** (can reuse existing component)
- [ ] **Build FAQ section** (can reuse existing component)
- [ ] **Build final CTA section**
- [ ] **Add all tracking events** to Variant A

### Phase 3: Variant B - Interactive (Days 8-14)

- [ ] **Build compact hero** with "Start Demo" CTA
- [ ] **Build DemoFlow component** with step indicator
- [ ] **Build Step 1: Email input** (simulated)
- [ ] **Build Step 2: Applicant experience mockup** (email preview, Plaid mockup)
- [ ] **Build Step 3: Interactive sample report** explorer
- [ ] **Build social proof bar** (compact trust elements)
- [ ] **Build signup section** (appears after demo completion)
- [ ] **Implement step tracking** - which steps are completed
- [ ] **Add all tracking events** to Variant B

### Phase 4: Integration & Testing (Days 15-17)

- [ ] **Test variant assignment** - verify 50/50 split
- [ ] **Test cookie persistence** - same user sees same variant
- [ ] **Test cross-device** - mobile/desktop rendering
- [ ] **Test analytics firing** - all events logged correctly
- [ ] **Test Supabase logging** - events appearing in table
- [ ] **QA both variants** end-to-end
- [ ] **Load test** middleware performance

### Phase 5: Launch & Monitor (Day 18+)

- [ ] **Deploy to production**
- [ ] **Verify traffic splitting** in production
- [ ] **Set up daily monitoring** dashboard/query
- [ ] **Configure alerts** for significant drop in either variant
- [ ] **Document decision criteria** for team
- [ ] **Schedule weekly review** meetings

### Build Priority Order

If time-constrained, build in this order:

1. **Middleware + routing** (required for test to work)
2. **Variant A hero + CTA** (minimum viable control)
3. **Variant B hero + demo step 1** (minimum viable treatment)
4. **Analytics integration** (required to measure)
5. **Full Variant A sections** (complete control)
6. **Full Variant B demo flow** (complete treatment)
7. **Supabase event logging** (nice-to-have backup)

---

## Appendix: Sample Report Data for Demo

Use this consistent sample data across the demo:

```typescript
// data/demo-applicant.ts

export const demoApplicant = {
  name: 'Alex M. Johnson',
  email: 'demo@example.com',
  reportDate: '2026-01-25',

  accounts: [
    {
      institution: 'Chase',
      type: 'Checking',
      mask: '4823',
      currentBalance: 3_842.67,
    },
    {
      institution: 'Chase',
      type: 'Savings',
      mask: '9102',
      currentBalance: 8_215.43,
    },
  ],

  incomeAnalysis: {
    monthlyAverage: 4_847.92,
    annualizedEstimate: 58_175.04,
    consistency: 'High',
    primarySource: 'Midwest Distribution Co.',
    incomeSources: [
      {
        name: 'Midwest Distribution Co.',
        type: 'Payroll',
        frequency: 'Bi-weekly',
        averageAmount: 2_423.96,
        confidence: 'High',
      },
    ],
  },

  recentTransactions: [
    { date: '2026-01-15', description: 'MIDWEST DISTRIBUTION PAYROLL', amount: 2_423.96, type: 'income' },
    { date: '2026-01-12', description: 'TRANSFER TO SAVINGS', amount: -500.00, type: 'transfer' },
    { date: '2026-01-10', description: 'SPOTIFY', amount: -15.99, type: 'expense' },
    { date: '2026-01-08', description: 'WHOLE FOODS', amount: -127.43, type: 'expense' },
    { date: '2026-01-01', description: 'MIDWEST DISTRIBUTION PAYROLL', amount: 2_423.96, type: 'income' },
    // ... more transactions
  ],
};
```

---

## Appendix: GA4 Configuration

### Custom Dimensions to Create

1. **ab_variant** (event-scoped) - The variant shown to user
2. **ab_test_name** (event-scoped) - The name of the A/B test

### Key Events to Configure

| Event Name | Parameters | Trigger |
|------------|------------|---------|
| `ab_test_exposure` | test_name, variant | Page view on landing |
| `landing_cta_click` | cta_name, variant | Any CTA click |
| `demo_step_complete` | step_number, variant | Demo step completion (B only) |
| `demo_complete` | variant | All demo steps finished |
| `signup_initiated` | source, variant | Signup form shown |
| `signup_completed` | source, variant | Account created |
| `first_verification` | variant | First verification completed |

### Funnel Configuration

Create a funnel in GA4:
1. `ab_test_exposure` (variant = b)
2. `demo_step_complete` (step = 1)
3. `demo_step_complete` (step = 2)
4. `demo_step_complete` (step = 3)
5. `signup_initiated`
6. `signup_completed`

---

*This document should be updated as the test progresses and results come in.*
