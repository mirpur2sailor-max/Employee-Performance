/* Automatic sales sync: reads the sales report from the repository (GitHub Pages / raw URL) on every open page. */
const SALES_URL = (window.APP_CONFIG || {}).salesUrl || '';
const SALES_EVERY = ((window.APP_CONFIG || {}).salesRefreshMin || 10) * 60000;
async function syncSales(manual) {
  if (!SALES_URL) return false;
  S.syncing = true; if (manual) schedule();
  try {
    const url = SALES_URL + (SALES_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status === 404 ? 'The sales file was not found at ' + SALES_URL : 'The sales file could not be read (HTTP ' + r.status + ').');
    const blob = await r.blob();
    const sig = blob.size + ':' + (r.headers.get('etag') || r.headers.get('last-modified') || '');
    if (S.remote && S.remote.sig === sig) { S.remote.checkedAt = Date.now(); S.syncErr = null; return false; }
    const res = await parseSales(new File([blob], SALES_URL.split('/').pop().split('?')[0] || 'sales.csv'));
    const months = {}; res.rows.forEach(x => { const m = x[1].slice(0, 7); (months[m] || (months[m] = { rows: 0 })).rows++; });
    S.remote = { sig, rows: res.rows, fetchedAt: Date.now(), checkedAt: Date.now(), url: SALES_URL };
    S.meta = { months, lastDate: res.max, firstDate: res.min, source: SALES_URL, uploadedAt: new Date().toISOString(), names: res.names };
    S.syncErr = null; rebuild(); return true;
  } catch (e) { S.syncErr = e.message || 'Sync failed.'; return false; }
  finally { S.syncing = false; schedule(); }
}
function startSalesSync() { if (!SALES_URL) return; syncSales(); setInterval(() => { if (!document.hidden) syncSales(); }, SALES_EVERY); document.addEventListener('visibilitychange', () => { if (!document.hidden && S.remote && Date.now() - S.remote.checkedAt > 60000) syncSales(); }); }
function syncCard() {
  if (!SALES_URL) return html`<div class="card"><h3>Automatic sync from GitHub</h3><p style="margin:0">No sales file address is set. Put the address of the published sales report in <code>js/config.js</code> (<code>salesUrl</code>). Until then, drop the file above.</p></div>`;
  const R = S.remote;
  return html`<div class="card"><h3>Automatic sync from GitHub</h3>
  <p class="small muted" style="margin:0 0 8px">The app reads <b>${SALES_URL}</b> by itself every ${Math.round(SALES_EVERY / 60000)} minutes. When the sales software publishes a newer file there, every employee sees the update without any upload.</p>
  ${S.syncErr ? html`<div class="note bad">${S.syncErr} Showing the last data that loaded.</div>` : ''}
  ${R ? html`<p class="small" style="margin:0 0 8px">Loaded ${fmt(R.rows.length)} invoices · sales up to <b>${dLabelY(S.meta.lastDate)}</b> · checked ${new Date(R.checkedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>` : html`<p class="small muted">Not loaded yet.</p>`}
  <button class="btn sm" data-act="syncNow" ${S.syncing ? 'disabled' : ''}>${S.syncing ? 'Checking…' : 'Check for new sales now'}</button>
  ${R ? html`<p class="small muted" style="margin:8px 0 0">While this file is connected it is the source of truth. A file dropped above is saved to the database but does not override it.</p>` : ''}</div>`;
}
