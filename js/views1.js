/* ============ shared UI ============ */
const avatar=(st,cls='')=>html`<span class="av ${cls}">${st&&st.photo?html`<img src="${st.photo}" alt="">`:initials(st&&st.name)}</span>`;
const personCell=st=>html`<div class="person">${avatar(st)}<div><b>${st.name}</b><span class="muted small">${st.id} · ${st.designation||''}</span></div></div>`;
function periodBar(){
  const k=S.period.key;const chips=[['today','Today'],['week','Week'],['month','Month'],['lastmonth','Last month'],['quarter','Quarter'],['fy','Year (FY)'],['custom','Custom']];
  return html`<div class="card"><div class="pbar">${chips.map(([x,l])=>html`<button class="chip ${k===x?'on':''}" data-act="period" data-arg="${x}">${l}</button>`)}
   ${k==='custom'?html`<span class="row"><input type="date" id="pf" value="${S.period.from}" style="width:150px"><span class="muted">to</span><input type="date" id="pt" value="${S.period.to}" style="width:150px"><button class="btn sm pri" data-act="applyCustom">Apply</button></span>`:''}
   <span class="sp"></span><span class="muted small">${periodLabel()} · sales data up to ${dLabelY(S.asOf)}</span></div></div>`;
}
function noData(){return html`<div class="card"><div class="empty"><b>No sales data yet.</b><br>Go to <button class="btn sm" data-act="nav" data-arg="data">Sales Data</button> and upload your executive-wise sales report.</div></div>`}
const hasData=()=>Object.keys(S.rows).length>0;

/* ============ login / setup ============ */
function viewLoading(){return html`<div class="login"><div class="hero"><h1>Performance Hub</h1><p>${S.loadErr||'Loading your outlet data…'}</p></div></div>`}
function viewNoDb(){return html`<div class="login"><div class="hero"><h1>Performance Hub</h1><p>The data store could not be opened.</p></div><div class="card">Check js/config.js (Supabase URL and key) and your internet connection, then reload.</div></div>`}
function viewSetup(){
  const st=S.setup;
  if(!S.canEdit&&!S.isOwner)return html`<div class="login"><div class="hero"><h1>Performance Hub</h1><p>This outlet has not been set up yet.</p></div><div class="card">The outlet administrator has to open the app once and finish the setup.</div></div>`;
  return html`<div class="login"><div class="hero"><h1>Set up your outlet</h1><p>One-time setup. You become the administrator.</p></div>
  <div class="card"><div class="form">
   <div class="f full"><label for="su-outlet">Outlet name</label><input id="su-outlet" value="Mirpur-2 Outlet"></div>
   <div class="f"><label for="su-pw">Admin password</label><input id="su-pw" type="password" autocomplete="new-password"></div>
   <div class="f"><label for="su-pw2">Repeat password</label><input id="su-pw2" type="password" autocomplete="new-password"></div>
   <div class="f full"><label class="row" style="text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink)"><input type="checkbox" id="su-seed" checked style="width:auto;min-height:0"> Load my starter data (32 staff with photos, Jul–Nov 2026 targets and sales)</label></div>
   <div class="full"><button class="btn pri" data-act="doSetup" ${S.busy?'disabled':''}>${S.busy||'Create admin account'}</button></div>
  </div></div></div>`;
}
function viewLogin(){
  const t=S.loginTab;
  return html`<div class="login"><div class="hero"><img src="img/logo-white.png" alt="Sailor" class="herologo"><h1>Performance Hub</h1><p>${cfg().outlet} · live sales performance</p></div>
  <div class="row" style="justify-content:flex-end;margin:-4px 0 8px"><button class="btn sm" data-act="setLang" data-arg="${lang()==='bn'?'en':'bn'}">${lang()==='bn'?'English':'বাংলা'}</button></div>
  <div class="seg"><button class="${t==='emp'?'on':''}" data-act="loginTab" data-arg="emp">Employee</button><button class="${t==='admin'?'on':''}" data-act="loginTab" data-arg="admin">Admin</button></div>
  <div class="card">${t==='reset'?html`<div class="form" style="grid-template-columns:1fr"><div class="note">You are the page owner, so you can set a new admin password.</div><div class="f"><label for="l-new">New admin password</label><input id="l-new" type="password" autocomplete="new-password"></div><button class="btn pri" data-act="ownerSetPw">Set password and open admin</button><button class="btn sm" data-act="loginTab" data-arg="admin">Back</button></div>`:t==='emp'?html`<div class="form" style="grid-template-columns:1fr">
    <div class="f"><label for="l-id">Employee ID</label><input id="l-id" inputmode="numeric" autocomplete="username" placeholder="e.g. 195975"></div>
    <div class="f"><label for="l-code">Access code</label><input id="l-code" type="password" inputmode="numeric" autocomplete="current-password"></div>
    <button class="btn pri" data-act="loginEmp">Open my performance</button><span class="muted small">Your access code is given by your branch in-charge.</span></div>`
   :html`<div class="form" style="grid-template-columns:1fr">
    <div class="f"><label for="l-pw">Admin password</label><input id="l-pw" type="password" autocomplete="current-password"></div>
    <button class="btn pri" data-act="loginAdmin">Open admin panel</button>
    ${S.isOwner?html`<button class="btn sm" data-act="loginTab" data-arg="reset">Forgot password? Reset as page owner</button>`:''}</div>`}</div></div>`;
}
const ADMIN_TABS=[['overview','Overview'],['team','Team'],['targets','Targets'],['data','Sales Data'],['bigbasket','Big Basket'],['watch','Watchlist'],['explain','Explanations'],['reports','Reports'],['settings','Settings']];
function masthead(){
  const me=S.role==='emp'?S.staff[S.empId]:null;
  const tabs=isAdmin()?ADMIN_TABS:[['home','My Performance'],['profile','My Profile'],['explainme','Explanations']];
  const cur=isAdmin()?S.view:S.empTab;
  return html`<div class="mast"><div class="mast-row"><div class="brand"><img src="img/logo-white.png" alt="Sailor" class="logo"><span class="pname">Performance Hub<small>${cfg().outlet}</small></span></div><span class="sp"></span>
   <div class="who"><button class="btn sm ghost lang" data-act="setLang" data-arg="${lang()==='bn'?'en':'bn'}" title="Language">${lang()==='bn'?'English':'বাংলা'}</button>${me?avatar(me):''}<span>${isAdmin()?'Administrator':me?me.name:''}</span><button class="btn sm ghost" data-act="logout">Log out</button></div></div>
   <div class="tabs" role="tablist">${tabs.map(([k,l])=>html`<button class="tab ${cur===k?'on':''}" data-act="${isAdmin()?'nav':'empnav'}" data-arg="${k}" role="tab">${l}</button>`)}</div></div>`;
}

