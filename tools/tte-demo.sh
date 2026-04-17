#!/bin/bash
# Aporia × TTE · 动画效果 demo
# 必须在真终端里跑（CC 内不显示动画）
# Usage:  bash tools/tte-demo.sh

TTE="$(command -v tte 2>/dev/null || echo $HOME/.local/bin/tte)"
if [[ ! -x "$TTE" ]]; then
  echo "tte 未安装。请先：uv tool install terminaltexteffects"
  exit 1
fi

pause() {
  echo ""
  echo "——— Enter 下一个, Ctrl-C 退出 ———"
  read _
  clear
}

clear
cat <<'EOF'

  ═══════════════════════════════════════
    Aporia × TTE · 动画效果 demo
  ═══════════════════════════════════════

  7 个效果示范
  每个对应 Aporia 的一个视觉时刻

EOF
pause

# 1. Burn — 扬弃
echo "1/7  Burn · 扬弃承诺（烧 "应该"）"
echo ""
echo "应该" | "$TTE" burn
pause

# 2. Crumble — Frame 崩坏
echo "2/7  Crumble · Frame 从 Pristine 到 Cracked"
echo ""
cat <<'EOF' | "$TTE" crumble
      ┌──────────────────────┐
      │                      │
      │          @           │
      │                      │
      └──────────────────────┘
EOF
pause

# 3. BlackHole — Last God L4
echo "3/7  BlackHole · Last God L4 系统崩塌"
echo ""
cat <<'EOF' | "$TTE" blackhole
      ·                ·



              ·



      ·                ·
EOF
pause

# 4. Beams — 章节转场
echo "4/7  Beams · 章节转场 (beginning → echo)"
echo ""
echo "beginning  →  echo" | "$TTE" beams
pause

# 5. Scattered — Foresight 符号入场
echo "5/7  Scattered · Foresight 符号散落入场"
echo ""
echo "being    there    is    not    all    one" | "$TTE" scattered
pause

# 6. Decrypt — Daemon 读取玩家的句子
echo "6/7  Decrypt · Daemon 读取玩家的句子"
echo ""
echo "我看见门" | "$TTE" decrypt
pause

# 7. Wipe — AppShell 过场
echo "7/7  Wipe · 过场扫掠"
echo ""
cat <<'EOF' | "$TTE" wipe
      ╔══════════════════════╗
      ║                      ║
      ║          @      ◇   ║
      ║                      ║
      ╚══════════════════════╝
EOF

echo ""
echo "——— 完 ———"
echo ""
echo "TTE 共有 40+ 效果。完整列表："
echo ""
"$TTE" --help 2>&1 | awk '/\{beams/{found=1} found{print; if(/\}/) exit}' | fold -s -w 70
echo ""
