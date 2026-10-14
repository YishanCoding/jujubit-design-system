import json
import os
from pathlib import Path
import subprocess
import tempfile
import textwrap
import unittest

ROOT = Path(__file__).resolve().parents[1]


class WorkflowTests(unittest.TestCase):
    def run_script(self, scenario):
        workflow = (ROOT / '.github/workflows/build.yml').read_text()
        script = textwrap.dedent(workflow.split('      - name: Commit generated files\n', 1)[1].split('        run: |\n', 1)[1])
        with tempfile.TemporaryDirectory() as directory:
            tmp = Path(directory)
            # The subprocess PATH contains a fake Git. No repository is reset or pushed.
            shim = '''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
log = Path(os.environ['TEST_LOG'])
records = json.loads(log.read_text()) if log.exists() else []
name = Path(sys.argv[0]).name
args = sys.argv[1:]
records.append([name, *args]); log.write_text(json.dumps(records))
scenario = os.environ['TEST_SCENARIO']
if name == 'git' and args[:1] == ['push']:
    count = sum(r[:2] == ['git', 'push'] for r in records)
    sys.exit(1 if scenario == 'exhausted' or count == 1 else 0)
if name == 'git' and args[:2] == ['diff', '--cached']:
    count = sum(r[:3] == ['git', 'diff', '--cached'] for r in records)
    sys.exit(0 if scenario == 'fresh' or (scenario == 'caught_up' and count > 1) else 1)
sys.exit(0)
'''
            for name in ['git', 'python3']:
                file = tmp / name
                # Use an absolute interpreter so the python3 shim cannot recurse.
                import sys
                file.write_text(shim.replace('#!/usr/bin/env python3', '#!' + sys.executable))
                file.chmod(0o755)
            log = tmp / 'log.json'
            result = subprocess.run(['/bin/bash', '-e', '-c', script], cwd=tmp, env={**os.environ, 'PATH': str(tmp) + ':' + os.environ['PATH'], 'TEST_LOG': str(log), 'TEST_SCENARIO': scenario}, capture_output=True, text=True)
            return result, json.loads(log.read_text())

    def test_retry_rebuilds_latest_main(self):
        result, calls = self.run_script('retry')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(sum(c[:2] == ['git', 'push'] for c in calls), 2)
        first = calls.index(['git', 'push'])
        self.assertEqual(calls[first + 1:first + 4], [['git', 'fetch', 'origin', 'main'], ['git', 'reset', '--hard', 'origin/main'], ['python3', 'build.py']])

    def test_three_failures_exit_one(self):
        result, calls = self.run_script('exhausted')
        self.assertEqual(result.returncode, 1)
        self.assertEqual(sum(c[:2] == ['git', 'push'] for c in calls), 3)

    def test_up_to_date_avoids_push(self):
        for scenario, pushes in [('fresh', 0), ('caught_up', 1)]:
            result, calls = self.run_script(scenario)
            self.assertEqual(result.returncode, 0)
            self.assertEqual(sum(c[:2] == ['git', 'push'] for c in calls), pushes)

    def test_checks_before_build_and_modules_staged(self):
        text = (ROOT / '.github/workflows/build.yml').read_text()
        self.assertLess(text.index('python3 -m unittest discover -s tests'), text.index('- run: python3 build.py'))
        self.assertLess(text.index('node --test worker/test/'), text.index('- run: python3 build.py'))
        self.assertIn('actions/setup-node@v4', text)
        self.assertIn('node-version: "24"', text)
        for line in text.splitlines():
            if 'git add' in line:
                self.assertIn('modules.json', line)
