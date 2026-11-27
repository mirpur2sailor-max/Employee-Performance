/* Data store with a Firestore-like surface (doc/collection/get/set/update/delete/onSnapshot).
   Backends: Supabase REST (shared, live) or this browser's localStorage (single device). */
(function () {
  const C = window.APP_CONFIG || {};
  const SHARED = !!(C.supabaseUrl && C.supabaseKey);
  const base = SHARED ? C.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/kv' : '';
  const H = SHARED ? Object.assign({ apikey: C.supabaseKey, 'Content-Type': 'application/json' }, String(C.supabaseKey).startsWith('eyJ') ? { Authorization: 'Bearer ' + C.supabaseKey } : {}) : {};
  const split = p => { const i = p.indexOf('/'); return [p.slice(0, i), p.slice(i + 1)]; };
  const q = s => encodeURIComponent(s);
  const fail = (msg, code) => { const e = new Error(msg); e.code = code; return e; };

  /* ---- backends: list(col) -> [{id,u,data?}], read(col,ids), get, put, del ---- */
  const mem = {};
  const ls = {
    r(k) { try { const v = localStorage.getItem(k); return v == null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; } },
    w(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
    d(k) { try { localStorage.removeItem(k); } catch (e) {} delete mem[k]; },
    ids(col) { const o = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('sh:' + col + '/')) o.push(k.slice(col.length + 4)); } } catch (e) {} for (const k in mem) if (k.startsWith('sh:' + col + '/')) o.push(k.slice(col.length + 4)); return [...new Set(o)]; }
  };
  const B = SHARED ? {
    async list(col) { const r = await fetch(`${base}?col=eq.${q(col)}&select=id,updated_at`, { headers: H }); if (!r.ok) throw fail('Data store error ' + r.status, r.status === 401 || r.status === 403 ? 'permission_denied' : 'unavailable'); return (await r.json()).map(x => ({ id: x.id, u: x.updated_at })); },
    async read(col, ids) { if (!ids.length) return []; const out = []; for (let i = 0; i < ids.length; i += 40) { const part = ids.slice(i, i + 40); const r = await fetch(`${base}?col=eq.${q(col)}&id=in.(${part.map(x => '"' + String(x).replace(/"/g, '') + '"').join(',')})&select=id,data,updated_at`, { headers: H }); if (!r.ok) throw fail('Data store error ' + r.status, 'unavailable'); out.push(...await r.json()); } return out.map(x => ({ id: x.id, u: x.updated_at, data: x.data })); },
    async get(col, id) { const r = await fetch(`${base}?col=eq.${q(col)}&id=eq.${q(id)}&select=data`, { headers: H }); if (!r.ok) throw fail('Data store error ' + r.status, 'unavailable'); const a = await r.json(); return a.length ? a[0].data : undefined; },
    async put(col, id, data) { const r = await fetch(`${base}?on_conflict=col,id`, { method: 'POST', headers: Object.assign({ Prefer: 'resolution=merge-duplicates,return=minimal' }, H), body: JSON.stringify([{ col, id, data, updated_at: new Date().toISOString() }]) }); if (!r.ok) throw fail('Could not save (' + r.status + ')', r.status === 401 || r.status === 403 ? 'permission_denied' : 'unavailable'); },
    async del(col, id) { const r = await fetch(`${base}?col=eq.${q(col)}&id=eq.${q(id)}`, { method: 'DELETE', headers: H }); if (!r.ok) throw fail('Could not delete (' + r.status + ')', 'unavailable'); }
  } : {
    async list(col) { return ls.ids(col).map(id => ({ id, u: String((ls.r('sh:' + col + '/' + id) || '').length) })); },
    async read(col, ids) { return ids.map(id => ({ id, data: JSON.parse(ls.r('sh:' + col + '/' + id) || 'null') })).filter(x => x.data != null); },
    async get(col, id) { const v = ls.r('sh:' + col + '/' + id); return v == null ? undefined : JSON.parse(v); },
    async put(col, id, data) { ls.w('sh:' + col + '/' + id, JSON.stringify(data)); },
    async del(col, id) { ls.d('sh:' + col + '/' + id); }
  };

  /* ---- change tracking: one poller per collection ---- */
  const cache = {};            // col -> {sig:{id:u}, docs:{id:data}}
  const watchers = {};         // col -> Set(fn)
  const timers = {};
  const POLL = { salesParts: 180 };
  async function refresh(col) {
    const c = cache[col] || (cache[col] = { sig: {}, docs: {}, loaded: false });
    const list = await B.list(col); const seen = {}; const changed = [];
    list.forEach(x => { seen[x.id] = 1; if (!c.loaded || c.sig[x.id] !== x.u || !(x.id in c.docs)) changed.push(x.id); });
    let dirty = !c.loaded;
    for (const id in c.docs) if (!seen[id]) { delete c.docs[id]; delete c.sig[id]; dirty = true; }
    if (changed.length) { (await B.read(col, changed)).forEach(x => { c.docs[x.id] = x.data; c.sig[x.id] = x.u; }); dirty = true; }
    list.forEach(x => { if (!(x.id in c.sig)) c.sig[x.id] = x.u; });
    c.loaded = true; return dirty;
  }
  async function tick(col, force) {
    const ws = watchers[col]; if (!ws || !ws.size) return;
    try { const d = await refresh(col); if (d || force) ws.forEach(f => f.ok()); } catch (e) { ws.forEach(f => f.err && f.err(e)); }
  }
  function watch(col, ok, err) {
    const w = { ok, err }; (watchers[col] || (watchers[col] = new Set())).add(w);
    if (!timers[col]) timers[col] = setInterval(() => { if (!document.hidden) tick(col); }, (POLL[col] || (C.pollSec || 10)) * 1000);
    tick(col, true); return () => watchers[col].delete(w);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) Object.keys(watchers).forEach(c => tick(c)); });

  const snap = (id, d) => ({ id, exists: d !== undefined && d !== null, data: () => d == null ? undefined : JSON.parse(JSON.stringify(d)) });
  const clone = o => JSON.parse(JSON.stringify(o));
  function doc(path) {
    const [col, id] = split(path);
    return {
      path, id,
      async get() { const c = cache[col]; if (c && c.loaded && id in c.docs) return snap(id, c.docs[id]); return snap(id, await B.get(col, id)); },
      async set(d) { await B.put(col, id, clone(d)); const c = cache[col]; if (c) { c.docs[id] = clone(d); c.sig[id] = 'local' + Date.now(); } setTimeout(() => tick(col, true), 0); },
      async update(d) { const cur = (await B.get(col, id)) || {}; return this.set(Object.assign({}, cur, d)); },
      async delete() { await B.del(col, id); const c = cache[col]; if (c) { delete c.docs[id]; delete c.sig[id]; } setTimeout(() => tick(col, true), 0); },
      onSnapshot(ok, err) { return watch(col, () => { const c = cache[col]; ok(snap(id, c && id in c.docs ? c.docs[id] : undefined)); }, err); }
    };
  }
  function collection(col) {
    const mk = () => { const c = cache[col] || { docs: {} }; const docs = Object.keys(c.docs).sort().map(i => snap(i, c.docs[i])); return { docs, size: docs.length, empty: !docs.length }; };
    return {
      path: col, doc: id => doc(col + '/' + (id || Math.random().toString(36).slice(2))),
      async get() { await refresh(col); return mk(); },
      onSnapshot(ok, err) { return watch(col, () => ok(mk()), err); }
    };
  }

  /* ---- downloads ---- */
  async function save({ filename, data }) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000); return { status: 'saved' };
  }

  const api = {
    db: { doc, collection },
    user: { id: async () => 'local', canEdit: async () => true, isOwner: async () => false, can: async () => true },
    downloads: { save }
  };
  window.claude = { use: async n => api[n] || null, shared: SHARED };
})();
