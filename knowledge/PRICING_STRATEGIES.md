# Income Checker - Pricing Strategy Analysis

*Last updated: 2026-01-28*

## Current Pricing Summary

| Plan | Price | Included | Effective Cost/Verification |
|------|-------|----------|----------------------------|
| Per Verification | $14.99 | 1 | $14.99 |
| Starter | $59/mo | 10 | $5.90 |
| Pro | $129/mo | 50 | $2.58 |
| Enterprise | Custom | Custom | Custom |

**Internal cost:** ~$0.30/verification (Plaid)
**Gross margin:** 88-98% depending on tier

---

## Analysis of Current Pricing

### Strengths
- Clear good-better-best structure
- Strong value metric (per verification)
- Significant discount incentive for subscriptions
- Competitive vs. traditional screening ($30-50)

### Potential Issues
1. **Large gap between tiers** - Jump from 10 → 50 verifications is 5x
2. **Starter may be too small** - 10/month only fits very small landlords
3. **No free tier or trial** - Barrier to entry for skeptical buyers
4. **Pay-as-you-go lacks features** - May feel like second-class experience
5. **Pro might be overkill** - 50/month is a lot for small PMs

---

## Alternative Pricing Strategies

### Strategy A: Lower Entry Point (Freemium)

**Philosophy:** Remove all barriers to first verification. Convert based on value.

| Plan | Price | Included | Best For |
|------|-------|----------|----------|
| **Free** | $0 | 1 verification/month | Try it out |
| **Starter** | $29/mo | 5 verifications | Solo landlords |
| **Growth** | $79/mo | 25 verifications | Small PMs |
| **Pro** | $149/mo | 75 verifications | Growing PMs |
| **Enterprise** | Custom | Unlimited | Large orgs |

**Overage:** $9.99/verification across all tiers

**Pros:**
- Free tier drives awareness and word-of-mouth
- Lower entry point ($29) captures price-sensitive landlords
- More gradual tier progression

**Cons:**
- Free tier may attract non-converters
- Lower initial revenue per customer
- Support burden for free users

**Best if:** You're optimizing for growth and market share

---

### Strategy B: Usage-Based (Pay As You Grow)

**Philosophy:** Price scales exactly with value delivered. No commitment anxiety.

| Tier | Monthly Fee | Per Verification | Volume Discounts |
|------|-------------|------------------|------------------|
| **Basic** | $0 | $14.99 | None |
| **Pro** | $19/mo | $9.99 | First 5 free with subscription |
| **Business** | $49/mo | $6.99 | First 10 free with subscription |
| **Enterprise** | $99/mo | $4.99 | First 25 free with subscription |

**Example costs:**
- 3 verifications/month: $44.97 (Basic) or $19 + $0 = $19 (Pro)
- 15 verifications/month: $224.85 (Basic) or $49 + $34.95 = $83.95 (Business)
- 40 verifications/month: $599.60 (Basic) or $99 + $74.85 = $173.85 (Enterprise)

**Pros:**
- True pay-for-what-you-use model
- No "wasted" credits
- Easy to start, scales naturally
- Appeals to variable-volume users

**Cons:**
- Less predictable revenue
- More complex to explain
- No incentive to commit upfront

**Best if:** Your customers have highly variable verification volume

---

### Strategy C: Per-Unit Pricing (Property-Based)

**Philosophy:** Charge based on portfolio size, not verification volume.

| Plan | Price | Properties | Verifications |
|------|-------|------------|---------------|
| **Landlord** | $19/mo | 1-5 properties | Unlimited |
| **Investor** | $49/mo | 6-20 properties | Unlimited |
| **Manager** | $99/mo | 21-50 properties | Unlimited |
| **Portfolio** | $199/mo | 51-150 properties | Unlimited |
| **Enterprise** | Custom | 150+ | Unlimited |

**Pros:**
- Simple mental model for landlords
- Predictable for both parties
- No verification anxiety
- Scales with customer's business

**Cons:**
- Harder to verify property count
- High-turnover properties subsidize low-turnover
- May leave money on table with heavy users

**Best if:** Your customers think in terms of portfolio size, not verification count

---

### Strategy D: Annual-First with Monthly Premium

**Philosophy:** Optimize for annual commitments with significant savings.

| Plan | Annual (save 25%) | Monthly | Verifications |
|------|-------------------|---------|---------------|
| **Starter** | $399/yr ($33/mo) | $49/mo | 10/month |
| **Pro** | $899/yr ($75/mo) | $99/mo | 30/month |
| **Business** | $1,499/yr ($125/mo) | $169/mo | 60/month |
| **Enterprise** | Custom | Custom | Custom |

**Overage:** $7.99/verification

**Pros:**
- Better cash flow (annual prepay)
- Lower churn (commitment)
- 25% savings is compelling
- Simpler forecasting

**Cons:**
- Higher upfront ask
- May slow initial adoption
- Requires trust before commitment

