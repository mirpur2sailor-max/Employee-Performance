/* ============ helpers ============ */
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
class Raw{constructor(s){this.s=s}}
const raw=s=>new Raw(s);
const val=x=>x instanceof Raw?x.s:Array.isArray(x)?x.map(val).join(''):x==null||x===false?'':E(x);
const html=(st,...v)=>new Raw(st.reduce((a,s,i)=>a+s+(i<v.length?val(v[i]):''),''));
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const DAY=864e5, pad=n=>String(n).padStart(2,'0');
const parseISO=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d))};
const fmtISO=d=>`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
const addDays=(s,n)=>fmtISO(new Date(parseISO(s).getTime()+n*DAY));
const dowOf=s=>parseISO(s).getUTCDay();
const WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const mk=s=>s.slice(0,7);
const monthEnd=k=>{const [y,m]=k.split('-').map(Number);return fmtISO(new Date(Date.UTC(y,m,0)))};
const monthLabel=k=>`${MON[+k.slice(5,7)-1]} ${k.slice(0,4)}`;
const dLabel=s=>`${+s.slice(8)} ${MON[+s.slice(5,7)-1]}`;
const dLabelY=s=>`${+s.slice(8)} ${MON[+s.slice(5,7)-1]} ${s.slice(0,4)}`;
const rangeDays=(a,b)=>{const o=[];for(let d=a;d<=b;d=addDays(d,1))o.push(d);return o};
const nextMonth=k=>{let [y,m]=k.split('-').map(Number);m++;if(m>12){m=1;y++}return `${y}-${pad(m)}`};
const prevMonth=k=>{let [y,m]=k.split('-').map(Number);m--;if(m<1){m=12;y--}return `${y}-${pad(m)}`};
const monthsBetween=(a,b)=>{const o=[];for(let k=mk(a);k<=mk(b);k=nextMonth(k))o.push(k);return o};
const fmt=n=>n==null||isNaN(n)?'–':Math.round(n).toLocaleString('en-IN');
const taka=n=>n==null||isNaN(n)?'–':'৳'+Math.round(n).toLocaleString('en-IN');
const short=n=>{if(n==null||isNaN(n))return '–';const a=Math.abs(n);return a>=1e7?(n/1e7).toFixed(2)+' Cr':a>=1e5?(n/1e5).toFixed(2)+' L':a>=1e3?(n/1e3).toFixed(1)+'K':String(Math.round(n))};
const pct=(p,d=0)=>p==null||isNaN(p)?'–':p.toFixed(d)+'%';
const initials=n=>String(n||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const tcase=s=>String(s||'').toLowerCase().replace(/(^|[\s.])([a-z])/g,(m,a,b)=>a+b.toUpperCase());
const fyStart=d=>{const y=+d.slice(0,4),m=+d.slice(5,7);return `${m>=7?y:y-1}-07-01`};
const fyLabel=d=>{const y=+fyStart(d).slice(0,4);return `FY ${y}-${String(y+1).slice(2)}`};
const qStart=d=>{const y=+d.slice(0,4),m=+d.slice(5,7),qi=Math.floor(((m-7+12)%12)/3),sm=((6+3*qi)%12)+1;return `${sm>m?y-1:y}-${pad(sm)}-01`};
const weekStart=d=>addDays(d,-((dowOf(d)+1)%7));
const todayISO=()=>{const n=new Date();return `${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())}`};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const ssGet=k=>{try{return sessionStorage.getItem(k)}catch(e){return null}};
const ssSet=(k,v)=>{try{v==null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)}catch(e){}};
async function sha(str){
  try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  catch(e){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return 'f'+(4294967296*(2097151&h2)+(h1>>>0)).toString(16)}
}
const libs={};
function loadLib(url){return libs[url]||(libs[url]=new Promise((res,rej)=>{const s=document.createElement('script');s.src=url;s.onload=res;s.onerror=()=>rej(new Error('Could not load a required library. Check your connection and try again.'));document.head.appendChild(s)}))}
const LIB={xlsx:'js/vendor/xlsx.full.min.js',excel:'js/vendor/exceljs.min.js',pdf:'js/vendor/jspdf.umd.min.js',pdft:'js/vendor/jspdf.plugin.autotable.min.js'};

/* ============ state ============ */
const DEFAULT_CFG={outlet:'Mirpur-2 Outlet',basis:'ex',poorBelow:80,lang:'en',staffOpen:true,staffSees:{rank:true,eval:true,days:true,big:true,bill:true},
  desigWeights:{'FS':6,'AFS':5,'SR SA':5,'SA':4.5,'POS':2,'SR BIC':1,'BIC':1,'ABIC':1,'OTHERS':2},
  sectionFactors:{MENS:1,WOMENS:1,KIDS:1,OTHERS:0.8}};
const SLABS=[5000,10000,15000,20000,25000,30000,50000];
const S={db:null,user:null,dl:null,canEdit:false,isOwner:false,ready:false,loadErr:null,
  cfg:null,cfgLoaded:false,staff:{},targets:{},parts:{},meta:null,codes:{},followups:[],explanations:[],requests:[],
  role:null,empId:null,view:'overview',period:{key:'month',from:null,to:null},drawer:null,modal:null,
  rows:{},asOf:todayISO(),tcache:{},filter:{q:'',section:'',status:'active'},sort:{k:'pct',dir:1},
  bb:{thr:10000,mode:'atleast'},tgtMonth:null,draftW:null,upload:null,busy:null,loginTab:'emp',setup:{step:1},
  rep:{cols:{photo:true,personal:true,target:true,sales:true,bb:true},section:'',title:'Staff Performance Summary',slabs:true},
  empTab:'home',explFilter:{emp:'',status:''},justSent:null,wlOpen:{}};
const cfg=()=>Object.assign({},DEFAULT_CFG,S.cfg||{});
const isAdmin=()=>S.role==='admin';
let dirty=false,rafId=0;
function schedule(){ if(rafId)return; rafId=requestAnimationFrame(()=>{rafId=0;const a=document.activeElement;if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)&&$('#app').contains(a)){dirty=true;return}dirty=false;render()})}
document.addEventListener('focusout',()=>{setTimeout(()=>{const a=document.activeElement;if(dirty&&!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))){dirty=false;render()}},60)});
function toast(msg,err){const t=document.createElement('div');t.className='toast'+(err?' err':'');t.textContent=lang()==='bn'&&window.tr?tr(msg):msg;document.body.appendChild(t);setTimeout(()=>t.remove(),err?5200:2600)}
function dbErr(e){const c=e&&e.code;if(c==='invalid_argument'||c==='permission_denied')return 'This change was refused by the data store. Check the Supabase keys and table policies.';return (e&&e.message)||'Something went wrong. Please try again.'}
async function guard(fn,okMsg){try{const r=await fn();if(okMsg)toast(okMsg);return r}catch(e){console.error(e);toast(dbErr(e),true);return undefined}}

/* ============ derived data ============ */
function basisIdx(){return {net:2,ex:3,gross:4}[cfg().basis]||3}
function rebuild(){
  S.ver=(S.ver||0)+1;S.tcache={};S.rows={};
  const bi=basisIdx();let last=null;
  if(S.remote){for(const r of S.remote.rows){const o={d:r[1],amt:r[bi],net:r[2],q:r[5]};(S.rows[r[0]]||(S.rows[r[0]]=[])).push(o);if(!last||r[1]>last)last=r[1]}}
  else
  for(const id in S.parts){const p=S.parts[id];for(const r of p.rows||[]){
    const d=p.month+'-'+pad(r[1]);const o={d,amt:r[bi],net:r[2],q:r[5]};
    (S.rows[r[0]]||(S.rows[r[0]]=[])).push(o);if(!last||d>last)last=d}}
  S.asOf=(S.meta&&S.meta.lastDate)||last||todayISO();
  if(!S.tgtMonth)S.tgtMonth=mk(S.asOf);
  setPeriod(S.period.key||'month',true);
}
function staffList(){return Object.values(S.staff)}
function activeOn(st,d){if(st.joining&&d<st.joining)return false;if(st.resign&&d>st.resign)return false;if(st.status==='Resigned'&&!st.resign)return false;return true}
function isActiveNow(st){return st.status!=='Resigned'&&!(st.resign&&st.resign<S.asOf)}
/* daily per-employee targets: outlet day target split by weight over staff present that day */
function dayTargets(m){
  const key=m;if(S.tcache[key])return S.tcache[key];
  const t=S.targets[m];const out={};if(!t){return S.tcache[key]=out}
  const n=+monthEnd(m).slice(8);const W0=t.weights||{};const V=(t.wv||[]).slice().sort((a,b)=>a.from.localeCompare(b.from));
  const wAt=iso=>{let w=W0;for(const v of V)if(v.from<=iso)w=v.w;return w};
  const ids=new Set(Object.keys(W0).filter(k=>+W0[k]>0));V.forEach(v=>Object.keys(v.w).forEach(k=>{if(+v.w[k]>0)ids.add(k)}));
  const list=staffList().filter(s=>ids.has(s.id));
  list.forEach(s=>out[s.id]=new Array(n+1).fill(0));
  for(let d=1;d<=n;d++){
    const D=+(t.days&&t.days[d])||0;if(!D)continue;const iso=`${m}-${pad(d)}`,wd=WD[dowOf(iso)];const W=wAt(iso);
    const pr=list.filter(s=>activeOn(s,iso)&&s.dayOff!==wd&&(+W[s.id]||0)>0);const sw=pr.reduce((a,s)=>a+(+W[s.id]),0);
    if(sw>0)pr.forEach(s=>out[s.id][d]=D*(+W[s.id])/sw);
  }
  return S.tcache[key]=out;
}
function targetOf(emp,a,b){let sum=0;for(const m of monthsBetween(a,b)){const dt=dayTargets(m)[emp];if(!dt)continue;const s=m===mk(a)?+a.slice(8):1,e=m===mk(b)?+b.slice(8):dt.length-1;for(let d=s;d<=e;d++)sum+=dt[d]||0}return sum}
function outletTarget(a,b){let sum=0;for(const m of monthsBetween(a,b)){const t=S.targets[m];if(!t||!t.days)continue;const s=m===mk(a)?+a.slice(8):1,e=m===mk(b)?+b.slice(8):31;for(let d=s;d<=e;d++)sum+=+t.days[d]||0}return sum}
function outletMonthTarget(m){const t=S.targets[m];return t&&t.days?Object.values(t.days).reduce((a,b)=>a+(+b||0),0):0}
function metricsFrom(rows,a,b,thr){
  let ach=0,inv=0,qty=0,big=0;const days=new Set();const sl=SLABS.map(()=>0);
  for(const r of rows){if(r.d<a||r.d>b)continue;ach+=r.amt;qty+=r.q;if(r.net>0){inv++;days.add(r.d)}if(r.amt>=thr)big++;for(let i=0;i<SLABS.length;i++)if(r.amt>=SLABS[i])sl[i]++}
  return {ach,inv,qty,big,sl,atv:inv?ach/inv:0,upt:inv?qty/inv:0,sellDays:days.size};
}
const clipTo=b=>b>S.asOf?S.asOf:b;
function empMetrics(emp,a,b,thr=10000){
  b=clipTo(b);const m=metricsFrom(S.rows[emp]||[],a,b,thr);
  m.target=targetOf(emp,a,b);m.pct=m.target>0?m.ach/m.target*100:null;
  let wd=0;for(const mm of monthsBetween(a,b)){const dt=dayTargets(mm)[emp];if(!dt)continue;const s=mm===mk(a)?+a.slice(8):1,e=mm===mk(b)?+b.slice(8):dt.length-1;for(let d=s;d<=e;d++)if(dt[d]>0)wd++}
  m.workDays=wd;m.invPerDay=wd?m.inv/wd:0;return m;
}
function outletMetrics(a,b,thr=10000){
  b=clipTo(b);const all=[];for(const id in S.rows)all.push(...S.rows[id]);
  const m=metricsFrom(all,a,b,thr);m.target=outletTarget(a,b);m.pct=m.target>0?m.ach/m.target*100:null;return m;
}
function setPeriod(key,silent){
  const A=S.asOf;let from,to=A;
  if(key==='today')from=A;
  else if(key==='week')from=weekStart(A);
  else if(key==='month')from=mk(A)+'-01';
  else if(key==='lastmonth'){const p=prevMonth(mk(A));from=p+'-01';to=monthEnd(p)}
  else if(key==='quarter')from=qStart(A);
  else if(key==='fy')from=fyStart(A);
  else {from=S.period.from||mk(A)+'-01';to=S.period.to||A}
  S.period={key,from,to};if(!silent)schedule();
}
function periodLabel(p=S.period){const lab={today:'Today',week:'This week',month:'This month',lastmonth:'Last month',quarter:'This quarter',fy:fyLabel(S.asOf),custom:'Custom'}[p.key];return `${lab} · ${p.from===p.to?dLabelY(p.from):dLabel(p.from)+' – '+dLabelY(clipTo(p.to))}`}
const band=p=>{const lo=cfg().poorBelow;return p==null?{k:'na',l:'No target'}:p>=100?{k:'good',l:'On target'}:p>=lo?{k:'warn',l:'Near target'}:p>=lo*0.75?{k:'bad',l:'Below target'}:{k:'crit',l:'Critical'}};
const pillB=p=>{const b=band(p);return html`<span class="pill ${b.k}">${b.l}</span>`};
function expMonths(st,ref){if(!st.joining)return 12;const a=parseISO(st.joining),b=parseISO(ref);return Math.max(0,(b-a)/DAY/30.4)}
/* suggestion engine: designation x section x recent performance x experience */
function suggestWeights(m){
  const c=cfg(),first=m+'-01',last=monthEnd(m);const pm=prevMonth(m);
  const list=staffList().filter(s=>activeOn(s,last)&&s.status!=='Resigned'||(s.resign&&s.resign>=first&&s.joining<=last));
  const rows=list.map(s=>{
    const base=c.desigWeights[s.designation]??c.desigWeights['OTHERS']??2;
    const sec=c.sectionFactors[s.section]??1;
    let perf=1;const pt=targetOf(s.id,pm+'-01',monthEnd(pm));
    if(pt>0){const a=metricsFrom(S.rows[s.id]||[],pm+'-01',monthEnd(pm),1e9).ach;const r=Math.min(1.5,a/pt);perf=Math.max(0.8,Math.min(1.25,0.75+0.5*r))}
    const mo=expMonths(s,first);const exp=mo<1?0.7:mo<3?0.85:mo<6?1:mo<12?1.1:1.15;
    return {id:s.id,base,sec,perf,exp,raw:base*sec*perf*exp};
  });
  const tot=rows.reduce((a,r)=>a+r.raw,0)||1;
  rows.forEach(r=>r.pct=Math.round(r.raw/tot*1000)/10);
  const diff=Math.round((100-rows.reduce((a,r)=>a+r.pct,0))*10)/10;if(rows.length&&diff){rows.sort((a,b)=>b.pct-a.pct);rows[0].pct=Math.round((rows[0].pct+diff)*10)/10}
  return rows;
}
/* guidance */
function diagnose(emp,a,b){
  const m=empMetrics(emp,a,b),st=S.staff[emp];const tips=[];
  const peers=staffList().filter(s=>s.id!==emp&&isActiveNow(s)).map(s=>empMetrics(s.id,a,b)).filter(x=>x.target>0&&x.workDays>0);
  const avg=f=>peers.length?peers.reduce((x,y)=>x+f(y),0)/peers.length:0;
  const pAtv=avg(x=>x.atv),pUpt=avg(x=>x.upt),pIpd=avg(x=>x.invPerDay),pBig=avg(x=>x.workDays?x.big/x.workDays:0);
  if(m.inv&&pIpd&&m.invPerDay<pIpd*0.85)tips.push({t:'Low invoice count',b:`Makes ${m.invPerDay.toFixed(1)} invoices per working day against a team average of ${pIpd.toFixed(1)}. Coach on greeting every customer within 30 seconds, holding position in the allocated zone, and converting trials into bills.`});
  if(m.inv&&pAtv&&m.atv<pAtv*0.85)tips.push({t:'Low average bill value',b:`Average invoice is ${taka(m.atv)} against a team average of ${taka(pAtv)}. Practise showing a higher-priced option first, pairing top with bottom, and adding belts, wallets or footwear at the counter.`});
  if(m.inv&&pUpt&&m.upt<pUpt*0.85)tips.push({t:'Low units per invoice',b:`Sells ${m.upt.toFixed(2)} units per invoice (team ${pUpt.toFixed(2)}). Ask for the "one more item" at every fitting room and keep matching accessories near the section.`});
  if(m.workDays&&pBig&&(m.big/m.workDays)<pBig*0.6)tips.push({t:'Few big baskets',b:`${m.big} invoices of 10K or more. Target family and occasion shopping, offer set bundles, and mention seasonal collections to customers with a large first item.`});
  if(m.workDays&&m.sellDays<m.workDays*0.85)tips.push({t:'Days without a sale',b:`Sold on ${m.sellDays} of ${m.workDays} scheduled days. Review floor presence, break timing and whether the section is being covered during peak hours.`});
  const wk=weeklyPcts(emp,4).filter(x=>x!=null);if(wk.length>=3&&wk[wk.length-1]<wk[0]-10)tips.push({t:'Declining trend',b:`Weekly achievement fell from ${pct(wk[0])} to ${pct(wk[wk.length-1])}. Hold a one-to-one this week to find out what changed (stock, section, motivation, personal reasons).`});
  if(st&&st.joining&&expMonths(st,b)<2)tips.push({t:'New joiner',b:`Joined ${dLabelY(st.joining)}. Pair with a Sr. SA buddy, run product-knowledge and POS refreshers, and set a lower weekly milestone.`});
  if(m.pct!=null&&m.pct<cfg().poorBelow){const need=remainingNeed(emp);if(need)tips.push({t:'Daily goal to recover',b:`To close this month at 100% the daily requirement is ${taka(need.perDay)} over the remaining ${need.days} working days. Agree a written daily milestone with ${st?st.name:'the employee'}.`})}
  if(!tips.length)tips.push({t:'Keep coaching',b:'No single weak metric stands out. Review the section display, stock availability and customer feedback with the employee.'});
  return {m,tips};
}
function remainingNeed(emp){
  const m=mk(S.asOf),end=monthEnd(m);const full=targetOf(emp,m+'-01',end);if(!full)return null;
  const ach=metricsFrom(S.rows[emp]||[],m+'-01',S.asOf,1e9).ach;
  const dt=dayTargets(m)[emp]||[];let days=0;for(let d=+S.asOf.slice(8)+1;d<dt.length;d++)if(dt[d]>0)days++;
  const left=full-ach;return {full,ach,left,days,perDay:days?Math.max(0,left)/days:Math.max(0,left),done:left<=0};
}
function weeklyPcts(emp,n){
  const out=[];let ws=weekStart(S.asOf);const list=[];for(let i=0;i<n;i++){list.unshift(ws);ws=addDays(ws,-7)}
  for(const w of list){const m=empMetrics(emp,w,addDays(w,6));out.push(m.pct)}return out;
}
function weekStarts(n){const l=[];let ws=weekStart(S.asOf);for(let i=0;i<n;i++){l.unshift(ws);ws=addDays(ws,-7)}return l}

/* ---- access + target share versions ---- */
function canLogin(st){return !!st&&st.status!=='Resigned'&&st.access!=='Blocked'&&!(st.resign&&st.resign<=todayISO())}
function latestW(t){const V=(t&&t.wv)||[];return V.length?V.slice().sort((a,b)=>a.from.localeCompare(b.from)).pop().w:((t&&t.weights)||{})}
function withWeights(cur,m,w,from){const doc=Object.assign({},cur);const first=m+'-01';
  if(!from||from<=first){doc.weights=w;doc.wv=[]}
  else{doc.weights=cur.weights||{};doc.wv=(cur.wv||[]).filter(x=>x.from!==from).concat([{from,w}]).sort((a,b)=>a.from.localeCompare(b.from))}
  return doc}

function lang(){try{const v=localStorage.getItem('ph.lang');if(v==='bn'||v==='en')return v}catch(e){}return cfg().lang==='bn'?'bn':'en'}
function setLang(v){try{localStorage.setItem('ph.lang',v)}catch(e){}schedule()}
