# Income Verifier

A modern income verification tool for landlords and property managers. Securely verify applicant income, bank balances, and transaction history via Teller.

## Features

- 🏠 **Landlord Dashboard** - Create and manage verification requests
- 🔗 **Shareable Links** - Send verification links to applicants
- 🏦 **Bank Connection** - Applicants securely connect via Teller
- 📊 **Income Reports** - View deposits, balances, and transaction history
- 💾 **Persistent Storage** - Works without an account (localStorage) or with Supabase auth
- ⚡ **Extremely Cost Effective** - Only ~$0.30 per verification with Teller!

---

## Cost Per Verification

| Provider | Cost | Notes |
|----------|------|-------|
| **Teller** | **~$0.30** | Direct bank connection |
| Plaid (previous) | ~$1.60 | Auth + Transactions |
| Plaid Bank Income | ~$6.00 | Pre-built income product |

### Why Teller is Better

1. **80% cheaper** than our previous Plaid implementation
2. **No monthly fees** per connected Item
3. **Simple pricing** - just pay per API call
4. **Direct connections** - no aggregator middleman for many banks

---

## What Landlords Get

| Data Point | Source |
|------------|--------|
| ✅ Monthly income estimate | Calculated from deposits |
| ✅ Recurring deposits (paychecks) | Pattern detection |
| ✅ Deposit sources | Transaction descriptions |
| ✅ Current bank balances | Balances API |
| ✅ 3 months transaction history | Transactions API |
| ✅ Account types | Checking, savings, etc. |
| ✅ Transaction categories | Teller enrichment |

### What This Does NOT Include

- ❌ Credit scores (use TransUnion SmartMove separately)
- ❌ FCRA-compliant reports (not needed for most landlords)
- ❌ Identity verification (can be added with Teller Identity)

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (optional - works without account)
- **Banking**: Teller (Accounts, Balances, Transactions)
- **Styling**: Tailwind CSS

---

## Environment Variables

Create a `.env` file with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key

# Teller
NEXT_PUBLIC_TELLER_APPLICATION_ID=your_teller_app_id
NEXT_PUBLIC_TELLER_ENV=sandbox  # or 'development' or 'production'
```

---

## Database Schema

### `income_verifications` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `session_id` | text | For anonymous users (localStorage) |
| `user_id` | uuid | For logged-in users |
| `applicant_name` | text | Applicant's name |
| `applicant_email` | text | Applicant's email |
| `landlord_name` | text | Requesting landlord/company |
| `landlord_email` | text | Landlord contact email |
| `property_unit` | text | Property being applied for |
| `verification_token` | uuid | Unique link token |
| `status` | enum | pending, in_progress, completed, expired, failed |
| `raw_plaid_data` | jsonb | Raw Teller API response (named for backwards compat) |
| `created_at` | timestamp | When created |
| `expires_at` | timestamp | Link expiration |
| `completed_at` | timestamp | When applicant completed |

### `user_preferences` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | References auth.users |
| `company_name` | text | Default landlord name |
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
# - supabase/migrations/20260107100000_add_landlord_info.sql
# - supabase/migrations/20260107200000_separate_raw_data.sql
```

### 3. Configure Teller

1. Create a [Teller account](https://teller.io/)
2. Get your Application ID from the dashboard
3. For production: Download your certificate and private key
4. Start with `sandbox` environment for testing

### 4. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## User Flow

### For Landlords

1. Go to dashboard
2. Fill in "From" (your info) and "Request To" (applicant info)
3. Click "Create Verification"
4. Copy the link and send to applicant
5. View completed report when applicant finishes

### For Applicants

1. Click verification link from landlord
2. See who is requesting verification
3. Click "Connect Your Bank Account"
4. Complete Teller Connect flow (log into bank)
5. Done - landlord can now view report

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/teller/fetch-data` | POST | Fetch accounts, balances, transactions and save report |

---

## How Teller Works

### Frontend: Teller Connect

```typescript
import { useTellerConnect } from 'teller-connect-react';

const { open, ready } = useTellerConnect({
  applicationId: process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID,
  environment: 'sandbox',
  onSuccess: (enrollment) => {
    // enrollment.accessToken - use this to call Teller API
  },
});
```

### Backend: Teller API

```typescript
// Basic Auth: access_token as username, empty password
const authHeader = Buffer.from(`${accessToken}:`).toString('base64');

// Fetch accounts
const accounts = await fetch('https://api.teller.io/accounts', {
  headers: { Authorization: `Basic ${authHeader}` }
});

// Fetch transactions
const transactions = await fetch(
  `https://api.teller.io/accounts/${accountId}/transactions`,
  { headers: { Authorization: `Basic ${authHeader}` } }
);
```

---

## Testing with Teller Sandbox

In sandbox mode:
1. Click "Connect Your Bank Account"
2. Teller will show fake banks
3. Use any credentials to "log in"
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
└── api/teller/
    └── fetch-data/route.ts     # Fetch & save Teller data

components/
├── NewVerificationTab.tsx      # Create verification form
├── VerificationsListTab.tsx    # List view wrapper
├── VerificationsTable.tsx      # Reusable table component
└── ActionsSidebar.tsx          # Actions panel

lib/
└── income-calculations.ts      # Income analysis from raw data

supabase/migrations/
├── 20260107000000_income_verification.sql
├── 20260107100000_add_landlord_info.sql
└── 20260107200000_separate_raw_data.sql
```

---

## Going to Production

### 1. Teller Environment

1. Complete Teller's production onboarding
2. Download your mTLS certificate and private key
3. Set up certificate in your server environment
4. Change `NEXT_PUBLIC_TELLER_ENV` to `production`

**Note**: Teller requires mTLS (client certificates) for production/development environments. Only sandbox skips this.

### 2. Supabase

- Enable Row Level Security (RLS) policies
- Set up proper auth redirects
- Configure site URL in Supabase dashboard

### 3. Expected Costs

| Monthly Verifications | Teller Cost |
|----------------------|-------------|
| 10 | ~$3 |
| 50 | ~$15 |
| 100 | ~$30 |
| 500 | ~$150 |

Plus Supabase costs (free tier covers most small apps).

---

## Migration from Plaid

This app was previously built with Plaid. Key changes:

1. **No link token flow** - Teller Connect uses Application ID directly
2. **Direct access token** - No token exchange needed
3. **Basic Auth** - Instead of bearer tokens
4. **Different data format** - Amounts are strings in Teller
5. **80% cost savings** - $0.30 vs $1.60 per verification

Old Plaid API routes are still in `/app/api/plaid/` for reference but unused.

---

## Future Improvements

- [ ] Email notifications to applicants
- [ ] PDF report generation
- [ ] Identity verification (Teller Identity)
- [ ] Bulk verification creation
- [ ] Credit check integration (TransUnion/Experian)
- [ ] Stripe subscription for premium features

---

## License

MIT