**Best if:** You're confident in product-market fit and want predictable revenue

---

### Strategy E: Flat Rate Simplicity

**Philosophy:** One simple price. No tiers, no confusion.

| Plan | Price | Included |
|------|-------|----------|
| **Income Checker** | $99/mo | 30 verifications, all features |

**Overage:** $5.99/verification

**One price includes:**
- All current and future features
- 12-month transaction history
- Email to applicants
- Reminders
- Multi-user access
- PDF exports
- Priority support

**Pros:**
- Dead simple to understand
- No decision paralysis
- Easy to sell
- Differentiates from complex competitors

**Cons:**
- Leaves money on table with heavy users
- May be too expensive for very small landlords
- No expansion revenue path

**Best if:** You want maximum simplicity and your ideal customer does ~20-40/month

---

### Strategy F: Vertical Tiers (By Customer Type)

**Philosophy:** Name tiers by customer segment, not arbitrary labels.

| Plan | Price | Verifications | Target |
|------|-------|---------------|--------|
| **Solo Landlord** | $29/mo | 5 | 1-3 properties |
| **Small Portfolio** | $69/mo | 15 | 4-15 properties |
| **Property Manager** | $149/mo | 50 | 15-50 units |
| **Management Company** | $299/mo | 150 | 50+ units |
| **Enterprise** | Custom | Unlimited | 200+ units |

**Pros:**
- Customers self-select into "their" tier
- Clear who each tier is for
- Natural upsell as they grow
- Marketing aligned with segments

**Cons:**
- Customers may game segment boundaries
- Less flexibility
- May alienate non-property customers later

**Best if:** You're doubling down on property management vertical

---

## Pricing Comparison Matrix

| Strategy | Entry Price | Mid Price | Best For | Risk Level |
|----------|-------------|-----------|----------|------------|
| **Current** | $14.99/ea | $59-129/mo | Balanced | Low |
| **A: Freemium** | Free | $29-149/mo | Growth | Medium |
| **B: Usage-Based** | $0 + $14.99/ea | $19-99/mo + usage | Variable users | Medium |
| **C: Per-Property** | $19/mo | $49-199/mo | Portfolio focus | Medium |
| **D: Annual-First** | $399/yr | $899-1499/yr | Cash flow | Low |
| **E: Flat Rate** | $99/mo | $99/mo | Simplicity | Low |
| **F: Vertical Tiers** | $29/mo | $69-299/mo | Segment focus | Low |

---

## Recommendations by Goal

### If optimizing for GROWTH:
**→ Strategy A (Freemium) or Strategy B (Usage-Based)**
- Lower barriers to entry
- Let customers try before committing
- Accept lower initial ARPU for volume

### If optimizing for REVENUE:
**→ Strategy D (Annual-First) or Current pricing**
- Push annual commitments
- Maintain premium positioning
- Capture high-intent customers

### If optimizing for SIMPLICITY:
**→ Strategy E (Flat Rate) or Strategy F (Vertical Tiers)**
- Reduce decision friction
- Clear value proposition
- Easy sales conversations

### If optimizing for MARKET FIT (pre-launch):
**→ Start with Current or Strategy F**
- Test willingness to pay
- Learn which segments convert
- Adjust based on data

---

## Quick Win Adjustments to Current Pricing

Without a full restructure, consider these tweaks:

### 1. Add a "Lite" tier
- $29/mo for 3 verifications
- Captures very small landlords
- Reduces gap to Starter

### 2. Offer 7-day free trial
- Full Pro features
- Credit card required
- Converts skeptics

### 3. Annual discount
- 20% off annual plans
- $47/mo (Starter) = $564/yr
- $103/mo (Pro) = $1,236/yr

### 4. First verification free
- New accounts get 1 free verification
- Reduces first purchase anxiety
- Demonstrates value

### 5. Adjust verification counts
- Starter: 10 → 15 (better value perception)
- Pro: 50 → 35 (closer to actual need)
- Or add middle tier at $89/mo for 25

---

## Pricing Research To Do

Before finalizing, consider:

1. **Customer interviews** - What do landlords/PMs actually spend on screening now?
2. **Van Westendorp survey** - Find the acceptable price range
3. **Competitor deep-dive** - What do AppFolio, Buildium users pay?
4. **Usage analysis** - Once live, how many verifications do customers actually do?

---

## Decision Framework

Answer these questions to narrow down:

1. **What's your #1 priority?**
   - Growth → Lower prices, freemium
   - Revenue → Current or higher prices
   - Simplicity → Flat rate

2. **How variable is customer usage?**
   - High variance → Usage-based
   - Predictable → Fixed tiers

3. **How price-sensitive is your market?**
   - Very sensitive → Lower entry point
   - Value-focused → Premium positioning

4. **How confident are you in product-market fit?**
   - Still testing → Flexible pricing, easy to change
   - Confident → Lock in annual, optimize for revenue

---

*This document should be revisited after first 50 paying customers to validate assumptions.*
