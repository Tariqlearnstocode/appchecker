# Quick Start Setup Guide - Clarence

*Get the team ready to execute in 1-2 days*
*Created: 2026-01-28*

---

## Overview

You're setting up the infrastructure so Tyrese and Lamar can hit the ground running. This guide is step-by-step — just follow it in order.

**Time estimate:** 4-6 hours total
**End result:** All tools ready, first leads loaded, team can start Day 4

---

## Step 1: Create Accounts (30 min)

Create these accounts using a shared company email (e.g., team@incomechecker.com or your Google Workspace):

### Required (Do These First)

| Tool | URL | Plan | Cost |
|------|-----|------|------|
| Apollo.io | https://apollo.io | Free tier | $0 |
| Instantly.ai | https://instantly.ai | Starter | $37/mo |
| HubSpot CRM | https://hubspot.com/crm | Free | $0 |
| Google Voice | https://voice.google.com | Free | $0 |

### Optional (Can Add Later)

| Tool | URL | Plan | Cost |
|------|-----|------|------|
| Buffer | https://buffer.com | Free | $0 |
| Hunter.io | https://hunter.io | Free | $0 |

**Action:** Create each account. Save logins in a shared password manager or secure doc.

---

## Step 2: Set Up Apollo.io (45 min)

Apollo is where Tyrese will build prospect lists.

### 2.1 Complete Onboarding
1. Sign up at apollo.io
2. Complete the onboarding wizard
3. Connect your Google Workspace (for email sync)

### 2.2 Create Your First Saved Search

**Search 1: Michigan Property Managers**
1. Go to Search → People
2. Set filters:
   - **Job Titles:** Property Manager, Property Management, Director of Property Management, Leasing Manager, Regional Manager
   - **Location:** Michigan, United States
   - **Company Industry:** Real Estate
   - **Company Size:** 1-50 employees
3. Click "Save Search" → Name it "Michigan PMs"

**Search 2: Small PM Companies**
1. Go to Search → Companies
2. Set filters:
   - **Industry:** Property Management, Real Estate Management
   - **Location:** Michigan
   - **Employees:** 2-50
3. Click "Save Search" → Name it "MI PM Companies"

### 2.3 Export First 50 Contacts
1. Run the "Michigan PMs" search
2. Select first 50 contacts (checkbox)
3. Click "Export" → CSV
4. Save file as `first-batch-michigan-pms.csv`

**Screenshot the search filters so Tyrese can replicate.**

---

## Step 3: Set Up Instantly.ai (1 hour)

Instantly handles cold email sending with built-in warmup.

### 3.1 Create Account & Connect Email
1. Sign up at instantly.ai
2. Add your sending email account:
   - Go to Email Accounts → Add Account
   - Connect via Google Workspace (easiest)
   - **Important:** Use a dedicated email like outreach@incomechecker.com or hello@incomechecker.com
   - Don't use your personal email

### 3.2 Start Email Warmup
1. Go to Email Accounts
2. Click on your connected account
3. Enable "Warmup" toggle
4. Set warmup to:
   - Daily limit: Start at 20, increase to 50 over 2 weeks
   - Warmup emails: Enable (this improves deliverability)

**Note:** Warmup takes 1-2 weeks to fully ramp. You can still send emails, just start slow (20-30/day).

### 3.3 Create Campaign

**Campaign Name:** Michigan PMs - Initial Outreach

1. Go to Campaigns → New Campaign
2. Upload the CSV from Apollo (50 contacts)
3. Map fields:
   - Email → email column
   - First Name → first_name column
   - Company → company_name column

### 3.4 Add Email Sequence

Copy these from `outreach-templates.md`:

**Email 1 (Day 0):**
```
Subject: quick question about {{company}}

Hi {{first_name}},

Weird question — how much time do you spend chasing pay stubs from applicants?

We built a tool that lets applicants connect their bank directly. You get a verified income report in 5 minutes. $14.99 per verification.

Worth a quick look?

Clarence
Income Checker
```

