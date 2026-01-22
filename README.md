# IncomeChecker.com

**IncomeChecker.com** is an **income verification platform** that uses **Plaid Transactions** (not Income/Employment, not FCRA) to generate income reports from bank transaction data only. We do not pull credit reports, payroll systems, or employer records.

This is a **user-consented, transaction-based income analysis tool**, not an employment or credit system.

## Features

- 🏠 **Requester Dashboard** - Create and manage verification requests
- 🔗 **Shareable Links** - Send verification links to applicants
- 🏦 **Bank Connection** - Applicants securely connect via Plaid (transactions only)
- 📊 **Income Reports** - Our internal algorithm processes transactions to generate income reports
- 💾 **Persistent Storage** - Works without an account (localStorage) or with Supabase auth
- ⚡ **Extremely Cost Effective** - Only ~$0.30 per verification with Plaid!

---

## Cost Per Verification

| Provider | Cost | Notes |
|----------|------|-------|
| **Plaid** | **~$0.30** | Transactions only |
| Plaid (Auth + Transactions) | ~$1.60 | Full Plaid product |
| Plaid Bank Income | ~$6.00 | Pre-built income product |

### How It Works

1. **Requester** creates an income verification request
2. **Applicant** receives a unique, shareable verification link
3. **Applicant alone** connects their bank account via Plaid (transactions only)
4. The platform pulls **transaction history only** via Plaid Transactions API
5. Our internal algorithm:
   - Identifies deposits
   - Detects recurring paycheck patterns
   - Estimates monthly income
   - Categorizes income sources
   - Flags consistency, volatility, and gaps
6. A structured **income report** is produced
7. **Requester sees the report only** — never Plaid, never credentials, never raw access

---

## What Requesters Get

| Data Point | Source |
|------------|--------|
| ✅ Estimated monthly income | Calculated by internal algorithm from deposits |
| ✅ Detected recurring deposits | Pattern detection algorithm |
| ✅ Deposit sources | Transaction descriptions analyzed by algorithm |
| ✅ Current bank balances | Calculated from transaction data |
| ✅ 3 months transaction history | Plaid Transactions API |
| ✅ Account types | Checking, savings, etc. |
| ✅ Transaction categories | Plaid enrichment |
| ✅ Income patterns | Based on transaction history analysis |

### What This Does NOT Include

- ❌ Credit scores or credit reports
- ❌ FCRA-compliant consumer reports
- ❌ Employment verification or employer records
- ❌ Payroll system data
- ❌ Identity verification
- ❌ Eligibility decisions or approvals

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (optional - works without account)
- **Banking**: Plaid (Transactions only)
- **Processing**: Internal algorithm for income analysis
- **Styling**: Tailwind CSS

---

## Environment Variables

Create a `.env` file with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key

# Plaid
NEXT_PUBLIC_PLAID_PUBLIC_KEY=your_plaid_public_key
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox  # or 'development' or 'production'
```

---

## Database Schema

### `income_verifications` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `session_id` | text | For anonymous users (localStorage) |
| `user_id` | uuid | For logged-in users |
| `individual_name` | text | Individual's name being verified |
| `individual_email` | text | Individual's email |
| `requested_by_name` | text | Requesting party/company name |
| `requested_by_email` | text | Requesting party contact email |
| `purpose` | text | Purpose of verification (optional) |
| `verification_token` | uuid | Unique link token |
| `status` | enum | pending, in_progress, completed, expired, failed |
| `raw_plaid_data` | jsonb | Raw Plaid Transactions API response |
| `created_at` | timestamp | When created |
| `expires_at` | timestamp | Link expiration |
| `completed_at` | timestamp | When applicant completed |

### `user_preferences` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | References auth.users |
| `company_name` | text | Default requester name |
| `email` | text | Default contact email |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

Run the migrations in your Supabase project:

```bash
# Via Supabase CLI
npx supabase db push

