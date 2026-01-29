# Marketing & Sales Tech Stack Recommendations

*Income Checker - Go-to-Market Infrastructure*
*Last updated: 2026-01-28*

---

## Overview

This document outlines recommended tools for Income Checker's five core go-to-market activities. Recommendations prioritize bootstrapped-friendly options while noting scale-up paths.

**Current baseline:** Google Workspace only

---

## 1. Cold Outreach (Email & Calling)

### Email Outreach

| Option | Tool | Pricing | Why It Fits |
|--------|------|---------|-------------|
| **Free/Low-Cost** | **Instantly.ai** (Starter) | $37/mo | Unlimited email accounts, warmup included, simple UI. Great for cold email at scale without deliverability headaches. |
| **Paid/Scale** | **Apollo.io** (Professional) | $99/mo per user | Combines prospecting database + sequences. All-in-one for list building and outreach. |

**Alternative free option:** **GMass** ($25/mo) works directly inside Gmail, good for <500 emails/day.

### Cold Calling

| Option | Tool | Pricing | Why It Fits |
|--------|------|---------|-------------|
| **Free/Low-Cost** | **Google Voice** | Free | Basic calling, voicemail transcription. Good enough for early validation calls. |
| **Paid/Scale** | **OpenPhone** | $19/mo per user | Shared numbers, call recording, CRM integrations. Professional setup for team calling. |

**Power dialer (later):** **PhoneBurner** ($149/mo) or **Orum** ($150/mo) for high-volume calling when you have dedicated SDR time.

---

## 2. List Building (Finding PM/Landlord Contacts)

| Option | Tool | Pricing | Why It Fits |
|--------|------|---------|-------------|
| **Free/Low-Cost** | **Apollo.io** (Free tier) | Free (50 credits/mo) | 275M+ contacts, filter by industry, title, company size. Property management companies are well-indexed. |
| **Free/Low-Cost** | **Hunter.io** (Free tier) | Free (25 searches/mo) | Domain search to find emails at specific PM companies you've identified. |
| **Paid/Scale** | **Apollo.io** (Basic) | $59/mo | 900 credits/mo, unlimited sequences, better filters. |
| **Paid/Scale** | **ZoomInfo** | ~$15K/year | Gold standard B2B data but overkill for early stage. Consider only after proven PMF. |

### Manual List Building Sources (Free)

- **State real estate commission databases** - Licensed property managers by state
- **Google Maps scraping** - "Property management [city]" searches
- **Yelp/BBB listings** - Property management category
- **LinkedIn Sales Navigator** ($99/mo) - Search by title + industry
- **Apartment association directories** - NAA, state affiliates
- **BiggerPockets Pro directory** - Investor/PM profiles

---

## 3. Landing Page A/B Testing

| Option | Tool | Pricing | Why It Fits |
|--------|------|---------|-------------|
| **Free/Low-Cost** | **Vercel** (built-in) | Free | You're on Next.js—use Edge Config or feature flags for simple A/B routing. Free, no new tool needed. |
| **Free/Low-Cost** | **Google Optimize** successor: **Google Tag Manager + GA4** | Free | DIY A/B testing with GTM triggers and GA4 events. Requires setup but no cost. |
| **Paid/Scale** | **Unbounce** | $99/mo | Drag-drop landing page builder with built-in A/B testing. Fast iteration without dev time. |
| **Paid/Scale** | **VWO** | $199/mo | Full experimentation platform, heatmaps, session recordings. |

### Recommended Approach for Income Checker

Since you have dev capability, build A/B testing into your Next.js app:

```
/app/landing/page.tsx        → Control (informational)
/app/landing-b/page.tsx      → Variant (interactive)
```

Use middleware or edge functions to randomly assign visitors and track with existing analytics (Vercel Analytics, GA4, or PostHog).

---

## 4. LinkedIn Content (Founder Brand)

| Option | Tool | Pricing | Why It Fits |
|--------|------|---------|-------------|
| **Free/Low-Cost** | **Buffer** (Free tier) | Free (3 channels, 10 posts/queue) | Simple scheduling, clean UI. Enough for 1 founder posting 2-3x/week. |
| **Free/Low-Cost** | **Typefully** (Free tier) | Free (limited) | Built specifically for Twitter/LinkedIn, good for drafting long-form posts. |
| **Paid/Scale** | **Taplio** | $49/mo | LinkedIn-specific: scheduling, carousel creator, AI assistance, analytics, lead tracking. |
| **Paid/Scale** | **Shield** | $8/mo | LinkedIn analytics only—see what content performs. Pairs with Buffer for scheduling. |

### Content Workflow Recommendation

1. **Write in Google Docs** (collaboration with Tyrese/Lamar)
2. **Schedule with Buffer Free** (good enough to start)
3. **Upgrade to Taplio** when posting daily or need carousel templates

---

## 5. Facebook Group Strategy

| Option | Tool | Pricing | Why It Fits |
|--------|------|---------|-------------|
| **Free/Low-Cost** | **Manual + Google Sheets tracker** | Free | Search Facebook for landlord/REI groups, track in spreadsheet (group name, size, rules, engagement quality). |
| **Free/Low-Cost** | **Facebook Search** | Free | Use search operators: `groups named "landlord"`, `groups named "property management"`, `groups named "real estate investing"` |
| **Paid/Scale** | **Phantombuster** | $69/mo | Automate group member extraction, profile scraping. Gray area—use carefully, risk of Facebook ban. |

### Target Group Types

- Landlord-specific: "Landlord Tips", "Rental Property Owners"
- REI communities: Local BiggerPockets groups, "[City] Real Estate Investors"
- Property management: "Property Managers Unite", "Property Management Mastermind"
- Niche: "Section 8 Landlords", "Self-Managing Landlords"