/* ============ Overview ============ */
function chartDaily(a,b){
  b=clipTo(b);const days=rangeDays(a,b);if(days.length>100)return html`<div class="empty">Pick a period of up to 100 days to see the daily chart.</div>`;
  const all=[];for(const id in S.rows)for(const r of S.rows[id])if(r.d>=a&&r.d<=b)all.push(r);
  const act={};all.forEach(r=>act[r.d]=(act[r.d]||0)+r.amt);
  const tg={};days.forEach(d=>{const t=S.targets[mk(d)];tg[d]=t&&t.days?+t.days[+d.slice(8)]||0:0});
  const mx=Math.max(1,...days.map(d=>Math.max(act[d]||0,tg[d])))*1.1;
  const W=720,H=230,L=46,R=8,T=10,B=26,iw=W-L-R,ih=H-T-B,bw=iw/days.length;
  const y=v=>T+ih-(v/mx)*ih;const ticks=[0,.25,.5,.75,1].map(f=>f*mx);
  const step=Math.ceil(days.length/12);
  const bars=days.map((d,i)=>{const v=act[d]||0,x=L+i*bw+bw*0.14,w=Math.max(1,bw*0.72);const ok=tg[d]>0&&v>=tg[d];
    return `<rect x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${w.toFixed(1)}" height="${(T+ih-y(v)).toFixed(1)}" rx="2" fill="${ok?'var(--good)':'var(--accent)'}" opacity=".88"><title>${dLabel(d)}: ${taka(v)} (target ${taka(tg[d])})</title></rect>`}).join('');
  const line=days.map((d,i)=>`${i?'L':'M'}${(L+i*bw+bw/2).toFixed(1)} ${y(tg[d]).toFixed(1)}`).join('');
  const xl=days.map((d,i)=>i%step===0?`<text x="${(L+i*bw+bw/2).toFixed(1)}" y="${H-8}" text-anchor="middle">${dLabel(d)}</text>`:'').join('');
  const yl=ticks.map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${L-6}" y="${(y(v)+4).toFixed(1)}" text-anchor="end">${short(v)}</text>`).join('');
  return html`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily sales against target">${raw(yl+bars)}<path d="${line}" fill="none" stroke="var(--warn)" stroke-width="2" stroke-dasharray="5 4"/>${raw(xl)}</svg>
  <div class="row small muted" style="margin-top:6px"><span><b style="color:var(--accent)">▮</b> Sales</span><span><b style="color:var(--good)">▮</b> Day target met</span><span><b style="color:var(--warn)">- -</b> Daily target</span></div>`;
}
function viewOverview(){
  if(!hasData())return noData();
  const {from,to}=S.period;const m=outletMetrics(from,to);const bb=m.big;
  const mm=mk(S.asOf);const fullT=outletMonthTarget(mm),mAch=outletMetrics(mm+'-01',S.asOf).ach;
  const left=+monthEnd(mm).slice(8)-+S.asOf.slice(8);const proj=(()=>{const dd=+S.asOf.slice(8);return dd?mAch/dd*(+monthEnd(mm).slice(8)):0})();
  const req=left>0?Math.max(0,fullT-mAch)/left:0;
  const td=outletMetrics(S.asOf,S.asOf);
  const rows=staffList().map(s=>({s,m:empMetrics(s.id,from,to)})).filter(x=>x.m.target>0||x.m.ach>0).sort((a,b)=>(b.m.pct??-1)-(a.m.pct??-1));
  const secs={};rows.forEach(x=>{const k=x.s.section||'OTHERS';const o=secs[k]||(secs[k]={t:0,a:0,n:0});o.t+=x.m.target;o.a+=x.m.ach;o.n++});
  const known=rows.reduce((a,x)=>a+x.m.ach,0),unk=m.ach-known;
  return html`${periodBar()}
  <div class="kpis">
   <div class="kpi"><div class="l">Target</div><div class="v">${taka(m.target)}</div><div class="s">${fmt(rangeDays(from,clipTo(to)).length)} days to date</div></div>
   <div class="kpi"><div class="l">Achieved</div><div class="v">${taka(m.ach)}</div><div class="s">${pct(m.pct,1)} of target</div></div>
   <div class="kpi"><div class="l">Status</div><div class="v" style="font-size:19px">${pillB(m.pct)}</div><div class="s">${m.target?taka(m.ach-m.target)+(m.ach>=m.target?' ahead':' behind'):''}</div></div>
   <div class="kpi"><div class="l">Invoices · Avg bill</div><div class="v">${fmt(m.inv)}</div><div class="s">${taka(m.atv)} per invoice · ${m.upt.toFixed(2)} units</div></div>
   <div class="kpi"><div class="l">Big baskets (10K+)</div><div class="v">${fmt(bb)}</div><div class="s">${m.inv?pct(bb/m.inv*100,1):'–'} of invoices</div></div>
   <div class="kpi"><div class="l">Today · ${dLabel(S.asOf)}</div><div class="v">${taka(td.ach)}</div><div class="s">target ${taka(td.target)} · ${pct(td.pct)}</div></div>
  </div>
  <div class="card"><div class="hd"><h3>${monthLabel(mm)} outlook</h3></div><div class="kpis">
   <div><div class="lab">Month target</div><b class="num">${taka(fullT)}</b></div><div><div class="lab">Achieved so far</div><b class="num">${taka(mAch)}</b></div>
   <div><div class="lab">Projected month-end</div><b class="num">${taka(proj)}</b> <span class="muted small">${fullT?pct(proj/fullT*100):''}</span></div>
   <div><div class="lab">Required per remaining day</div><b class="num">${left>0?taka(req):'Month complete'}</b></div></div></div>
  <div class="grid g2"><div class="card"><h3>Daily sales vs target</h3>${chartDaily(from,to)}</div>
   <div class="card"><h3>Section performance</h3><div class="tw"><table><thead><tr><th>Section</th><th class="r">Staff</th><th class="r">Target</th><th class="r">Achieved</th><th class="r">Ach %</th></tr></thead><tbody>
   ${Object.entries(secs).sort((a,b)=>b[1].a-a[1].a).map(([k,o])=>html`<tr><td><b>${k}</b></td><td class="r num">${o.n}</td><td class="r num">${short(o.t)}</td><td class="r num">${short(o.a)}</td><td class="r num"><span class="pill ${band(o.t?o.a/o.t*100:null).k}">${o.t?pct(o.a/o.t*100):'–'}</span></td></tr>`)}</tbody></table></div>
   ${unk>1?html`<p class="small muted">Sales by staff not in the Team list: ${taka(unk)}.</p>`:''}</div></div>
  <div class="card"><div class="hd"><h3>Leaderboard</h3><span class="muted small">Click a name to open the profile</span></div>
   <div class="tw"><table><thead><tr><th>#</th><th>Employee</th><th>Section</th><th class="r">Target</th><th class="r">Achieved</th><th style="min-width:130px">Achievement</th></tr></thead><tbody>
   ${rows.map((x,i)=>html`<tr data-act="profile" data-arg="${x.s.id}" tabindex="0"><td class="num">${i+1}</td><td>${personCell(x.s)}</td><td>${x.s.section}</td><td class="r num">${short(x.m.target)}</td><td class="r num">${short(x.m.ach)}</td>
   <td><div class="row" style="flex-wrap:nowrap"><div class="bar sp"><i class="${band(x.m.pct).k}" style="width:${Math.min(100,x.m.pct||0)}%"></i></div><b class="num small" style="min-width:44px;text-align:right">${pct(x.m.pct)}</b></div></td></tr>`)}</tbody></table></div></div>`;
}

