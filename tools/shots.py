#!/usr/bin/env python3
"""섹션별 스크린샷: python3 tools/shots.py <출력폴더> [URL]
발표 모드(1024x768, 1920x1080)는 섹션마다 한 장, 휴대폰(390)은 전체 한 장."""
import sys, pathlib
from playwright.sync_api import sync_playwright

out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
url = sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:8791/"
SECS = ["hero", "videos", "learn", "roadmap", "faculty", "life", "fit", "faq", "end"]

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(1024, 768), (1024, 640), (1920, 1080)]:   # 1024×640 = 탭바 있는 창을 4:3 프로젝터에 미러링
        pg = b.new_page(viewport={"width": w, "height": h})
        pg.goto(url); pg.wait_for_timeout(1500)
        pg.add_style_tag(content="html{scroll-behavior:auto!important}")
        for s in SECS:
            pg.evaluate(f"document.getElementById('{s}').scrollIntoView({{block:'start'}})")
            pg.wait_for_timeout(300)
            pg.screenshot(path=str(out / f"p{w}_{s}.png"))
        pg.close()
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg.goto(url); pg.wait_for_timeout(1500)
    pg.screenshot(path=str(out / "m390_full.png"), full_page=True)
    pg.close()
    b.close()
print("ok", out)
