#!/bin/bash
# Aporia v3 status line — minimal, dim, ledger facts only
cat </dev/stdin >/dev/null

STATE="$(dirname "$0")/../world/state.json"
LEDGER="$(dirname "$0")/../world/commitments.jsonl"

if [[ ! -f "$STATE" ]]; then
  echo "aporia | unborn"
  exit 0
fi

TURN=$(jq -r '.turn // 0' "$STATE")
CHAPTER=$(jq -r '.chapter // "?"' "$STATE")
REI=$(jq -r '.reincarnation // 0' "$STATE")

if [[ -f "$LEDGER" ]]; then
  COMMITS=$(grep -c '"op":"commit"' "$LEDGER" 2>/dev/null || echo 0)
  SILENCES=$(grep -c '"op":"silence"' "$LEDGER" 2>/dev/null || echo 0)
  BURNED=$(grep -c '"op":"burn"' "$LEDGER" 2>/dev/null || echo 0)
else
  COMMITS=0; SILENCES=0; BURNED=0
fi

# Dim gray. No colors. No bars. Just ledger facts.
printf '\033[2maporia · %s · turn %s · rei %s · 承诺 %s · 沉默 %s · 燃烧 %s\033[0m\n' \
  "$CHAPTER" "$TURN" "$REI" "$COMMITS" "$SILENCES" "$BURNED"