**Email 2 (Day 3):**
```
Subject: re: quick question about {{company}}

{{first_name}},

Wanted to follow up. Did you know you can buy fake pay stubs on Instagram for $30? That's what you're competing with when you ask for documents.

Bank-connected income verification solves this. Applicant links their account, you see real deposits.

15-minute demo if you're curious: [CALENDAR LINK]

Clarence
```

**Email 3 (Day 7):**
```
Subject: last one from me

{{first_name}},

I'll keep this short — just want to make sure this landed on your radar.

Several property managers we've talked to switched from manual pay stub collection to bank-verified income reports. Takes applicants 5 minutes, costs you $14.99.

If tenant screening isn't a pain point for you, no worries. But if it is, happy to show you how it works.

Clarence
```

### 3.5 Set Schedule
1. Sending window: 9am - 5pm EST (or local time for Michigan)
2. Days: Monday - Friday
3. Daily limit: 30 emails/day (increase as warmup progresses)

### 3.6 Activate Campaign
1. Review everything
2. Click "Start Campaign"
3. First emails will go out next business day

---

## Step 4: Set Up Google Voice (15 min)

For cold calling.

1. Go to voice.google.com
2. Sign in with Google Workspace
3. Choose a phone number (pick a Michigan area code: 313, 248, 734, 517)
4. Link to your mobile for forwarding (optional)
5. Test by calling yourself

**Share this number with Tyrese** — he'll use it for outbound calls.

---

## Step 5: Set Up HubSpot CRM (30 min)

Central place to track all contacts and deals.

### 5.1 Create Account
1. Go to hubspot.com/crm
2. Sign up with company email
3. Complete onboarding

### 5.2 Create Pipeline Stages
1. Go to Sales → Deals → Pipeline
2. Create stages:
   - **Lead** - New contact, not yet contacted
   - **Contacted** - Email sent or called
   - **Replied** - Got a response
   - **Demo Scheduled** - Meeting booked
   - **Demo Completed** - Had the call
   - **Proposal Sent** - Shared pricing
   - **Won** - Paying customer
   - **Lost** - Said no

### 5.3 Import Apollo Contacts
1. Export full list from Apollo as CSV
2. In HubSpot: Contacts → Import → File
3. Map columns (email, first name, last name, company, phone)
4. Import

### 5.4 Invite Team
1. Settings → Users & Teams
2. Add Tyrese and Lamar as users (free seats)
3. Give them Sales access

---

## Step 6: Create Facebook Group Tracker (15 min)

**HubSpot is the single source of truth** for all contacts, outreach activity, and pipeline. No spreadsheets needed for that — HubSpot tracks it automatically.

The **only spreadsheet** you need is for Lamar's Facebook/BiggerPockets group tracking (since groups aren't contacts):

### Facebook Group Tracker (Google Sheet)
**Columns:**
- Group Name
- URL
- Member Count
- Join Date
- Status (Joined/Pending/Rejected)
- Engagement Quality (1-5)
- Posts Made
- Comments Made
- Leads Generated (then add these people to HubSpot)
- Notes

**Share with lamar@...**

### What Goes Where

| Data | Where to Track |
|------|----------------|
| Contacts & companies | HubSpot |
| Email activity | HubSpot (auto-logged from Instantly sync) |
| Call activity | HubSpot (log manually after calls) |
| Deal pipeline | HubSpot |
| Facebook groups | Google Sheet (the only one) |
| Leads from Facebook | Add to HubSpot as contacts |

---

## Step 7: Generate First Leads Yourself (1 hour)

Before handing off, prove the system works by doing a small batch yourself.

### 7.1 Pull 25 More Contacts from Apollo
- Use the saved search
- Export to CSV
- Import to Instantly

### 7.2 Send First 25 Emails
- Let the campaign run
- Monitor for bounces or issues
- Check deliverability

### 7.3 Make 10 Test Calls
- Call 10 contacts from the list
- Use the scripts from outreach-templates.md
- Note what works, what doesn't
- Write down any objections you hear

