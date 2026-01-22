# Plaid Implementation Guide

This document describes the previous Plaid integration, how to find it in git history, and how to migrate back from Teller if needed.

## Git History

### Key Commits

- **Final Plaid Implementation**: `572adac` - "feat: Final Plaid implementation before Teller migration"
  - Date: Thu Jan 8 09:53:17 2026
  - This is the last commit with a working Plaid implementation
  - Full commit hash: `572adac5b2de91bb986a1cf5a510b91b96b4a1cd`

- **Initial Plaid Integration**: `1d46a50` - "feat: Add income verification with Plaid integration"
  - Earlier version, less refined

- **Teller Migration**: `d44d3fa` - "feat: Switch to Teller API with AppFolio-style report"
  - Date: Thu Jan 8 11:20:54 2026
  - This commit removed the Plaid routes

### Viewing the Old Code

To view the Plaid implementation files:

```bash
# View the create-link-token route
git show 572adac:app/api/plaid/create-link-token/route.ts

# View the exchange-token route (includes data fetching)
git show 572adac:app/api/plaid/exchange-token/route.ts

# View all files in that commit
git show 572adac --stat
```

## Plaid API Endpoints Used

The implementation used the following Plaid API endpoints via the Plaid Node SDK:

1. **`linkTokenCreate`** (`/link/token/create`)
   - Creates Link token for frontend connection flow
   - Location: `app/api/plaid/create-link-token/route.ts`
   - Products: `Products.Transactions` only (not Auth)
   - Country: `CountryCode.Us`

2. **`itemPublicTokenExchange`** (`/item/public_token/exchange`)
   - Exchanges public token for access token
   - Location: `app/api/plaid/exchange-token/route.ts`
   - Returns: `access_token` and `item_id`

3. **`accountsGet`** (`/accounts/get`)
   - Fetches account information and balances
   - Called immediately after token exchange

4. **`transactionsGet`** (`/transactions/get`)
   - Fetches 3 months of transaction history
   - Includes retry logic for `PRODUCT_NOT_READY` errors
   - Options: `count: 500`

5. **`itemRemove`** (`/item/remove`)
   - Disconnects Item immediately after fetching data
   - **Critical**: Prevents recurring monthly charges per connected Item

## Implementation Details

### Data Flow

1. Frontend requests Link token from `/api/plaid/create-link-token`
2. User connects bank via Plaid Link
3. Frontend receives `public_token` from Plaid Link
4. Frontend exchanges token via `/api/plaid/exchange-token`
5. Backend:
   - Exchanges public token for access token
   - Fetches accounts and balances
   - Fetches transactions (with retry logic)
   - **Immediately disconnects Item** to avoid monthly charges
   - Stores raw data in `raw_plaid_data` column
   - Clears `plaid_access_token` after disconnection

### Key Features

- **Cost Optimization**: Item disconnected immediately after data fetch to avoid monthly per-Item charges
- **Retry Logic**: Handles `PRODUCT_NOT_READY` errors with exponential backoff
- **Raw Data Storage**: Stores unprocessed Plaid API responses, calculations done at display time
- **Transactions Only**: Uses `Products.Transactions` (not Auth) to reduce costs

## Backwards Compatibility

### ✅ **Fully Backwards Compatible**

The current codebase is designed to support both Plaid and Teller data:

1. **Database Schema**: 
   - `plaid_access_token` and `plaid_item_id` columns still exist
   - `raw_plaid_data` column is reused for both providers (with `provider` field in JSON)

2. **Data Normalization**: 
   - `lib/income-calculations.ts` includes normalization functions for both formats
   - `detectProvider()` function automatically detects Plaid vs Teller data
   - `normalizeAccounts()` and `normalizeTransactions()` handle both formats

3. **Report Display**:
   - `app/(public)/report/[token]/ReportContent.tsx` works with both data formats
   - Income calculations work identically for both providers

### Data Format Differences

| Field | Plaid | Teller |
|-------|-------|--------|
| Account ID | `account_id` | `id` |
| Account Mask | `mask` | `last_four` |
| Transaction ID | `transaction_id` | `id` |
| Transaction Amount | Negative = income, Positive = expense | Positive = income, Negative = expense |
| Balance | `balances.current` | `balances.ledger` |
| Running Balance | Not provided | `running_balance` |
| Institution | Not in account object | `institution.name` |

