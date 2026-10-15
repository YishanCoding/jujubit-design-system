#!/usr/bin/env python3
"""JuJuBit brand backgrounds for store art, ads, posters and packaging inserts.

The pattern is the brand symbol set (../brand-symbols/, traced from the five
white glyphs on the gift box side panel plus one set per product line): a few
big glyphs printed one shade darker than the base. Colors come from tokens.css.
Everything is deterministic, so the same size always gives the same background.

    python3 assets/backgrounds/make_backgrounds.py          # SVG + previews + symbol sheets
    python3 assets/backgrounds/make_backgrounds.py --png    # also full-size PNG into ./out (gitignored)

Output: <variant>--<size>.svg uses the core set only; <variant>-<line>--<size>.svg
mixes ~70% of that product line with ~30% core. Add a line in SETS below.
"""
import argparse, random, re, shutil, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
TOKENS = ROOT / "tokens.css"

def token(name):
    return re.search(rf"--jjb-{name}:\s*(#[0-9A-Fa-f]{{6}})", TOKENS.read_text()).group(1)

C = {k: token(k) for k in ["brand-500", "brand-400", "brand-600", "brand-300", "brand-100", "brand-light-bg"]}

SIZES = {
    "gp-feature-1024x500": (1024, 500),
    "ios-header-3840x1646": (3840, 1646),
    "landscape-1920x1080": (1920, 1080),
    "square-1080": (1080, 1080),
    "portrait-1080x1350": (1080, 1350),
    "story-1080x1920": (1080, 1920),
}

SYMBOLS = ROOT / "assets" / "brand-symbols"

# Brand symbols (playground section 01 "品牌符号"). "core" is the five glyphs on
# the gift box side panel; each product line adds its own set. One image = core
# + one line, never two lines mixed. Glyphs marked 待修 on the playground are
# not listed here until the designer redraws them.
SETS = {
    "core": ["amp", "paw", "badge", "sparkle", "sun"],
    "people": ["camera", "photo", "afro", "box"],
    "pets": ["paw", "cat", "dog", "gecko"],
    "trpg": ["d20", "sword", "shield"],
}
CORE_SHARE = .3  # share of core glyphs in a product-line background

def symbol(name):
    s = (SYMBOLS / f"{name}.svg").read_text()
    inner = re.search(r"<svg[^>]*>(.*)</svg>", s, re.S).group(1)
    return f'<symbol id="g-{name}" viewBox="0 0 100 100" overflow="visible">{inner}</symbol>'

def symdefs(names):
    return "".join(symbol(n) for n in dict.fromkeys(names))

def scatter(w, h, seed, cols):
    """Jittered grid: big glyphs, evenly spread, never clumped."""
    rnd = random.Random(seed)
    cell = w / cols
    rows = max(2, round(h / cell))
    cy = h / rows
    pts = []
    for r in range(rows + 1):
        for c in range(cols + 1):
            x = (c + (.5 if r % 2 else 0)) * cell + rnd.uniform(-.22, .22) * cell
            y = r * cy + rnd.uniform(-.22, .22) * cy
            pts.append((x, y, min(cell, cy) * rnd.uniform(.7, .98), rnd.uniform(-24, 24)))
    return pts, rnd

def pattern(w, h, line, color, opacity, seed, cols):
    pts, rnd = scatter(w, h, seed, cols)
    out = [f'<g color="{color}" opacity="{opacity}">']
    last = None
    for x, y, s, r in pts:
        pool = SETS["core"] if line == "core" or rnd.random() < CORE_SHARE else SETS[line]
        n = rnd.choice([k for k in pool if k != last] or pool); last = n
        out.append(f'<use href="#g-{n}" width="{s:.0f}" height="{s:.0f}" '
                   f'transform="translate({x - s/2:.0f} {y - s/2:.0f}) rotate({r:.0f} {s/2:.0f} {s/2:.0f})"/>')
    out.append("</g>")
    return "\n".join(out)