### Engagement Best Practices (No Tool Needed)

1. **Join 10-15 active groups** (5K+ members, posts daily)
2. **Comment before posting** - Build reputation over 2 weeks
3. **Provide value first** - Answer screening/income verification questions
4. **Soft pitch only** - "We built something for this" after establishing presence
5. **Track in spreadsheet** - Group name, join date, engagement count, response quality

---

## Multi-Purpose Tools (Reduce Sprawl)

These tools cover multiple needs:

| Tool | Covers | Pricing | Notes |
|------|--------|---------|-------|
| **Apollo.io** | List building + cold email sequences + basic CRM | $59/mo | Best single tool for early outbound. Database + outreach in one. |
| **HubSpot Free CRM** | Contact management + email tracking + basic pipeline | Free | If you need CRM separate from Apollo. Integrates with everything. |
| **Notion** | Content calendar + group tracking + meeting notes | Free (personal) | Already may be using. Good for marketing ops documentation. |
| **Zapier** | Connects everything | Free (100 tasks/mo) | Apollo → Sheets, form submissions → CRM, etc. |

---

## Integration Considerations

### What Plays Nice Together

```
Apollo.io ←→ HubSpot CRM ←→ Slack (notifications)
    ↓
Google Sheets (backup/reporting)
    ↓
Zapier (automation glue)
```

### Recommended Integration Points

1. **New Stripe customer → Google Sheets log** (already have Stripe)
2. **Apollo reply → Slack notification** (if using Slack)
3. **Form submission → Apollo contact + sequence** (automate follow-up)
4. **Calendar booking → HubSpot deal created** (track pipeline)

### Tools That Don't Integrate Well

- Facebook groups (no API, manual only)
- LinkedIn (limited API, most tools scrape/risk bans)
- Phantombuster (works but against platform ToS)

---

## Custom Tool Opportunities

Given your Next.js/Supabase stack, you could build:

### High Value / Moderate Effort

| Custom Tool | Replaces | Effort | Value |
|-------------|----------|--------|-------|
| **Landing page A/B framework** | Unbounce, VWO | 2-3 days | Full control, no monthly cost, learn what converts |
| **Lead magnet delivery system** | ConvertKit, Mailchimp | 1-2 days | Capture emails, drip content, track engagement |
| **Demo booking flow** | Calendly ($12/mo) | 1 day | Embed in app, customize questions, track source |

### Medium Value / Low Effort

| Custom Tool | Replaces | Effort | Value |
|-------------|----------|--------|-------|
| **Outreach tracking dashboard** | Spreadsheets | 1 day | Supabase table + simple UI showing email stats |
| **Facebook group tracker** | Google Sheets | 0.5 day | Quick Supabase table, better than spreadsheet |

### Lower Priority (Buy Instead)

- **Email warmup/deliverability** - Complex, just pay for Instantly
- **Contact data enrichment** - Apollo's database is worth the cost
- **LinkedIn automation** - High ban risk, not worth building

---

## "Start With This" Minimal Stack

### Phase 1: Validation (Months 1-2)

**Total cost: ~$37-59/month**

| Need | Tool | Cost |
|------|------|------|
| List building | Apollo.io Free | $0 |
| Cold email | Instantly.ai Starter | $37/mo |
| Cold calling | Google Voice | $0 |
| CRM | Google Sheets or HubSpot Free | $0 |
| LinkedIn scheduling | Buffer Free | $0 |
| A/B testing | Custom (Next.js) | $0 |
| Facebook groups | Manual + Sheets | $0 |

**Or Apollo Basic ($59/mo) alone** if you want list building + sequences in one tool.

### Phase 2: Scaling (Months 3-6)

**Total cost: ~$150-200/month**

| Need | Tool | Cost |
|------|------|------|
| List building + outreach | Apollo.io Professional | $99/mo |
| Additional email capacity | Instantly.ai Growth | $97/mo |
| Calling | OpenPhone | $19/mo |
| LinkedIn | Taplio | $49/mo |
| CRM | HubSpot Free (still) | $0 |

### Phase 3: Team Scale (6+ months)

Add based on bottlenecks:
- **Power dialer** if cold calling works
- **Sales engagement platform** (Outreach.io, Salesloft) if team grows
- **Marketing automation** (HubSpot paid, ActiveCampaign) for nurture sequences

---

## Decision Framework

Before adding any tool, ask:

1. **Can we do this manually for 2 weeks first?** (Validate the activity matters)
2. **Can we build it ourselves in <2 days?** (Often yes for simple tracking)
3. **Does it integrate with what we have?** (Avoid data silos)
4. **What's the cost per lead/conversion?** (ROI math)

---

## Quick Reference: Tool Links

| Tool | URL | Category |
|------|-----|----------|
| Apollo.io | apollo.io | List building + outreach |
| Instantly.ai | instantly.ai | Cold email |
| Hunter.io | hunter.io | Email finding |
| OpenPhone | openphone.com | Business calling |
| Buffer | buffer.com | Social scheduling |
| Taplio | taplio.com | LinkedIn growth |
| Unbounce | unbounce.com | Landing pages |
| HubSpot CRM | hubspot.com/crm | CRM (free tier) |
| Zapier | zapier.com | Integrations |
| Phantombuster | phantombuster.com | Automation (use carefully) |

---

## Next Steps

1. [ ] Set up Apollo.io free account, pull initial PM list (50 contacts)
2. [ ] Set up Instantly.ai, connect email accounts, begin warmup
3. [ ] Create Facebook group tracking spreadsheet, join first 10 groups
4. [ ] Set up Buffer, schedule first week of LinkedIn content
5. [ ] Build simple A/B test in Next.js for landing page variants

---

*This document should be reviewed monthly and updated as tools are adopted or deprecated.*
