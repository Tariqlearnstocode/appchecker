# Income Verifier

A modern income verification tool for landlords and property managers. Securely verify applicant income, bank balances, and transaction history via Plaid.

## Features

- 🏠 **Landlord Dashboard** - Create and manage verification requests
- 🔗 **Shareable Links** - Send verification links to applicants
- 🏦 **Bank Connection** - Applicants securely connect via Plaid
- 📊 **Income Reports** - View deposits, balances, and transaction history
- 💾 **Persistent Storage** - Works without an account (localStorage) or with Supabase auth
- ⚡ **Cost Optimized** - Uses minimal Plaid products for maximum savings

---

## Cost Per Verification

| Plaid Product | Cost | What It Does |
|---------------|------|--------------|
| **Auth** | $1.50 | Connects bank account |
| **Transactions** | Included | 3 months of transaction history |
| **Total** | **~$1.60** | Per verification |

### Why This is Cheap

We do NOT use Plaid's "Bank Income" product ($6/verification). Instead, we:
1. Pull raw transactions via the Transactions API
2. Analyze deposits ourselves to identify income
3. Calculate monthly income estimates in our own code

**Savings: ~73% cheaper than using Bank Income**

---

## What Landlords Get

| Data Point | Source |
|------------|--------|
| ✅ Monthly income estimate | Calculated from deposits |
| ✅ Recurring deposits (paychecks) | Pattern detection |
| ✅ Deposit sources | Transaction descriptions |
| ✅ Current bank balances | Accounts API |
| ✅ 3 months transaction history | Transactions API |
| ✅ Account types | Checking, savings, etc. |

### What This Does NOT Include

- ❌ Credit scores (use TransUnion SmartMove separately)
- ❌ FCRA-compliant reports (not needed for most landlords)
- ❌ Identity verification (can be added for +$1.50)

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (optional - works without account)
- **Banking**: Plaid (Auth + Transactions)
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
PLAID_CLIENT_ID=your_plaid_client_id
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
| `applicant_name` | text | Applicant's name |
| `applicant_email` | text | Applicant's email |
| `landlord_name` | text | Requesting landlord/company |
| `landlord_email` | text | Landlord contact email |
| `property_unit` | text | Property being applied for |
| `verification_token` | uuid | Unique link token |
| `status` | enum | pending, in_progress, completed, expired, failed |
| `plaid_access_token` | text | Encrypted Plaid token |
| `report_data` | jsonb | Full income report |
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
```

### 3. Configure Plaid

1. Create a [Plaid account](https://dashboard.plaid.com/signup)
2. Get your API keys from the dashboard
3. Start with `sandbox` environment for testing

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
4. Complete Plaid Link flow
5. Done - landlord can now view report

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/plaid/create-link-token` | POST | Create Plaid Link token for applicant |
| `/api/plaid/exchange-token` | POST | Exchange public token, fetch data, save report |

---

## Plaid Products Used

```typescript
// create-link-token/route.ts
products: [Products.Transactions, Products.Auth]
```

That's it. We intentionally don't use:
- `Products.Income` ($6/call)
- `Products.IncomeVerification` 
- `Products.Identity` (+$1.50/call, optional)

---

## Testing with Plaid Sandbox

Use these test credentials in Plaid Link:
- **Username**: `user_good`
- **Password**: `pass_good`

Or use the "Instant" option to skip credentials entirely.

---

## Project Structure

```
app/
├── page.tsx                    # Main dashboard
├── settings/page.tsx           # User settings
├── verify/[token]/page.tsx     # Applicant verification page
├── report/[token]/page.tsx     # View completed report
└── api/plaid/
    ├── create-link-token/route.ts
    └── exchange-token/route.ts

components/
├── NewVerificationTab.tsx      # Create verification form
├── VerificationsListTab.tsx    # List view wrapper
├── VerificationsTable.tsx      # Reusable table component
└── ActionsSidebar.tsx          # Actions panel

supabase/migrations/
├── 20260107000000_income_verification.sql
└── 20260107100000_add_landlord_info.sql
```

---

## Going to Production

### 1. Plaid Environment

Change `PLAID_ENV` from `sandbox` to `production`:

```bash
PLAID_ENV=production
```

Note: You'll need Plaid production approval first.

### 2. Supabase

- Enable Row Level Security (RLS) policies
- Set up proper auth redirects
- Configure site URL in Supabase dashboard

### 3. Costs to Expect

| Monthly Verifications | Plaid Cost |
|----------------------|------------|
| 10 | ~$16 |
| 50 | ~$80 |
| 100 | ~$160 |
| 500 | ~$800 |

Plus Supabase costs (free tier covers most small apps).

---

## Future Improvements

- [ ] Email notifications to applicants
- [ ] PDF report generation
- [ ] Identity verification (+$1.50)
- [ ] Bulk verification creation
- [ ] Credit check integration (TransUnion/Experian)
- [ ] Stripe subscription for premium features

---

## License

MIT