/* ============ Team ============ */
function viewTeam(){
  const f=S.filter;const {from,to}=S.period;
  let list=staffList().filter(s=>(f.status==='all'||(f.status==='active'?isActiveNow(s):!isActiveNow(s)))&&(!f.section||s.section===f.section)&&(!f.q||(s.name+' '+s.id).toLowerCase().includes(f.q.toLowerCase())));
  const rows=list.map(s=>({s,m:empMetrics(s.id,from,to),t:empMetrics(s.id,S.asOf,S.asOf)}));
  const key=S.sort.k;const val=x=>key==='name'?x.s.name:key==='ach'?x.m.ach:key==='inv'?x.m.inv:key==='big'?x.m.big:(x.m.pct??-1);
  rows.sort((a,b)=>{const A=val(a),B=val(b);return (typeof A==='string'?A.localeCompare(B):A-B)*S.sort.dir*(key==='name'?1:-1)});
  const secs=[...new Set(staffList().map(s=>s.section).filter(Boolean))];
  const th=(k,l,r)=>html`<th class="${r?'r':''}"><button class="chip" style="border:0;background:none;padding:0;font:inherit;text-transform:inherit;letter-spacing:inherit;color:inherit;cursor:pointer" data-act="sort" data-arg="${k}">${l}${S.sort.k===k?(S.sort.dir>0?' ↓':' ↑'):''}</button></th>`;
  return html`${periodBar()}
  <div class="card"><div class="hd"><h3>Team · ${rows.length} people</h3>
   <div class="row"><input id="tq" placeholder="Search name or ID" value="${f.q}" style="width:180px">
   <select id="tsec" style="width:130px"><option value="">All sections</option>${secs.map(x=>html`<option ${f.section===x?'selected':''}>${x}</option>`)}</select>
   <select id="tst" style="width:120px">${[['active','Active'],['left','Resigned'],['all','All']].map(([v,l])=>html`<option value="${v}" ${f.status===v?'selected':''}>${l}</option>`)}</select>
   <button class="btn pri" data-act="addStaff">Add staff</button></div></div>
  <div class="tw"><table><thead><tr>${th('name','Employee')}<th>Section</th><th class="r">Today (T/A)</th><th class="r">Period target</th>${th('ach','Achieved',1)}${th('pct','Ach %',1)}<th>Grade</th>${th('inv','Invoices',1)}<th class="r">Avg bill</th>${th('big','10K+',1)}</tr></thead><tbody>
  ${rows.map(({s,m,t})=>html`<tr data-act="profile" data-arg="${s.id}" tabindex="0"><td>${personCell(s)}</td><td>${s.section||''}${isActiveNow(s)?'':html` <span class="pill mute">Resigned</span>`}</td>
   <td class="r num small">${short(t.target)} / ${short(t.ach)}</td><td class="r num">${short(m.target)}</td><td class="r num">${short(m.ach)}</td><td class="r num"><b>${pct(m.pct)}</b></td><td>${pillB(m.pct)}</td><td class="r num">${fmt(m.inv)}</td><td class="r num">${m.inv?fmt(m.atv):'–'}</td><td class="r num">${m.big}</td></tr>`)}
  ${rows.length?'':html`<tr><td colspan="10"><div class="empty">No staff match this filter.</div></td></tr>`}</tbody></table></div></div>`;
}

