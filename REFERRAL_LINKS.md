# Referral Links

Share these links to track which team member drives each signup. Includes `ref` (Supabase) + UTM params (GA4).

## Tyrese (CMO - Cold Outreach)
```
https://incomechecker.com?ref=tyrese&utm_source=tyrese&utm_medium=cold_outreach&utm_campaign=launch
```

Channel-specific:
```
https://incomechecker.com?ref=tyrese_email&utm_source=tyrese&utm_medium=email&utm_campaign=launch
https://incomechecker.com?ref=tyrese_call&utm_source=tyrese&utm_medium=call&utm_campaign=launch
```

---

## Lamar (CGO - Facebook / BiggerPockets)
```
https://incomechecker.com?ref=lamar&utm_source=lamar&utm_medium=social&utm_campaign=launch
```

Channel-specific:
```
https://incomechecker.com?ref=lamar_facebook&utm_source=lamar&utm_medium=facebook&utm_campaign=launch
https://incomechecker.com?ref=lamar_biggerpockets&utm_source=lamar&utm_medium=biggerpockets&utm_campaign=launch
```

---

## Clarence (CEO/CTO)
```
https://incomechecker.com?ref=clarence&utm_source=clarence&utm_medium=direct&utm_campaign=launch
```

---

## Query conversions

**What you're counting:** Each row in `public.users` = one account creation (trigger on signup). So counts include every signup ever (team, test, real). No `created_at` on `public.users`; use `auth.users.created_at` if you need to filter by date or spot test accounts.

Total user count:
```sql
SELECT COUNT(*) AS total_accounts FROM public.users;
```

By ref:
```sql
SELECT ref, COUNT(*) AS signups FROM public.users GROUP BY ref ORDER BY signups DESC;
```

By UTM source:
```sql
SELECT utm_source, utm_medium, utm_campaign, COUNT(*) AS signups 
FROM public.users 
WHERE utm_source IS NOT NULL 
GROUP BY utm_source, utm_medium, utm_campaign 
ORDER BY signups DESC;
```

To see who the 18 are (emails + when they signed up):
```sql
SELECT u.id, u.ref, u.utm_source, u.company_name, a.email, a.created_at
FROM public.users u
JOIN auth.users a ON a.id = u.id
ORDER BY a.created_at DESC;
```
