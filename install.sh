#!/usr/bin/env bash
# 安装 JuJuBit 设计规范 skill 到 Claude Code / Codex。
# 用法：curl -fsSL https://playverseai.com/design/install.sh | bash            # 两个都装
#       curl -fsSL https://playverseai.com/design/install.sh | bash -s claude  # 只装 Claude Code
#       curl -fsSL https://playverseai.com/design/install.sh | bash -s codex   # 只装 Codex
# 再跑一次即更新到最新版。
set -euo pipefail
url="https://playverseai.com/design/downloads/jujubit-design-system-skill.zip"
target="${1:-all}"; target="${target#-s}"; target="${target# }"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
curl -fsSL "$url" -o "$tmp/skill.zip"
unzip -q "$tmp/skill.zip" -d "$tmp/x"
install_to() {
  local dir="$1/jujubit-design-system"
  mkdir -p "$1"
  if [ -L "$dir" ]; then echo "跳过 $dir（是软链，按你自己的方式更新）"; return; fi
  rm -rf "$dir" && cp -R "$tmp/x/jujubit-design-system" "$dir"
  echo "已安装：$dir"
}
case "$target" in
  all)    install_to "$HOME/.claude/skills"; install_to "${CODEX_HOME:-$HOME/.codex}/skills" ;;
  claude) install_to "$HOME/.claude/skills" ;;
  codex)  install_to "${CODEX_HOME:-$HOME/.codex}/skills" ;;
  *) echo "未知参数：$target（可选 claude / codex）"; exit 1 ;;
esac
echo "重启 Claude Code / Codex 后，说「按 JuJuBit 设计规范做一个 xx 页面」即可。"
