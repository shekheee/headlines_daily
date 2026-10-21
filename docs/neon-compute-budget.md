# Neon free compute budget

The production project is `soft-heart-60989635` (daily_news). At 0.25 CU,
100 CU-hours covers 400 active hours: 12.9 hours/day in a 31-day month.
Aim below 80 CU-hours (10.3 active hours/day) to retain a safety margin.
Compute is billed for active time, not article count or SQL query count.

## Controls

- Endpoint fixed at 0.25 CU with the default five-minute idle suspension.
- App connection pools release idle clients after ten seconds, max three clients.
- New visitor writes are disabled by default. Recorded totals remain visible;
  they are not a live analytics metric. `ENABLE_LIVE_VISITOR_COUNTS=true` opts
  back in, but every new browser can extend database active time.
- Shared six-hour search index also supplies category pagination, related
  articles, and invalid article URL checks. Arbitrary search terms do not
  create arbitrary database cache misses.
- Home data refreshes at most every six hours. Article bodies retain a 30-day
  cache; edits/deletions invalidate the exact URL. Daily publication invalidates
  listings, feed and sitemaps without flushing the archive.
- Daily News calls the protected `/api/revalidate` endpoint using CRON_SECRET.
  This secret must match between Vercel and GitHub Actions.
- Neon Compute Budget runs daily through the management API, without a SQL
  connection. It fails if projected usage exceeds 80 CU-hours or 100 are used.
  GitHub notification settings determine whether a failure generates an email.

## Verification and limits

Review actual usage in Neon after 24–48 hours; a projection from the month's
historical average initially still includes usage before these changes. Existing
consumption cannot be recovered. High sustained traffic or many uncached
articles can still exceed the allowance. Do not claim a full month is guaranteed
until the observed rate stays below the budget; use CDN content snapshots or a
paid tier if the database cannot remain idle sufficiently often.

Normal publication and social jobs remain enabled. Never turn off the database
on a timer to save compute: that would break admin, publishing and cold pages.
