#!/bin/bash
# Aporia Design System · Terminal Storybook
# Usage: bash tools/storybook.sh

# ── ANSI ──────────────────────────────────────────────
DIM=$'\033[2m'
BRIGHT=$'\033[1m'
ITALIC=$'\033[3m'
INVERSE=$'\033[7m'
STRIKE=$'\033[9m'
GOLD=$'\033[1;33m'
CYAN=$'\033[36m'
DIM_CYAN=$'\033[2;36m'
DIM_ITAL=$'\033[2;3m'
DIM_STRIKE=$'\033[2;9m'
RESET=$'\033[0m'

SEP="$(printf '%0.s─' $(seq 1 68))"

hr() { printf "${DIM}%s${RESET}\n" "$SEP"; }

# ══════════════════════════════════════════════════════
# L1 — COMPONENT
# ══════════════════════════════════════════════════════

item_glyphs() {
cat <<EOF

  ${BRIGHT}玩家${RESET}
    ·      arrived       刚进来，还没动
    @      acted         多数状态
    ◉      committed     近期立过高 intensity 承诺

  ${BRIGHT}Daemon 形态${RESET}  (由承诺模态决定)
    ·      alethic        不在场感
    ::     deontic        粒子
    ◇      presupp.       结晶   — 默认
    ∅      mixed/broken   空环   — 接近崩溃

  ${BRIGHT}Frame 边界${RESET}
    ─ │            细线   (intact)
    ═ ║            双线   (sealed)
    ┌ ┐ └ ┘        直角
    ╭ ╮ ╰ ╯        圆角

  ${BRIGHT}填充 / 密度${RESET}
    ░ ▒ ▓ █        1 → 4

  ${BRIGHT}方向${RESET}
    ↑ ↓ ← →        四向
    ↖ ↗ ↘ ↙        斜向
    ↻ ↺            循环
    ?              unknown

  ${BRIGHT}散 / 裂${RESET}
    ╱ ╲            裂痕
    · · ·          节律散点
    ⋯ ⋱ ⋰          碎裂

  ${BRIGHT}ANSI 权重 (live)${RESET}
    ${RESET}normal     叙事层${RESET}
    ${DIM}dim        承诺残影 / 状态${RESET}
    ${BRIGHT}bright     新出现 / 强调${RESET}
    ${ITALIC}italic     Daemon 口吻${RESET}
    ${INVERSE}inverse    崩溃 / 翻转${RESET}
    ${GOLD}gold       决定性瞬间${RESET}
    ${DIM_STRIKE}strike     已燃烧承诺${RESET}

EOF
}

item_frame_pristine() {
cat <<'EOF'

      ┌──────────────────────┐
      │                      │
      │                      │
      │                      │
      │                      │
      │                      │
      └──────────────────────┘

EOF
echo -e "  ${DIM}Pristine · 完好、细线、有呼吸 · Beginning 用${RESET}\n"
}

item_frame_sealed() {
cat <<'EOF'

      ╔══════════════════════╗
      ║                      ║
      ║                      ║
      ║                      ║
      ║                      ║
      ║                      ║
      ╚══════════════════════╝

EOF
echo -e "  ${DIM}Sealed · 双线、闭合、有压迫 · Echo 用${RESET}\n"
}

item_frame_stretched() {
cat <<'EOF'

            ┌──────────┐
            │          │
            │          │
            │          │
            │          │
            │          │
            │          │
            │          │
            │          │
            └──────────┘

EOF
echo -e "  ${DIM}Stretched · 垂直、抬升感 · Playing-forth 用${RESET}\n"
}

item_frame_scattered() {
cat <<'EOF'

   ·             ·                 ·

          ┌ ─ ─ ─ ─ ─ ─ ─ ┐

   ·                             ·

          └ ─ ─ ─ ─ ─ ─ ─ ┘

   ·          ·            ·

EOF
echo -e "  ${DIM}Scattered · 方块溶进旷野 · Foresight 用${RESET}\n"
}

item_frame_cracked() {
cat <<'EOF'

      ┌──────────────────────┐
      │                      │
      │                      │
      │    ╱                 │
      └───╱──────────────────┘
         ╱
        ╱

EOF
echo -e "  ${DIM}Cracked · 裂开、深渊从一角 · Grounding 用${RESET}\n"
}

