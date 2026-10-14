#!/usr/bin/env python3
"""构建 sprite、playground 和 skill 下载包。改完源文件跑一次：python3 build.py

- assets/icons/*.svg  -> assets/icons/sprite.svg  (<symbol id="i-<name>">, currentColor)
- playground.src.html -> playground.html          (内联 sprite + 字标，file:// 也能直接打开)
- skill/ + 规范文件   -> downloads/jujubit-design-system-skill.zip（固定时间戳，内容不变则字节不变）
"""
import json
import re
import zipfile
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ICONS = ROOT / "assets" / "icons"
LOGO = ROOT / "assets" / "logo" / "wordmark-orange.svg"


class SourceParser(HTMLParser):
    """Keep source offsets, never serialize the parsed tree back to HTML."""
    VOID = set('area base br col embed hr img input link meta param source track wbr'.split())

    def __init__(self, src):
        super().__init__(convert_charrefs=True)
        self.src, self.nodes, self.stack = src, [], []
        self.lines = [0] + [m.end() for m in re.finditer('\n', src)]
        self.feed(src)

    def source_offset(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        start = self.source_offset()
        node = dict(tag=tag, attrs=dict(attrs), start=start,
                    inner=start + len(self.get_starttag_text()), end=None,
                    line=self.getpos()[0], parent=self.stack[-1] if self.stack else None,
                    text=[])
        self.nodes.append(node)
        if tag not in self.VOID:
            self.stack.append(node)
        else:
            node['end'] = node['inner']

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.stack.pop()['end'] = self.source_offset() + len(self.get_starttag_text())

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]['tag'] == tag:
                self.stack[i]['end'] = self.source_offset()
                del self.stack[i:]
                break

    def handle_data(self, text):
        # Source badges do not contribute to module titles.
        for node in reversed(self.stack):
            if 'src' in node['attrs'].get('class', '').split():
                break
            node['text'].append(text)


def _module_data(src):
    parser = SourceParser(src)
    modules, by_id, edits = [], {}, []
    for node in parser.nodes:
        attrs = node['attrs']
        if 'data-mod' in attrs:
            ident = attrs['data-mod']
            if not ident or not re.fullmatch(r'[a-z0-9]+(\.[a-z0-9-]+)*', ident) or ident in by_id:
                raise ValueError(f'invalid or duplicate data-mod {ident!r} at line {node["line"]}')
            mod = dict(id=ident, title=ident, file='playground.src.html', line=node['line'], edits=[])
            modules.append(mod)
            by_id[ident] = mod
        parent = node
        owners = []
        while parent:
            if 'data-mod' in parent['attrs']:
                owners.append(by_id[parent['attrs']['data-mod']])
            parent = parent['parent']
        if not owners:
            continue
        classes = attrs.get('class', '').split()
        if node['tag'] in ('h2', 'h3') or 'pg-sub' in classes:
            for mod in owners:
                if '_title' not in mod:
                    mod['title'] = ''.join(node['text']).strip() or mod['id']
                    mod['_title'] = True
        parent = node['parent']
        eligible = (node['tag'] == 'h2' or (node['tag'] == 'p' and 'lead' in classes)
                    or 'pg-sub' in classes or 'logo-cap' in classes
                    or (node['tag'] == 'li' and parent and parent['tag'] == 'ul'
                        and 'rules' in parent['attrs'].get('class', '').split()))
        if not eligible or node['end'] is None:
            continue
        source = src[node['inner']:node['end']]
        # Strict source whitelist: attributes, comments and placeholders are excluded.
        if '{{' in source or '<' in re.sub(r'</?(?:b|code)>|<br>', '', source):
            continue
        mod = owners[0]
        key = f'{mod["id"]}#{len(mod["edits"]) + 1}'
        mod['edits'].append(dict(key=key, source=source))
        edits.append((node['inner'] - 1, key))
    for mod in modules:
        mod.pop('_title', None)
    return modules, edits


def scan_modules(src: str) -> list[dict]:
    return _module_data(src)[0]


def annotate_edits(src: str, modules: list[dict]) -> str:
    expected = {e['key'] for mod in modules for e in mod['edits']}
    for offset, key in reversed(_module_data(src)[1]):
        if key in expected:
            src = src[:offset] + f' data-edit="{key}"' + src[offset:]
    return src