# Or manually run in SQL Editor:
# - supabase/migrations/20260107000000_income_verification.sql
# - supabase/migrations/20260107100000_add_landlord_info.sql (requester info)
# - supabase/migrations/20260107200000_separate_raw_data.sql
```

### 3. Configure Plaid

1. Create a [Plaid account](https://plaid.com/)
2. Get your API keys from the dashboard
3. Use the Transactions product (transactions only)
4. Start with `sandbox` environment for testing

### 4. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## User Flow

### For Requesters

1. Go to dashboard
2. Fill in "From" (your info) and "Request To" (applicant info)
3. Click "Create Verification"
4. Copy the link and send to applicant
5. View completed report when applicant finishes

### For Applicants

1. Click verification link from requester
2. See who is requesting verification
3. Click "Connect Your Bank Account"
4. Complete Plaid Link flow (log into bank) - only applicants have access to Plaid
5. Done - requester can now view the processed income report (requester never sees Plaid or bank credentials)

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/plaid/fetch-data` | POST | Fetch transactions via Plaid, process with internal algorithm, and save report |

---

## How It Works

### User Roles & Data Access

**Applicants:**
- Control the Plaid connection
- Authorize data access
- Can revoke access
- Are the only users who interact with Plaid Link

**Requesters:**
- Never touch Plaid
- Never access bank credentials
- Only see derived income summaries
- Receive processed reports, not raw transaction data

### Frontend: Plaid Link

```typescript
import { usePlaidLink } from 'react-plaid-link';

const { open, ready } = usePlaidLink({
  token: linkToken,
  onSuccess: (publicToken, metadata) => {
    // Exchange public token for access token
  },
});
```

### Backend: Plaid Transactions API

```typescript
// Exchange public token for access token
const response = await plaidClient.itemPublicTokenExchange({
  public_token: publicToken,
});

// Fetch transactions
const transactionsResponse = await plaidClient.transactionsGet({
  access_token: accessToken,
  start_date: startDate,
  end_date: endDate,
});

// Process with internal algorithm
const incomeReport = processTransactions(transactionsResponse.data.transactions);
```

### Internal Algorithm

Our proprietary algorithm processes raw Plaid transaction data to:
- Identify and categorize deposits
- Detect recurring paycheck patterns
- Calculate estimated monthly income (not verified employment)
- Analyze deposit sources and frequencies
- Flag consistency, volatility, and gaps in income patterns
- Generate structured income analysis reports for requesters

**Important:** The algorithm transforms raw transaction data into insights. We do not resell Plaid output as-is, and we do not act as a Consumer Reporting Agency (CRA).

---

## Testing with Plaid Sandbox

In sandbox mode:
1. Click "Connect Your Bank Account"
2. Plaid will show test banks
3. Use test credentials (e.g., `user_good` / `pass_good`)
4. Select accounts to share
5. Data is synthetic but realistic

---

## Project Structure

```
app/
├── page.tsx                    # Main dashboard
├── settings/page.tsx           # User settings
├── verify/[token]/page.tsx     # Applicant verification page
├── report/[token]/page.tsx     # View completed report
└── api/plaid/
    └── fetch-data/route.ts     # Fetch transactions, process with algorithm, save report

components/
├── NewVerificationTab.tsx      # Create verification form
├── VerificationsListTab.tsx    # List view wrapper
├── VerificationsTable.tsx      # Reusable table component
└── ActionsSidebar.tsx          # Actions panel

lib/
└── income-calculations.ts      # Internal algorithm for income analysis from transaction data

supabase/migrations/
├── 20260107000000_income_verification.sql
├── 20260107100000_add_landlord_info.sql (requester info)
└── 20260107200000_separate_raw_data.sql
```

---

## Going to Production

### 1. Plaid Environment

1. Complete Plaid's production onboarding
2. Get your production API keys from Plaid dashboard
3. Set up webhook endpoints for transaction updates
4. Change `PLAID_ENV` to `production`

### 2. Supabase

- Enable Row Level Security (RLS) policies
- Set up proper auth redirects
- Configure site URL in Supabase dashboard