item_frame_ruined() {
cat <<'EOF'

      ·                ·



              ·



      ·                ·

EOF
echo -e "  ${DIM}Ruined · 仅剩角点的记忆 · Last God 用${RESET}\n"
}

item_player_markers() {
cat <<EOF

  ${BRIGHT}·${RESET}      arrived        刚到，没动过

      ┌──────────────────────┐
      │                      │
      │          ·           │
      └──────────────────────┘


  ${BRIGHT}@${RESET}      acted          行动过（多数状态）

      ┌──────────────────────┐
      │                      │
      │          @           │
      └──────────────────────┘


  ${BRIGHT}◉${RESET}      committed      立过高 intensity 承诺

      ┌──────────────────────┐
      │                      │
      │          ◉           │
      └──────────────────────┘


  ${DIM}(absent)${RESET}  刚死、被抽离

      ┌──────────────────────┐
      │                      │
      │                      │
      └──────────────────────┘

EOF
}

item_daemon_markers() {
cat <<EOF

  形态 × 模态

    ${BRIGHT}·${RESET}      alethic       不在场感
    ${BRIGHT}::${RESET}     deontic       粒子
    ${BRIGHT}◇${RESET}      presupp.      结晶（默认）
    ${BRIGHT}∅${RESET}      mixed         空环（接近崩溃）

  状态

    ◇      quiet          默认观察

      ┌──────────────────────┐
      │                  ◇   │
      │          @           │
      └──────────────────────┘


    ◈      active         刚引用一条承诺

      ┌──────────────────────┐
      │                  ${GOLD}◈${RESET}   │
      │          @           │
      └──────────────────────┘
      ${DIM_ITAL}*「应该」——这个词留下了痕迹。*${RESET}


    ∅      dissolving     Last God

      ·                ·

                ·
              ${DIM}∅${RESET}   ·
                ·

      ·                ·

EOF
}

item_exits() {
cat <<EOF

  ${BRIGHT}?${RESET}          unknown — 玩家未说才显形

                  ?
      ┌──────────────────────┐
  ?   │                      │   ?
      └──────────────────────┘
                  ?


  ${BRIGHT}echo${RESET}       named — 已解析出下一章

                echo
                  ↑
      ┌──────────────────────┐
  ?   │          @           │   ?
      └──────────────────────┘
                  ?


  ${BRIGHT}↑ seyn${RESET}     directed — 有方向 + 目的

                ↑ seyn
      ┌──────────────────────┐
      │          @           │
      └──────────────────────┘


  ${BRIGHT}╱${RESET}          crack — 裂口替代出口

      ┌──────────────────────┐
      │    ╱                 │
      └───╱──────────────────┘
         ╱    grounding
        ╱


  ${BRIGHT}(sealed)${RESET}   无出口

      ╔══════════════════════╗
      ║          @           ║
      ╚══════════════════════╝

EOF
}

item_residues() {
cat <<EOF

  ${BRIGHT}fresh${RESET}       近 3 轮

      ┌──────────────────────┐
      │   ${DIM}应该${RESET}                 │
      │          @           │
      └──────────────────────┘


  ${BRIGHT}settled${RESET}     3-10 轮 (不突出)

      ┌──────────────────────┐
      │   ${DIM}应该${RESET}        ${DIM}只是${RESET}     │
      │          @           │
      │   ${DIM}本来${RESET}        ${DIM}不过是${RESET}   │
      └──────────────────────┘


  ${BRIGHT}flaring${RESET}     被 Daemon 引用那一瞬

      ┌──────────────────────┐
      │   ${GOLD}应该${RESET}                 │
      │          @      ${GOLD}◈${RESET}    │
      │                      │
      └──────────────────────┘
      ${DIM_ITAL}*「应该」——你第 2 轮说的。*${RESET}


  ${BRIGHT}burned${RESET}      已扬弃

      ┌──────────────────────┐
      │   ${DIM_STRIKE}应该${RESET}        ${DIM}只是${RESET}     │
      │          @           │
      └──────────────────────┘

EOF
}