def swoosh(w, h):
    """White sweep behind the subject on the right, as on the live feature graphic."""
    return (f'<path d="M{w*.42:.0f} {-h*.02:.0f} C{w*.56:.0f} {h*.3:.0f} {w*.5:.0f} {h*.72:.0f} {w*.6:.0f} {h*1.02:.0f} '
            f'L{w*1.02:.0f} {h*1.02:.0f} L{w*1.02:.0f} {h*.55:.0f} C{w*.97:.0f} {h*.4:.0f} {w*.99:.0f} {h*.15:.0f} {w*.96:.0f} {-h*.02:.0f} Z" fill="#FFFFFF"/>')

# name: (base, glyph color, glyph opacity, swoosh, use)
VARIANTS = {
    "orange-pattern": ("orange", C["brand-600"], .7, False, "高能量档：商店头图、广告首屏、海报、包装内卡"),
    "orange-swoosh": ("orange", C["brand-600"], .7, True, "高能量档 + 人物：白色弧带放在人物身后"),
    "light-pattern": ("light", C["brand-300"], .22, False, "生活感档、教程、截图底、信息密集的版面"),
    "orange-plain": ("orange", None, 0, False, "需要放大段文字时（如感谢卡正文区）"),
}

def base(kind):
    if kind == "orange":
        return (f'<radialGradient id="bg" cx=".6" cy=".4" r=".9"><stop offset="0" stop-color="{C["brand-400"]}"/>'
                f'<stop offset=".6" stop-color="{C["brand-500"]}"/><stop offset="1" stop-color="{C["brand-600"]}"/></radialGradient>')
    return (f'<radialGradient id="bg" cx=".5" cy=".45" r=".85"><stop offset="0" stop-color="#FFFFFF"/>'
            f'<stop offset="1" stop-color="{C["brand-light-bg"]}"/></radialGradient>')

def svg(variant, w, h, line):
    kind, color, op, sw, _ = VARIANTS[variant]
    cols = 5 if w / h > 1.6 else 4 if w >= h else 3
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
             f"<defs>{base(kind)}{symdefs(SETS['core'] + SETS[line]) if color else ''}</defs>", f'<rect width="{w}" height="{h}" fill="url(#bg)"/>']
    if color:
        parts.append(pattern(w, h, line, color, op, w * 7 + h * 13 + len(line), cols))
    if sw:
        parts.append(swoosh(w, h))
    parts.append("</svg>")
    return "\n".join(parts)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--png", action="store_true")
    a = ap.parse_args()
    for old in HERE.glob("*.svg"):
        old.unlink()
    prev = HERE / "previews"; prev.mkdir(exist_ok=True)
    for old in prev.glob("*.png"):
        old.unlink()
    resvg = shutil.which("resvg")
    n = 0
    for line in SETS:
        for v in VARIANTS:
            if line != "core" and not VARIANTS[v][1]:
                continue  # plain variant has no glyphs, one copy is enough
            stem = v if line == "core" else f"{v}-{line}"
            for name, (w, h) in SIZES.items():
                f = HERE / f"{stem}--{name}.svg"
                f.write_text(svg(v, w, h, line)); n += 1
                if resvg and (name == "gp-feature-1024x500" or (line == "core" and name == "portrait-1080x1350")):
                    subprocess.run([resvg, "-w", "720", str(f), str(prev / f"{stem}--{name}.png")], check=True)
                if a.png and resvg:
                    (HERE / "out").mkdir(exist_ok=True)
                    subprocess.run([resvg, str(f), str(HERE / "out" / f"{stem}--{name}.png")], check=True)
    # one symbol sheet per set for the playground
    for line, names in SETS.items():
        W = 24 + len(names) * 116
        sheet = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="140" viewBox="0 0 {W} 140">',
                 f"<defs>{symdefs(names)}</defs>", f'<rect width="{W}" height="140" rx="12" fill="{C["brand-500"]}"/>']
        for i, g in enumerate(names):
            sheet.append(f'<use href="#g-{g}" x="{34 + i * 116}" y="30" width="80" height="80" color="#FFFFFF"/>')
        sheet.append("</svg>")
        (SYMBOLS / f"sheet-{line}.svg").write_text("\n".join(sheet))
    print(f"{n} backgrounds; sets: " + ", ".join(f"{k}({len(v)})" for k, v in SETS.items()))

if __name__ == "__main__":
    main()
