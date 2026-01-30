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
```sql
SELECT ref, COUNT(*) as signups FROM users GROUP BY ref ORDER BY signups DESC;
```
