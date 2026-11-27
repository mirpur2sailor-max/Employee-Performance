import asyncio, json
from playwright.async_api import async_playwright
U='http://localhost:8777/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':1280,'height':900}); pg=await ctx.new_page()
        logs=[]
        pg.on('pageerror',lambda e:logs.append('PAGEERR '+str(e)))
        pg.on('console',lambda m:logs.append(m.text) if m.type=='error' and 'ERR_' not in m.text and '403' not in m.text else None)
        await pg.goto(U); await pg.wait_for_timeout(800)
        await pg.screenshot(path='/tmp/v_setup.png')
        await pg.fill('#su-pw','secret1'); await pg.fill('#su-pw2','secret1'); await pg.click('[data-act=doSetup]')
        await pg.wait_for_selector('.kpis',timeout=90000); await pg.wait_for_timeout(600)
        print('banner shown (local mode):', 'This device only' in await pg.inner_text('#app'))
        await pg.screenshot(path='/tmp/v_overview.png')
        # --- mid-month share change
        await pg.click('.tab[data-arg=targets]'); await pg.wait_for_timeout(400)
        before=await pg.evaluate("[dayTargets('2026-11')['195975'][10],dayTargets('2026-11')['195975'][20]]")
        await pg.fill('.wi[data-emp="195975"]','12'); await pg.fill('#w-from','2026-11-15'); await pg.click('[data-act=saveW]'); await pg.wait_for_timeout(800)
        after=await pg.evaluate("[dayTargets('2026-11')['195975'][10],dayTargets('2026-11')['195975'][20]]")
        print('target day10 before/after',[round(x) for x in before],[round(x) for x in after],'(day10 must stay, day20 must change)')
        t=await pg.evaluate("JSON.parse(localStorage.getItem('sh:targets/2026-11')).wv.map(x=>x.from)"); print('wv',t)
        await pg.screenshot(path='/tmp/v_targets.png',full_page=True)
        # --- block access via profile
        await pg.click('.tab[data-arg=team]'); await pg.click('tr[data-arg="195975"]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/tmp/v_drawer.png')
        await pg.click('text=Edit profile'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/tmp/v_edit.png')
        await pg.select_option('#sd-access','Blocked'); await pg.click('text=Save profile'); await pg.wait_for_timeout(600)
        code=await pg.evaluate("JSON.parse(localStorage.getItem('sh:codes/main')).map['195975']")
        await pg.keyboard.press('Escape')
        await pg.click('[data-act=logout]'); await pg.click('[data-arg=emp][data-act=loginTab]'); await pg.fill('#l-id','195975'); await pg.fill('#l-code',code); await pg.click('[data-act=loginEmp]'); await pg.wait_for_timeout(500)
        print('blocked login msgs:', await pg.evaluate("[...document.querySelectorAll('.toast')].map(t=>t.textContent)"), '| still on login:', await pg.query_selector('#l-id') is not None)
        # unblock, hide eval table
        await pg.click('[data-arg=admin][data-act=loginTab]'); await pg.fill('#l-pw','secret1'); await pg.click('[data-act=loginAdmin]'); await pg.wait_for_selector('.kpis')
        await pg.click('.tab[data-arg=team]'); await pg.click('tr[data-arg="195975"]'); await pg.click('text=Edit profile'); await pg.select_option('#sd-access','Allowed'); await pg.click('text=Save profile'); await pg.wait_for_timeout(400); await pg.keyboard.press('Escape')
        await pg.click('.tab[data-arg=settings]'); await pg.uncheck('#vis-eval'); await pg.uncheck('#vis-rank'); await pg.click('[data-act=saveVis]'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='/tmp/v_settings.png',full_page=True)
        await pg.click('[data-act=logout]'); await pg.click('[data-arg=emp][data-act=loginTab]'); await pg.fill('#l-id','195975'); await pg.fill('#l-code',code); await pg.click('[data-act=loginEmp]'); await pg.wait_for_selector('.kpis'); await pg.wait_for_timeout(400)
        t=await pg.inner_text('#app'); print('staff sees eval table:', 'Evaluation by period' in t, '| rank:', 'Rank ' in t, '| last14:', 'Last 14 days' in t)
        await pg.screenshot(path='/tmp/v_emp.png',full_page=True)
        # --- language
        await pg.click('[data-act=setLang]'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='/tmp/v_emp_bn.png',full_page=True)
        await pg.click('[data-act=logout]'); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/v_login_bn.png')
        await pg.click('[data-arg=admin][data-act=loginTab]'); await pg.fill('#l-pw','secret1'); await pg.click('[data-act=loginAdmin]'); await pg.wait_for_selector('.kpis')
        for tb in ['overview','team','targets','watch','settings']:
            await pg.click(f'.tab[data-arg={tb}]'); await pg.wait_for_timeout(400); await pg.screenshot(path=f'/tmp/v_bn_{tb}.png',full_page=True)
        await pg.click('[data-act=setLang]'); await pg.wait_for_timeout(300)
        print('back to english:', 'Overview' in await pg.inner_text('#app'))
        await pg.set_viewport_size({'width':390,'height':800}); await pg.click('.tab[data-arg=overview]'); await pg.wait_for_timeout(400); await pg.screenshot(path='/tmp/v_mobile.png')
        print('mobile scrollWidth',await pg.evaluate('document.documentElement.scrollWidth'))
        print(logs[:10]); await b.close()
asyncio.run(main())
