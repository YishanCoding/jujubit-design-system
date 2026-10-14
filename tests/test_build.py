import unittest
import build


class BuildTests(unittest.TestCase):
    basic = '<section data-mod="color"><h2>色彩</h2><p class="lead">一个<b>主色</b></p></section>'

    def test_scan_modules_basic(self):
        self.assertEqual(build.scan_modules(self.basic), [{"id": "color", "title": "色彩", "file": "playground.src.html", "line": 1, "edits": [{"key": "color#1", "source": "色彩"}, {"key": "color#2", "source": "一个<b>主色</b>"}]}])

    def test_innermost_module_owns_edit(self):
        mods = build.scan_modules('<section data-mod="color"><ul class="rules" data-mod="color.rules"><li>Rule</li></ul></section>')
        self.assertEqual(mods[0]['edits'], [])
        self.assertEqual(mods[1]['edits'], [{'key': 'color.rules#1', 'source': 'Rule'}])

    def test_skip_placeholder_and_svg(self):
        mods = build.scan_modules('<div data-mod="a"><div class="logo-cap">{{WORDMARK}}</div><ul class="rules"><li><svg></svg>x</li></ul></div>')
        self.assertEqual(mods[0]['edits'], [])

    def test_non_unique_source_not_editable(self):
        src = '<nav><a>色彩</a></nav><section data-mod="color"><h2>色彩</h2><p class="lead">唯一一段</p></section>'
        modules = build.scan_modules(src)
        self.assertEqual(modules[0]['edits'], [{'key': 'color#1', 'source': '唯一一段'}])

    def test_duplicate_id_raises(self):
        with self.assertRaisesRegex(ValueError, 'color.*2'):
            build.scan_modules('<div data-mod="color"></div>\n<div data-mod="color"></div>')

    def test_invalid_id_raises(self):
        with self.assertRaisesRegex(ValueError, 'Color_1.*1'):
            build.scan_modules('<div data-mod="Color_1"></div>')

    def test_annotate_adds_data_edit(self):
        self.assertEqual(build.annotate_edits(self.basic, build.scan_modules(self.basic)), self.basic.replace('<h2>', '<h2 data-edit="color#1">').replace('<p class="lead">', '<p class="lead" data-edit="color#2">'))

    def test_entities_preserved(self):
        self.assertEqual(build.scan_modules('<div data-mod="a"><h2>A &amp; B</h2></div>')[0]['edits'][0]['source'], 'A &amp; B')

    def test_title_excludes_source_and_markup_is_strict(self):
        mods = build.scan_modules('<div data-mod="a"><h3>Title <span class="src">F</span></h3><p class="lead"><b class="x">No</b></p><div class="pg-sub">Yes<br>ok</div></div>')
        self.assertEqual(mods[0]['title'], 'Title')
        self.assertEqual(mods[0]['edits'], [{'key': 'a#1', 'source': 'Yes<br>ok'}])