/* ============ Targets ============ */
function viewTargets(){
  const m=S.tgtMonth;const t=S.targets[m]||{days:{},weights:{}};const n=+monthEnd(m).slice(8);
  const W=S.draftW&&S.draftW.m===m?S.draftW.w:Object.assign({},latestW(t));
  const sug=Object.fromEntries(suggestWeights(m).map(r=>[r.id,r]));
  const list=staffList().filter(s=>W[s.id]>0||(sug[s.id]&&isActiveNow(s)&&activeOn(s,monthEnd(m)))).sort((a,b)=>(+W[b.id]||0)-(+W[a.id]||0));
  const sumW=list.reduce((a,s)=>a+(+W[s.id]||0),0);const dt=outletMonthTarget(m);
  const prev=prevMonth(m);
  const tmpTargets=Object.assign({},S.targets);const saved=S.targets[m];S.targets[m]={days:t.days,weights:W};delete S.tcache[m];
  const calc=dayTargets(m);
  const rowsHtml=list.map(s=>{const sg=sug[s.id];const mt=(calc[s.id]||[]).reduce((a,b)=>a+b,0);
    const ex=expMonths(s,m+'-01');
    return html`<tr><td>${personCell(s)}</td><td>${s.section||''}</td><td class="r num">${ex<1?'<1 mo':ex.toFixed(0)+' mo'}</td>
    <td class="r num small" title="${sg?`Designation ${sg.base} × Section ${sg.sec} × Performance ${sg.perf.toFixed(2)} × Experience ${sg.exp}`:''}">${sg?sg.pct.toFixed(1)+'%':'–'}</td>
    <td class="r" style="width:96px"><input class="wi" data-emp="${s.id}" type="number" step="0.1" min="0" value="${W[s.id]||0}" style="text-align:right"></td>
    <td class="r num">${taka(mt)}</td><td class="r num small muted">${s.dayOff||'–'}</td></tr>`});
  const days=rangeDays(m+'-01',monthEnd(m));
  const matrix=html`<div class="tw" style="max-height:420px"><table class="matrix"><thead><tr><th>Employee</th>${days.map(d=>html`<th title="${WD[dowOf(d)]}">${+d.slice(8)}<br><span style="font-weight:400">${WD[dowOf(d)].slice(0,2)}</span></th>`)}<th>Total</th></tr></thead><tbody>
   <tr><td><b>Outlet target</b></td>${days.map(d=>html`<td><b>${short(+(t.days||{})[+d.slice(8)]||0)}</b></td>`)}<td><b>${short(dt)}</b></td></tr>
   ${list.map(s=>html`<tr><td>${s.name}</td>${days.map((d,i)=>{const v=(calc[s.id]||[])[i+1]||0;return html`<td class="${v?'':'off'}">${v?(v/1000).toFixed(1)+'k':'off'}</td>`})}<td><b>${short((calc[s.id]||[]).reduce((a,b)=>a+b,0))}</b></td></tr>`)}</tbody></table></div>`;
  S.targets=tmpTargets;if(saved)S.targets[m]=saved;else delete S.targets[m];delete S.tcache[m];
  const months=[...new Set([...Object.keys(S.targets),mk(S.asOf),nextMonth(mk(S.asOf))])].sort();
  return html`<div class="card"><div class="hd"><div class="row"><button class="btn sm" data-act="tgtMonth" data-arg="${prev}">‹</button><h2>${monthLabel(m)}</h2><button class="btn sm" data-act="tgtMonth" data-arg="${nextMonth(m)}">›</button>
   <select id="tmsel" style="width:130px">${months.map(x=>html`<option value="${x}" ${x===m?'selected':''}>${monthLabel(x)}</option>`)}</select></div>
   <div class="row"><button class="btn" data-act="openUpload" data-arg="target">Upload target file</button></div></div>
   <p class="muted small" style="margin:8px 0 0">The outlet gives one target per day. Each day it is divided among the people working that day (day-off and resigned staff are skipped) in proportion to their share below.</p></div>
  <div class="card"><div class="hd"><h3>1 · Outlet daily target</h3><span class="muted small">Month total <b class="num">${taka(dt)}</b></span></div>
   <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px">${days.map(d=>html`<div class="f"><label for="d${+d.slice(8)}">${+d.slice(8)} ${WD[dowOf(d)].slice(0,3)}</label><input class="di" id="d${+d.slice(8)}" data-day="${+d.slice(8)}" type="number" min="0" step="1000" value="${+(t.days||{})[+d.slice(8)]||''}"></div>`)}</div>
   <div class="row" style="margin-top:12px"><button class="btn pri" data-act="saveDays">Save daily targets</button><span class="muted small">Leave a day empty for no target.</span></div></div>
  <div class="card"><div class="hd"><h3>2 · Share of target by employee</h3><div class="row">
   <button class="btn sm" data-act="applySuggest">Use suggested shares</button><button class="btn sm" data-act="copyPrev" data-arg="${prev}">Copy ${monthLabel(prev)}</button><button class="btn sm" data-act="normW">Make 100%</button><label class="row small" style="gap:6px">Apply from <input id="w-from" type="date" min="${m}-01" max="${monthEnd(m)}" style="width:150px"></label><button class="btn sm pri" data-act="saveW">Save shares</button></div></div>
   ${(t.wv&&t.wv.length)?html`<div class="note" style="margin:8px 0">Share changes during this month: ${t.wv.map(v=>html`<span class="pill mute">from ${dLabelY(v.from)} <a href="#" data-act="rmWv" data-arg="${v.from}" style="margin-left:4px">remove</a></span> `)}<div class="small muted" style="margin-top:4px">Days before the first change use the original shares. The table below shows the latest shares.</div></div>`:''}
   <p class="small muted" style="margin:6px 0 0">Leave "Apply from" empty to change the whole month. Pick a date to change shares only from that day; earlier days keep their old targets.</p>
   <p class="small muted" style="margin:0 0 10px">Suggested share weighs designation, section, last month's performance and months of experience. Change the weights in Settings. You can overwrite any number.</p>
   <div class="note ${Math.abs(sumW-100)<0.15?'':'warn'}" style="margin-bottom:10px">Shares total <b class="num" id="sumw">${sumW.toFixed(1)}%</b>${Math.abs(sumW-100)<0.15?' — complete.':' — the daily targets are still split fairly, but the total should be 100%.'}</div>
   <div class="tw"><table><thead><tr><th>Employee</th><th>Section</th><th class="r">Experience</th><th class="r">Suggested</th><th class="r">Share %</th><th class="r">Month target</th><th class="r">Day off</th></tr></thead><tbody>${rowsHtml}</tbody></table></div></div>
  <div class="card"><div class="hd"><h3>3 · Day-by-day target per employee</h3><span class="muted small">Values in thousands (k)</span></div>${matrix}</div>`;
}

