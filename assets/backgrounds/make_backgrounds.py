#!/usr/bin/env python3
"""JuJuBit brand backgrounds for store art, ads, posters and packaging inserts.

The pattern copies the brand texture used on the live Google Play feature
graphic, the gift box side panel and the thank-you card: a few big, chunky,
single-color glyphs (sparkle, heart, ampersand, exclamation, ring, paw, arrow)
printed one shade darker than the base. Colors come from tokens.css; "&" and
"!" are taken from the brand font Outfit. Everything is deterministic, so the
same size always gives the same background.

    python3 assets/backgrounds/make_backgrounds.py          # SVG + previews
    python3 assets/backgrounds/make_backgrounds.py --png    # also full-size PNG into ./out (gitignored)

Glyphs are redrawn by hand, not the designer's source vectors. When the
source glyphs arrive, replace GLYPHS below and re-run.
"""
import argparse, random, re, shutil, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
TOKENS = ROOT / "tokens.css"
FONT = ROOT / "assets" / "fonts" / "Outfit-VariableFont_wght.ttf"

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

def font_glyph(char, weight=900):
    """Path of one Outfit glyph at the given weight, normalised to a 100x100 box."""
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.boundsPen import BoundsPen
    f = instantiateVariableFont(TTFont(FONT), {"wght": weight})
    gs = f.getGlyphSet()
    name = f.getBestCmap()[ord(char)]
    bp = BoundsPen(gs); gs[name].draw(bp)
    x0, y0, x1, y1 = bp.bounds
    s = 100 / max(x1 - x0, y1 - y0)
    pen = SVGPathPen(gs); gs[name].draw(pen)
    tx = -x0 * s + (100 - (x1 - x0) * s) / 2
    ty = y1 * s + (100 - (y1 - y0) * s) / 2
    return f'<path transform="translate({tx:.1f} {ty:.1f}) scale({s:.4f} {-s:.4f})" d="{pen.getCommands()}"/>'

# Chunky single-color glyphs, 100x100 box, filled with currentColor.
GLYPHS = {
    "sparkle": '<path d="M50 4C54 30 70 46 96 50C70 54 54 70 50 96C46 70 30 54 4 50C30 46 46 30 50 4Z"/>',
    "heart": '<path d="M50 90C40 82 6 62 6 34C6 14 22 6 34 6C42 6 47 11 50 17C53 11 58 6 66 6C78 6 94 14 94 34C94 62 60 82 50 90Z"/>',
    "ring": '<path fill-rule="evenodd" d="M50 6a44 44 0 1 1 0 88a44 44 0 1 1 0-88Zm0 24a20 20 0 1 0 0 40a20 20 0 1 0 0-40Z"/>',
    "paw": '<ellipse cx="50" cy="66" rx="26" ry="22"/><ellipse cx="20" cy="40" rx="11" ry="14"/><ellipse cx="38" cy="20" rx="11" ry="15"/>'
           '<ellipse cx="62" cy="20" rx="11" ry="15"/><ellipse cx="80" cy="40" rx="11" ry="14"/>',
    "arrow": '<path d="M6 34H50V10L96 50L50 90V66H6Z"/>',
    "star": '<path d="M50 6L62 36L94 38L69 58L77 92L50 73L23 92L31 58L6 38L38 36Z"/>',
}

def glyph_defs():
    g = dict(GLYPHS)
    try:
        g["amp"] = font_glyph("&")
        g["bang"] = font_glyph("!")
    except Exception as e:  # font missing: keep the drawn set
        print("font glyphs skipped:", e)
    return g, "".join(f'<symbol id="g-{k}" viewBox="0 0 100 100" overflow="visible"><g fill="currentColor">{v}</g></symbol>'
                      for k, v in g.items())

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

def pattern(w, h, names, color, opacity, seed, cols):
    pts, rnd = scatter(w, h, seed, cols)
    out = [f'<g color="{color}" opacity="{opacity}">']
    last = None
    for x, y, s, r in pts:
        n = rnd.choice([k for k in names if k != last]); last = n
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

def svg(variant, w, h, names, symdefs):
    kind, color, op, sw, _ = VARIANTS[variant]
    cols = 5 if w / h > 1.6 else 4 if w >= h else 3
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
             f"<defs>{base(kind)}{symdefs}</defs>", f'<rect width="{w}" height="{h}" fill="url(#bg)"/>']
    if color:
        parts.append(pattern(w, h, names, color, op, w * 7 + h * 13, cols))
    if sw:
        parts.append(swoosh(w, h))
    parts.append("</svg>")
    return "\n".join(parts)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--png", action="store_true")
    a = ap.parse_args()
    glyphs, symdefs = glyph_defs()
    names = list(glyphs)
    for old in HERE.glob("*.svg"):
        old.unlink()
    prev = HERE / "previews"; prev.mkdir(exist_ok=True)
    for old in prev.glob("*.png"):
        old.unlink()
    resvg = shutil.which("resvg")
    for v in VARIANTS:
        for name, (w, h) in SIZES.items():
            f = HERE / f"{v}--{name}.svg"
            f.write_text(svg(v, w, h, names, symdefs))
            if resvg and name in ("gp-feature-1024x500", "portrait-1080x1350"):
                subprocess.run([resvg, "-w", "720", str(f), str(prev / f"{v}--{name}.png")], check=True)
            if a.png and resvg:
                (HERE / "out").mkdir(exist_ok=True)
                subprocess.run([resvg, str(f), str(HERE / "out" / f"{v}--{name}.png")], check=True)
    # glyph sheet for the playground
    sheet = ['<svg xmlns="http://www.w3.org/2000/svg" width="960" height="140" viewBox="0 0 960 140">',
             f"<defs>{symdefs}</defs>", f'<rect width="960" height="140" rx="12" fill="{C["brand-500"]}"/>']
    for i, n in enumerate(names):
        sheet.append(f'<use href="#g-{n}" x="{24 + i * 116}" y="22" width="96" height="96" color="#FFFFFF"/>')
    sheet.append("</svg>")
    (HERE / "glyphs.svg").write_text("\n".join(sheet))
    print(f"{len(VARIANTS)} variants x {len(SIZES)} sizes, glyphs: {', '.join(names)}")

if __name__ == "__main__":
    main()
