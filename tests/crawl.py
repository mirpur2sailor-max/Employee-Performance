import asyncio, json, sys
from playwright.async_api import async_playwright
U='http://localhost:8777/index.html'
JS="""()=>{const out=new Set();const w=document.createTreeWalker(document.getElementById('app'),NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const t=n.nodeValue.replace(/\\s+/g,' ').trim();if(t)out.add(t)}
document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(e=>{['placeholder','aria-label','title'].forEach(a=>{const v=e.getAttribute(a);if(v)out.add('@'+v)})});return [...out]}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':1280,'height':900}); pg=await ctx.new_page()
        allt=set(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        async def grab(tag):
            await pg.wait_for_timeout(350); t=await pg.evaluate(JS); allt.update(t)
        await pg.goto(U); await pg.wait_for_timeout(800); await grab('setup')
        await pg.fill('#su-pw','secret1'); await pg.fill('#su-pw2','secret1'); await pg.click('[data-act=doSetup]')
        await pg.wait_for_selector('.kpis',timeout=90000)
        for tab in ['overview','team','targets','data','bigbasket','watch','explain','reports','settings']:
            await pg.click(f'.tab[data-arg={tab}]'); await grab(tab)
        # period chips
        for k in ['today','week','month','lastmonth','quarter','fy']:
            c=await pg.query_selector(f'[data-act=period][data-arg={k}]')
            if c: await c.click(); await grab('p'+k)
        # drawer tabs
        await pg.click('.tab[data-arg=team]'); await pg.click('tr[data-arg="195975"]'); await grab('drawer')
        for t in ['follow','expl','details','perf']:
            await pg.evaluate("t=>document.querySelector('[data-act=dtab][data-arg="+t+"]').click()".replace('"+t+"',t) if False else "()=>0"); await pg.evaluate('t=>document.querySelector(`[data-act=dtab][data-arg=${t}]`).click()',t); await grab('d'+t)
        await pg.click('[data-act=askExpl]') if await pg.query_selector('[data-act=askExpl]') else None
        await pg.evaluate("document.querySelector('[data-act=dtab][data-arg=follow]').click()"); await pg.evaluate("document.querySelector('[data-act=askExpl]').click()"); await grab('askmodal'); await pg.keyboard.press('Escape')
        await pg.keyboard.press('Escape')
        # watchlist/other: click a watch card if present
        await pg.click('.tab[data-arg=watch]'); 
        for sel in ['[data-act=wl]','[data-act=wlOpen]']:
            e=await pg.query_selector(sel)
            if e: await e.click(); await grab('wl')
        # new staff
        await pg.click('.tab[data-arg=team]')
        e=await pg.query_selector('[data-act=addStaff]'); 
        if e: await e.click(); await grab('newstaff'); await pg.keyboard.press('Escape')
        await pg.click('.tab[data-arg=explain]'); await grab('explain')
        await pg.click('.tab[data-arg=reports]'); await grab('rep')
        # employee
        code=await pg.evaluate("JSON.parse(localStorage.getItem('sh:codes/main')).map['195975']")
        await pg.click('[data-act=logout]'); await grab('login')
        await pg.click('[data-arg=admin][data-act=loginTab]'); await grab('loginadmin')
        await pg.click('[data-arg=emp][data-act=loginTab]'); await pg.fill('#l-id','195975'); await pg.fill('#l-code',code); await pg.click('[data-act=loginEmp]'); await pg.wait_for_selector('.kpis'); await grab('emphome')
        for tb in ['profile','explainme']:
            await pg.click(f'.tab[data-arg={tb}]'); await grab(tb)
        await pg.fill('#xp-detail','x'); await pg.click('[data-act=submitExpl]'); await grab('submitted-err')
        await pg.click('.tab[data-arg=explainme]'); await pg.check('.xr >> nth=0'); await pg.fill('#xp-detail','Footfall'); await pg.click('[data-act=submitExpl]'); await grab('submitted')
        json.dump(sorted(allt),open('/tmp/strings.json','w'),ensure_ascii=False,indent=0)
        print(len(allt),errs); await b.close()
asyncio.run(main())
