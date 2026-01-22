# Requester Income Data Scoping & Plaid Compliance Rationale

## Overview

This document records the design and product changes made to the **Income Verification Report – Requester View** and explains **why** each change was made. The goal is to preserve real-world income coverage (including P2P and irregular income) while remaining compliant with the Plaid Master Services Agreement (MSA), especially around **purpose limitation**, **data minimization**, and **non-decisioning posture**.

This file exists to:

* Provide historical context for future contributors
* Prevent scope creep back into ledger-style access
* Serve as internal justification during audits or reviews

---

## Core Design Principles

The requester view must:

1. Support **income verification context**, not account monitoring
2. Show **only incoming funds** authorized by the applicant
3. Avoid appearing like full bank statement or ledger access
4. Clearly distinguish **recurring income evidence** from **supplemental deposits**
5. Remain non-FCRA and non-decisioning

Everything below follows from these principles.

---

## Change Summary

### 1. Removed "Transaction History" from the Requester View

**What changed**

* The requester-facing table previously labeled **"Transaction History"** was removed.
* Month-by-month navigation, transaction counts, and ledger-style browsing were eliminated.

**Why**

* "Transaction History" implies full account access and exploratory browsing.
* Ledger-style UX creates unnecessary compliance risk by enabling lifestyle or spending inference.
* The requester does not need full transaction history to understand income.

**Outcome**

* Requester access is purpose-bound to income context only.
* Reduced risk of the product being interpreted as a bank statement or consumer financial profile.

---

### 2. Established a Two-Tier Deposit Model

The requester view now uses **two distinct sections**, each with a clear role.

#### Tier 1: Recurring Income Evidence

**Section name**

> **Recent Deposits Identified as Recurring Income Patterns (Last 90 Days)**

**Purpose**

* Acts as the **primary evidence** supporting income estimates.
* Highlights consistency, cadence, and repeated sources.

**Key characteristics**

* Algorithmically identified ("Identified as")
* Time-bounded
* Shows amounts and dates only
* Clearly supports the summary metrics above

**Why this matters**

* Keeps income verification focused on stability, not volume of transactions.
* Provides a defensible explanation of how income was estimated.

---

#### Tier 2: Other Incoming Deposits (Supplemental Context)

**Section name**

> **Other Incoming Deposits**

**Helper text**

> Incoming deposits authorized by the applicant that were not identified as recurring income. These may include peer-to-peer transfers or irregular payments.

**Purpose**

* Accounts for **P2P income, gig work, one-off payments, and edge cases**.
* Ensures no incoming funds are hidden or ignored.

**Why this section exists**

* Many users receive legitimate income via Cash App, Zelle, Venmo, Google Pay, etc.
* Recurring income algorithms will not capture all valid income.
* This section provides transparency without overstating significance.

**Design constraints**

* Credits only
* Fixed time window (6 months)
* Paginated
* Chronological order
* No balances
* No month navigation
* Clearly secondary in visual hierarchy

---

### 3. Renamed Tables and Labels for Intentional Framing

**Renames made**

* "Transaction History" → **Removed**
* "Additional Income Deposits" → **Other Incoming Deposits**

**Why**

* Avoids implying that all deposits are income
* Avoids authoritative or employment-verification language
* Reinforces that these deposits are supplemental context, not determinations

---

### 4. Credits-Only Enforcement for Requesters

**What changed**

* Requesters only ever see **incoming deposits**.
* Debits, withdrawals, spending, and balances are excluded.

**Why**

* Spending behavior is irrelevant to income verification.
* Prevents profiling or lifestyle inference.
* Aligns with data minimization requirements.

---

### 5. Fixed Evidence Windows + Pagination

**What changed**

* Data is limited to fixed windows (90 days for recurring, 6 months for supplemental).
* Lists are ordered and paginated.
* No date pickers or month toggles.

**Why**

* Pagination communicates a bounded dataset, not exploration.
* Fixed windows reinforce that data supports a report, not ongoing monitoring.

---

### 6. Non-Decisioning Language Maintained Throughout

Across the report:

* Income values are labeled **estimated** or **illustrative**.
* No approval, denial, qualification, or eligibility language exists.
* The disclaimer clearly states interpretation is the requester's responsibility.

**Why**

* Maintains non-FCRA posture.
* Prevents the product from acting as a decision engine.
* Keeps IncomeChecker positioned as an informational tool.

---

## Final Result

The requester view now:

* Shows **clear recurring income evidence**
* Accounts for **all incoming deposits**, including P2P
* Avoids ledger-style access
* Is purpose-built for income context
* Is defensible under Plaid MSA review

This structure should not be expanded without revisiting this document.

---

## Guardrails for Future Changes

Do **not** add the following to the requester view without compliance review:

* Full transaction history
* Debit or spending data
* Account balances
* Month-by-month navigation
* CSV or raw data export
* Language implying verification, approval, or eligibility

Any future changes should preserve the **two-tier model**: evidence first, context second.

---

**Last updated:** Jan 22, 2026