/* ============ Sales data ============ */
function viewData(){
  const months=Object.entries((S.meta&&S.meta.months)||{}).sort();
  const un={};for(const id in S.rows)if(!S.staff[id])un[id]=(un[id]||0)+S.rows[id].reduce((a,r)=>a+r.amt,0);
  return html`${S.remote?'':html`<div class="card"><div class="hd"><h3>Upload sales report</h3></div>
   <div class="dz" id="dz-sales" data-act="pick" data-arg="sales"><b>Drop the Executive Wise Sales Data file here</b><br><span class="muted">or click to choose (.xlsx or .csv). Days in the file replace the same days already saved; other days are kept.</span></div>
   <input type="file" id="f-sales" accept=".xlsx,.xls,.csv" hidden>
   ${S.upload&&S.upload.kind==='sales'?uploadPreview():''}</div>`}
  <div class="card"><h3>Saved sales data</h3>${months.length?html`<div class="tw"><table><thead><tr><th>Month</th><th class="r">Invoice lines</th><th class="r">Sales (${cfg().basis==='ex'?'ex-VAT':cfg().basis==='net'?'net incl. VAT':'gross'})</th></tr></thead><tbody>
   ${months.map(([k,v])=>html`<tr><td>${monthLabel(k)}</td><td class="r num">${fmt(v.rows)}</td><td class="r num">${taka(outletMetrics(k+'-01',monthEnd(k)).ach)}</td></tr>`)}</tbody></table></div>
   <p class="small muted">Latest sale date ${S.meta?dLabelY(S.meta.lastDate):'–'} · last file ${S.meta?E(S.meta.source||''):''}${S.meta&&S.meta.uploadedAt?' · uploaded '+new Date(S.meta.uploadedAt).toLocaleString('en-GB'):''}</p>`:html`<div class="empty">Nothing saved yet.</div>`}</div>
  ${Object.keys(un).length?html`<div class="card"><h3>Sales by IDs that are not in the Team list</h3><p class="small muted">These sales are counted in the outlet totals but not in anyone's profile. Add them as staff to include them.</p><div class="tw"><table><thead><tr><th>ID</th><th>Name in report</th><th class="r">Sales</th><th></th></tr></thead><tbody>
   ${Object.entries(un).sort((a,b)=>b[1]-a[1]).slice(0,25).map(([id,a])=>html`<tr><td>${id}</td><td>${(S.meta&&S.meta.names&&S.meta.names[id])||''}</td><td class="r num">${taka(a)}</td><td class="r"><button class="btn sm" data-act="addStaff" data-arg="${id}">Add as staff</button></td></tr>`)}</tbody></table></div></div>`:''}
  ${syncCard()}`;
}
function uploadPreview(){
  const u=S.upload;if(u.error)return html`<div class="note bad" style="margin-top:12px">${u.error}</div>`;
  if(u.busy)return html`<div class="note" style="margin-top:12px">${u.busy}</div>`;
  if(u.kind==='sales'){const r=u.res;
   return html`<div style="margin-top:14px" class="grid"><div class="note">Read <b>${fmt(r.lines)}</b> lines → <b>${fmt(r.rows.length)}</b> invoices from <b>${dLabelY(r.min)}</b> to <b>${dLabelY(r.max)}</b> · ${r.emps} employees · sales ${taka(r.total)}${r.skipped?` · ${r.skipped} lines without an employee ID skipped`:''}</div>
   <div class="row"><button class="btn pri" data-act="saveSales" ${S.busy?'disabled':''}>Save and update everyone</button><button class="btn" data-act="cancelUpload">Cancel</button></div></div>`;}
  if(u.kind==='target'){const r=u.res;
   return html`<div style="margin-top:14px" class="grid"><div class="note">Found daily targets for <b>${r.months.map(monthLabel).join(', ')}</b> (${r.days} days, total ${taka(r.total)}) and ${r.staff} employees.</div>
   <div class="row"><label class="row small"><input type="checkbox" id="tu-days" checked style="width:auto;min-height:0"> Daily outlet targets</label><label class="row small"><input type="checkbox" id="tu-w" checked style="width:auto;min-height:0"> Employee shares</label><label class="row small">Apply shares from <input id="tu-from" type="date" style="width:150px"></label><label class="row small"><input type="checkbox" id="tu-st" style="width:auto;min-height:0"> Add new employees from the file</label></div>
   <div class="row"><button class="btn pri" data-act="saveTargets">Save targets</button><button class="btn" data-act="cancelUpload">Cancel</button></div></div>`;}
  return '';
}

