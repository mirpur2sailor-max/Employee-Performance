import asyncio, json
from playwright.async_api import async_playwright
U='http://localhost:8777/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':1280,'height':900},accept_downloads=True); pg=await ctx.new_page()
        logs=[]
        pg.on('console',lambda m: logs.append(m.type+': '+m.text) if m.type in('error','warning') and 'TUNNEL' not in m.text else None)
        pg.on('pageerror',lambda e: logs.append('PAGEERR '+str(e)))
        await pg.goto(U); await pg.wait_for_timeout(800)
        await pg.fill('#su-pw','secret1'); await pg.fill('#su-pw2','secret1')
        await pg.click('[data-act=doSetup]') if await pg.query_selector('[data-act=doSetup]') else None
        await pg.wait_for_selector('.kpis',timeout=60000); await pg.wait_for_timeout(800)
        await pg.screenshot(path='/tmp/s1.png',full_page=True)
        for tab in ['team','targets','data','bigbasket','watch','explain','reports','settings']:
            await pg.click(f'.tab[data-arg={tab}]'); await pg.wait_for_timeout(400)
            await pg.screenshot(path=f'/tmp/s2_{tab}.png',full_page=True)
        await pg.click('.tab[data-arg=team]'); await pg.click('tr[data-arg="195975"]'); await pg.wait_for_timeout(400)
        await pg.screenshot(path='/tmp/s3.png')
        await pg.keyboard.press('Escape')
        await pg.click('.tab[data-arg=reports]')
        async with pg.expect_download(timeout=30000) as d: await pg.click('[data-act=exportXlsx]')
        dl=await d.value; await dl.save_as('/tmp/rep.xlsx'); print('xlsx',dl.suggested_filename)
        async with pg.expect_download(timeout=30000) as d: await pg.click('[data-act=exportPdf]')
        dl=await d.value; await dl.save_as('/tmp/rep.pdf'); print('pdf',dl.suggested_filename)
        code=await pg.evaluate("JSON.parse(localStorage.getItem('sh:codes/main')).map['195975']"); print('code',code)
        await pg.click('[data-act=logout]'); await pg.wait_for_timeout(300)
        await pg.click('[data-arg=emp][data-act=loginTab]'); await pg.fill('#l-id','195975'); await pg.fill('#l-code',code); await pg.click('[data-act=loginEmp]'); await pg.wait_for_timeout(600)
        await pg.screenshot(path='/tmp/s4.png',full_page=True)
        await pg.click('.tab[data-arg=explainme]'); await pg.fill('#xp-detail','Footfall was low in the kids section this week because of stock issues'); await pg.check('.xr >> nth=0'); await pg.click('[data-act=submitExpl]'); await pg.wait_for_timeout(600)
        await pg.screenshot(path='/tmp/s5.png')
        print('expl stored',await pg.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('sh:explanations'))"))
        await pg.set_viewport_size({'width':390,'height':800}); await pg.click('.tab[data-arg=home]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/tmp/s6.png',full_page=True)
        print('mobile scrollWidth',await pg.evaluate('document.documentElement.scrollWidth'))
        print('\n'.join(logs[:30]))
        await b.close()
asyncio.run(main())
