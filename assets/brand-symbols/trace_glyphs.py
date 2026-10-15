#!/usr/bin/env python3
"""Trace white-on-orange glyph sheets into one SVG symbol per glyph.

A sheet is a flat image with white glyphs on solid orange, laid out on a
grid (cols x rows). Each grid cell becomes one glyph, accents included.
Output: <out>/<name>.svg, normalised to a 100x100 viewBox, fill currentColor.

    python3 trace_glyphs.py sheet.png --cols 3 --rows 2 \
        --names fig,afro,camera,photo,pair,box --out glyphs/people
Needs potrace (brew install potrace) and Pillow.
"""
import argparse, math, re, subprocess, tempfile
from pathlib import Path
from PIL import Image, ImageFilter

def mask(img):
    g = img.convert("RGB")
    m = Image.new("L", g.size, 0)
    src, dst = g.load(), m.load()
    for y in range(g.height):
        for x in range(g.width):
            r, gg, b = src[x, y]
            dst[x, y] = 255 if (gg > 165 and b > 150) else 0
    return m.filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: 255 if v > 128 else 0)

def trace(cell):
    """potrace one black-on-white bitmap -> (path d, width, height)."""
    inv = cell.point(lambda v: 0 if v else 255).convert("1")
    with tempfile.TemporaryDirectory() as d:
        bmp, svg = Path(d, "c.bmp"), Path(d, "c.svg")
        inv.save(bmp)
        subprocess.run(["potrace", str(bmp), "-s", "-o", str(svg), "--turdsize", "8",
                        "--alphamax", "1.1", "--opttolerance", "0.4"], check=True)
        s = svg.read_text()
    tf = re.search(r'<g transform="([^"]+)"', s).group(1)
    paths = " ".join(re.findall(r' d="([^"]+)"', s))
    return tf, paths

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet"); ap.add_argument("--cols", type=int, required=True)
    ap.add_argument("--rows", type=int, default=1); ap.add_argument("--names", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--bold", type=int, default=0, help="thicken strokes by N px (odd) to match the box glyph weight")
    ap.add_argument("--skew", type=float, default=0, help="forward lean in degrees, to match the box glyphs")
    a = ap.parse_args()
    names = a.names.split(",")
    m = mask(Image.open(a.sheet))
    if a.bold:
        m = m.filter(ImageFilter.MaxFilter(a.bold | 1))
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    cw, ch = m.width / a.cols, m.height / a.rows
    for i, name in enumerate(names):
        c, r = i % a.cols, i // a.cols
        cell = m.crop((int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch)))
        bb = cell.getbbox()
        if not bb:
            print("empty", name); continue
        cell = cell.crop(bb)
        if a.skew:
            k = math.tan(math.radians(a.skew)); pad = int(cell.height * abs(k)) + 2
            wide = Image.new("L", (cell.width + pad, cell.height), 0); wide.paste(cell, (0, 0))
            cell = wide.transform(wide.size, Image.AFFINE, (1, k, -k * cell.height, 0, 1, 0), resample=Image.BICUBIC)
            cell = cell.point(lambda v: 255 if v > 128 else 0).crop(cell.getbbox())
        w, h = cell.size
        side = max(w, h)
        sq = Image.new("L", (side, side), 0)
        sq.paste(cell, ((side - w) // 2, (side - h) // 2))
        tf, d = trace(sq)
        s = 100 / side
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
               f'<g transform="scale({s:.5f})"><g transform="{tf}" fill="currentColor"><path d="{d}"/></g></g></svg>')
        (out / f"{name}.svg").write_text(svg)
        print("ok", name)

if __name__ == "__main__":
    main()
