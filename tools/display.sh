#!/bin/bash
# Aporia 视觉窗口 — 在独立 Ghostty tab 里跑
# 监听 world/scene.png，变了就重渲染 inline
#
# Usage:
#   bash tools/display.sh             # 监听默认 world/scene.png
#   bash tools/display.sh path/to.png # 监听指定文件

SCENE="${1:-world/scene.png}"

if ! command -v kitten >/dev/null; then
  echo "错误：kitten 未安装。brew install kitty 或 uv tool install kitten"
  exit 1
fi

LAST_MTIME=""
clear
echo ""
echo "  Aporia 视觉窗口 · 监听 $SCENE"
echo "  (另一个 tab 跑 CC 对话，这里显示场景)"
echo ""

while true; do
  if [[ -f "$SCENE" ]]; then
    CURRENT=$(stat -f %m "$SCENE" 2>/dev/null || stat -c %Y "$SCENE" 2>/dev/null)
    if [[ "$CURRENT" != "$LAST_MTIME" ]]; then
      clear
      # --clear 清掉前一张；--align center 居中
      kitten icat --clear --align=center "$SCENE" 2>/dev/null || {
        printf "\033[31m无法渲染 %s\033[0m\n" "$SCENE"
      }
      LAST_MTIME="$CURRENT"
    fi
  else
    clear
    echo ""
    echo "  等待 $SCENE 生成..."
    echo ""
  fi
  sleep 0.4
done
