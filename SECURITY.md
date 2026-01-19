# Security Documentation

## Overview

IncomeChecker.com is designed with security and privacy as core principles. This document outlines our security practices, data handling procedures, and compliance measures.

---

## Data Protection

### Encryption

| Layer | Protection |
|-------|------------|
| **At Rest** | All data is encrypted using Supabase's built-in AES-256 encryption |
| **In Transit** | TLS 1.3 for all connections |
| **API Communication** | mTLS (mutual TLS) for bank data provider connections |

### Data Minimization

- **Account Numbers**: Only the last 4 digits are stored (masked)
- **Bank Credentials**: Never stored - we use tokenized, read-only connections
- **Access Tokens**: Deleted immediately after data fetch
- **Connection Persistence**: Bank connections are disconnected right after use

---

## Bank Connectivity (Teller)

### How It Works

1. Applicant authenticates directly with their bank via Teller Connect
2. A temporary, read-only access token is generated
3. We fetch 12 months of transaction data
4. The bank connection is **immediately deleted** after data retrieval
5. No ongoing access to the applicant's bank account

### What We Can Access

- ✅ Transaction history (read-only)
- ✅ Account balances (read-only)
- ✅ Account names and last 4 digits

### What We Cannot Do

- ❌ Move money
- ❌ See full account numbers
- ❌ Access bank login credentials
- ❌ Maintain persistent access

---

## Authentication & Authorization

### User Authentication

- Email/password authentication via Supabase Auth
- Secure session management with HTTP-only cookies
- Password requirements enforced at sign-up

### Row Level Security (RLS)

All database tables use Postgres Row Level Security:

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own verifications" ON income_verifications
  FOR SELECT USING (auth.uid() = user_id);
```

This ensures that even if there's a bug in our application code, the database itself prevents unauthorized access.

### Access Control

| Role | Can Access |
|------|------------|
| **Landlord** | Their own verifications and reports |
| **Applicant** | Only the verification form (via unique token) |
| **Admin** | Server-side operations only (no UI access) |

---

## Data Retention

### Automatic Deletion

- **Verification Data**: Automatically deleted 2 years after completion
- **Audit Logs**: Retained for compliance (deletions logged)
- **Session Data**: Cleared on logout

### Manual Deletion (GDPR)

Users can request deletion of all their data at any time via:
- Settings → Privacy & Data → Delete All Data
- API: `DELETE /api/gdpr/delete`

---

## GDPR Compliance

### Data Subject Rights

| Right | How We Support It |
|-------|-------------------|
| **Right to Access** | Export all data via Settings → Privacy & Data |
| **Right to Portability** | JSON export includes all user data |
| **Right to Erasure** | One-click deletion of all data |
| **Right to Rectification** | Edit profile and verification defaults |

### Data Export Format

Exported data includes:
- User profile
- All verifications (metadata only - financial data excluded for security)
- Activity/audit logs

Note: Raw financial data is excluded from exports. Contact support if you need transaction-level data for a specific verification.

---

## Audit Logging

All significant actions are logged:

| Action | Logged Data |
|--------|-------------|
| Report Viewed | User ID, verification ID, timestamp, IP |
| Data Exported | User ID, timestamp |
| Data Deleted | User ID, what was deleted, timestamp |
| Verification Created | User ID, applicant info, timestamp |
| Login/Logout | User ID, timestamp, IP |

Audit logs are:
- Immutable (cannot be deleted by users)
- Retained for 7 years for compliance
- Available in user data exports

---

## Infrastructure Security

### Hosting

- **Database**: Supabase (AWS infrastructure)
- **Application**: Vercel Edge Network
- **Region**: Data stored in US-East

### Network Security

- All endpoints HTTPS-only
- API rate limiting enabled
- CORS restricted to application domain
- CSP headers configured

---

## Vulnerability Disclosure

If you discover a security vulnerability, please report it responsibly:

1. **Email**: info@incomechecker.com
2. **Do not** disclose publicly until we've had time to address it
3. We aim to respond within 48 hours
4. We do not pursue legal action against good-faith security researchers

---

## Security Checklist

| Control | Status |
|---------|--------|
| Encryption at rest | ✅ Enabled |
| Encryption in transit | ✅ TLS 1.3 |
| Row Level Security | ✅ Enabled |
| Audit logging | ✅ Enabled |
| Data retention policy | ✅ 2 years |
| GDPR data export | ✅ Available |
| GDPR data deletion | ✅ Available |
| Account number masking | ✅ Last 4 only |
| Bank token deletion | ✅ Immediate |
| Password hashing | ✅ bcrypt via Supabase |
| Session security | ✅ HTTP-only cookies |
| Rate limiting | ✅ Enabled |

---

## Compliance

### Standards We Follow

- **GDPR** - General Data Protection Regulation (EU)
- **CCPA** - California Consumer Privacy Act
- **SOC 2** - Via Supabase infrastructure

### Third-Party Security

| Provider | Certification |
|----------|---------------|
| Supabase | SOC 2 Type II |
| Teller | SOC 2 Type II, PCI DSS |
| Vercel | SOC 2 Type II |

---

## Contact

For security concerns or questions:
- **Security Issues**: info@incomechecker.com
- **Privacy Requests**: info@incomechecker.com
- **General Support**: info@incomechecker.com

---

*Last Updated: January 2026*