# ══════════════════════════════════════════════════════
# L2 — MODULE
# ══════════════════════════════════════════════════════

item_frame_with_exits() {
cat <<EOF

                     ?

      ┌──────────────────────────┐
      │                          │
      │                          │
  ?   │                          │   ?
      │                          │
      │                          │
      └──────────────────────────┘

                     ?

  ${DIM}Frame + 四向 Exit。所有方向 unknown 的初态。${RESET}

EOF
}

item_interior_field() {
cat <<EOF

      ┌──────────────────────────┐
      │  ${DIM}应该${RESET}                    │
      │                          │
      │                 ◇        │
      │          @               │
      │                          │
      │              ${DIM}本来${RESET}         │
      └──────────────────────────┘

  ${DIM}布局规则：@ 中心偏下、Daemon 右上 2-3 格、${RESET}
  ${DIM}Residues 沿内壁、总元素 ≤6${RESET}

EOF
}

item_daemon_quote() {
cat <<EOF

  Daemon 引文块（dim + italic）：

  ${DIM_ITAL}*「应该有路」——你第 2 轮说的。它还挂在那里。*${RESET}


  结合场景：

      ┌──────────────────────────┐
      │   ${GOLD}应该${RESET}             ${GOLD}◈${RESET}    │
      │                          │
      │          @               │
      │                          │
      └──────────────────────────┘

  这句话的重量让空气里的什么东西沉下去了。
  ${DIM_ITAL}*「应该有路」——你第 2 轮说的。它还挂在那里。*${RESET}

EOF
}

item_transition_hint() {
cat <<EOF

      ┌──────────────────────────┐
      │                          │
      │          @               │
      │    ╱                     │
      └───╱──────────────────────┘
         ╱
        ╱        ${DIM}seyn${RESET}
       ╱

  ${DIM}章节张力将至——frame 外冒出"下一章的气息"${RESET}

EOF
}

# ══════════════════════════════════════════════════════
# L3 — PAGE
# ══════════════════════════════════════════════════════

item_page_beginning_init() {
cat <<EOF

                     ?

      ┌──────────────────────────┐
      │                          │
      │                          │
  ?   │             ·            │   ?
      │                          │
      │                          │
      └──────────────────────────┘

                     ?


  ${DIM}Beginning · 初态 · 玩家刚进，4 向未知${RESET}

EOF
}