/* ============ Big basket ============ */
function viewBig(){
  if(!hasData())return noData();
  const {from,to}=S.period;const mode=S.bb.mode;
  const bands=SLABS.map((s,i)=>({lo:s,hi:SLABS[i+1]||Infinity,l:SLABS[i+1]?`${s/1000}–${SLABS[i+1]/1000}K`:`${s/1000}K+`}));
  const rows=staffList().map(s=>{const m=empMetrics(s.id,from,to,S.bb.thr);return {s,m}}).filter(x=>x.m.inv>0||x.m.target>0).sort((a,b)=>b.m.sl[1]-a.m.sl[1]);
  const o=outletMetrics(from,to);
  const cell=(m,i)=>mode==='atleast'?m.sl[i]:m.sl[i]-(m.sl[i+1]||0);
  return html`${periodBar()}
  <div class="card"><div class="hd"><div><h3>Big basket · invoices by bill size</h3><span class="muted small">A big basket is one invoice at or above the amount. Amounts use ${cfg().basis==='ex'?'sales ex-VAT':cfg().basis==='net'?'net sales incl. VAT':'gross sales'}.</span></div>
   <div class="row"><div class="pbar"><button class="chip ${mode==='atleast'?'on':''}" data-act="bbmode" data-arg="atleast">This amount or more</button><button class="chip ${mode==='band'?'on':''}" data-act="bbmode" data-arg="band">Exact bands</button></div></div></div>
  <div class="tw"><table><thead><tr><th>Employee</th><th class="r">Invoices</th><th class="r" style="background:var(--accent-soft)">Big basket (10K+)</th>${bands.map(b=>html`<th class="r">${mode==='atleast'?'≥ '+b.lo/1000+'K':b.l}</th>`)}<th class="r">10K+ share</th></tr></thead><tbody>
   ${rows.map(({s,m})=>html`<tr data-act="profile" data-arg="${s.id}" tabindex="0"><td>${personCell(s)}</td><td class="r num">${m.inv}</td><td class="r num" style="background:var(--accent-soft)"><b>${m.sl[1]}</b></td>${bands.map((b,i)=>html`<td class="r num">${cell(m,i)||html`<span class="muted">0</span>`}</td>`)}<td class="r num">${m.inv?pct(m.sl[1]/m.inv*100,1):'–'}</td></tr>`)}</tbody>
   <tfoot><tr><td>Outlet total</td><td class="r num">${o.inv}</td><td class="r num">${o.sl[1]}</td>${bands.map((b,i)=>html`<td class="r num">${cell(o,i)}</td>`)}<td class="r num">${o.inv?pct(o.sl[1]/o.inv*100,1):'–'}</td></tr></tfoot></table></div></div>`;
}

