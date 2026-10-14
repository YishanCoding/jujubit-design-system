import contextlib
import io
import json
import os
import unittest
from unittest.mock import patch
from tools import comments


class CommentsCliTests(unittest.TestCase):
    def test_missing_token_exit2(self):
        output = io.StringIO()
        with patch.dict(os.environ, {}, clear=True), contextlib.redirect_stderr(output):
            self.assertEqual(comments.main(['list']), 2)
        self.assertIn('creds run', output.getvalue())

    def test_agent_token_fallback(self):
        out = io.StringIO()
        with patch.dict(os.environ, {'AGENT_TOKEN': 'fallback-token'}, clear=False), patch('tools.comments.urlopen', return_value=io.BytesIO(b'{"comments":[]}')) as fetch, contextlib.redirect_stdout(out):
            os.environ.pop('JJB_DESIGN_AGENT_TOKEN', None)
            self.assertEqual(comments.main(['list']), 0)
        self.assertEqual(fetch.call_args.args[0].get_header('Authorization'), 'Bearer fallback-token')

    def test_list_format(self):
        data = {'comments': [
            {'id': 1, 'mod': 'color', 'author': 'yingrui', 'body': 'test-comment\nsecond line', 'module': {'file': 'playground.src.html', 'line': 42}},
            {'id': 2, 'mod': 'old.mod', 'author': 'yishan', 'body': 'test-orphan', 'module': None},
        ]}
        output = io.StringIO()
        with patch.dict(os.environ, {'JJB_DESIGN_AGENT_TOKEN': 'test-agent-token', 'JJB_DESIGN_API': 'https://example.test/design/api'}), patch('tools.comments.urlopen', return_value=io.BytesIO(json.dumps(data).encode())) as fetch, contextlib.redirect_stdout(output):
            self.assertEqual(comments.main(['list']), 0)
        self.assertEqual(output.getvalue(), '#1 [color] playground.src.html:42 yingrui: test-comment\n#2 [old.mod] ? yishan: test-orphan\n')
        self.assertEqual(fetch.call_args.args[0].get_header('Authorization'), 'Bearer test-agent-token')

    def test_resolve_reopen_and_json(self):
        for args, expected in [(['resolve', '7', '--commit', 'https://github.com/YishanCoding/jujubit-design-system/commit/test-fake'], 'resolved'), (['reopen', '7'], 'open')]:
            with patch.dict(os.environ, {'JJB_DESIGN_AGENT_TOKEN': 'test-agent-token'}), patch('tools.comments.urlopen', return_value=io.BytesIO(b'{"id":7}')) as fetch, contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(comments.main(args), 0)
            req = fetch.call_args.args[0]
            self.assertEqual(req.method, 'PATCH')
            self.assertEqual(json.loads(req.data)['status'], expected)
        out = io.StringIO()
        with patch.dict(os.environ, {'JJB_DESIGN_AGENT_TOKEN': 'test-agent-token'}), patch('tools.comments.urlopen', return_value=io.BytesIO(b'{"comments":[],"purge_skipped":"test-reason"}')), contextlib.redirect_stdout(out):
            self.assertEqual(comments.main(['list', '--json']), 0)
        self.assertEqual(json.loads(out.getvalue())['purge_skipped'], 'test-reason')
