# Income Checker - Project Context

## Company Overview

**Legal Name:** Income Checker LLC
**Structure:** Michigan LLC
**Stage:** Pre-launch / Beta
**Founded:** [UNKNOWN]

## What We Do

Income Checker is a transaction-based income analysis platform that uses Plaid Transactions API to generate income reports from bank data. We help landlords and property managers assess applicant income without credit pulls, pay stubs, or employer verification.

**Key Positioning:**
- NOT a Consumer Reporting Agency (CRA)
- NOT FCRA-compliant (by design)
- Transaction-based analysis, not employment verification
- Applicant-controlled bank connection

## Team

| Name | Role | Equity | Focus |
|------|------|--------|-------|
| Clarence T. Archibald IV | CEO, CTO | 44% | Product, Development |
| Tyrese Searles | CMO | 28% | [To be defined] |
| Lamar Lee | CGO | 28% | [To be defined] |

**Team Status:** Just assembled - roles and day-to-day responsibilities to be mapped post-discovery.

## Target Market

**Primary (Current Focus):**
- Small landlords (1-10 properties)
- Property management companies

**Future Expansion:** [To be defined]

## Product & Pricing

| Plan | Price | Verifications | Overage |
|------|-------|---------------|---------|
| Per Verification | $14.99 | 1 | — |
| Starter | $59/mo | 10 | $8.99 |
| Pro | $129/mo | 50 | $4.99 |
| Enterprise | Custom | Custom | Custom |

**Internal Cost:** ~$0.30 per verification (Plaid Transactions)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth + Google OAuth
- **Banking:** Plaid (Transactions only)
- **Payments:** Stripe
- **Styling:** Tailwind CSS

## Financials

- **Revenue Model:** Per-verification fees + subscriptions
- **Profit Distribution:** 44% / 28% / 28%
- **Retained Earnings:** 20% kept in business
- **Draws:** One month in arrears
- **Current Revenue:** [UNKNOWN - Pre-launch]

## Features Status

### Implemented
- [x] Bank-connected income verification via Plaid
- [x] Stripe payment integration
- [x] Subscription tiers with credit system
- [x] PDF export
- [x] Email notifications to applicants
- [x] Invitation reminders
- [x] Multi-user team access
- [x] Google OAuth sign-in

### Planned
- [ ] Custom branding
- [ ] Analytics dashboard
- [ ] Co-applicant verification
- [ ] Bulk verification (CSV upload)
- [ ] API access (Enterprise)
- [ ] Webhooks (Enterprise)
- [ ] White-label solution (Enterprise)

## Key Files

- `PRODUCT.md` - Pricing and feature roadmap
- `README.md` - Technical documentation
- `SECURITY.md` - Security practices
- `PLAID_IMPLEMENTATION.md` - Plaid integration details
- `STRIPE_INTEGRATION_GUIDE.md` - Stripe setup

## Important Context

### Regulatory Position
We explicitly avoid FCRA/CRA classification by:
- Using only transaction data (no credit, no employment records)
- Providing "analysis" not "verification"
- Making no eligibility decisions
- Using safe language ("estimated income" not "verified income")

### Safe Language Guidelines
See README.md "Plaid Safe Language" section for approved terminology.

---

## Gaps / Needs Discovery

- [ ] Team role definitions and responsibilities
- [ ] Go-to-market strategy and launch timeline
- [ ] Current traction (beta users, verifications processed)
- [ ] Communication tools (Slack, Discord, etc.)
- [ ] CRM / sales tracking system
- [ ] Funding status (bootstrapped vs. investment)
- [ ] Competitive positioning details
- [ ] Customer acquisition channels

*Last updated: 2026-01-28*
