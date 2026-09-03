# Task 06: Manually maintained static standings

Implemented for the top five European leagues and Ekstraklasa. The user replaced
the earlier API-Football proposal with manual updates on request.

Read published standings pages, preserve their ranking and records, and commit
one JSON per league in public/data. Every file includes season, checkedAt and
source links. No API, secret, cron or automated scraper is part of this flow.

The browser fetches committed files; shared schema/accounting validation runs
in both the browser and GitHub Actions. Failed loads keep the previous table
and provide Retry. See README.md for the complete update procedure.