def to_symbol(name: str, svg: str) -> str:
    vb = re.search(r'viewBox="([^"]+)"', svg).group(1)
    inner = re.sub(r"^.*?<svg[^>]*>|</svg>\s*$", "", svg, flags=re.S).strip()
    # 每个图标的内部 id 加前缀，避免 sprite 内 filter/clipPath 撞名
    for old in set(re.findall(r'id="([^"]+)"', inner)):
        inner = inner.replace(f'id="{old}"', f'id="{name}-{old}"').replace(f"url(#{old})", f"url(#{name}-{old})")
    # 根 <svg fill="none"> 不会被 <use> 继承，丢了它线性图标会被默认黑色填充成实心块
    root_fill = re.search(r'<svg[^>]*\sfill="([^"]+)"', svg)
    if root_fill:
        inner = f'<g fill="{root_fill.group(1)}">{inner}</g>'
    return f'<symbol id="i-{name}" viewBox="{vb}">{inner}</symbol>'


# 打进 skill 包的规范文件（放在包内 kit/ 下）；3D 字标和 App 图标矢量各 1MB+，网页用不到，不打包
KIT_FILES = ["tokens.css", "components.css", "playground.html", "assets/README.md"]
KIT_DIRS = ["assets/fonts", "assets/icons", "assets/logo", "assets/app"]
KIT_SKIP = {"juju-mark.svg", "juju-app-icon-square.svg"}


def build_zip() -> int:
    out = ROOT / "downloads" / "jujubit-design-system-skill.zip"
    out.parent.mkdir(exist_ok=True)
    entries = []
    skill = ROOT / "skill" / "jujubit-design-system"
    for f in sorted(skill.rglob("*")):
        if f.is_file():
            entries.append((f, "jujubit-design-system/" + f.relative_to(skill).as_posix()))
    for rel in KIT_FILES:
        entries.append((ROOT / rel, "jujubit-design-system/kit/" + rel))
    for d in KIT_DIRS:
        for f in sorted((ROOT / d).rglob("*")):
            if f.is_file() and f.name not in KIT_SKIP and not f.name.startswith("."):
                entries.append((f, "jujubit-design-system/kit/" + f.relative_to(ROOT).as_posix()))
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for src, arc in entries:
            info = zipfile.ZipInfo(arc, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, src.read_bytes())
    return out.stat().st_size


def main() -> None:
    names = sorted(p.stem for p in ICONS.glob("*.svg") if p.stem != "sprite")
    symbols = [to_symbol(n, (ICONS / f"{n}.svg").read_text()) for n in names]
    # 横版字标也进 sprite：<svg viewBox="0 0 89 22"><use href="#logo-wordmark"/></svg>，颜色跟随 currentColor
    mark = re.sub(r'fill="#FF5A11"', 'fill="currentColor"', LOGO.read_text(), flags=re.I)
    symbols.append(to_symbol("wordmark", mark).replace('id="i-wordmark"', 'id="logo-wordmark"'))
    sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">' + "".join(symbols) + "</svg>"
    (ICONS / "sprite.svg").write_text(sprite + "\n")

    wordmark = LOGO.read_text()
    wordmark = re.sub(r'fill="#FF5A11"', 'fill="currentColor"', wordmark, flags=re.I)
    wordmark = re.sub(r'<svg ', '<svg class="jjb-wordmark" role="img" aria-label="JuJuBit" ', wordmark, count=1)

    src = (ROOT / "playground.src.html").read_text()
    modules = scan_modules(src)
    (ROOT / 'modules.json').write_text(json.dumps({'version': 1, 'modules': modules}, ensure_ascii=False, indent=1) + '\n')
    src = annotate_edits(src, modules)
    out = (src.replace("{{SPRITE}}", sprite)
              .replace("{{ICONS}}", json.dumps(names))
              .replace("{{WORDMARK}}", wordmark.strip()))
    (ROOT / "playground.html").write_text(out)
    zip_size = build_zip()
    print(f"zip={zip_size//1024}KB ", end="")
    print(f"icons={len(names)} sprite={len(sprite)//1024}KB playground={len(out)//1024}KB modules={len(modules)}")


if __name__ == "__main__":
    main()
