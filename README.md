# Sailor Performance Hub

Employee sales performance app for the Mirpur-2 outlet: staff profiles, monthly target allocation, live achievement,
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
