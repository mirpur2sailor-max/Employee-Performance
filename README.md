# Performance Hub

Employee sales performance app (Performance Hub) for the Mirpur-2 outlet: staff profiles, monthly target allocation, live achievement,
Big Basket, evaluations, watchlist with coaching guidance, confidential explanations, Excel/PDF summary reports.
Plain static website (HTML + JS). No build step.

## 1. Put it online (GitHub Pages)
1. Create a GitHub repository and upload everything in this folder.
2. Settings -> Pages -> Deploy from branch `main` / root. Your address will be `https://<user>.github.io/<repo>/`.

## 2. Shared database (needed so staff see the same data and can send explanations)
1. Create a free project at supabase.com.
2. SQL Editor -> paste `supabase/schema.sql` -> Run.
3. Project Settings -> API: copy the Project URL and the `anon public` key into `js/config.js` (`supabaseUrl`, `supabaseKey`). Commit.
Without these two values the app still runs, but data stays inside one browser only.

## 3. First run
Open the site -> "Set up your outlet" -> choose an admin password -> "Load my starter data" (32 staff, photos,
Jul-Nov 2026 targets and sales from your files). Team -> each profile shows the staff member's access code. Give it to them with their Employee ID.

## 4. Automatic sales updates
The app reads `data/sales.csv` (set in `js/config.js` -> `salesUrl`) on every open page, every 10 minutes.
Make the sales software's publisher overwrite that file in the repository (same columns as Executive Wise Sales Data:
DATE, EMPLOYEE_NAME, INVOICE_NO, SALE QTY, RQTY, TOTAL, VAT AMT, NET AMT; .csv or .xlsx). It can also point to a
`https://raw.githubusercontent.com/<user>/<repo>/main/data/sales.csv` address. Admin -> Sales Data -> "Check for new sales now" forces a refresh.

## 5. Every month
Targets tab -> upload the Executive Wise Sales Target file (or edit day targets and contribution % by hand), review the suggested split, Save.

## Security note
Admin password and staff codes are checked inside the app, and the database key is public by design. This keeps casual access out,
but it is not bank-grade: someone technical who studies the site could read the shared tables, including explanations.
Do not store anything beyond what you are comfortable with at that level. For stronger protection, a server-side login layer can be added later.

## Forgot the admin password
Supabase -> Table editor -> `kv` -> delete the row `col=config, id=main`, reload the site and set up again (staff, sales and targets stay).

## Files
`index.html` · `css/app.css` · `js/*.js` (core, views, storage, sync) · `js/config.js` (your settings) · `data/` (seed + sales) · `tests/` (browser tests).

## Day-to-day answers
- **Staff access:** share the site address. Employees open it, choose the Employee tab, enter Employee ID + access code (Settings -> Employee access codes). On a phone: browser menu -> Add to Home Screen gives the Performance Hub icon.
- **What staff see:** only their own numbers, profile (read-only) and their own explanations. Settings -> Employee view switches rank, evaluation table, day-by-day table (since joining), big baskets and average bill on or off, or pauses all employee sign-ins. Extra tabs (Outlet overview, team leaderboard, Big Basket, Coaching, Reports) stay closed until ticked there; all except the outlet overview and leaderboard show only the employee's own numbers.
- **Daily updates:** achievement comes from `data/sales.csv`. Each day replace it on GitHub with the latest cumulative export (same name). Targets are set once a month in the Targets tab; change them only if the target file changes.
- **Employee leaves:** open the profile -> Edit profile -> set Status to Resigned (with the resign date) or App access to Blocked -> Save. Sign-in stops at once, even on a phone that is already signed in. Their past sales stay in reports.
- **Sales file:** keep ONE cumulative file at `data/sales.csv` (everything from the first day you want to see, e.g. 1 July). Replace it on GitHub (Add file -> Upload files, same name) or let the publisher overwrite it. Do not download and re-upload through the app. The app picks it up within 10 minutes.
- **Target file changed mid-month:** Targets tab. Upload the new file or edit the daily targets and shares. To change shares only from a date forward, fill "Apply from" before saving; earlier days keep their old targets. New joiners, resignations and day-offs are handled automatically from the dates in each profile.
- **Language:** English by default. Settings -> Language sets the default, and everyone can switch with the button at the top. Excel and PDF reports stay in English.
- **Updating the app:** replace the files in the repository with this version but keep your own `js/config.js`.

## Privacy of the repository
GitHub Pages on a free plan needs a public repository, so everything inside it (including `data/sales.csv` and `data/seed.json`, which holds staff names, mobile numbers and photos) can be opened by anyone who guesses the address. After the first "Load starter data", delete `data/seed.json` from the repository. If employee-wise sales must stay private, host from a private repository (GitHub paid plan, or Cloudflare Pages / Netlify connected to a private repo).
