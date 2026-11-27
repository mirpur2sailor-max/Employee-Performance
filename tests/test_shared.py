import asyncio
from playwright.async_api import async_playwright
U='http://localhost:8777/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        async def newpg():
            ctx=await b.new_context(viewport={'width':1280,'height':900}); pg=await ctx.new_page()
            await pg.route('**/js/config.js',lambda r:r.fulfill(body="window.APP_CONFIG={supabaseUrl:'http://localhost:8788',supabaseKey:'k',salesUrl:'data/sales.csv',salesRefreshMin:10,pollSec:3};",content_type='application/javascript'))
            logs=[];pg.on('pageerror',lambda e:logs.append(str(e)));pg.on('console',lambda m:logs.append(m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
            return pg,logs
        a,la=await newpg(); await a.goto(U); await a.wait_for_timeout(800)
        await a.fill('#su-pw','secret1'); await a.fill('#su-pw2','secret1'); await a.click('[data-act=doSetup]')
        await a.wait_for_selector('.kpis',timeout=90000)
        print('admin ready'); code=await a.evaluate("(async()=>{const d=await (await claude.use('db')).doc('codes/main').get();return d.data().map['195975']})()")
        # staff on a separate browser context
        s,ls_=await newpg(); await s.goto(U); await s.wait_for_timeout(2500)
        await s.click('[data-arg=emp][data-act=loginTab]'); await s.fill('#l-id','195975'); await s.fill('#l-code',code); await s.click('[data-act=loginEmp]')
        await s.wait_for_selector('.kpis',timeout=30000); print('staff login ok on 2nd device:', 'Hello, Mithila' in await s.inner_text('#app'))
        await s.click('.tab[data-arg=explainme]'); await s.fill('#xp-detail','Stock shortage in kids section.'); await s.check('.xr >> nth=0'); await s.click('[data-act=submitExpl]'); await s.wait_for_timeout(800)
        # admin sees it without reload
        await a.click('.tab[data-arg=explain]'); await a.wait_for_timeout(5000)
        t=await a.inner_text('#app'); print('admin sees staff explanation:', 'Stock shortage' in t)
        print(la[:5],ls_[:5]); await b.close()
asyncio.run(main())
