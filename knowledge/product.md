# Product Overview

*Last verified: 2026-01-28*

## Core Product

**Name:** Income Checker (IncomeChecker.com)

**One-liner:** Transaction-based income analysis for landlords and property managers.

**How it works:**
1. Requester creates verification request with applicant info
2. Applicant receives secure link via email
3. Applicant connects bank account via Plaid (transactions only)
4. Our algorithm analyzes transaction patterns
5. Requester receives income analysis report

## Value Proposition

| For Requesters | For Applicants |
|----------------|----------------|
| Fast income insights | No pay stub hunting |
| Affordable ($14.99 vs $30-50) | No credit pull |
| No manual document review | Quick process (~5 min) |
| Bank-verified data | Control over their data |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Google OAuth |
| Banking | Plaid (Transactions API only) |
| Payments | Stripe |
| Styling | Tailwind CSS |
| Hosting | [UNKNOWN - likely Vercel] |

## Features

### Implemented [VERIFIED]
- [x] Requester dashboard
- [x] Verification request creation
- [x] Shareable verification links
- [x] Plaid Link integration (transactions only)
- [x] Income analysis algorithm
- [x] Income reports with transaction history
- [x] PDF export
- [x] Stripe subscription tiers
- [x] Credit-based verification system
- [x] Overage billing
- [x] Email notifications to applicants
- [x] Invitation reminders
- [x] Multi-user team access
- [x] Google OAuth sign-in
- [x] Google One Tap

### Planned
- [ ] Custom branding (upload logo)
- [ ] Analytics dashboard
- [ ] Co-applicant verification
- [ ] Bulk verification (CSV upload)
- [ ] API access (Enterprise)
- [ ] Webhooks (Enterprise)
- [ ] White-label solution (Enterprise)
- [ ] Custom integrations (AppFolio, Buildium)

## Income Analysis Algorithm

Located in: `lib/income-calculations.ts`

**What it does:**
- Identifies deposit transactions
- Detects recurring paycheck patterns
- Estimates monthly income
- Categorizes income sources (payroll vs P2P vs other)
- Calculates confidence scores
- Flags consistency, volatility, gaps

**Output includes:**
- Estimated monthly income
- Detected recurring deposits
- Income sources
- Current balances
- Transaction history (3 or 12 months)
- Income patterns and flags

## Data Access

| Data Point | Source |
|------------|--------|
| Transactions | Plaid Transactions API |
| Account balances | Calculated from transactions |
| Account types | Plaid metadata |
| Transaction categories | Plaid enrichment |
| Income estimates | Our algorithm |

**NOT included:**
- Credit scores
- Employment records
- Payroll data
- Identity verification

## User Flows

### Requester Flow
1. Sign up / Sign in (Google OAuth or email)
2. Go to dashboard
3. Create new verification request
4. Enter applicant name and email
5. Copy link or send via email
6. Wait for completion notification
7. View income report

### Applicant Flow
1. Click verification link from email
2. See who is requesting and why
3. Click "Connect Bank Account"
4. Complete Plaid Link (login to bank)
5. Select accounts to share
6. Done - requester notified

---

## Gaps to Fill

- Hosting provider confirmation
- Analytics/monitoring tools
- Error tracking (Sentry?)
- Customer support system
- Help docs / FAQ
