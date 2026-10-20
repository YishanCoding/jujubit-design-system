"""Local browser acceptance for dashboard.html and the reusable template.

Run from the repository root after `python3 -m http.server 8765`:
    python3 skill/jujubit-design-system/templates/dashboard/verify.py
Screenshots are intentionally kept in .codex-shots/ and must not be staged.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[4]
SHOTS = ROOT / '.codex-shots'
BASE = 'http://127.0.0.1:8765/'
RESULTS = []


def check(name, condition):
    ok = bool(condition)
    RESULTS.append((name, ok))
    print(('PASS' if ok else 'FAIL') + ' ' + name)


def open_page(browser, path, width):
    page = browser.new_page(viewport={'width': width, 'height': 900})
    errors = []
    page.on('pageerror', lambda error: errors.append('pageerror: ' + str(error)))
    page.on('console', lambda message: errors.append('console: ' + message.text) if message.type == 'error' else None)
    page.goto(BASE + path, wait_until='networkidle', timeout=60000)
    page.locator('.jjb-dash-kpi__value').first.wait_for()
    check(f'{path} {width} no horizontal overflow', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    check(f'{path} {width} no script/console errors', not errors)
    if errors:
        print('\n'.join(errors[:5]))
    return page, errors


def run():
    SHOTS.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page, errors = open_page(browser, 'dashboard.html', 1440)
        page.screenshot(path=str(SHOTS / 'v2-dashboard-1440.png'), full_page=True)
        first = page.locator('#demo-kpis .jjb-dash-kpi__value').first.inner_text()
        page.get_by_role('button', name='近 30 天').click()
        check('preset changes KPI', page.locator('#demo-kpis .jjb-dash-kpi__value').first.inner_text() != first)
        ticks = page.locator('#demo-trend-plot .jjb-dash-axis').nth(1).locator('text').count()
        page.get_by_role('button', name='按周').click()
        check('weekly reduces X ticks', page.locator('#demo-trend-plot .jjb-dash-axis').nth(1).locator('text').count() < ticks)
        overlay = page.locator('#demo-trend-plot .jjb-dash-overlay')
        overlay.hover(position={'x': 200, 'y': 90})
        check('weekly tooltip title', '周 ' in page.locator('#demo-trend-plot .jjb-dash-tip').inner_text())
        page.get_by_role('button', name='自定义').click()
        check('custom date inputs visible', page.locator('#demo-date-bar .jjb-dash-date-bar__custom').is_visible())
        overlay = page.locator('#demo-trend-plot .jjb-dash-overlay')
        overlay.hover(position={'x': 220, 'y': 100})
        check('crosshair and tooltip', page.locator('#demo-trend-plot .jjb-dash-crosshair').is_visible() and page.locator('#demo-trend-plot .jjb-dash-tip').is_visible())
        overlay.click(position={'x': 220, 'y': 100})
        check('pin created', page.locator('#demo-trend-plot .jjb-dash-pin').count() == 1)
        page.screenshot(path=str(SHOTS / 'v2-trend-pin.png'))
        overlay.click(position={'x': 220, 'y': 100})
        check('same date toggles pin off', page.locator('#demo-trend-plot .jjb-dash-pin').count() == 0)
        overlay.click(position={'x': 220, 'y': 100})
        page.locator('#demo-trend-plot .jjb-dash-pin__close').click()
        check('pin close button', page.locator('#demo-trend-plot .jjb-dash-pin').count() == 0)
        active = page.locator('#demo-channel-chips [data-chip][aria-pressed="true"]')
        while active.count() > 1:
            active.first.click()
        active.first.click()
        check('last channel remains selected', active.count() == 1)
        more = page.locator('#demo-channel-chips .jjb-dash-chip--more')
        more.click()
        check('detail channels expand', more.get_attribute('aria-expanded') == 'true')
        more.click()
        check('detail channels collapse', more.get_attribute('aria-expanded') == 'false')
        check('no-data version disabled', page.locator('#demo-version-chips [data-chip="v3"]').is_disabled())
        page.locator('#demo-trend [data-view="numbers"]').click()
        check('chart/numbers toggle', page.locator('#demo-trend-table').is_visible() and not page.locator('#demo-trend-plot').is_visible())
        page.get_by_role('button', name='近 30 天').click()
        page.get_by_role('button', name='按日').click()
        page.locator('#demo-trend-table [data-expand]').click()
        check('table expands', page.locator('#demo-trend-table [data-expand]').get_attribute('aria-expanded') == 'true')
        page.locator('#demo-trend [data-info]').hover()
        check('info help appears', page.locator('.jjb-dash-info-float').is_visible())
        link = page.locator('#demo-sankey-plot .jjb-dash-sankey-link').first
        link.hover(force=True)
        check('sankey dims other links', page.locator('#demo-sankey-plot .jjb-dash-sankey-link').evaluate_all("nodes => nodes.some(n => getComputedStyle(n).opacity === '0.06')"))
        page.screenshot(path=str(SHOTS / 'v2-sankey-hover.png'))
        link.click(force=True)
        check('sankey locks', link.evaluate("n => getComputedStyle(n).opacity === '1'"))
        page.locator('#demo-sankey-plot .jjb-dash-sankey-bg').click(position={'x': 4, 'y': 4}, force=True)
        check('sankey background clears', link.evaluate("n => getComputedStyle(n).opacity === '0.48'"))
        page.locator('#demo-trend [data-view="chart"]').click()
        page.get_by_role('button', name='自定义').click()
        page.get_by_label('开始日期').fill('2027-01-01')
        page.get_by_label('结束日期').fill('2027-01-31')
        check('empty range shown', page.locator('#demo-trend-plot .jjb-dash-empty').is_visible())
        check('dashboard no accumulated errors', not errors)
        page.close()
        for width in (390,):
            page, errors = open_page(browser, 'dashboard.html', width)
            page.screenshot(path=str(SHOTS / f'v2-dashboard-{width}.png'), full_page=True)
            page.close()
        for width in (1440, 390):
            page, errors = open_page(browser, 'skill/jujubit-design-system/templates/dashboard/index.html', width)
            page.screenshot(path=str(SHOTS / f'v2-template-{width}.png'), full_page=True)
            page.close()
        browser.close()
    print(f'{sum(ok for _, ok in RESULTS)}/{len(RESULTS)} checks passed')
    return all(ok for _, ok in RESULTS)


if __name__ == '__main__':
    try:
        raise SystemExit(0 if run() else 1)
    except Exception as error:
        print('FAIL browser launch or acceptance run:', str(error).splitlines()[0])
        fatal = next((line for line in str(error).splitlines() if 'FATAL:' in line), None)
        if fatal:
            print(fatal)
        raise SystemExit(2)
