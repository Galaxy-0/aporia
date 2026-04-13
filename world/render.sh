#!/bin/bash
# Aporia map renderer — reads state.json, outputs ASCII map to stdout
# Called by world engine via Bash tool: bash world/render.sh

STATE="world/state.json"
if [[ ! -f "$STATE" ]]; then
  echo "(no world)"
  exit 0
fi

SCENE=$(jq -r '.scene' "$STATE")
C=$(jq -r '.clarity // 4' "$STATE")
S=$(jq -r '.strain // 0' "$STATE")
D1=$(jq -r '.coordinates.d1 // 3' "$STATE")
SYMS=$(jq -r '.symbols // [] | join(",")' "$STATE")
SYNTH=$(jq -r '.synthSymbols // [] | join(",")' "$STATE")
DIM=$(jq -r '.dimSymbols // [] | join(",")' "$STATE")
LOCK=$(jq -r '.ideologicalLockTurns // 0' "$STATE")
WHISPER=$(jq -r '.daemonWhisper // "..."' "$STATE")

# Daemon form
case $D1 in
  1) DM="·" ;;
  2) DM="::" ;;
  3) DM="◇" ;;
  4) DM="∅" ;;
  *) DM="?" ;;
esac

# Fog chars by distance from center (0=clear, 1=light, 2=heavy, 3=black)
fog() {
  local dist=$1
  local visible=$((C / 2 + 1))
  if [ $dist -le $visible ]; then echo " "
  elif [ $dist -le $((visible+1)) ]; then echo "░"
  elif [ $dist -le $((visible+2)) ]; then echo "▓"
  else echo "█"
  fi
}

F1=$(fog 1)
F2=$(fog 2)
F3=$(fog 3)
F4=$(fog 4)

# Symbol display
sym_display() {
  if [ -z "$SYMS" ]; then
    echo "(空)"
  else
    echo "$SYMS" | tr ',' ' '
  fi
}

echo ""

case $SCENE in
  beginning)
    cat << 'MAP'
              ┆
         ░░░░░│░░░░░
         ░    │    ░
    ─────────@─────────
         ░    │    ░
         ░░░░░│░░░░░
              ┆
MAP
    echo "       [$DM] 在你脚边"
    echo ""
    echo "  十字开端。四个方向。"
    echo "  N=北  S=南  E=东  W=西"
    ;;

  echo)
    # Echo: circular corridor
    if [ "$LOCK" -gt 0 ]; then
      cat << 'MAP'
    ╔══════════════════════════╗
    ║ 重复。重复。重复。重复。 ║
    ║ 重复。  @   重复。重复。 ║
    ║ 重复。重复。重复。重复。 ║
    ╚══════════════════════════╝
MAP
      echo "  ⚠ 意识形态固化中 — 只有扬弃能打破"
    else
      cat << MAP
    ┌──────────────────────────┐
    │  ···  同一面墙  ···      │
    │  ···    @  $DM   ···  ∦? │
    │  ···  同一面墙  ···      │
    └──────────────────────────┘
         ↻ 走到尽头会回到这里
MAP
    fi
    ;;

  playing-forth)
    cat << MAP
           ▲ 前瞻(Foresight)
           │
           │  $DM
           @
           │
           │
           ▼ 开端(Beginning) ← 死亡
MAP
    ;;

  foresight)
    # Show symbols as pickups on the field
    cat << MAP
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    ~                          ~
    ~   ◆being    ◆there    $F3  ~
    ~       @  $DM             ~
    ~   ◆nothing     [井道]    ~
    ~              ◆not     $F3  ~
    ~                          ~
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
MAP
    echo "  旷野。碎片散落。读够了才能跳。"
    ;;

  leap)
    cat << MAP
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    ▓▓▓▓▓▓          ▓▓▓▓▓▓
    ▓▓▓▓▓▓    @     ▓▓▓▓▓▓
    ▓▓▓▓▓▓    ↓     ▓▓▓▓▓▓
    ▓▓▓▓▓▓  █████   ▓▓▓▓▓▓
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
MAP
    echo "  黑暗。脚下是深渊。跳还是不跳？"
    ;;

  grounding)
    cat << MAP
    ___/    \\___/    \\___
    _/  @  $DM \\_/  ◆  \\_
    /  ◆实体    \\/  ◆因果  \\
    \\___/ ◆同一  / ◆差异 /
        \\_____/\\_____/
           ∅ 深渊在下方
MAP
    echo "  裂隙。找到矛盾对，扬弃它们。"
    ;;

  seyn)
    cat << MAP
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    ▓▓▓▓▓   ┌────┐   ▓▓▓▓▓
    ▓▓▓▓▓   │ ∦∦ │   ▓▓▓▓▓
    ▓▓▓▓▓   └────┘   ▓▓▓▓▓
    ▓▓▓▓▓    @ $DM    ▓▓▓▓▓
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
MAP
    echo "  一扇门。等它开。"
    ;;

  ones-to-come)
    cat << MAP
       d1[${D1}→4]    d2[$(jq -r '.coordinates.d2' "$STATE")→4]
           \\      /
            @ $DM
           /      \\
       d3[$(jq -r '.coordinates.d3' "$STATE")→4]    d4[$(jq -r '.coordinates.d4' "$STATE")→4]
MAP
    echo "  坐标在漂移。你只能守住一部分。"
    ;;

  last-god)
    cat << MAP
    ████████████████████████
    ████████████████████████
    ██████████  ·  █████████
    ████████████████████████
    ████████████████████████
MAP
    echo "  寂静。什么都不要做。"
    ;;

  *)
    echo "  [未知场景: $SCENE]"
    ;;
esac

echo ""
echo "  ─────────────────────────────"
echo "  符号: $(sym_display)"
if [ -n "$SYNTH" ] && [ "$SYNTH" != "" ]; then
  echo "  合成: $SYNTH"
fi
if [ -n "$DIM" ] && [ "$DIM" != "null" ] && [ "$DIM" != "" ]; then
  echo "  残影: $DIM"
fi
echo "  clarity:$C/$8  strain:$S/8  coord:${D1}$(jq -r '.coordinates.d2' "$STATE")$(jq -r '.coordinates.d3' "$STATE")$(jq -r '.coordinates.d4' "$STATE")"
echo "  $DM $WHISPER"
echo ""
