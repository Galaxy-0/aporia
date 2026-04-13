#!/bin/bash
# Aporia status line — reads game state and renders HUD
cat </dev/stdin >/dev/null  # consume Claude Code's JSON input

STATE="$(dirname "$0")/../world/state.json"
if [[ ! -f "$STATE" ]]; then
  echo "aporia | no world found"
  exit 0
fi

SCENE=$(jq -r '.scene // "?"' "$STATE")
CODE=$(jq -r '.sceneCode // "?"' "$STATE")
C=$(jq -r '.clarity // 0' "$STATE")
S=$(jq -r '.strain // 0' "$STATE")
D1=$(jq -r '.coordinates.d1 // "?"' "$STATE")
D2=$(jq -r '.coordinates.d2 // "?"' "$STATE")
D3=$(jq -r '.coordinates.d3 // "?"' "$STATE")
D4=$(jq -r '.coordinates.d4 // "?"' "$STATE")
CY=$(jq -r '.cycle // 0' "$STATE")
DE=$(jq -r '.deaths // 0' "$STATE")
LOCK=$(jq -r '.ideologicalLockTurns // 0' "$STATE")

# Clarity bar
CB=""
for i in $(seq 1 8); do
  if [ $i -le $C ]; then CB="${CB}█"; else CB="${CB}░"; fi
done

# Strain bar
SB=""
for i in $(seq 1 8); do
  if [ $i -le $S ]; then SB="${SB}█"; else SB="${SB}░"; fi
done

# Lock indicator
if [ "$LOCK" -gt 0 ]; then
  LOCK_STR=" ⚠LOCK"
else
  LOCK_STR=""
fi

# Daemon form based on D1
case $D1 in
  1) DAEMON="·" ;;
  2) DAEMON=".:·:." ;;
  3) DAEMON="◇" ;;
  4) DAEMON="∅" ;;
  *) DAEMON="?" ;;
esac

# Daemon whisper - read from state if available, otherwise contextual default
WHISPER=$(jq -r '.daemonWhisper // ""' "$STATE")
if [ -z "$WHISPER" ] || [ "$WHISPER" = "null" ]; then
  if [ "$LOCK" -gt 0 ]; then
    WHISPER="重复。重复。"
  elif [ "$S" -ge "$C" ] 2>/dev/null && [ "$C" -gt 0 ]; then
    WHISPER="你在重复。"
  elif [ "$S" -ge 3 ] 2>/dev/null; then
    WHISPER="小心。"
  else
    WHISPER="..."
  fi
fi

echo "\033[36m${CODE}\033[0m ${SCENE} | \033[32mC[${CB}]\033[0m \033[31mS[${SB}]\033[0m | ${D1}${D2}${D3}${D4} \033[33m${DAEMON}\033[0m | cy:${CY} d:${DE}${LOCK_STR}"
echo "\033[2m${DAEMON} ${WHISPER}\033[0m"