### 7.4 Document What You Learned
Write a quick summary:
- What subject lines got opens?
- Any common objections on calls?
- What questions did people ask?
- Any adjustments needed to templates?

**This becomes intel for Tyrese.**

---

## Step 8: Prepare Handoff Documents (30 min)

Create a simple doc for each person:

### For Tyrese (Outreach Owner)
```
TYRESE - GETTING STARTED

Logins:
- Apollo.io: [email] / [password or SSO]
- Instantly.ai: [email] / [password]
- HubSpot: [email] / [password or SSO]
- Google Voice: [number]

Your Daily Workflow:
1. Morning: 1-2 hrs in Apollo building lists → import to HubSpot
2. Check Instantly for replies, respond immediately
3. Midday: 2 hrs cold calling → log calls in HubSpot after each
4. End of day: Update deal stages in HubSpot for any progress

Key Docs:
- Outreach templates: [link]
- List building process: [link]

Tracking: Everything goes in HubSpot. No spreadsheets.

First Week Goals:
- 150 contacts added
- 100 emails sent
- 100 calls made
- 5 conversations

Questions? Text/Slack me.
```

### For Lamar (Facebook/BP Owner)
```
LAMAR - GETTING STARTED

No tool logins needed — just your existing Facebook and BiggerPockets accounts.

Your Daily Workflow:
1. Morning: 30 min scrolling groups, commenting on posts
2. Midday: Answer 3-5 screening questions in groups
3. When you see opportunity: DM interested people
4. End of day: Update group tracker sheet, add any leads to HubSpot

Key Docs:
- Facebook group strategy: [link]
- Sample posts/comments: [link]

Tracking:
- Groups → Google Sheet (group tracker)
- Leads/contacts → HubSpot (add anyone interested)

First Week Goals:
- 15 groups actively engaged in
- 35+ comments/answers
- 5 DM conversations
- 1 soft-pitch post (Day 10)

Reminder: Give value for 2 weeks before pitching. You're positioning as the expert, not selling.

Questions? Text/Slack me.
```

---

## Step 9: Schedule Kickoff Call (15 min)

Set up a 30-min call with Tyrese and Lamar:

**Agenda:**
1. Walk through their specific docs (10 min)
2. Show them the tools (live screenshare) (10 min)
3. Answer questions (5 min)
4. Confirm daily standup format (5 min)

**After the call:** They should be ready to start Day 4.

---

## Checklist - You're Done When:

- [ ] Apollo.io account created, saved searches set up
- [ ] Instantly.ai account created, warmup started, first campaign live
- [ ] Google Voice number active
- [ ] HubSpot CRM set up with pipeline and contacts imported
- [ ] Facebook group tracker (Google Sheet) created and shared with Lamar
- [ ] First 25-50 leads in HubSpot
- [ ] First batch of emails sent (test run)
- [ ] 10 test calls made, learnings documented
- [ ] Tyrese handoff doc ready
- [ ] Lamar handoff doc ready
- [ ] Kickoff call scheduled

---

## Quick Reference - All Logins

| Tool | URL | Email | Notes |
|------|-----|-------|-------|
| Apollo.io | apollo.io | | |
| Instantly.ai | instantly.ai | | |
| HubSpot | hubspot.com | | |
| Google Voice | voice.google.com | | Phone: |
| Buffer | buffer.com | | (optional) |

**Fill this in as you create accounts, then share with team.**

---

## Troubleshooting

**Instantly emails going to spam:**
- Warmup needs more time (wait 1 week)
- Reduce daily send volume
- Check email content for spam trigger words

**Apollo not finding contacts:**
- Broaden job titles
- Expand geographic area
- Try company search instead of people search

**Google Voice not working:**
- Make sure you're signed into correct Google account
- Try from phone app instead of web

**Team not logging activity in HubSpot:**
- Show them how quick it is (30 seconds per call log)
- Check HubSpot together in daily standups until it becomes habit
- Lamar only needs to update one spreadsheet (group tracker)

---

*Total setup time: 4-6 hours*
*Result: Team can start executing Day 4*