### 3. Expected Costs

| Monthly Verifications | Plaid Cost (Transactions) |
|----------------------|---------------------------|
| 10 | ~$3 |
| 50 | ~$15 |
| 100 | ~$30 |
| 500 | ~$150 |

Plus Supabase costs (free tier covers most small apps).

---

## How Income Reports Are Generated

Our internal algorithm processes Plaid transaction data to create income analysis reports:

1. **Transaction Fetching** - We use Plaid Transactions API (transactions only product)
2. **Data Processing** - Our proprietary algorithm analyzes raw transaction data
3. **Pattern Detection** - Identifies recurring deposits, paychecks, and income sources
4. **Income Calculation** - Calculates estimated monthly income from deposit patterns
5. **Report Generation** - Creates structured analysis reports for requesters without exposing bank credentials

The algorithm is implemented in `lib/income-calculations.ts` and processes transaction data to extract meaningful income insights. This is **transaction-based income analysis**, not employment verification or credit reporting.

---

## Plaid Safe Language

### What IncomeChecker.com Is

IncomeChecker.com is a **user-consented, transaction-based income analysis tool** that:

- ✅ Uses **Plaid Transactions** (not Income/Employment, not FCRA)
- ✅ Generates **income reports from bank transaction data only**
- ✅ Transforms raw transaction data into insights via internal algorithm
- ✅ Provides applicant-controlled authorization
- ✅ Delivers derived analytics instead of raw data resale
- ✅ Does not pull credit reports, payroll systems, or employer records

### What IncomeChecker.com Is NOT

- ❌ **Not a Consumer Reporting Agency (CRA)**
- ❌ **Not an employment verification service**
- ❌ **Not a credit reporting system**
- ❌ **Not making eligibility decisions**
- ❌ **Not reselling Plaid output as-is**
- ❌ **Not providing FCRA-compliant consumer reports**

### Safe Language to Use

**✅ Safe phrasing:**
- "Estimated monthly income"
- "Detected recurring deposits"
- "Income patterns based on transaction history"
- "Transaction-based income analysis"
- "Income insights from bank data"
- "Derived income summaries"
- "Income report based on transaction patterns"

**❌ Risky phrasing (avoid):**
- "Verified income for approval"
- "Meets income requirements"
- "Employment confirmed"
- "Verified employment"
- "Approved / Denied / Qualifies"
- "Income verification for eligibility"
- "FCRA-compliant report"

### Legal & Regulatory Position

IncomeChecker.com operates as:

> **"User-authorized financial data analysis and reporting"**

and **not** as:

> **"Consumer reporting / underwriting / employment verification"**

This distinction is critical under Plaid's MSA and regulatory frameworks.

### Key Compliance Points

1. **Applicant Control**: Only applicants connect via Plaid and authorize data access
2. **Data Transformation**: We process and analyze transaction data, not resell raw Plaid output
3. **No Eligibility Decisions**: Reports are informational analysis, not approval/denial decisions
4. **No CRA Claims**: We do not act as or claim to be a Consumer Reporting Agency
5. **Clear Disclaimers**: Reports are transaction-based analysis, not employment verification

### Marketing & Copy Guidelines

When describing IncomeChecker.com:

- ✅ Emphasize transaction-based analysis
- ✅ Highlight applicant control and consent
- ✅ Use "estimated" and "detected" language
- ✅ Focus on data insights, not verification claims
- ✅ Avoid employment or credit verification language
- ✅ Make clear this is analysis, not decision-making

---

---

## Future Improvements

- [ ] Email notifications to applicants
- [ ] PDF report generation
- [ ] Identity verification (separate from income analysis)
- [ ] Bulk verification creation
- [ ] Enhanced pattern detection algorithms
- [ ] Stripe subscription for premium features

**Note:** We do not plan to integrate credit checks or FCRA-compliant reporting, as these fall outside our transaction-based income analysis model.

---

## License

MIT
