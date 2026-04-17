#!/bin/bash
# Aporia 场景预览 — 在真 Ghostty 窗口里跑（不是 CC）
#
# Usage:
#   bash tools/preview.sh           # 看所有电影感场景
#   bash tools/preview.sh old       # 看旧版（对比用）
#   bash tools/preview.sh begin_c   # 只看某一个
#
# 控制：
#   Enter   下一个
#   b       上一个
#   q       退出

PYTHON="$(dirname "$0")/../.venv/bin/python"
SHOW="$(dirname "$0")/show_scene.py"

if [[ ! -x "$PYTHON" ]]; then
  echo "错误：没找到 $PYTHON"
  echo "先：cd $(dirname "$0")/.. && uv venv .venv && uv pip install pillow numpy"
  exit 1
fi

# 决定要放哪些
if [[ "$1" == "old" ]]; then
  SCENES=(begin echo seyn lastgod)
  LABEL="旧版对比"
elif [[ "$1" == "cinema" ]]; then
  SCENES=(begin_c seyn_c lastgod_c)
  LABEL="电影感版（无锁定）"
elif [[ "$1" == "lock" ]]; then
  SCENES=(lock_begin lock_echo lock_seyn lock_lastgod)
  LABEL="锁定不变量版"
elif [[ "$1" == "gal" ]] || [[ -z "$1" ]]; then
  SCENES=(gal_begin gal_echo gal_seyn gal_lastgod)
  LABEL="galgame 画面感版"
elif [[ -n "$1" ]]; then
  # 单个场景直接跑
  clear
  "$PYTHON" "$SHOW" "$1"
  echo ""
  exit 0
fi

i=0
total=${#SCENES[@]}

while true; do
  clear
  # re-query terminal width each render (handles resize)
  # stty size → "rows cols"; bypasses terminfo (which doesn't know xterm-ghostty)
  stty_size=$(stty size 2>/dev/null)
  if [[ -n "$stty_size" ]]; then
    export APORIA_COLS="${stty_size#* }"
  else
    export APORIA_COLS=100
  fi
  "$PYTHON" "$SHOW" "${SCENES[$i]}"

  # 底部提示（暗色，不打扰画面）
  printf '\033[2m  [%d/%d · %s · %s · cols=%s]   Enter=next  b=prev  q=quit\033[0m' \
    $((i+1)) "$total" "$LABEL" "${SCENES[$i]}" "$APORIA_COLS"

  # 读一个键
  read -rsn1 key

  case "$key" in
    q|Q) clear; exit 0 ;;
    b|B)
      i=$(( i - 1 ))
      (( i < 0 )) && i=$(( total - 1 ))
      ;;
    *)
      i=$(( i + 1 ))
      if (( i >= total )); then
        clear
        echo ""
        echo "  ——完——"
        echo ""
        exit 0
      fi
      ;;
  esac
done
