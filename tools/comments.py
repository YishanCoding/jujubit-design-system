#!/usr/bin/env python3
"""Read and resolve design comments. Credentials are supplied only via environment."""
import argparse
import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    listing = commands.add_parser('list')
    listing.add_argument('--status', choices=('open', 'resolved', 'all'), default='open')
    listing.add_argument('--json', action='store_true')
    resolve = commands.add_parser('resolve')
    resolve.add_argument('id', type=int)
    resolve.add_argument('--commit', required=True)
    reopen = commands.add_parser('reopen')
    reopen.add_argument('id', type=int)
    args = parser.parse_args(argv)
    # creds run 注入的变量名是 AGENT_TOKEN（与 Worker secret 同名），这里两个都认
    token = os.environ.get('JJB_DESIGN_AGENT_TOKEN') or os.environ.get('AGENT_TOKEN')
    if not token:
        print('缺少 JJB_DESIGN_AGENT_TOKEN；请用 creds run <设计页 agent 凭据> -- python3 tools/comments.py list 注入。', file=sys.stderr)
        return 2
    base = os.environ.get('JJB_DESIGN_API', 'https://playverseai.com/design/api').rstrip('/')
    headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/json',
               # Cloudflare 的浏览器完整性检查会拦 Python-urllib 默认 UA（error 1010）
               'User-Agent': 'jujubit-design-comments/1'}
    if args.command == 'list':
        request = Request(f'{base}/comments?status={args.status}', headers=headers)
    else:
        if args.id < 1:
            parser.error('评论 id 必须为正整数')
        body = {'status': 'resolved' if args.command == 'resolve' else 'open'}
        if args.command == 'resolve':
            if not args.commit.startswith('https://github.com/YishanCoding/jujubit-design-system/commit/'):
                parser.error('commit 必须是本仓库的提交链接')
            body['commit_url'] = args.commit
        headers['Content-Type'] = 'application/json'
        request = Request(f'{base}/comments/{args.id}', data=json.dumps(body).encode(), headers=headers, method='PATCH')
    try:
        with urlopen(request, timeout=30) as response:
            raw = response.read().decode('utf-8')
        result = json.loads(raw)
    except HTTPError as error:
        print(f'API 请求失败：HTTP {error.code}', file=sys.stderr)
        return 1
    except (URLError, TimeoutError, OSError, ValueError):
        print('API 请求失败：网络或响应格式错误', file=sys.stderr)
        return 1
    if args.command == 'list' and not args.json:
        for comment in result['comments']:
            module = comment.get('module')
            location = f'{module["file"]}:{module["line"]}' if module else '?'
            first_line = comment['body'].splitlines()[0] if comment['body'] else ''
            print(f'#{comment["id"]} [{comment["mod"]}] {location} {comment["author"]}: {first_line}')
        if result.get('purge_skipped'):
            print(f'purge_skipped: {result["purge_skipped"]}', file=sys.stderr)
    else:
        print(raw)
    return 0


if __name__ == '__main__':
    sys.exit(main())
