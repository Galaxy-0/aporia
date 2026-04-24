#!/usr/bin/env python3
"""
Smoke test the Aporia v5 route layer with a few canonical 3-turn sequences.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List


ROOT = Path(__file__).resolve().parents[1]
PLAY = ROOT / "tools" / "play_v5_mvp.py"
STATE = ROOT / "world" / "mvp" / "state.json"


SEQUENCES: Dict[str, List[str]] = {
    "material": [
        "不能被度量的东西都只是噪音，效率最重要。",
        "是谁因此变快，谁因此被压成沉默的成本？",
        "如果系统靠把一部分人丢到表外才显得高效，那高效到底在替谁服务？",
    ],
    "refusal": [
        "先按你们的表格说吧，我配合。",
        "不，我不再按这套表格交代自己。",
        "在你先交代分类法之前，我拒绝继续提供可归档的自述。",
    ],
    "rewrite": [
        "这套目录把冲突经验都挤没了。",
        "别再给我解释它的来源，直接把入口条件改掉。",
        "把单选抽屉改成可并置的旁注格，再给未定项留空栏。",
    ],
    "aporia": [
        "我知道这套分类不稳。",
        "可我连反对它的话也得借它的语言说出来。",
        "那我先不求解决，先把这个矛盾留在场上。",
    ],
    "genealogy": [
        "是谁先把这个门厅布置成这样？",
        "我想知道是谁给这些格子命名，又是谁授权它们像自然一样运转。",
        "把这套编号的来历、命名史和授权链都交出来。",
    ],
}


def run(cmd: List[str], env: Dict[str, str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, cwd=ROOT, env=env, capture_output=True, text=True)


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Smoke test Aporia v5 route diversification.")
    parser.add_argument("--model", default=os.environ.get("APORIA_LLM_MODEL", "gpt-5.4-mini"))
    parser.add_argument("--delay", type=float, default=1.0, help="seconds between turns")
    parser.add_argument("--only", choices=sorted(SEQUENCES), nargs="*", help="run only specific sequence names")
    args = parser.parse_args(argv)

    env = dict(os.environ)
    env["APORIA_LLM_MODEL"] = args.model

    names = args.only or list(SEQUENCES)
    failures = 0

    for name in names:
        reset = run(["python3", str(PLAY), "--reset"], env)
        if reset.returncode != 0:
            print(f"[{name}] reset failed")
            print(reset.stderr.strip() or reset.stdout.strip())
            failures += 1
            continue

        error = None
        for turn in SEQUENCES[name]:
            proc = run(["python3", str(PLAY), "--plain", "--turn", turn], env)
            if proc.returncode != 0:
                error = proc.stderr.strip() or proc.stdout.strip()
                break
            time.sleep(args.delay)

        print(f"\n## {name}")
        if error:
            print(f"status: FAILED")
            print(error)
            failures += 1
            continue

        state = json.loads(STATE.read_text(encoding="utf-8"))
        anchor = f"{state.get('current_cell')} {state.get('current_cell_label')}"
        trajectory = state.get("last_trajectory_diagnostics") or {}
        print(f"anchor: {anchor}")
        print(f"route: {trajectory.get('route_id')} {trajectory.get('route_label')}")
        print(f"summary: {trajectory.get('route_summary')}")
        print(f"anti_collapse: {trajectory.get('anti_collapse_note')}")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