The normalization functions handle all these differences automatically.

## Migration Guide: Switching Back to Plaid

### Step 1: Restore Plaid API Routes

```bash
# Restore the files from git history
git show 572adac:app/api/plaid/create-link-token/route.ts > app/api/plaid/create-link-token/route.ts
git show 572adac:app/api/plaid/exchange-token/route.ts > app/api/plaid/exchange-token/route.ts
```

### Step 2: Install Plaid SDK

```bash
npm install plaid
```

### Step 3: Update Environment Variables

Add to `.env.local`:

```env
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox  # or 'development' or 'production'
```

### Step 4: Update Frontend Integration

The frontend needs to:
1. Use Plaid Link instead of Teller Connect
2. Call `/api/plaid/create-link-token` instead of `/api/teller/init-connect`
3. Call `/api/plaid/exchange-token` instead of `/api/teller/fetch-data`

**Frontend changes needed:**
- Replace `teller-connect-react` with `react-plaid-link` or `@plaid/link-react`
- Update the verification page to use Plaid Link component
- Update API calls to use Plaid endpoints

### Step 5: Update Data Fetching

The Plaid implementation fetches data differently:
- **Plaid**: Fetches 3 months of transactions (configurable)
- **Teller**: Fetches 12 months of transactions

If you want 12 months with Plaid, you'll need to modify the `fetchRawPlaidData` function to make multiple calls or use pagination.

### Step 6: Update Webhook Handler (if needed)

If you were using Plaid webhooks, restore:
- `app/api/webhooks/plaid/route.ts` (if it existed)

Check git history:
```bash
git log --all --full-history -- "**/webhooks/plaid/**"
```

### Step 7: Test with Existing Data

The system should automatically:
- Detect Plaid data format via `detectProvider()`
- Normalize Plaid data correctly
- Display reports identically

### Step 8: Optional - Remove Teller Code

If you're fully switching back, you can remove:
- `app/api/teller/` directory
- `teller-connect-react` from package.json
- Teller environment variables

**However, keeping both is recommended** for flexibility and to support existing Teller verifications.

## Cost Comparison

| Provider | Cost per Verification | Notes |
|----------|----------------------|-------|
| **Plaid** | ~$1.60 | Auth + Transactions products |
| **Teller** | ~$0.30 | Direct bank connection |

**Plaid Cost Breakdown:**
- Transactions product: ~$0.30 per API call
- Auth product: ~$0.30 per API call (if used)
- **Monthly per-Item fee**: ~$1.00/month per connected bank (avoided by disconnecting immediately)

**Important**: The Plaid implementation disconnects Items immediately after fetching to avoid monthly charges, making it effectively pay-per-verification.

## Files to Restore

From commit `572adac`:

```
app/api/plaid/create-link-token/route.ts
app/api/plaid/exchange-token/route.ts
```

## Current State

- ✅ Database schema supports both providers
- ✅ Data normalization supports both formats
- ✅ Report display works with both formats
- ❌ Plaid API routes removed (need to restore)
- ❌ Frontend uses Teller Connect (needs Plaid Link)
- ❌ Plaid SDK not installed

## Quick Restore Command

To quickly restore the Plaid routes:

```bash
# Create directory
mkdir -p app/api/plaid/create-link-token
mkdir -p app/api/plaid/exchange-token

# Restore files
git show 572adac:app/api/plaid/create-link-token/route.ts > app/api/plaid/create-link-token/route.ts
git show 572adac:app/api/plaid/exchange-token/route.ts > app/api/plaid/exchange-token/route.ts

# Install Plaid SDK
npm install plaid
```

Then update the frontend to use Plaid Link instead of Teller Connect.

## Notes

- The Plaid implementation was removed in favor of Teller due to **80% cost savings** ($0.30 vs $1.60 per verification)
- Both implementations store data in the same `raw_plaid_data` column (named for backwards compatibility)
- The system can handle both Plaid and Teller data simultaneously
- Existing Plaid verifications will continue to work without any changes