/* ============ Watchlist ============ */
function viewWatch(){
  if(!hasData())return noData();
  const {from,to}=S.period;const lo=cfg().poorBelow;
  const ws=weekStarts(8);
  const all=staffList().filter(isActiveNow).map(s=>({s,m:empMetrics(s.id,from,to),wk:ws.map(w=>empMetrics(s.id,w,addDays(w,6)).pct)}));
  const poor=all.filter(x=>x.m.pct!=null&&x.m.pct<lo).sort((a,b)=>a.m.pct-b.m.pct);
  const streak=wk=>{let n=0;for(let i=wk.length-1;i>=0;i--){if(wk[i]!=null&&wk[i]<lo)n++;else if(wk[i]==null&&i===wk.length-1)continue;else break}return n};
  const sinceOf=x=>{const n=streak(x.wk);return n?ws[ws.length-n]:null};
  return html`${periodBar()}
  <div class="card"><div class="hd"><h3>Needs attention · below ${lo}% in this period</h3><span class="muted small">${poor.length} of ${all.length} employees</span></div>
  ${poor.length?poor.map(x=>{const d=S.wlOpen[x.s.id];const sn=sinceOf(x);return html`<div style="border-top:1px solid var(--line);padding:12px 0"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">
    <div style="flex:1;min-width:0">${personCell(x.s)}</div><div class="right nowrap"><b class="num" style="font-size:18px">${pct(x.m.pct)}</b><br>${pillB(x.m.pct)}</div></div>
    <div class="small muted" style="margin:6px 0">${sn?`Below ${lo}% every week since the week of ${dLabel(sn)} (${streak(x.wk)} week${streak(x.wk)>1?'s':''}). `:''}Target ${taka(x.m.target)} · achieved ${taka(x.m.ach)} · ${x.m.inv} invoices · avg bill ${taka(x.m.atv)}</div>
    <div class="row"><button class="btn sm" data-act="wlToggle" data-arg="${x.s.id}">${d?'Hide':'Show'} guidance</button><button class="btn sm" data-act="profile" data-arg="${x.s.id}" data-tab="follow">Log follow-up</button><button class="btn sm" data-act="askExpl" data-arg="${x.s.id}">Ask for explanation</button></div>
    ${d?html`<ul class="guide">${diagnose(x.s.id,from,to).tips.map(t=>html`<li><b>${t.t}.</b> ${t.b}</li>`)}</ul>`:''}</div>`}):html`<div class="empty">Everyone is at or above ${lo}% for this period.</div>`}</div>
  <div class="card"><div class="hd"><h3>Weekly timeline · last 8 weeks (Sat–Fri)</h3></div><div class="tw"><table><thead><tr><th>Employee</th>${ws.map(w=>html`<th class="r">${dLabel(w)}</th>`)}<th class="r">Weeks below</th></tr></thead><tbody>
   ${all.sort((a,b)=>(a.m.pct??999)-(b.m.pct??999)).map(x=>html`<tr data-act="profile" data-arg="${x.s.id}" tabindex="0"><td>${personCell(x.s)}</td>${x.wk.map(p=>html`<td class="r"><span class="cell ${band(p).k}">${p==null?'–':Math.round(p)+'%'}</span></td>`)}<td class="r num">${x.wk.filter(p=>p!=null&&p<lo).length}</td></tr>`)}</tbody></table></div></div>`;
}