item_page_beginning_acted() {
cat <<EOF

                  echo
                    ↑

      ┌──────────────────────────┐
      │  ${DIM}看看${RESET}                    │
      │                          │
      │                ◇         │
  ?   │          @               │   ?
      │                          │
      │                          │
      └──────────────────────────┘

                     ?


  玩家说了 \`我看看北边\` → 北向解析为 echo，残影 \`看看\` 进内场
  ${DIM_ITAL}*「看看」——这里也在听这个词。*${RESET}

EOF
}

item_page_echo() {
cat <<EOF

      ╔══════════════════════════╗
      ║   ${DIM}应该${RESET}            ${DIM}只是${RESET}    ║
      ║                          ║
      ║                 ◇        ║
      ║          @               ║
      ║                          ║
      ║   ${DIM}本来${RESET}          ${DIM}不过是${RESET}    ║
      ╚══════════════════════════╝
                    ↻
                 回到此处


  ${DIM}Echo · 闭环、承诺沿墙、循环提示${RESET}

EOF
}

item_page_playing_forth() {
cat <<EOF

                ↑ foresight


              ┌──────────┐
              │          │
              │          │
              │    ◇     │
              │    @     │
              │          │
              │          │
              │          │
              └──────────┘

                ↓ beginning


  ${DIM}Playing-forth · 垂直 Frame · 双向通道（抬升 / 回落）${RESET}

EOF
}

item_page_foresight() {
cat <<EOF

   ${CYAN}◆being${RESET}                      ${CYAN}◆there${RESET}

            ┌ ─ ─ ─ ─ ─ ─ ─ ┐

            │   @      ◇   │

            └ ─ ─ ─ ─ ─ ─ ─ ┘

   ${CYAN}◆nothing${RESET}       ${CYAN}◆not${RESET}      → leap


  ${DIM}Foresight · 旷野、符号可拾、frame 若隐${RESET}

EOF
}

item_page_leap() {
cat <<EOF

      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
      ▓                     ▓
      ▓                     ▓
      ▓        @   ◇        ▓
      ▓        ↓             ▓
      ▓                     ▓
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

             ·
            ·
           ·    ${DIM}grounding${RESET}


  ${DIM}Leap · 高反差 · 单向下跳 · 不可逆${RESET}

EOF
}

item_page_grounding() {
cat <<EOF

      ┌──────────────────────────┐
      │   ${DIM}应该${RESET}              ◇    │
      │                          │
      │         @                │
      │    ╱                     │
      └───╱──────────────────────┘
         ╱
        ╱   ${DIM}seyn${RESET}
       ╱


  ${DIM}Grounding · 裂开 · 裂口指向下一章${RESET}

EOF
}

item_page_seyn() {
cat <<EOF

      ┌──────────────────────────┐
      │▓▓▓▓▓▓                ▓▓▓▓│
      │▓▓▓       ╔═════╗     ▓▓▓│
      │▓▓▓       ║  ∦  ║     ▓▓▓│
      │▓▓▓       ╚═════╝     ▓▓▓│
      │▓▓▓▓▓▓       @        ▓▓▓│
      │▓▓▓▓▓▓    ◇           ▓▓▓│
      │▓▓▓▓▓▓                ▓▓▓│
      └──────────────────────────┘


  ${DIM}Seyn · 墙 + 唯一的门 · 等门开${RESET}

EOF
}

item_page_ones_to_come() {
cat <<EOF

    ┌─────┐                  ┌─────┐
    │     │                  │     │
    │  @  │                  │  ◇  │
    └─────┘                  └─────┘

              ╱        ╲
             ╱          ╲

        ┌─────┐        ┌─────┐
        │     │        │     │
        │  ?  │        │  ?  │
        └─────┘        └─────┘


  ${DIM}Ones to Come · 方块碎成多片 · 主体分裂${RESET}

EOF
}

item_page_last_god_init() {
cat <<EOF


      ·                      ·




                 ·




      ·                      ·


  ${DIM}Last God · 初态 · 四角 + 中心 · 无出口${RESET}

EOF
}

item_page_last_god_l4() {
cat <<EOF







                 ${DIM}·${RESET}






  ${DIM}Last God · L4 触发 · 引擎此刻改写 CLAUDE.md${RESET}
  ${DIM}世界真的变了。下一轮回时，这一切都不同。${RESET}

EOF
}

# ══════════════════════════════════════════════════════
# L4 — APPSHELL
# ══════════════════════════════════════════════════════

item_appshell() {
cat <<EOF

                  echo
                    ↑

      ┌──────────────────────────┐
      │  ${DIM}看看${RESET}                    │
      │                          │
      │                ◇         │
  ?   │          @               │   ?
      │                          │
      │                          │
      └──────────────────────────┘

                     ?

  ——一个音节从你喉咙里浮出，撞在没有形状的地方，又退回来。
  这里没有墙，也没有不是墙。方向还没生出来。

  ${DIM_ITAL}*「hello？」——这里也在听这个词。*${RESET}

  ${DIM}────────────────────────────────────────────────────────────${RESET}
  ${DIM}aporia · beginning · turn 1 · rei 0 · 承诺 1 · 沉默 0 · 燃烧 0${RESET}
  ${DIM}────────────────────────────────────────────────────────────${RESET}
  > _


  ${DIM}AppShell · PAGE + NARRATIVE + DAEMON + STATUS + INPUT${RESET}

EOF
}

# ══════════════════════════════════════════════════════
# MENU
# ══════════════════════════════════════════════════════

show_menu() {
  clear
  echo ""
  echo -e "  ${BRIGHT}Aporia Design System${RESET} ${DIM}· Storybook${RESET}"
  hr
  echo ""
  echo -e "  ${DIM}L1 · Component${RESET}"
  echo "     1  Glyph Tokens"
  echo "     2  Frame: Pristine       3  Frame: Sealed"
  echo "     4  Frame: Stretched      5  Frame: Scattered"
  echo "     6  Frame: Cracked        7  Frame: Ruined"
  echo "     8  PlayerMarker          9  DaemonMarker"
  echo "    10  Exit                 11  CommitmentResidue"
  echo ""
  echo -e "  ${DIM}L2 · Module${RESET}"
  echo "    12  FrameWithExits       13  InteriorField"
  echo "    14  DaemonQuote          15  TransitionHint"
  echo ""
  echo -e "  ${DIM}L3 · Page (8 章)${RESET}"
  echo "    16  Beginning (init)     17  Beginning (acted)"
  echo "    18  Echo                 19  Playing-forth"
  echo "    20  Foresight            21  Leap"
  echo "    22  Grounding            23  Seyn"
  echo "    24  Ones to Come         25  Last God (init)"
  echo "    26  Last God (L4)"
  echo ""
  echo -e "  ${DIM}L4 · AppShell${RESET}"
  echo "    27  Full AppShell"
  echo ""
  hr
  echo -e "  ${DIM}n/p  next/prev    q  quit    输入数字查看${RESET}"
  echo ""
}

show_item() {
  local title="$1"
  local fn="$2"
  clear
  echo ""
  echo -e "  ${BRIGHT}$title${RESET}"
  hr
  $fn
  hr
  echo -e "  ${DIM}[Enter] 返回    [n] 下一个    [p] 上一个    [q] 退出${RESET}"
  echo ""
}

# ordered list for next/prev
ITEMS=(
  "1|Glyph Tokens|item_glyphs"
  "2|Frame: Pristine|item_frame_pristine"
  "3|Frame: Sealed|item_frame_sealed"
  "4|Frame: Stretched|item_frame_stretched"
  "5|Frame: Scattered|item_frame_scattered"
  "6|Frame: Cracked|item_frame_cracked"
  "7|Frame: Ruined|item_frame_ruined"
  "8|PlayerMarker|item_player_markers"
  "9|DaemonMarker|item_daemon_markers"
  "10|Exit|item_exits"
  "11|CommitmentResidue|item_residues"
  "12|FrameWithExits|item_frame_with_exits"
  "13|InteriorField|item_interior_field"
  "14|DaemonQuote|item_daemon_quote"
  "15|TransitionHint|item_transition_hint"
  "16|Beginning (init)|item_page_beginning_init"
  "17|Beginning (acted)|item_page_beginning_acted"
  "18|Echo|item_page_echo"
  "19|Playing-forth|item_page_playing_forth"
  "20|Foresight|item_page_foresight"
  "21|Leap|item_page_leap"
  "22|Grounding|item_page_grounding"
  "23|Seyn|item_page_seyn"
  "24|Ones to Come|item_page_ones_to_come"
  "25|Last God (init)|item_page_last_god_init"
  "26|Last God (L4)|item_page_last_god_l4"
  "27|Full AppShell|item_appshell"
)

lookup() {
  local num="$1"
  for entry in "${ITEMS[@]}"; do
    IFS='|' read -r n t f <<< "$entry"
    if [[ "$n" == "$num" ]]; then
      echo "$t|$f"
      return 0
    fi
  done
  return 1
}

main() {
  local current=0
  while true; do
    if [[ $current -eq 0 ]]; then
      show_menu
      read -r choice
      case "$choice" in
        q|Q) clear; exit 0 ;;
        '') continue ;;
        *[!0-9]*) continue ;;
        *)
          result=$(lookup "$choice") || continue
          current="$choice"
          ;;
      esac
    fi

    result=$(lookup "$current") || { current=0; continue; }
    IFS='|' read -r title fn <<< "$result"
    show_item "$title" "$fn"
    read -r action
    case "$action" in
      q|Q) clear; exit 0 ;;
      n|N)
        next=$((current + 1))
        lookup "$next" > /dev/null && current="$next" || current=0
        ;;
      p|P)
        prev=$((current - 1))
        [[ $prev -ge 1 ]] && current="$prev" || current=0
        ;;
      '') current=0 ;;
      *[0-9]*)
        lookup "$action" > /dev/null && current="$action" || current=0
        ;;
      *) current=0 ;;
    esac
  done
}

main
