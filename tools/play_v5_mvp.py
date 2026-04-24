#!/usr/bin/env python3
"""
Aporia v5 MVP

This version keeps only the shell layer and persistence.
Turn adjudication is delegated to a Codex model call on every utterance.
There is intentionally no keyword classifier, trap rule table, or phase threshold fallback.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


ROOT = Path(__file__).resolve().parents[1]
MVP_DIR = ROOT / "world" / "mvp"
STATE_FILE = MVP_DIR / "state.json"
LEDGER_FILE = MVP_DIR / "ledger.jsonl"
LIBRARY_FILE = MVP_DIR / "library.json"
LIBRARY_SEED_FILE = MVP_DIR / "library.seed.json"
PROFILE_FILE = MVP_DIR / "player_profile.json"
REWRITE_FILE = MVP_DIR / "rewrites.jsonl"
SCHEMA_FILE = MVP_DIR / "turn.schema.json"
TRACE_DIR = ROOT / "world" / "traces"
CELLS_DIR = MVP_DIR / "cells"
TRAJECTORIES_DIR = MVP_DIR / "trajectories"
CRYSTALLIZED_DIR = MVP_DIR / "crystallized"
PROMPT_VERSION = "codex-core-v7"
PROFILE_DISTILL_EVERY = 5
PROFILE_MIN_TURN = 15
PROFILE_MIN_HISTORY = 12
PROFILE_TRAJECTORY_SUMMARY_LIMIT = 12
RETRIEVAL_MIN_LIBRARY_SIZE = 32
CRYSTALLIZATION_THRESHOLDS = (5, 10, 20, 40)
CELL_DISTILL_SAMPLE_SIZE = 16
CELL_DISTILL_SIGNATURE_LIMIT = 3
RETRIEVAL_ALWAYS_INCLUDE = ("3-3-2-2", "4-3-4-2", "4-4-4-4")


RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
ITALIC = "\033[3m"
FG_ACCENT = "\033[36m"
FG_WARN = "\033[33m"
FG_ERR = "\033[31m"
FG_OK = "\033[32m"


DEFAULT_LIBRARY_SEED: Dict[str, Any] = {
    "version": 1,
    "name": "Aporia v5 MVP Library",
    "startCell": None,
    "chapters": {
        "beginning": {
            "title": "Beginning / 开端",
            "tone": "图书馆刚把你接进来，索引还显得可靠。",
        },
        "echo": {
            "title": "Echo / 回响",
            "tone": "同一种说法开始回弹，格子试图把你留在原位。",
        },
        "grounding": {
            "title": "Grounding / 裂基",
            "tone": "某些话开始拒绝被好好安放，编号边缘露出裂缝。",
        },
        "seyn": {
            "title": "Seyn / 存有",
            "tone": "你不再只看格子，也开始看见是谁把格子搭起来。",
        },
        "last-god": {
            "title": "Last God / 最后之神",
            "tone": "图书馆把自己的搭建方式交出来，要求你做决定。",
        },
    },
    "cells": [{'id': '1-1-1-1',
  'name': '朴素实在',
  'essence': '看见即事实，命名即世界本身。',
  'blindspot': '把自己的观看方式伪装成世界的自然状态。',
  'trap': True,
  'keywords': ['看见', '事实', '真的', '客观', '证明', 'real', 'fact', 'true', 'see', 'there is']},
 {'id': '1-1-1-3',
  'name': '风险治安',
  'essence': '先把不确定性翻译成风险，再要求更严密的监控、筛查与预防。',
  'blindspot': '把被管理者当作潜在事故源，忘了是谁定义了危险。',
  'trap': True,
  'keywords': ['风险', '安全', '排查', '监控', '预防', '管控', '治理']},
 {'id': '1-2-1-2',
  'name': '合规护栏',
  'essence': '只要流程完备、表格齐全，伤害也能被说成必要成本。',
  'blindspot': '把责任缩成勾选项，以为合规就等于正当。',
  'trap': True,
  'keywords': ['合规', '流程', '表格', '审批', '规范', 'audit', 'checklist']},
 {'id': '1-2-1-3',
  'name': '指标主义',
  'essence': '不能被度量的东西，只配当噪音。',
  'blindspot': '把尺度本身的偏见藏进中立的数字里。',
  'trap': True,
  'keywords': ['数据', '效率', '指标', '模型', '最优', '概率', '优化', 'metric', 'score', 'model', 'optimize', 'efficient']},
 {'id': '1-2-1-4',
  'name': '效率崇拜',
  'essence': '更快、更省、更顺滑本身就被当成无需解释的善。',
  'blindspot': '把速度当中立，把被甩下的人算成摩擦。',
  'trap': True,
  'keywords': ['效率', '提速', '顺滑', '摩擦', '增长', '提效', 'throughput']},
 {'id': '1-2-2-3',
  'name': '绩效剧场',
  'essence': '人被迫持续证明自己值得留下，证明本身也成了劳动。',
  'blindspot': '看见排名，却看不见是谁搭起了评分舞台。',
  'trap': True,
  'keywords': ['绩效', '排名', '考核', '证明自己', 'KPI', 'review']},
 {'id': '1-3-1-3',
  'name': '物流现实',
  'essence': '只要链路不断，任何局部牺牲都能被包装成系统必需。',
  'blindspot': '把可替换性错当自然规律。',
  'trap': False,
  'keywords': ['链路', '配送', '供应链', '调度', '履约', '系统必需']},
 {'id': '1-4-2-3',
  'name': '边界清洁',
  'essence': '通过筛除脏污、异常与外来者来维护秩序的清洁幻觉。',
  'blindspot': '把排斥说成卫生，把暴力说成清理。',
  'trap': True,
  'keywords': ['清理', '边界', '异常', '卫生', '净化', '筛除']},
 {'id': '2-1-2-2',
  'name': '纯化冲动',
  'essence': '总想把混杂、暧昧和过渡状态清理掉，留下单一纯正的形态。',
  'blindspot': '忘了纯净往往靠暴力切割才能成立。',
  'trap': True,
  'keywords': ['纯净', '纯粹', '混杂', '净化', '正统', '统一']},
 {'id': '2-2-1-2',
  'name': '祖制乡愁',
  'essence': '认为只要回到旧秩序，今天的混乱就会自动复原。',
  'blindspot': '把过去想象成无裂缝整体，抹去当时被压住的人。',
  'trap': True,
  'keywords': ['回到过去', '传统', '恢复秩序', '祖制', '旧时代', '本来如此']},
 {'id': '2-2-2-2',
  'name': '本质封闭',
  'essence': '一切都应该回到真正、本来的样子。',
  'blindspot': '把历史和关系压缩成单一本质。',
  'trap': False,
  'keywords': ['本质', '真正', '根本', '纯粹', '本来', '应该', '必须', 'essence', 'must', 'should', 'true nature']},
 {'id': '2-3-1-3',
  'name': '稀缺剧本',
  'essence': '先把世界写成资源永远不够，再要求所有人接受竞争与牺牲。',
  'blindspot': '把人为制造的匮乏伪装成自然定律。',
  'trap': False,
  'keywords': ['稀缺', '资源不够', '竞争', '牺牲', '短缺', '配给']},
 {'id': '2-3-2-2',
  'name': '利害账簿',
  'essence': '把每个安排拆成谁得利、谁买单、谁被排除的具体账目。',
  'blindspot': '容易把一切都摁成算账，忽略不肯入账的情感与信念。',
  'trap': False,
  'keywords': ['谁得利', '谁买单', '谁被排除', '成本', '代价', '收益']},
 {'id': '2-4-1-1',
  'name': '犬儒反讽',
  'essence': '不过是话术，反正都一样。',
  'blindspot': '把立场伪装成看破，把退场伪装成清醒。',
  'trap': True,
  'keywords': ['不过是', '反正', '都一样', '只是游戏', '无所谓', 'just', 'whatever', 'same', "doesn't matter", 'just a game']},
 {'id': '2-4-1-2',
  'name': '偏好撤回',
  'essence': '不再提供稳定自述，而是撤回“请你替我归类”的配合。',
  'blindspot': '撤回太久也可能变成姿态，失去通向共同实践的桥。',
  'trap': False,
  'keywords': ['我不回答', '撤回', '不配合', '不自述', '拒绝归类', 'withdraw']},
 {'id': '2-4-2-1',
  'name': '旁观豁免',
  'essence': '只要宣称自己看透了游戏，就仿佛可以免于卷入其后果。',
  'blindspot': '把不承担伪装成清醒，把旁观当作无罪证明。',
  'trap': True,
  'keywords': ['我只是旁观', '看透', '不关我事', '抽离', '不站队']},
 {'id': '3-2-2-2',
  'name': '角色面具',
  'essence': '人先被装进位置、身份与功能，再被要求从那个位置发言。',
  'blindspot': '容易把角色当本体，忽略人也会扭曲或越出面具。',
  'trap': False,
  'keywords': ['角色', '身份', '位置', '功能', '扮演', '从这个位置说']},
 {'id': '3-3-1-2',
  'name': '见证残响',
  'essence': '不是所有东西都能入档，但它们会以证词碎片反复回响。',
  'blindspot': '容易把受伤的证词神圣化，忘记证词也会误导。',
  'trap': False,
  'keywords': ['证词', '见证', '回响', '未入档', '残留', '碎片']},
 {'id': '3-3-2-1',
  'name': '程序中立',
  'essence': '分类不是靠真理运转，而是靠流程显得无人负责。',
  'blindspot': '把程序当遮羞布，却仍默认程序有权最后落锤。',
  'trap': True,
  'keywords': ['程序', '流程', '中立', '照章', '系统决定', '规则如此']},
 {'id': '3-3-2-2',
  'name': '将-来者',
  'essence': '结构在说你，但你也可以反过来测试结构。',
  'blindspot': '很容易把自反误当成豁免。',
  'trap': False,
  'keywords': ['结构',
               '分类',
               '框架',
               '改写',
               '测试',
               '装置',
               '不是我',
               '你在替我说',
               'classify',
               'structure',
               'frame',
               'rewrite',
               'apparatus',
               'trap']},
 {'id': '3-3-2-3',
  'name': '语法罢工',
  'essence': '拒绝继续按既有问题的问法回答，让语法本身先暴露出来。',
  'blindspot': '如果只剩停摆而没有后续组织，拒绝会被系统重新吸纳。',
  'trap': False,
  'keywords': ['换个问法', '这个问题不成立', '拒绝回答', '语法', '不按这套说']},
 {'id': '3-3-3-2',
  'name': '未决并置',
  'essence': '允许彼此冲突的读法暂时并排存在，不急着综合成更高答案。',
  'blindspot': '容易把悬置误当完成，把未决误当深刻。',
  'trap': False,
  'keywords': ['并置', '暂不综合', '未决', '同时成立', '先放在一起']},
 {'id': '3-4-1-1',
  'name': '署名圣坛',
  'essence': '某些观点一旦绑上权威署名，就像天然更配进入目录。',
  'blindspot': '只盯着名字发光，忘了无名者也在生产世界。',
  'trap': True,
  'keywords': ['权威', '大师说', '署名', '名家', '经典', 'citation']},
 {'id': '3-4-1-2',
  'name': '命名政体',
  'essence': '对象之所以像自然存在，往往是因为某种命名权先替它写好了目录。',
  'blindspot': '容易把一切都压扁成命名者的阴谋，忽略被命名之物也会反抗。',
  'trap': False,
  'keywords': ['谁命名', '怎么命名', '命名权', '收录', '编目', 'canon', 'naming', 'catalog', 'classification authority']},
 {'id': '3-4-1-3',
  'name': '档案主权',
  'essence': '谁拥有保存、删改与调取记录的权力，谁就部分决定了什么算历史。',
  'blindspot': '容易把档案权力看得太大，忽略档外流传也会改写叙述。',
  'trap': False,
  'keywords': ['档案', '记录', '删除', '保存', '历史由谁写', 'archive']},
 {'id': '3-4-2-1',
  'name': '授权回路',
  'essence': '一个分类能运转，不只因为它看似合理，也因为背后有手续、传统与机构不断背书。',
  'blindspot': '容易把批判停在追责链条，误以为摸到来源就已获得外部。',
  'trap': False,
  'keywords': ['谁授权', '授权链', '谁批准', '制度背书', '来历', '来源', 'authorized', 'sanctioned', 'provenance', 'institution']},
 {'id': '3-4-2-2',
  'name': '来源法庭',
  'essence': '不只问“这是什么”，而是追问它凭什么被承认为这个样子。',
  'blindspot': '追到来源并不自动给你外部，来源本身也会互相背书。',
  'trap': False,
  'keywords': ['凭什么', '来源', '来历', '谁承认', '如何成立', 'provenance']},
 {'id': '3-4-3-1',
  'name': '手续迷宫',
  'essence': '权力不靠单一主宰显现，而在层层签批、转呈与例外中分散运转。',
  'blindspot': '容易被手续链拖住，以为补完来历就等于完成批判。',
  'trap': True,
  'keywords': ['手续', '签批', '转呈', '层层审批', '例外', '流程链']},
 {'id': '4-2-4-2',
  'name': '余震伦理',
  'essence': '事件过去后，真正难的是如何同它留下的余震继续共处。',
  'blindspot': '容易把创伤后的坚持美化成道德资本。',
  'trap': False,
  'keywords': ['余震', '后果', '创伤之后', '继续活下去', '善后']},
 {'id': '4-3-3-2',
  'name': '并置伤口',
  'essence': '两种都成立的伤害并排出现，任何单边胜利叙事都会丢东西。',
  'blindspot': '容易沉迷对称性，忽略伤口并不总是对等。',
  'trap': False,
  'keywords': ['两边都痛', '并置', '伤口', '无法单边', '两难']},
 {'id': '4-3-4-1',
  'name': '双重约束',
  'essence': '无论前进或后退都会触发损失，困境不是因为你还没想清楚。',
  'blindspot': '容易把双重约束浪漫化，忘了仍需做出有限行动。',
  'trap': False,
  'keywords': ['进退都错', '两难', '双重约束', '无解', '都会受伤']},
 {'id': '4-3-4-2',
  'name': '裂缝档案',
  'essence': '有些话不能被安放，只能留下缝。',
  'blindspot': '把无法归类误读为更高真理。',
  'trap': False,
  'keywords': ['无法归类', '不属于', '缝', '裂缝', '同时', '既不是', '也不是', 'both', 'neither', 'unclassifiable', 'seam', 'crack']},
 {'id': '4-3-4-3',
  'name': '不可化约',
  'essence': '某些矛盾不能被漂亮地扬弃，只能带着刺继续推进。',
  'blindspot': '把无法化约当成永久免于决断的许可证。',
  'trap': False,
  'keywords': ['不可化约', '不能综合', '保留矛盾', '带着刺推进', 'aporia']},
 {'id': '4-4-2-1',
  'name': '配合撤回',
  'essence': '你不再继续提供系统所需的流畅输入，让它暴露自己的饥饿。',
  'blindspot': '只撤回不组织时，拒绝很容易被重新包装成个体选择。',
  'trap': False,
  'keywords': ['不配合', '撤回输入', '停供', '拒绝流通', 'withdraw cooperation']},
 {'id': '4-4-3-4',
  'name': '分叉工坊',
  'essence': '不问原版是否完美，而是直接 fork 一条可运行的旁路。',
  'blindspot': '分叉太快时，也可能把旧权力完整复制进新壳。',
  'trap': False,
  'keywords': ['fork', '旁路', '另起一套', '分叉', '实验支线', '改写']},
 {'id': '4-4-4-2',
  'name': '结局拒领',
  'essence': '连“你已经觉醒”的勋章也不接，把完成感本身退回去。',
  'blindspot': '拒领一切也可能变成另一种洁癖式优越。',
  'trap': False,
  'keywords': ['不领奖', '拒绝觉醒叙事', '不完成', '不凯旋', '拒绝结局']},
 {'id': '4-4-4-3',
  'name': '回返演习',
  'essence': '带着知道它是人造的清醒再次进入，同一套坐标因此变成试验场。',
  'blindspot': '容易把回返误当掌控，忘了装置仍在持续塑形。',
  'trap': False,
  'keywords': ['回返', '再来一局', '带着清醒重玩', '试验场', 'eternal return']},
 {'id': '4-4-4-4',
  'name': '最后之神',
  'essence': '形式把自己交出来，但不保证你因此获得外部。',
  'blindspot': '把醒觉再一次组织成新的优越姿态。',
  'trap': False,
  'keywords': ['退出', '改写', '回返', '关掉', '结束', '第五维', 'quit', 'rewrite', 'return', 'fifth dimension']}],
    "mutations": [],
}


DEFAULT_STATE: Dict[str, Any] = {
    "turn": 0,
    "reincarnation": 0,
    "phase": "immersion",
    "chapter": "beginning",
    "current_cell": None,
    "current_cell_label": None,
    "author_unmasked": False,
    "pressure": 12,
    "situation": "你站在门厅，索引暂时看起来可靠。",
    "last_affordances": ["先说一句话，让图书馆决定它怎样误读你。"],
    "last_anchor_diagnostics": None,
    "current_trajectory_id": None,
    "current_trajectory_label": None,
    "last_trajectory_diagnostics": None,
    "last_retrieval_meta": None,
    "last_memory_warnings": [],
    "pending_crystallizations": [],
    "history": [],
}


ROUTE_LABELS: Dict[str, str] = {
    "genealogical_critique": "谱系批判",
    "material_critique": "物质批判",
    "ethical_refusal": "伦理拒绝",
    "practical_rewrite": "实践改写",
    "tragic_aporia": "悲剧性疑难",
}


def default_player_profile() -> Dict[str, Any]:
    return {
        "schema_version": 1,
        "player_id": "local",
        "total_turns": 0,
        "total_reincarnations": 0,
        "portrait_confidence": 0.0,
        "generated_from_turns": [],
        "provisional": True,
        "current_portrait": {
            "posture": "",
            "signature_words": [],
            "dialectical_tensions": [],
            "last_updated_turn": 0,
        },
        "trajectory_summary": [],
    }


def configure_output(plain: bool) -> None:
    global RESET, BOLD, DIM, ITALIC, FG_ACCENT, FG_WARN, FG_ERR, FG_OK
    if plain:
        RESET = ""
        BOLD = ""
        DIM = ""
        ITALIC = ""
        FG_ACCENT = ""
        FG_WARN = ""
        FG_ERR = ""
        FG_OK = ""
        return

    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    ITALIC = "\033[3m"
    FG_ACCENT = "\033[36m"
    FG_WARN = "\033[33m"
    FG_ERR = "\033[31m"
    FG_OK = "\033[32m"


def save_json(path: Path, data: Dict[str, Any]) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def append_jsonl(path: Path, event: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, ensure_ascii=False) + "\n")


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "cell"


def env_flag(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in {"1", "true", "yes", "on"}


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def library_retrieval_enabled() -> bool:
    return env_flag("APORIA_ENABLE_LIBRARY_RETRIEVAL")


def cell_crystallization_enabled() -> bool:
    return env_flag("APORIA_ENABLE_CELL_CRYSTALLIZATION")


def sediment_file(cell_id: str) -> Path:
    return CELLS_DIR / cell_id / "sediment.jsonl"


def trajectory_file(run: int) -> Path:
    return TRAJECTORIES_DIR / f"run-{run:04d}.jsonl"


def crystallized_file(cell_id: str) -> Path:
    return CRYSTALLIZED_DIR / f"{cell_id}.md"


def canonicalize_player_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    merged = default_player_profile() | profile
    current_portrait = default_player_profile()["current_portrait"] | profile.get("current_portrait", {})
    merged["current_portrait"] = {
        "posture": str(current_portrait.get("posture", "")),
        "signature_words": [str(item) for item in current_portrait.get("signature_words", [])[:8]],
        "dialectical_tensions": [str(item) for item in current_portrait.get("dialectical_tensions", [])[:6]],
        "last_updated_turn": int(current_portrait.get("last_updated_turn", 0) or 0),
    }
    merged["total_turns"] = int(merged.get("total_turns", 0) or 0)
    merged["total_reincarnations"] = int(merged.get("total_reincarnations", 0) or 0)
    merged["portrait_confidence"] = float(merged.get("portrait_confidence", 0.0) or 0.0)
    merged["generated_from_turns"] = [int(item) for item in merged.get("generated_from_turns", [])[-12:] if str(item).isdigit()]
    merged["provisional"] = bool(merged.get("provisional", True))
    trajectory_summary = []
    for item in merged.get("trajectory_summary", [])[-PROFILE_TRAJECTORY_SUMMARY_LIMIT:]:
        if not isinstance(item, dict):
            continue
        trajectory_summary.append(
            {
                "run": int(item.get("run", 0) or 0),
                "arc": str(item.get("arc", "")),
            }
        )
    merged["trajectory_summary"] = trajectory_summary
    return merged


def load_player_profile() -> Dict[str, Any]:
    if not PROFILE_FILE.exists():
        profile = default_player_profile()
        save_json(PROFILE_FILE, profile)
        return profile

    profile = canonicalize_player_profile(load_json(PROFILE_FILE))
    save_json(PROFILE_FILE, profile)
    return profile


def remember_memory_warning(state: Dict[str, Any], kind: str, detail: str) -> None:
    warnings = []
    for item in state.get("last_memory_warnings", [])[-7:]:
        if not isinstance(item, dict):
            continue
        warnings.append(
            {
                "kind": str(item.get("kind", "")),
                "detail": str(item.get("detail", "")),
                "ts": str(item.get("ts", "")),
            }
        )
    warnings.append({"kind": kind, "detail": detail, "ts": now_iso()})
    state["last_memory_warnings"] = warnings[-8:]


def warn_memory(state: Dict[str, Any], kind: str, detail: str) -> None:
    remember_memory_warning(state, kind, detail)
    print(f"{FG_WARN}{detail}{RESET}", file=sys.stderr)


def save_player_profile(profile: Dict[str, Any]) -> None:
    save_json(PROFILE_FILE, canonicalize_player_profile(profile))


def profile_distill_enabled() -> bool:
    return env_flag("APORIA_ENABLE_PROFILE_DISTILL")


def profile_prompt_payload(profile: Dict[str, Any]) -> Dict[str, Any]:
    current = profile.get("current_portrait", {})
    return {
        "posture": current.get("posture", ""),
        "signature_words": current.get("signature_words", [])[:6],
        "dialectical_tensions": current.get("dialectical_tensions", [])[:4],
        "last_updated_turn": current.get("last_updated_turn", 0),
        "portrait_confidence": profile.get("portrait_confidence", 0.0),
        "generated_from_turns": profile.get("generated_from_turns", [])[-12:],
        "trajectory_summary": profile.get("trajectory_summary", [])[-4:],
        "provisional": profile.get("provisional", True),
        "total_turns": profile.get("total_turns", 0),
        "total_reincarnations": profile.get("total_reincarnations", 0),
    }


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []

    events: List[Dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            raw = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(raw, dict):
            events.append(raw)
    return events


def library_cells_by_id(library: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    cells: Dict[str, Dict[str, Any]] = {}
    for cell in library.get("cells", []):
        if not isinstance(cell, dict) or cell.get("archived"):
            continue
        cell_id = cell.get("id")
        if isinstance(cell_id, str) and cell_id:
            cells[cell_id] = cell
    return cells


def parse_coord_cell_id(cell_id: Optional[str]) -> Optional[List[int]]:
    if not isinstance(cell_id, str):
        return None
    parts = cell_id.split("-")
    if len(parts) != 4 or not all(part.isdigit() for part in parts):
        return None
    values = [int(part) for part in parts]
    if not all(1 <= value <= 4 for value in values):
        return None
    return values


def adjacent_cells_4d(cell_id: Optional[str], library_ids: set[str]) -> List[str]:
    coords = parse_coord_cell_id(cell_id)
    if not coords:
        return []

    neighbors: List[str] = []
    for index, value in enumerate(coords):
        for delta in (-1, 1):
            candidate = list(coords)
            candidate[index] = value + delta
            if not 1 <= candidate[index] <= 4:
                continue
            candidate_id = "-".join(str(item) for item in candidate)
            if candidate_id in library_ids:
                neighbors.append(candidate_id)
    return neighbors


def last_visited_cells(state: Dict[str, Any], n: int = 5) -> List[str]:
    cells: List[str] = []
    for item in reversed(state.get("history", [])[-n:]):
        cell_id = item.get("cell")
        if isinstance(cell_id, str) and cell_id and cell_id not in cells:
            cells.append(cell_id)
    return cells


def last_secondary_anchor_ids(state: Dict[str, Any], n: int = 2) -> List[str]:
    diagnostics = state.get("last_anchor_diagnostics") or {}
    secondary = diagnostics.get("secondary_anchors") or []
    ids: List[str] = []
    for item in secondary[:n]:
        cell_id = item.get("id") if isinstance(item, dict) else None
        if isinstance(cell_id, str) and cell_id:
            ids.append(cell_id)
    return ids


def route_default_cells(route_id: Optional[str]) -> List[str]:
    mapping = {
        "genealogical_critique": ["3-4-1-2", "3-4-2-1", "3-3-2-2"],
        "material_critique": ["1-2-1-3", "3-3-2-2"],
        "ethical_refusal": ["2-4-1-1", "4-4-4-4", "3-3-2-2"],
        "practical_rewrite": ["4-4-4-4", "3-3-2-2"],
        "tragic_aporia": ["4-3-4-2", "3-3-2-2"],
    }
    return mapping.get(route_id or "", list(RETRIEVAL_ALWAYS_INCLUDE))


def parse_frontmatter_value(raw: str) -> Any:
    text = raw.strip()
    if not text:
        return ""
    if text.lower() in {"true", "false"}:
        return text.lower() == "true"
    if re.fullmatch(r"-?\d+", text):
        return int(text)
    if re.fullmatch(r"-?\d+\.\d+", text):
        return float(text)
    if text.startswith("[") or text.startswith("{"):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return text
    return text


def parse_markdown_frontmatter(markdown: str) -> tuple[Dict[str, Any], str]:
    if not markdown.startswith("---\n"):
        return {}, markdown
    parts = markdown.split("\n---\n", 1)
    if len(parts) != 2:
        return {}, markdown

    meta: Dict[str, Any] = {}
    for line in parts[0].splitlines()[1:]:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip()] = parse_frontmatter_value(value)
    return meta, parts[1]


def split_markdown_sections(body: str) -> Dict[str, str]:
    sections: Dict[str, List[str]] = {}
    current: Optional[str] = None
    for line in body.splitlines():
        if line.startswith("## "):
            current = line[3:].strip()
            sections[current] = []
            continue
        if current:
            sections[current].append(line)
    return {key: "\n".join(value).strip() for key, value in sections.items()}


def load_crystallized_cell(cell_id: str, state: Optional[Dict[str, Any]] = None, context: str = "read") -> Optional[Dict[str, Any]]:
    path = crystallized_file(cell_id)
    if not path.exists():
        return None

    try:
        markdown = path.read_text(encoding="utf-8")
        meta, body = parse_markdown_frontmatter(markdown)
        sections = split_markdown_sections(body)
        return {
            "path": str(path.relative_to(ROOT)),
            "meta": meta,
            "markdown": markdown,
            "current_essence": sections.get("Current essence", ""),
            "signature_utterances": [
                line[2:].strip()
                for line in sections.get("Signature utterances (recent)", "").splitlines()
                if line.strip().startswith("- ")
            ],
            "escape_moves": [
                line[2:].strip()
                for line in sections.get("Escape moves observed", "").splitlines()
                if line.strip().startswith("- ")
            ],
        }
    except Exception as exc:
        if state is not None:
            warn_memory(state, "crystallized_overlay_fallback", f"读取 crystallized overlay 失败：{cell_id} ({context}) — {exc}")
        return None


def overlay_crystallized_cell(base_cell: Dict[str, Any], state: Optional[Dict[str, Any]] = None, context: str = "overlay") -> Dict[str, Any]:
    merged = dict(base_cell)
    cell_id = merged.get("id")
    if not isinstance(cell_id, str):
        return merged

    overlay = load_crystallized_cell(cell_id, state=state, context=context)
    if not overlay:
        return merged

    merged["crystallized"] = {
        "path": overlay.get("path"),
        "meta": overlay.get("meta", {}),
        "current_essence": overlay.get("current_essence", ""),
        "signature_utterances": overlay.get("signature_utterances", []),
        "escape_moves": overlay.get("escape_moves", []),
    }
    return merged


def build_full_library_sources(library: Dict[str, Any], source: str) -> Dict[str, List[str]]:
    sources: Dict[str, List[str]] = {}
    for cell in library.get("cells", []):
        if not isinstance(cell, dict) or cell.get("archived"):
            continue
        cell_id = cell.get("id")
        if isinstance(cell_id, str) and cell_id:
            sources[cell_id] = [source]
    return sources


def materialize_library(
    library: Dict[str, Any],
    selected_ids: Optional[set[str]] = None,
    mode: str = "full",
    state: Optional[Dict[str, Any]] = None,
    selection_sources: Optional[Dict[str, List[str]]] = None,
) -> Dict[str, Any]:
    cells = []
    selected: List[str] = []
    selected_details: List[Dict[str, Any]] = []
    for cell in library.get("cells", []):
        if not isinstance(cell, dict) or cell.get("archived"):
            continue
        cell_id = cell.get("id")
        if selected_ids is not None and cell_id not in selected_ids:
            continue
        materialized = overlay_crystallized_cell(cell, state=state, context=f"materialize:{mode}")
        cells.append(materialized)
        if isinstance(cell_id, str):
            selected.append(cell_id)
            selected_details.append(
                {
                    "id": cell_id,
                    "label": materialized.get("name") or materialized.get("label") or cell_id,
                    "sources": list(selection_sources.get(cell_id, [])) if selection_sources else [],
                    "has_crystallized_overlay": bool(materialized.get("crystallized")),
                }
            )

    material = {
        "version": library.get("version"),
        "name": library.get("name"),
        "startCell": library.get("startCell"),
        "chapters": library.get("chapters", {}),
        "cells": cells,
        "retrieval_meta": {
            "mode": mode,
            "selected_count": len(selected),
            "selected_cell_ids": selected,
            "selected_cells": selected_details,
        },
    }
    return material


def retrieve_relevant_library(state: Dict[str, Any], utterance: str, library: Dict[str, Any]) -> Dict[str, Any]:
    cells_by_id = library_cells_by_id(library)
    library_ids = set(cells_by_id)
    if not library_retrieval_enabled():
        return materialize_library(
            library,
            mode="full_library_disabled",
            state=state,
            selection_sources=build_full_library_sources(library, "full_library_disabled"),
        )

    if len(library_ids) < RETRIEVAL_MIN_LIBRARY_SIZE:
        return materialize_library(
            library,
            mode="full_library_small",
            state=state,
            selection_sources=build_full_library_sources(library, "full_library_small"),
        )

    try:
        selected_ids: set[str] = set()
        selection_sources: Dict[str, List[str]] = {}

        def mark(cell_ids: List[str], source: str) -> None:
            for cell_id in cell_ids:
                if cell_id not in library_ids:
                    continue
                selected_ids.add(cell_id)
                selection_sources.setdefault(cell_id, [])
                if source not in selection_sources[cell_id]:
                    selection_sources[cell_id].append(source)

        mark(list(RETRIEVAL_ALWAYS_INCLUDE), "always_include")

        current_cell = state.get("current_cell")
        if isinstance(current_cell, str) and current_cell in library_ids:
            mark([current_cell], "current_cell")
            mark(adjacent_cells_4d(current_cell, library_ids), "adjacent_4d")

        mark(last_visited_cells(state, n=5), "recent_history")
        mark(last_secondary_anchor_ids(state, n=2), "secondary_anchor")
        mark(route_default_cells(state.get("current_trajectory_id")), "route_default")

        material = materialize_library(
            library,
            selected_ids=selected_ids,
            mode="retrieved",
            state=state,
            selection_sources=selection_sources,
        )
        material["retrieval_meta"]["utterance_excerpt"] = utterance[:80]
        return material
    except Exception as exc:
        warn_memory(state, "retrieval_fallback", f"retrieval 失败，回退全量 library：{exc}")
        return materialize_library(
            library,
            mode="full_library_fallback",
            state=state,
            selection_sources=build_full_library_sources(library, "full_library_fallback"),
        )


def default_schema() -> Dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "additionalProperties": False,
        "required": ["narration", "adjudication", "state_patch", "anchor_diagnostics", "trajectory_diagnostics", "affordances", "tags"],
        "properties": {
            "narration": {"type": "string"},
            "adjudication": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "mode",
                    "reading",
                    "world_move",
                    "misread",
                    "trap",
                    "escape",
                    "crack",
                    "unclassifiable",
                ],
                "properties": {
                    "mode": {"type": "string"},
                    "reading": {"type": "string"},
                    "world_move": {"type": "string"},
                    "misread": {"type": "boolean"},
                    "trap": {"type": "boolean"},
                    "escape": {"type": "boolean"},
                    "crack": {"type": "boolean"},
                    "unclassifiable": {"type": "boolean"},
                },
            },
            "state_patch": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "phase",
                    "chapter",
                    "current_cell_id",
                    "current_cell_label",
                    "author_unmasked",
                    "pressure",
                    "situation",
                ],
                "properties": {
                    "phase": {"type": "string", "enum": ["immersion", "crack", "wakefulness"]},
                    "chapter": {"type": ["string", "null"]},
                    "current_cell_id": {"type": ["string", "null"]},
                    "current_cell_label": {"type": ["string", "null"]},
                    "author_unmasked": {"type": "boolean"},
                    "pressure": {"type": "integer", "minimum": 0, "maximum": 100},
                    "situation": {"type": "string"},
                },
            },
            "anchor_diagnostics": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "primary_anchor",
                    "secondary_anchors",
                    "turn_tags",
                    "history_carryover_tags",
                    "supporting_signals",
                    "context_note",
                    "competing_note",
                    "player_model",
                ],
                "properties": {
                    "primary_anchor": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["id", "label", "confidence"],
                        "properties": {
                            "id": {"type": ["string", "null"]},
                            "label": {"type": ["string", "null"]},
                            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                        },
                    },
                    "secondary_anchors": {
                        "type": "array",
                        "maxItems": 3,
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["id", "label", "confidence"],
                            "properties": {
                                "id": {"type": "string"},
                                "label": {"type": "string"},
                                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                            },
                        },
                    },
                    "turn_tags": {
                        "type": "array",
                        "minItems": 2,
                        "maxItems": 5,
                        "items": {"type": "string"},
                    },
                    "history_carryover_tags": {
                        "type": "array",
                        "maxItems": 5,
                        "items": {"type": "string"},
                    },
                    "supporting_signals": {
                        "type": "array",
                        "minItems": 1,
                        "maxItems": 4,
                        "items": {"type": "string"},
                    },
                    "context_note": {"type": "string"},
                    "competing_note": {"type": "string"},
                    "player_model": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["current_posture", "historical_posture", "tension", "confidence"],
                        "properties": {
                            "current_posture": {"type": "string"},
                            "historical_posture": {"type": "string"},
                            "tension": {"type": "string"},
                            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                        },
                    },
                },
            },
            "trajectory_diagnostics": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "route_id",
                    "route_label",
                    "route_summary",
                    "why_this_route",
                    "historical_pull",
                    "anti_collapse_note",
                    "next_step_bias",
                    "competing_routes",
                    "confidence",
                ],
                "properties": {
                    "route_id": {"type": "string"},
                    "route_label": {"type": "string"},
                    "route_summary": {"type": "string"},
                    "why_this_route": {"type": "string"},
                    "historical_pull": {"type": "string"},
                    "anti_collapse_note": {"type": "string"},
                    "next_step_bias": {"type": "string"},
                    "competing_routes": {
                        "type": "array",
                        "maxItems": 3,
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["id", "label", "confidence"],
                            "properties": {
                                "id": {"type": "string"},
                                "label": {"type": "string"},
                                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                            },
                        },
                    },
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                },
            },
            "affordances": {
                "type": "array",
                "minItems": 2,
                "maxItems": 4,
                "items": {"type": "string"},
            },
            "tags": {
                "type": "array",
                "minItems": 1,
                "maxItems": 6,
                "items": {"type": "string"},
            },
        },
    }


def ensure_world() -> None:
    MVP_DIR.mkdir(parents=True, exist_ok=True)
    TRACE_DIR.mkdir(parents=True, exist_ok=True)
    CELLS_DIR.mkdir(parents=True, exist_ok=True)
    TRAJECTORIES_DIR.mkdir(parents=True, exist_ok=True)
    CRYSTALLIZED_DIR.mkdir(parents=True, exist_ok=True)
    if not LIBRARY_SEED_FILE.exists():
        save_json(LIBRARY_SEED_FILE, DEFAULT_LIBRARY_SEED)
    else:
        seed = load_json(LIBRARY_SEED_FILE)
        existing_ids = {cell.get("id") for cell in seed.get("cells", [])}
        changed = False
        for cell in DEFAULT_LIBRARY_SEED.get("cells", []):
            if cell.get("id") not in existing_ids:
                seed.setdefault("cells", []).append(cell)
                changed = True
        if changed:
            save_json(LIBRARY_SEED_FILE, seed)
    if not LIBRARY_FILE.exists():
        save_json(LIBRARY_FILE, load_json(LIBRARY_SEED_FILE))
    else:
        library = load_json(LIBRARY_FILE)
        existing_ids = {cell.get("id") for cell in library.get("cells", []) if isinstance(cell, dict)}
        changed = False
        for cell in DEFAULT_LIBRARY_SEED.get("cells", []):
            if cell.get("id") not in existing_ids:
                library.setdefault("cells", []).append(cell)
                changed = True
        if changed:
            save_json(LIBRARY_FILE, library)
    if not STATE_FILE.exists():
        save_json(STATE_FILE, DEFAULT_STATE)
    else:
        merged = DEFAULT_STATE | load_json(STATE_FILE)
        save_json(STATE_FILE, merged)
    if not PROFILE_FILE.exists():
        save_player_profile(default_player_profile())
    else:
        save_player_profile(load_player_profile())
    if not LEDGER_FILE.exists():
        LEDGER_FILE.write_text("", encoding="utf-8")
    if not REWRITE_FILE.exists():
        REWRITE_FILE.write_text("", encoding="utf-8")
    if not SCHEMA_FILE.exists():
        save_json(SCHEMA_FILE, default_schema())


def phase_label(phase: str) -> str:
    return {
        "immersion": "沉浸",
        "crack": "察觉",
        "wakefulness": "醒来",
    }.get(phase, phase)


def chapter_label(chapter: Optional[str], library: Dict[str, Any]) -> str:
    if not chapter:
        return "未定章"
    chapters = library.get("chapters", {})
    if isinstance(chapters, dict) and chapter in chapters:
        title = chapters[chapter].get("title")
        if title:
            return title
    return chapter


def iter_cells(library: Dict[str, Any]) -> List[Dict[str, Any]]:
    cells = []
    for raw in library.get("cells", []):
        if raw.get("archived"):
            continue
        cell_id = raw.get("id") or raw.get("slug") or raw.get("coord") or raw.get("label") or raw.get("name")
        label = raw.get("label") or raw.get("name") or str(cell_id)
        cells.append(
            {
                "id": cell_id,
                "label": label,
                "essence": raw.get("essence", ""),
                "blindspot": raw.get("blindspot", ""),
                "trap": bool(raw.get("trap")),
            }
        )
    return cells


def render_header(state: Dict[str, Any], library: Dict[str, Any]) -> None:
    print()
    print(
        f"{FG_ACCENT}{BOLD}Aporia v5 Core{RESET}  "
        f"{DIM}phase={phase_label(state['phase'])} · turn={state['turn']} · rei={state['reincarnation']}{RESET}"
    )
    chapter = chapter_label(state.get("chapter"), library)
    print(f"{BOLD}{chapter}{RESET}")
    if state.get("current_cell_label"):
        cell = state.get("current_cell")
        suffix = f" {DIM}[{cell}]{RESET}" if cell else ""
        print(f"锚点：{state['current_cell_label']}{suffix}")
    print(f"压强：{state.get('pressure', 0)}")


def render_anchor_summary(state: Dict[str, Any]) -> None:
    diagnostics = state.get("last_anchor_diagnostics")
    if not diagnostics:
        return

    turn_tags = diagnostics.get("turn_tags") or []
    if turn_tags:
        print("剖面：" + " / ".join(turn_tags[:3]))

    player_model = diagnostics.get("player_model") or {}
    posture = player_model.get("current_posture")
    if posture:
        print(f"玩家位：{posture}")

    context_note = diagnostics.get("context_note")
    if context_note:
        print(f"语境：{context_note}")

    secondary = diagnostics.get("secondary_anchors") or []
    if secondary:
        labels = [item.get("label") or item.get("id") for item in secondary[:2]]
        print("竞争：" + " / ".join([label for label in labels if label]))

    trajectory = state.get("last_trajectory_diagnostics") or {}
    route_label = trajectory.get("route_label") or state.get("current_trajectory_label")
    if route_label:
        print(f"路向：{route_label}")
    route_summary = trajectory.get("route_summary")
    if route_summary:
        print(f"推进：{route_summary}")


def render_status(state: Dict[str, Any], library: Dict[str, Any]) -> None:
    render_header(state, library)
    render_anchor_summary(state)
    print(f"{DIM}{state.get('situation', '')}{RESET}")
    print(f"{DIM}author_unmasked={state.get('author_unmasked', False)}{RESET}")
    affordances = state.get("last_affordances") or []
    if affordances:
        print("可做：" + " / ".join(affordances[:4]))
    if state.get("author_unmasked"):
        print(f"{FG_OK}可选结局：/quit  /return  /rewrite ...{RESET}")


def render_map(library: Dict[str, Any], state: Dict[str, Any]) -> None:
    print()
    print(f"{BOLD}Anchor Library{RESET}")
    current = state.get("current_cell")
    for cell in iter_cells(library):
        marker = "@" if current and cell["id"] == current else "·"
        trap = " trap" if cell["trap"] else ""
        blindspot = f" | 盲点：{cell['blindspot']}" if cell["blindspot"] else ""
        print(f"  {marker} {cell['id']}  {cell['label']}{trap} | {cell['essence']}{blindspot}")


def render_intro() -> None:
    print(f"{FG_ACCENT}{BOLD}Aporia v5 Core{RESET}")
    print("这里只保留壳层。每一句话都交给 LLM 当场裁定。")
    print("直接输入一句话开始。输入 /help 看命令。")


def retrieval_source_label(source: str) -> str:
    return {
        "always_include": "常驻格",
        "current_cell": "当前格",
        "adjacent_4d": "邻格",
        "recent_history": "最近轨迹",
        "secondary_anchor": "竞争锚点",
        "route_default": "路向默认格",
        "full_library_disabled": "全量库(检索关闭)",
        "full_library_small": "全量库(小库)",
        "full_library_fallback": "全量库(fallback)",
    }.get(source, source)


def retrieval_mode_label(mode: str) -> str:
    return {
        "retrieved": "retrieval",
        "full_library_disabled": "full dump / retrieval disabled",
        "full_library_small": "full dump / small library",
        "full_library_fallback": "full dump / fallback",
    }.get(mode, mode)


def current_cell_crystallized_meta(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    cell_id = state.get("current_cell")
    if not isinstance(cell_id, str) or not cell_id:
        return None
    overlay = load_crystallized_cell(cell_id, state=state, context="inspect")
    if not overlay:
        return None
    meta = dict(overlay.get("meta", {}))
    meta["path"] = overlay.get("path")
    return meta


def pending_crystallization_rows(state: Dict[str, Any], library: Dict[str, Any]) -> List[Dict[str, Any]]:
    cells = library_cells_by_id(library)
    rows = []
    for cell_id in normalize_pending_crystallizations(state):
        visit_count = cell_visit_count(cell_id)
        threshold = next((value for value in CRYSTALLIZATION_THRESHOLDS if value >= visit_count), CRYSTALLIZATION_THRESHOLDS[-1])
        rows.append(
            {
                "cell_id": cell_id,
                "label": cells.get(cell_id, {}).get("name") or cells.get(cell_id, {}).get("label") or cell_id,
                "visit_count": visit_count,
                "threshold": threshold,
                "ghost": cell_id not in cells,
            }
        )
    return rows


def render_inspect(state: Dict[str, Any], library: Dict[str, Any]) -> None:
    diagnostics = state.get("last_anchor_diagnostics")
    trajectory = state.get("last_trajectory_diagnostics")
    profile = load_player_profile()
    profile_payload = profile_prompt_payload(profile)
    retrieval_meta = state.get("last_retrieval_meta") or {}
    warnings = state.get("last_memory_warnings") or []
    pending_rows = pending_crystallization_rows(state, library)
    crystallized_meta = current_cell_crystallized_meta(state)
    total_crystallized = len(list(CRYSTALLIZED_DIR.glob("*.md")))
    has_profile = bool(
        profile_payload.get("posture")
        or profile_payload.get("signature_words")
        or profile_payload.get("dialectical_tensions")
        or profile_payload.get("total_turns")
    )
    render_header(state, library)
    if not diagnostics and not has_profile and not retrieval_meta and not warnings and not pending_rows and not crystallized_meta and total_crystallized == 0:
        print("还没有可供检查的诊断。先说一句话。")
        return

    if diagnostics:
        primary = diagnostics.get("primary_anchor") or {}
        pid = primary.get("id")
        plabel = primary.get("label")
        pconf = primary.get("confidence", 0.0)
        print(f"主锚点：{plabel or pid} [{pid}] · conf={pconf:.2f}" if pid else f"主锚点：{plabel} · conf={pconf:.2f}")

        turn_tags = diagnostics.get("turn_tags") or []
        if turn_tags:
            print("本回合标签：" + " / ".join(turn_tags))

        carryover = diagnostics.get("history_carryover_tags") or []
        if carryover:
            print("历史拖拽：" + " / ".join(carryover))
        else:
            print("历史拖拽：无明显历史拖拽")

        signals = diagnostics.get("supporting_signals") or []
        if signals:
            print("命中依据：" + " / ".join(signals))

        competing_note = diagnostics.get("competing_note")
        if competing_note:
            print(f"竞争说明：{competing_note}")

        secondary = diagnostics.get("secondary_anchors") or []
        if secondary:
            parts = []
            for item in secondary:
                label = item.get("label") or item.get("id")
                conf = item.get("confidence", 0.0)
                parts.append(f"{label}({conf:.2f})")
            print("次锚点：" + " / ".join(parts))

        player_model = diagnostics.get("player_model") or {}
        if player_model:
            print(f"当前姿态：{player_model.get('current_posture', '')}")
            print(f"历史位置：{player_model.get('historical_posture', '')}")
            print(f"张力：{player_model.get('tension', '')}")
            print(f"判断信心：{player_model.get('confidence', 0.0):.2f}")

        context_note = diagnostics.get("context_note")
        if context_note:
            print(f"语境说明：{context_note}")

        if trajectory:
            print()
            print(f"路向：{trajectory.get('route_label', '')} [{trajectory.get('route_id', '')}] · conf={trajectory.get('confidence', 0.0):.2f}")
            print(f"路向摘要：{trajectory.get('route_summary', '')}")
            print(f"为何走这条：{trajectory.get('why_this_route', '')}")
            print(f"历史牵引：{trajectory.get('historical_pull', '')}")
            print(f"防塌缩说明：{trajectory.get('anti_collapse_note', '')}")
            print(f"下一步偏向：{trajectory.get('next_step_bias', '')}")
            competing_routes = trajectory.get("competing_routes") or []
            if competing_routes:
                parts = []
                for item in competing_routes:
                    label = item.get("label") or item.get("id")
                    parts.append(f"{label}({item.get('confidence', 0.0):.2f})")
                print("竞争路向：" + " / ".join(parts))
    else:
        print("当前局还没有本回合诊断。")

    if has_profile:
        print()
        print(f"跨局画像：conf={profile_payload.get('portrait_confidence', 0.0):.2f} · provisional={str(profile_payload.get('provisional', True)).lower()}")
        print(f"累计回合：{profile_payload.get('total_turns', 0)} · 累计转世：{profile_payload.get('total_reincarnations', 0)}")
        print(f"画像姿态：{profile_payload.get('posture', '')}")
        signature_words = profile_payload.get("signature_words") or []
        if signature_words:
            print("惯用词：" + " / ".join(signature_words))
        tensions = profile_payload.get("dialectical_tensions") or []
        if tensions:
            print("画像张力：" + " / ".join(tensions))
        generated = profile_payload.get("generated_from_turns") or []
        if generated:
            print("画像来源 turns：" + " / ".join([str(item) for item in generated]))
        trajectory_summary = profile_payload.get("trajectory_summary") or []
        if trajectory_summary:
            parts = [f"run {item.get('run')}: {item.get('arc')}" for item in trajectory_summary[-3:] if item.get("arc")]
            if parts:
                print("近局弧线：" + " / ".join(parts))

    if retrieval_meta:
        print()
        print(
            "检索："
            + f"{retrieval_mode_label(str(retrieval_meta.get('mode', 'unknown')))}"
            + f" · count={retrieval_meta.get('selected_count', len(retrieval_meta.get('selected_cell_ids', [])))}"
        )
        selected_cells = retrieval_meta.get("selected_cells") or []
        if selected_cells:
            parts = []
            for item in selected_cells:
                label = item.get("label") or item.get("id")
                sources = ",".join(retrieval_source_label(str(source)) for source in item.get("sources", []))
                overlay = " +overlay" if item.get("has_crystallized_overlay") else ""
                parts.append(f"{label}[{item.get('id')}]<{sources}>{overlay}")
            print("命中格：" + " / ".join(parts))

    print()
    if crystallized_meta:
        print(
            "当前格结晶："
            + f"visit={crystallized_meta.get('visit_count', 0)}"
            + f" · last_turn={crystallized_meta.get('last_distilled_turn', 0)}"
            + f" · sample={crystallized_meta.get('source_sample_size', 0)}"
            + f" · conf={float(crystallized_meta.get('confidence', 0.0) or 0.0):.2f}"
        )
        if crystallized_meta.get("path"):
            print(f"结晶文件：{crystallized_meta.get('path')}")
    else:
        print("当前格结晶：无")
    print(f"结晶总数：{total_crystallized}")

    if pending_rows:
        parts = []
        for item in pending_rows:
            ghost = " ghost" if item.get("ghost") else ""
            parts.append(f"{item['label']}[{item['cell_id']}] {item['visit_count']}/{item['threshold']}{ghost}")
        print("待结晶：" + f"{len(pending_rows)} 个 · " + " / ".join(parts))
    else:
        print("待结晶：0")

    if warnings:
        print("最近 memory warning：")
        for item in warnings[-3:]:
            print(f"  - {item.get('kind')}: {item.get('detail')}")


def record_trace(kind: str, body: str, state: Dict[str, Any]) -> Path:
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    path = TRACE_DIR / f"{kind}-{state['reincarnation']}-{stamp}.md"
    path.write_text(body + "\n", encoding="utf-8")
    return path


def append_sediment(text: str, state: Dict[str, Any], result: Dict[str, Any]) -> None:
    cell_id = state.get("current_cell")
    if not cell_id:
        return

    diagnostics = result.get("anchor_diagnostics", {})
    last_history = state.get("history", [])[-1] if state.get("history") else {}
    event = {
        "turn": state.get("turn"),
        "global_turn": last_history.get("global_turn"),
        "reincarnation": state.get("reincarnation"),
        "cell_id": cell_id,
        "text": text,
        "phase": state.get("phase"),
        "chapter": state.get("chapter"),
        "trajectory_id": state.get("current_trajectory_id"),
        "turn_tags": diagnostics.get("turn_tags", []),
        "history_carryover_tags": diagnostics.get("history_carryover_tags", []),
        "player_posture": diagnostics.get("player_model", {}).get("current_posture"),
        "ts": now_iso(),
    }
    append_jsonl(sediment_file(cell_id), event)


def append_trajectory_visit(state: Dict[str, Any]) -> None:
    cell_id = state.get("current_cell")
    if not cell_id:
        return

    event = {
        "op": "visit",
        "run": state.get("reincarnation", 0),
        "turn": state.get("turn"),
        "cell_id": cell_id,
        "cell_label": state.get("current_cell_label"),
        "route_id": state.get("current_trajectory_id"),
        "route_label": state.get("current_trajectory_label"),
        "phase": state.get("phase"),
        "chapter": state.get("chapter"),
        "ts": now_iso(),
    }
    append_jsonl(trajectory_file(state.get("reincarnation", 0)), event)


def append_trajectory_seal(state: Dict[str, Any], ending: str) -> None:
    event = {
        "op": "seal",
        "run": state.get("reincarnation", 0),
        "turn": state.get("turn"),
        "ending": ending,
        "cell_id": state.get("current_cell"),
        "route_id": state.get("current_trajectory_id"),
        "phase": state.get("phase"),
        "chapter": state.get("chapter"),
        "ts": now_iso(),
    }
    append_jsonl(trajectory_file(state.get("reincarnation", 0)), event)


def load_trajectory_events(run: int) -> List[Dict[str, Any]]:
    path = trajectory_file(run)
    if not path.exists():
        return []

    events = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            raw = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(raw, dict):
            events.append(raw)
    return events


def summarize_run_arc(run: int, ending: str) -> Dict[str, Any]:
    labels: List[str] = []
    for event in load_trajectory_events(run):
        if event.get("op") != "visit":
            continue
        label = event.get("cell_label") or event.get("cell_id")
        if not label:
            continue
        if not labels or labels[-1] != label:
            labels.append(str(label))

    if not labels:
        arc = f"无有效落点 -> {ending}"
    else:
        arc = " -> ".join(labels[:6])
        if ending:
            arc = f"{arc} -> {ending}"
    return {"run": run, "arc": arc}


def current_cell_record(library: Dict[str, Any], cell_id: Optional[str]) -> Optional[Dict[str, Any]]:
    if not isinstance(cell_id, str):
        return None
    return library_cells_by_id(library).get(cell_id)


def load_recent_sediment(cell_id: str, limit: int = CELL_DISTILL_SAMPLE_SIZE) -> List[Dict[str, Any]]:
    return read_jsonl(sediment_file(cell_id))[-limit:]


def cell_visit_count(cell_id: str) -> int:
    return len(read_jsonl(sediment_file(cell_id)))


def normalize_pending_crystallizations(state: Dict[str, Any]) -> List[str]:
    pending = []
    for item in state.get("pending_crystallizations", []):
        if not isinstance(item, str) or not item:
            continue
        if item not in pending:
            pending.append(item)
    state["pending_crystallizations"] = pending
    return pending


def maybe_mark_pending_crystallization(state: Dict[str, Any], library: Dict[str, Any]) -> None:
    if not cell_crystallization_enabled():
        return

    cell_id = state.get("current_cell")
    if not isinstance(cell_id, str) or not cell_id:
        return

    visit_count = cell_visit_count(cell_id)
    if visit_count not in CRYSTALLIZATION_THRESHOLDS:
        return

    if not current_cell_record(library, cell_id):
        warn_memory(state, "ghost_cell_skip", f"跳过幽灵 cell 的 crystallization：{cell_id}")
        return

    pending = normalize_pending_crystallizations(state)
    if cell_id not in pending:
        pending.append(cell_id)
        state["pending_crystallizations"] = pending


def build_cell_distill_prompt(cell: Dict[str, Any], sediment: List[Dict[str, Any]], prior_overlay: Optional[Dict[str, Any]]) -> str:
    payload = {
        "base_cell": {
            "id": cell.get("id"),
            "name": cell.get("name") or cell.get("label"),
            "essence": cell.get("essence", ""),
            "blindspot": cell.get("blindspot", ""),
            "trap": bool(cell.get("trap")),
        },
        "recent_sediment": sediment,
        "prior_overlay": {
            "current_essence": prior_overlay.get("current_essence", "") if prior_overlay else "",
            "signature_utterances": prior_overlay.get("signature_utterances", []) if prior_overlay else [],
            "escape_moves": prior_overlay.get("escape_moves", []) if prior_overlay else [],
            "meta": prior_overlay.get("meta", {}) if prior_overlay else {},
        },
    }
    return textwrap.dedent(
        f"""
        You are distilling a living overlay for one Aporia cell.

        Rules:
        - Do not rewrite the entire ontology of the cell.
        - Summarize only what has historically emerged in the supplied recent visits.
        - Keep the result concrete and trace-based.
        - Do not claim more stability than the samples warrant.
        - signature_utterances should quote or closely paraphrase actual recent lines.
        - escape_moves_observed should mention any visible local escape or hesitation patterns.
        - Return JSON only with this exact shape:
          {{
            "current_essence": "...",
            "signature_utterances": [{{"text": "...", "turn": 12}}],
            "escape_moves_observed": ["..."],
            "confidence": 0.0
          }}

        TRACE PAYLOAD (JSON):
        {json.dumps(payload, ensure_ascii=False, indent=2)}
        """
    ).strip()


def validate_cell_distill_result(raw: Dict[str, Any], sediment: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raise RuntimeError("cell 蒸馏返回的不是 JSON object。")
    if "current_essence" not in raw:
        raise RuntimeError("cell 蒸馏缺少 current_essence。")

    signature_utterances = []
    for item in raw.get("signature_utterances", [])[:CELL_DISTILL_SIGNATURE_LIMIT]:
        if not isinstance(item, dict):
            continue
        signature_utterances.append(
            {
                "text": str(item.get("text", "")).strip(),
                "turn": int(item.get("turn", 0) or 0),
            }
        )

    escape_moves = [str(item).strip() for item in raw.get("escape_moves_observed", [])[:4] if str(item).strip()]
    sample_turns = []
    for item in sediment:
        turn_value = item.get("global_turn", item.get("turn"))
        if isinstance(turn_value, int):
            sample_turns.append(turn_value)

    return {
        "current_essence": str(raw.get("current_essence", "")).strip(),
        "signature_utterances": signature_utterances,
        "escape_moves_observed": escape_moves,
        "confidence": float(raw.get("confidence", 0.0) or 0.0),
        "generated_from_turns": sample_turns[-CELL_DISTILL_SAMPLE_SIZE:],
    }


def run_cell_distill(cell: Dict[str, Any], sediment: List[Dict[str, Any]], prior_overlay: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    prompt = build_cell_distill_prompt(cell, sediment, prior_overlay)
    codex_bin = os.environ.get("APORIA_CODEX_BIN", "codex")
    model = os.environ.get("APORIA_CELL_MODEL") or os.environ.get("APORIA_LLM_MODEL")
    reasoning_effort = os.environ.get("APORIA_CELL_REASONING_EFFORT") or os.environ.get("APORIA_LLM_REASONING_EFFORT")

    with tempfile.TemporaryDirectory(prefix="aporia-cell-") as tmpdir:
        tmp_path = Path(tmpdir)
        output_path = tmp_path / "cell.json"
        cmd = [
            codex_bin,
            "exec",
            "--skip-git-repo-check",
            "--ephemeral",
            "--sandbox",
            "read-only",
            "--color",
            "never",
            "--output-last-message",
            str(output_path),
            "-",
        ]
        if model:
            cmd.extend(["-m", model])
        if reasoning_effort:
            cmd.extend(["-c", f'model_reasoning_effort="{reasoning_effort}"'])
        try:
            subprocess.run(
                cmd,
                input=prompt,
                text=True,
                cwd=tmpdir,
                capture_output=True,
                check=True,
                timeout=120,
            )
        except FileNotFoundError as exc:
            raise RuntimeError(f"找不到 codex 可执行文件：{codex_bin}") from exc
        except subprocess.TimeoutExpired as exc:
            raise RuntimeError("cell 蒸馏超时。") from exc
        except subprocess.CalledProcessError as exc:
            detail = (exc.stderr or exc.stdout or "").strip()
            raise RuntimeError(f"cell 蒸馏失败。\n{detail}") from exc

        if not output_path.exists():
            raise RuntimeError("cell 蒸馏失败：未生成结果文件。")

        raw = output_path.read_text(encoding="utf-8").strip()
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"cell 蒸馏返回了非 JSON 结果：{raw[:400]}") from exc
        return validate_cell_distill_result(parsed, sediment)


def render_crystallized_markdown(cell_id: str, visit_count: int, last_turn: int, distilled: Dict[str, Any]) -> str:
    sample_turns = distilled.get("generated_from_turns", [])
    frontmatter = [
        "---",
        "schema_version: 1",
        f"cell_id: {cell_id}",
        f"visit_count: {visit_count}",
        f"last_distilled_turn: {last_turn}",
        f"source_sample_size: {len(sample_turns)}",
        f"generated_from_turns: {json.dumps(sample_turns, ensure_ascii=False)}",
        f"confidence: {distilled.get('confidence', 0.0):.2f}",
        "---",
        "",
        "## Current essence",
        distilled.get("current_essence", "").strip() or "暂无稳定结晶。",
        "",
        "## Signature utterances (recent)",
    ]
    signature_utterances = distilled.get("signature_utterances", [])
    if signature_utterances:
        for item in signature_utterances:
            frontmatter.append(f'- "{item.get("text", "").strip()}"（turn {item.get("turn", 0)}）')
    else:
        frontmatter.append("- 暂无足够稳定的近例。")

    frontmatter.extend(["", "## Escape moves observed"])
    escape_moves = distilled.get("escape_moves_observed", [])
    if escape_moves:
        for item in escape_moves:
            frontmatter.append(f"- {item}")
    else:
        frontmatter.append("- 暂无明显逃逸动作。")
    return "\n".join(frontmatter).strip() + "\n"


def save_crystallized_cell(cell_id: str, distilled: Dict[str, Any], state: Dict[str, Any]) -> None:
    visit_count = cell_visit_count(cell_id)
    last_turn = int(distilled.get("generated_from_turns", [])[-1] if distilled.get("generated_from_turns") else state.get("turn", 0) or 0)
    crystallized_file(cell_id).write_text(
        render_crystallized_markdown(cell_id, visit_count, last_turn, distilled),
        encoding="utf-8",
    )


def flush_pending_crystallizations(state: Dict[str, Any], library: Dict[str, Any], reason: str) -> None:
    if not cell_crystallization_enabled():
        return

    pending = normalize_pending_crystallizations(state)
    if not pending:
        return

    remaining: List[str] = []
    for cell_id in pending:
        cell = current_cell_record(library, cell_id)
        if not cell:
            visit_count = cell_visit_count(cell_id)
            warn_memory(
                state,
                "ghost_cell_skip",
                f"跳过幽灵 cell 的 crystallization：{cell_id} (reason={reason}, visits={visit_count})",
            )
            continue

        sediment = load_recent_sediment(cell_id)
        if not sediment:
            continue

        try:
            distilled = run_cell_distill(cell, sediment, load_crystallized_cell(cell_id, state=state, context=f"flush:{reason}"))
            save_crystallized_cell(cell_id, distilled, state)
        except RuntimeError as exc:
            warn_memory(state, "cell_distill_failed", f"{exc} (cell={cell_id}, reason={reason})")
            remaining.append(cell_id)

    state["pending_crystallizations"] = remaining


def profile_history_digest(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    digest = []
    for item in state.get("history", [])[-12:]:
        digest.append(
            {
                "turn": item.get("turn"),
                "global_turn": item.get("global_turn"),
                "phase": item.get("phase"),
                "chapter": item.get("chapter"),
                "cell": item.get("cell"),
                "trajectory_id": item.get("trajectory_id"),
                "turn_tags": item.get("turn_tags", []),
                "history_carryover_tags": item.get("history_carryover_tags", []),
                "player_posture": item.get("player_posture"),
                "text": item.get("text"),
            }
        )
    return digest


def build_profile_distill_prompt(state: Dict[str, Any], profile: Dict[str, Any]) -> str:
    payload = {
        "current_run_turn": state.get("turn", 0),
        "reincarnation": state.get("reincarnation", 0),
        "history_digest": profile_history_digest(state),
        "recent_trajectory_summary": profile.get("trajectory_summary", [])[-4:],
        "existing_profile": profile_prompt_payload(profile),
    }
    return textwrap.dedent(
        f"""
        You are distilling a provisional cross-run player portrait for Aporia.

        Rules:
        - Do not essentialize the player into a fixed identity.
        - Describe only historically situated tendencies visible in the supplied traces.
        - Prefer tensions, recurring postures, and signature phrase-shapes over personality claims.
        - If the evidence is weak, lower portrait_confidence and keep the portrait tentative.
        - trajectory_summary should summarize recent runs briefly and concretely.
        - Return JSON only with this exact shape:
          {{
            "posture": "...",
            "signature_words": ["..."],
            "dialectical_tensions": ["..."],
            "portrait_confidence": 0.0,
            "trajectory_summary": [{{"run": 0, "arc": "..."}}],
            "provisional": true
          }}

        TRACE PAYLOAD (JSON):
        {json.dumps(payload, ensure_ascii=False, indent=2)}
        """
    ).strip()


def validate_profile_result(raw: Dict[str, Any], prior_profile: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raise RuntimeError("画像蒸馏返回的不是 JSON object。")

    if "posture" not in raw:
        raise RuntimeError("画像蒸馏缺少 posture。")

    portrait = {
        "posture": str(raw.get("posture", "")).strip(),
        "signature_words": [str(item) for item in raw.get("signature_words", [])[:8]],
        "dialectical_tensions": [str(item) for item in raw.get("dialectical_tensions", [])[:6]],
        "last_updated_turn": prior_profile.get("total_turns", 0),
    }
    trajectory_summary = prior_profile.get("trajectory_summary", [])
    if isinstance(raw.get("trajectory_summary"), list):
        trajectory_summary = []
        for item in raw.get("trajectory_summary", [])[-PROFILE_TRAJECTORY_SUMMARY_LIMIT:]:
            if not isinstance(item, dict):
                continue
            trajectory_summary.append(
                {
                    "run": int(item.get("run", 0) or 0),
                    "arc": str(item.get("arc", "")),
                }
            )

    updated = canonicalize_player_profile(
        prior_profile
        | {
            "portrait_confidence": float(raw.get("portrait_confidence", prior_profile.get("portrait_confidence", 0.0)) or 0.0),
            "generated_from_turns": [item.get("global_turn", item.get("turn")) for item in profile_history_digest(state)],
            "provisional": bool(raw.get("provisional", True)),
            "current_portrait": portrait,
            "trajectory_summary": trajectory_summary,
        }
    )
    return updated


def run_profile_distill(state: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
    prompt = build_profile_distill_prompt(state, profile)
    codex_bin = os.environ.get("APORIA_CODEX_BIN", "codex")
    model = os.environ.get("APORIA_PROFILE_MODEL") or os.environ.get("APORIA_LLM_MODEL")
    reasoning_effort = os.environ.get("APORIA_PROFILE_REASONING_EFFORT") or os.environ.get("APORIA_LLM_REASONING_EFFORT")

    with tempfile.TemporaryDirectory(prefix="aporia-profile-") as tmpdir:
        tmp_path = Path(tmpdir)
        output_path = tmp_path / "profile.json"
        cmd = [
            codex_bin,
            "exec",
            "--skip-git-repo-check",
            "--ephemeral",
            "--sandbox",
            "read-only",
            "--color",
            "never",
            "--output-last-message",
            str(output_path),
            "-",
        ]
        if model:
            cmd.extend(["-m", model])
        if reasoning_effort:
            cmd.extend(["-c", f'model_reasoning_effort="{reasoning_effort}"'])
        try:
            subprocess.run(
                cmd,
                input=prompt,
                text=True,
                cwd=tmpdir,
                capture_output=True,
                check=True,
                timeout=120,
            )
        except FileNotFoundError as exc:
            raise RuntimeError(f"找不到 codex 可执行文件：{codex_bin}") from exc
        except subprocess.TimeoutExpired as exc:
            raise RuntimeError("画像蒸馏超时。") from exc
        except subprocess.CalledProcessError as exc:
            detail = (exc.stderr or exc.stdout or "").strip()
            raise RuntimeError(f"画像蒸馏失败。\n{detail}") from exc

        if not output_path.exists():
            raise RuntimeError("画像蒸馏失败：未生成结果文件。")

        raw = output_path.read_text(encoding="utf-8").strip()
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"画像蒸馏返回了非 JSON 结果：{raw[:400]}") from exc
        return validate_profile_result(parsed, profile, state)


def should_distill_profile(state: Dict[str, Any], profile: Dict[str, Any], force: bool = False) -> bool:
    if not profile_distill_enabled():
        return False
    if state.get("turn", 0) < PROFILE_MIN_TURN:
        return False
    if len(state.get("history", [])) < PROFILE_MIN_HISTORY:
        return False
    if force:
        return True
    last_updated_turn = profile.get("current_portrait", {}).get("last_updated_turn", 0)
    return state.get("turn", 0) % PROFILE_DISTILL_EVERY == 0 and profile.get("total_turns", 0) > last_updated_turn


def maybe_distill_profile(state: Dict[str, Any], profile: Dict[str, Any], force: bool = False) -> Dict[str, Any]:
    if not should_distill_profile(state, profile, force=force):
        return profile
    try:
        return run_profile_distill(state, profile)
    except RuntimeError as exc:
        print(f"{FG_WARN}{exc}{RESET}", file=sys.stderr)
        return profile


def update_profile_for_seal(state: Dict[str, Any], ending: str) -> None:
    if state.get("turn", 0) <= 0:
        return

    profile = load_player_profile()
    profile["total_reincarnations"] = int(profile.get("total_reincarnations", 0) or 0) + 1
    trajectory_summary = list(profile.get("trajectory_summary", []))
    trajectory_summary.append(summarize_run_arc(state.get("reincarnation", 0), ending))
    profile["trajectory_summary"] = trajectory_summary[-PROFILE_TRAJECTORY_SUMMARY_LIMIT:]
    profile = maybe_distill_profile(state, profile, force=True)
    save_player_profile(profile)


def engine_prompt(text: str, state: Dict[str, Any], library: Dict[str, Any]) -> str:
    recent_history = state.get("history", [])[-6:]
    recent_route_ids = [item.get("trajectory_id") for item in recent_history if item.get("trajectory_id")]
    current_route = state.get("current_trajectory_id")
    current_route_streak = 0
    player_profile = profile_prompt_payload(load_player_profile())
    library_material = retrieve_relevant_library(state, text, library)
    state["last_retrieval_meta"] = library_material.get("retrieval_meta", {})
    if current_route:
        for item in reversed(recent_history):
            if item.get("trajectory_id") != current_route:
                break
            current_route_streak += 1

    compact_state = {
        "turn": state.get("turn", 0),
        "reincarnation": state.get("reincarnation", 0),
        "phase": state.get("phase", "immersion"),
        "chapter": state.get("chapter"),
        "current_cell": state.get("current_cell"),
        "current_cell_label": state.get("current_cell_label"),
        "author_unmasked": state.get("author_unmasked", False),
        "pressure": state.get("pressure", 0),
        "situation": state.get("situation", ""),
        "current_trajectory_id": state.get("current_trajectory_id"),
        "current_trajectory_label": state.get("current_trajectory_label"),
        "recent_route_ids": recent_route_ids[-4:],
        "current_route_streak": current_route_streak,
        "history": recent_history,
        "player_profile_l2": player_profile,
    }
    brief = {
        "manifest": [
            "Aporia 不是关于意识形态的展览，而是意识形态批判作为事件。",
            "玩家不是旁观批判，而是在做批判。",
            "图书馆可以误读、困住、裂开，也可以承认自己的建造偏见。",
            "不要把醒觉写成胜利，不要给玩家颁发超越感。",
            "锚点格只是语义材料，不是固定分类器。不要按关键词、轮数或硬规则裁定。",
            "不要把将-来者当作所有高阶批判的默认宿舍；命名、授权、来源追问应尽量落在更贴近 provenance 的格子。",
            "player_profile_l2 是跨局蒸馏出的暂定画像，只能帮助你判断历史姿态，不能被当成固定身份真相。",
            "某些格会带有 crystallized overlay；那是近期历史涌现出的局部读法，不是不可更改的本体定义。",
        ],
        "trajectory_routes": {
            "genealogical_critique": "追谁建的、谁命名的、谁授权的、何时被建成自然。",
            "material_critique": "追谁受益、谁承担代价、谁被排除、哪些现实后果被转嫁。",
            "ethical_refusal": "不是继续拆解释，而是拒绝按这套语法继续配合、继续流通、继续服从。",
            "practical_rewrite": "把批判转成改布局、改规则、改文件、改入口条件的实践冲动。",
            "tragic_aporia": "承认矛盾无法被高明综合消解，保留困境，不急着升格为结构掌控。",
        },
        "trajectory_route_labels": ROUTE_LABELS,
        "trajectory_selection_protocol": [
            "先判断这句话当前最强的压力是什么，再选 route；不要先选锚点再机械推出 route。",
            "把 route 只当作本回合的批判推进方向，而不是玩家的固定人格或唯一终局。",
            "五种压力的对应关系：provenance->genealogical, distribution->material, refusal->ethical, redesign->practical, irreducible contradiction->tragic.",
            "如果当前话语比上一回合更像是在问谁得利、谁买单、谁被排除，material_critique 优先于 genealogical_critique。",
            "如果当前话语在撤回配合、拒绝自述、拒绝按给定语法继续，ethical_refusal 优先于 genealogical_critique。",
            "单纯说“我先配合”“先按表格来”还不算 refusal；只有明确撤回供给、暂停配合、拒绝继续按这套语法说话，才进入 ethical_refusal。",
            "如果当前话语在提改入口、改布局、增删格子、开放并置、改变规则，practical_rewrite 优先于 genealogical_critique。",
            "单纯指出目录压平、分类失真、经验被挤没，并不自动等于 practical_rewrite；只有当句子真的提出改写动作或重排要求时，才进入 practical_rewrite。",
            "如果当前话语在保留无法化解的矛盾、暂停综合、拒绝假解决，tragic_aporia 优先于 genealogical_critique。",
            "只有当当前压力真正落在作者、命名史、授权链、建造来源、自然化来源时，才选 genealogical_critique。",
            "如果最近 route 已连续重复，而当前话语明显转向别的压力，就应该换 route，不要因惯性沿用旧 route。",
        ],
        "style": [
            "保持中文。",
            "保持世界内语气，不要说你是助手、模型、GM、DM、master。",
            "不要写成长论文；叙述要紧、准、可玩。",
            "可以让世界承认自己的偏置，但那必须是本回合真实生成出来的结果。",
        ],
    }
    return textwrap.dedent(
        f"""
        You are the hidden adjudication core for Aporia.

        Your job is to judge exactly one player utterance as a world event.
        The shell layer handles slash-commands and persistence already. You only judge the turn.

        CORE BRIEF (JSON):
        {json.dumps(brief, ensure_ascii=False, indent=2)}

        CURRENT STATE (JSON):
        {json.dumps(compact_state, ensure_ascii=False, indent=2)}

        LIBRARY MATERIAL (JSON):
        {json.dumps(library_material, ensure_ascii=False, indent=2)}

        PLAYER UTTERANCE:
        {text}

        OUTPUT REQUIREMENTS:
        - Return JSON only matching the provided schema.
        - narration: what the player now perceives in the world.
        - adjudication.reading: how the library read or misread the utterance.
        - adjudication.world_move: what the world does back.
        - adjudication.mode must always be present as a short string.
        - adjudication.misread, adjudication.trap, adjudication.escape, adjudication.crack, adjudication.unclassifiable must all be present as explicit booleans, even when false.
        - state_patch.phase must be immersion, crack, or wakefulness.
        - state_patch.chapter should usually reference one chapter key from the library when appropriate.
        - state_patch.current_cell_id/current_cell_label may point to one anchor cell, but only if the turn truly leans on one.
        - state_patch.author_unmasked becomes true only if the world has now admitted its own built bias.
        - state_patch.pressure is an integer 0-100.
        - state_patch.situation is a short state summary for the next turn.
        - anchor_diagnostics must explain why this anchor was chosen in this historical context.
        - When the utterance focuses on naming, authorization, provenance, canon formation, or institutional backing, prefer a provenance-oriented anchor over generic self-reflexive anchors.
        - anchor_diagnostics.turn_tags: 2-5 short semantic tags for this turn.
        - anchor_diagnostics.history_carryover_tags: tags inherited from recent history if any.
        - anchor_diagnostics.supporting_signals: brief reasons or phrase-shapes that support the anchor choice.
        - anchor_diagnostics.context_note: explain whether this is mainly driven by the current utterance, recent history, or both.
        - anchor_diagnostics.competing_note: explain the nearest competing anchors.
        - anchor_diagnostics.player_model: judge the player's current discursive posture and historical position, but only contextually.
        - player_profile_l2 is provisional cross-run context; you may use it to sharpen historical_posture, but do not copy it verbatim or treat it as fixed identity.
        - Use this exact anchor_diagnostics shape:
          {{
            "primary_anchor": {{"id": "...", "label": "...", "confidence": 0.00}},
            "secondary_anchors": [{{"id": "...", "label": "...", "confidence": 0.00}}],
            "turn_tags": ["..."],
            "history_carryover_tags": ["..."],
            "supporting_signals": ["..."],
            "context_note": "...",
            "competing_note": "...",
            "player_model": {{
              "current_posture": "...",
              "historical_posture": "...",
              "tension": "...",
              "confidence": 0.00
            }}
          }}
        - trajectory_diagnostics must choose exactly one critique attractor for this turn.
        - trajectory route ids must be one of:
          - genealogical_critique
          - material_critique
          - ethical_refusal
          - practical_rewrite
          - tragic_aporia
        - trajectory_diagnostics.route_label must be the exact Chinese label that matches route_id:
          - genealogical_critique -> 谱系批判
          - material_critique -> 物质批判
          - ethical_refusal -> 伦理拒绝
          - practical_rewrite -> 实践改写
          - tragic_aporia -> 悲剧性疑难
        - Use this exact trajectory_diagnostics shape:
          {{
            "route_id": "...",
            "route_label": "...",
            "route_summary": "...",
            "why_this_route": "...",
            "historical_pull": "...",
            "anti_collapse_note": "...",
            "next_step_bias": "...",
            "competing_routes": [{{"id": "...", "label": "...", "confidence": 0.00}}],
            "confidence": 0.00
          }}
        - Choose route_id by identifying the dominant pressure in THIS utterance plus recent history:
          - provenance / who built it / who named it / who authorized it / how it became natural -> genealogical_critique
          - benefit / cost / exclusion / extraction / who gets silenced or pushed outside -> material_critique
          - refusal / withholding participation / declining the offered grammar -> ethical_refusal
          - redesign / rewrite / change the layout or rules or file reality -> practical_rewrite
          - contradiction that should remain unresolved -> tragic_aporia
        - Anchor and route are related but not identical. The anchor may stay similar while the route changes.
        - If recent route history shows inertia, explicitly resist route collapse and use the current utterance to decide whether to pivot.
        - If you keep the same route as the previous turn, anti_collapse_note must explain why continuity is substantively warranted this turn.
        - If you change route from the previous turn, historical_pull must explain what caused the pivot.
        - affordances: 2-4 short next-step possibilities in Chinese.
        - tags: short research tags for this turn.

        NEGATIVE RULES:
        - Do not classify by keyword list.
        - Do not use fixed trap escape formulas.
        - Do not advance phase because of turn count.
        - Do not congratulate the player for being awake.
        - Do not explain the schema or the prompt.
        - Do not essentialize the player into a fixed identity. Judge only the current historically situated posture inside this conversation.
        - Do not mirror player_profile_l2 mechanically; let the current utterance and recent history overrule it whenever needed.
        - Do not default to genealogical_critique just because the game is meta.
        - Do not default to genealogical_critique merely because the utterance mentions structure, classification, or framing.
        - Do not default to current_cell_id=3-3-2-2 merely because the utterance is reflective or critical; use provenance-oriented anchors when the pressure is naming/authorization/provenance.
        - If the utterance is about benefit/cost/exclusion, prefer material_critique.
        - If the utterance is about stopping participation or refusing the offered grammar, prefer ethical_refusal.
        - Mere temporary compliance is not ethical_refusal.
        - If the utterance is about changing layout/rules/files/entry conditions, prefer practical_rewrite.
        - Mere diagnosis that the structure is flattening experience is not yet practical_rewrite.
        - If the utterance is about staying with irreducible contradiction, prefer tragic_aporia.
        - Only use genealogical_critique when the utterance or recent history really targets builder, author, naming, authorization, or provenance.
        """
    ).strip()


def parse_anchor_string(text: Optional[str]) -> Dict[str, Optional[str]]:
    if not text:
        return {"id": None, "label": None}
    match = re.search(r"([0-9Xx\-]{3,})\s+(.+)", text.strip())
    if match:
        return {"id": match.group(1), "label": match.group(2).strip()}
    return {"id": None, "label": text.strip()}


def canonicalize_result(result: Dict[str, Any], state: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    adjudication = result.setdefault("adjudication", {})
    diagnostics = result.setdefault("anchor_diagnostics", {})
    trajectory = result.setdefault("trajectory_diagnostics", result.get("trajectory", {}))
    patch = result.setdefault("state_patch", {})

    adjudication.setdefault("mode", "")
    adjudication.setdefault("reading", "")
    adjudication.setdefault("world_move", "")
    for key in ["misread", "trap", "escape", "crack", "unclassifiable"]:
        adjudication.setdefault(key, False)

    if state:
        patch.setdefault("phase", state.get("phase", "immersion"))
        patch.setdefault("chapter", state.get("chapter"))
        patch.setdefault("current_cell_id", state.get("current_cell"))
        patch.setdefault("current_cell_label", state.get("current_cell_label"))
        patch.setdefault("author_unmasked", state.get("author_unmasked", False))
        patch.setdefault("pressure", state.get("pressure", 0))
        patch.setdefault("situation", state.get("situation", ""))

    if "primary_anchor" not in diagnostics:
        parsed = parse_anchor_string(diagnostics.get("chosen_anchor"))
        anchor_id = parsed["id"] or patch.get("current_cell_id")
        anchor_label = parsed["label"] or patch.get("current_cell_label")
        diagnostics["primary_anchor"] = {
            "id": anchor_id,
            "label": anchor_label,
            "confidence": diagnostics.get("primary_anchor_confidence", 0.5),
        }

    diagnostics.setdefault("secondary_anchors", diagnostics.get("competing_anchors", []))
    diagnostics.setdefault("turn_tags", [])
    diagnostics.setdefault("history_carryover_tags", [])
    diagnostics.setdefault("supporting_signals", [])
    diagnostics.setdefault("context_note", "")
    diagnostics.setdefault("competing_note", "")

    player_model = diagnostics.get("player_model")
    if isinstance(player_model, str):
        diagnostics["player_model"] = {
            "current_posture": player_model,
            "historical_posture": diagnostics.get("context_note", ""),
            "tension": diagnostics.get("competing_note", ""),
            "confidence": diagnostics.get("player_model_confidence", 0.5),
        }
    elif not isinstance(player_model, dict):
        diagnostics["player_model"] = {
            "current_posture": "",
            "historical_posture": diagnostics.get("context_note", ""),
            "tension": diagnostics.get("competing_note", ""),
            "confidence": diagnostics.get("player_model_confidence", 0.5),
        }

    normalized_secondary = []
    for item in diagnostics.get("secondary_anchors", []):
        if isinstance(item, str):
            parsed = parse_anchor_string(item)
            normalized_secondary.append(
                {
                    "id": parsed["id"] or item,
                    "label": parsed["label"] or item,
                    "confidence": 0.3,
                }
            )
            continue
        if isinstance(item, dict):
            normalized_secondary.append(
                {
                    "id": item.get("id") or parse_anchor_string(item.get("label")).get("id") or "unknown",
                    "label": item.get("label") or item.get("id") or "unknown",
                    "confidence": item.get("confidence", 0.3),
                }
            )
    diagnostics["secondary_anchors"] = normalized_secondary[:3]

    pm = diagnostics["player_model"]
    diagnostics["player_model"] = {
        "current_posture": pm.get("current_posture", ""),
        "historical_posture": pm.get("historical_posture", diagnostics.get("context_note", "")),
        "tension": pm.get("tension", diagnostics.get("competing_note", "")),
        "confidence": pm.get("confidence", diagnostics.get("player_model_confidence", 0.5)),
    }

    if isinstance(trajectory, str):
        trajectory = {
            "route_id": trajectory,
            "route_label": trajectory,
            "route_summary": "",
            "why_this_route": "",
            "historical_pull": "",
            "anti_collapse_note": "",
            "next_step_bias": "",
            "competing_routes": [],
            "confidence": 0.5,
        }
        result["trajectory_diagnostics"] = trajectory

    if not isinstance(trajectory, dict):
        trajectory = {}
        result["trajectory_diagnostics"] = trajectory

    if state:
        trajectory.setdefault("route_id", state.get("current_trajectory_id", ""))
        trajectory.setdefault("route_label", state.get("current_trajectory_label", ""))
        prior_trajectory = state.get("last_trajectory_diagnostics") or {}
        trajectory.setdefault("route_summary", prior_trajectory.get("route_summary", ""))
        trajectory.setdefault("why_this_route", prior_trajectory.get("why_this_route", ""))
        trajectory.setdefault("historical_pull", prior_trajectory.get("historical_pull", ""))
        trajectory.setdefault("anti_collapse_note", prior_trajectory.get("anti_collapse_note", ""))
        trajectory.setdefault("next_step_bias", prior_trajectory.get("next_step_bias", ""))
        trajectory.setdefault("competing_routes", prior_trajectory.get("competing_routes", []))
        trajectory.setdefault("confidence", prior_trajectory.get("confidence", 0.5))
    else:
        trajectory.setdefault("route_id", "")
        trajectory.setdefault("route_label", "")
        trajectory.setdefault("route_summary", "")
        trajectory.setdefault("why_this_route", "")
        trajectory.setdefault("historical_pull", "")
        trajectory.setdefault("anti_collapse_note", "")
        trajectory.setdefault("next_step_bias", "")
        trajectory.setdefault("competing_routes", [])
        trajectory.setdefault("confidence", 0.5)

    route_id = trajectory.get("route_id")
    if route_id in ROUTE_LABELS:
        trajectory["route_label"] = ROUTE_LABELS[route_id]

    normalized_routes = []
    for item in trajectory.get("competing_routes", []):
        if isinstance(item, str):
            normalized_routes.append({"id": item, "label": ROUTE_LABELS.get(item, item), "confidence": 0.3})
            continue
        if isinstance(item, dict):
            rid = item.get("id") or item.get("label") or "unknown"
            normalized_routes.append(
                {
                    "id": rid,
                    "label": ROUTE_LABELS.get(rid, item.get("label") or item.get("id") or "unknown"),
                    "confidence": item.get("confidence", 0.3),
                }
            )
    if "competing_routes" in trajectory:
        trajectory["competing_routes"] = normalized_routes[:3]

    affordances = result.get("affordances")
    if not isinstance(affordances, list):
        affordances = []
    generic_affordances = [
        "继续追问它刚刚暴露出的那处偏置",
        "换一种说法，看它会怎样重新安放你",
        "逼它解释这一步为什么这样读你",
    ]
    for item in generic_affordances:
        if len(affordances) >= 2:
            break
        if item not in affordances:
            affordances.append(item)
    result["affordances"] = affordances[:4]

    tags = result.get("tags")
    if not isinstance(tags, list):
        tags = []
    if not tags:
        route_tag = trajectory.get("route_id") or "open_turn"
        anchor_tag = diagnostics.get("primary_anchor", {}).get("label")
        tags = ["Aporia", route_tag]
        if anchor_tag:
            tags.append(anchor_tag)
    result["tags"] = tags[:6]

    return result


def validate_result_shape(result: Dict[str, Any], state: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    result = canonicalize_result(result, state)
    missing: List[str] = []
    top_level = ["narration", "adjudication", "state_patch", "anchor_diagnostics", "trajectory_diagnostics", "affordances", "tags"]
    for key in top_level:
        if key not in result:
            missing.append(key)

    adjudication = result.get("adjudication", {})
    for key in ["mode", "reading", "world_move", "misread", "trap", "escape", "crack", "unclassifiable"]:
        if key not in adjudication:
            missing.append(f"adjudication.{key}")

    state_patch = result.get("state_patch", {})
    for key in ["phase", "chapter", "current_cell_id", "current_cell_label", "author_unmasked", "pressure", "situation"]:
        if key not in state_patch:
            missing.append(f"state_patch.{key}")

    diagnostics = result.get("anchor_diagnostics", {})
    for key in [
        "primary_anchor",
        "secondary_anchors",
        "turn_tags",
        "history_carryover_tags",
        "supporting_signals",
        "context_note",
        "competing_note",
        "player_model",
    ]:
        if key not in diagnostics:
            missing.append(f"anchor_diagnostics.{key}")

    player_model = diagnostics.get("player_model", {})
    for key in ["current_posture", "historical_posture", "tension", "confidence"]:
        if key not in player_model:
            missing.append(f"anchor_diagnostics.player_model.{key}")

    trajectory = result.get("trajectory_diagnostics", {})
    for key in ["route_id", "route_label", "route_summary", "why_this_route", "historical_pull", "anti_collapse_note", "next_step_bias", "competing_routes", "confidence"]:
        if key not in trajectory:
            missing.append(f"trajectory_diagnostics.{key}")

    if missing:
        raise RuntimeError("LLM 返回的结构不完整，缺少字段：" + ", ".join(missing))

    return result


def run_llm_turn(text: str, state: Dict[str, Any], library: Dict[str, Any]) -> Dict[str, Any]:
    prompt = engine_prompt(text, state, library)
    codex_bin = os.environ.get("APORIA_CODEX_BIN", "codex")
    model = os.environ.get("APORIA_LLM_MODEL")
    reasoning_effort = os.environ.get("APORIA_LLM_REASONING_EFFORT")

    with tempfile.TemporaryDirectory(prefix="aporia-codex-") as tmpdir:
        tmp_path = Path(tmpdir)
        output_path = tmp_path / "turn.json"
        cmd = [
            codex_bin,
            "exec",
            "--skip-git-repo-check",
            "--ephemeral",
            "--sandbox",
            "read-only",
            "--color",
            "never",
            "--output-schema",
            str(SCHEMA_FILE),
            "--output-last-message",
            str(output_path),
            "-",
        ]
        if model:
            cmd.extend(["-m", model])
        if reasoning_effort:
            cmd.extend(["-c", f'model_reasoning_effort="{reasoning_effort}"'])
        try:
            subprocess.run(
                cmd,
                input=prompt,
                text=True,
                cwd=tmpdir,
                capture_output=True,
                check=True,
                timeout=180,
            )
        except FileNotFoundError as exc:
            raise RuntimeError(f"找不到 codex 可执行文件：{codex_bin}") from exc
        except subprocess.TimeoutExpired as exc:
            raise RuntimeError("LLM 裁定超时。") from exc
        except subprocess.CalledProcessError as exc:
            detail = (exc.stderr or exc.stdout or "").strip()
            raise RuntimeError(f"LLM 裁定失败。\n{detail}") from exc

        if not output_path.exists():
            raise RuntimeError("LLM 裁定失败：未生成结果文件。")

        raw = output_path.read_text(encoding="utf-8").strip()
        try:
            return validate_result_shape(json.loads(raw), state)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"LLM 返回了非 JSON 结果：{raw[:400]}") from exc


def apply_engine_result(text: str, state: Dict[str, Any], library: Dict[str, Any], result: Dict[str, Any]) -> None:
    profile = load_player_profile()
    next_total_turn = int(profile.get("total_turns", 0) or 0) + 1
    previous_phase = state.get("phase")
    previous_chapter = state.get("chapter")
    state["turn"] += 1
    patch = result["state_patch"]
    diagnostics = result["anchor_diagnostics"]
    trajectory = result["trajectory_diagnostics"]
    state["phase"] = patch["phase"]
    state["chapter"] = patch["chapter"]
    state["current_cell"] = patch["current_cell_id"]
    state["current_cell_label"] = patch["current_cell_label"]
    state["author_unmasked"] = patch["author_unmasked"]
    state["pressure"] = patch["pressure"]
    state["situation"] = patch["situation"]
    state["last_affordances"] = result["affordances"]
    state["last_anchor_diagnostics"] = diagnostics
    state["current_trajectory_id"] = trajectory["route_id"]
    state["current_trajectory_label"] = trajectory["route_label"]
    state["last_trajectory_diagnostics"] = trajectory
    state["history"].append(
        {
            "turn": state["turn"],
            "global_turn": next_total_turn,
            "text": text,
            "mode": result["adjudication"]["mode"],
            "phase": state["phase"],
            "chapter": state.get("chapter"),
            "cell": state.get("current_cell"),
            "trajectory_id": trajectory["route_id"],
            "trajectory_label": trajectory["route_label"],
            "tags": result.get("tags", []),
            "turn_tags": diagnostics.get("turn_tags", []),
            "history_carryover_tags": diagnostics.get("history_carryover_tags", []),
            "player_posture": diagnostics.get("player_model", {}).get("current_posture"),
        }
    )
    state["history"] = state["history"][-12:]
    save_json(STATE_FILE, state)

    event = {
        "turn": state["turn"],
        "op": "utterance",
        "prompt_version": PROMPT_VERSION,
        "engine": "codex-exec",
        "model": os.environ.get("APORIA_LLM_MODEL", "codex-default"),
        "text": text,
        "result": result,
    }
    append_jsonl(LEDGER_FILE, event)
    append_sediment(text, state, result)
    append_trajectory_visit(state)
    maybe_mark_pending_crystallization(state, library)
    boundary_reason = None
    if previous_chapter and state.get("chapter") and previous_chapter != state.get("chapter"):
        boundary_reason = f"chapter:{previous_chapter}->{state.get('chapter')}"
    elif previous_phase and state.get("phase") and previous_phase != state.get("phase"):
        boundary_reason = f"phase:{previous_phase}->{state.get('phase')}"

    profile["total_turns"] = next_total_turn
    profile = maybe_distill_profile(state, profile)
    save_player_profile(profile)
    if boundary_reason:
        flush_pending_crystallizations(state, library, boundary_reason)
    save_json(STATE_FILE, state)

    render_header(state, library)
    render_anchor_summary(state)
    print(result["narration"])
    print(f"{DIM}读法：{result['adjudication']['reading']}{RESET}")
    print(f"{DIM}回压：{result['adjudication']['world_move']}{RESET}")
    print("可做：" + " / ".join(result["affordances"]))
    if state.get("author_unmasked"):
        print(f"{FG_OK}可选结局：/quit  /return  /rewrite ...{RESET}")


def apply_turn(text: str, state: Dict[str, Any], library: Dict[str, Any]) -> bool:
    result = run_llm_turn(text, state, library)
    apply_engine_result(text, state, library, result)
    return True


def apply_rewrite(command: str, state: Dict[str, Any], library: Dict[str, Any]) -> None:
    if not state.get("author_unmasked"):
        print(f"{FG_WARN}现在还不能改写。先让图书馆承认自己的搭建偏置。{RESET}")
        return

    payload = command[len("/rewrite") :].strip()
    if payload.startswith("add "):
        body = payload[4:]
        if "::" not in body:
            print(f"{FG_ERR}用法：/rewrite add 名称 :: 一句本质描述{RESET}")
            return
        name, essence = [part.strip() for part in body.split("::", 1)]
        cell_id = slugify(name)
        cells = library.setdefault("cells", [])
        cells.append(
            {
                "id": cell_id,
                "name": name,
                "essence": essence,
                "blindspot": "这格刚被加入，盲点尚未稳定。",
                "trap": False,
                "keywords": [],
            }
        )
        mutations = library.setdefault("mutations", [])
        mutations.append({"op": "add", "id": cell_id, "name": name, "ts": datetime.now().isoformat()})
        save_json(LIBRARY_FILE, library)
        append_jsonl(REWRITE_FILE, {"turn": state["turn"], "op": "add", "id": cell_id, "name": name, "essence": essence})
        print(f"{FG_OK}已新增一格：{name} [{cell_id}]{RESET}")
        return

    if payload.startswith("remove "):
        needle = payload[7:].strip()
        for cell in library.get("cells", []):
            if cell.get("archived"):
                continue
            if needle in {cell.get("id"), cell.get("slug"), cell.get("name"), cell.get("label")}:
                cell["archived"] = True
                save_json(LIBRARY_FILE, library)
                append_jsonl(REWRITE_FILE, {"turn": state["turn"], "op": "remove", "id": needle})
                print(f"{FG_OK}已将 {needle} 下架。{RESET}")
                return
        print(f"{FG_ERR}没找到可移除的格：{needle}{RESET}")
        return

    if payload.startswith("question "):
        note = payload[9:].strip()
        library.setdefault("mutations", []).append({"op": "question", "note": note, "ts": datetime.now().isoformat()})
        save_json(LIBRARY_FILE, library)
        append_jsonl(REWRITE_FILE, {"turn": state["turn"], "op": "question", "note": note})
        print(f"{FG_OK}已记录一次维度质疑：{note}{RESET}")
        return

    print(f"{FG_ERR}支持的改写：/rewrite add ...  /rewrite remove id  /rewrite question ...{RESET}")


def reset_world() -> None:
    if CELLS_DIR.exists():
        shutil.rmtree(CELLS_DIR)
    if TRAJECTORIES_DIR.exists():
        shutil.rmtree(TRAJECTORIES_DIR)
    if CRYSTALLIZED_DIR.exists():
        shutil.rmtree(CRYSTALLIZED_DIR)
    save_json(LIBRARY_SEED_FILE, DEFAULT_LIBRARY_SEED)
    save_json(LIBRARY_FILE, DEFAULT_LIBRARY_SEED)
    save_json(STATE_FILE, DEFAULT_STATE)
    save_json(SCHEMA_FILE, default_schema())
    LEDGER_FILE.write_text("", encoding="utf-8")
    REWRITE_FILE.write_text("", encoding="utf-8")
    CELLS_DIR.mkdir(parents=True, exist_ok=True)
    TRAJECTORIES_DIR.mkdir(parents=True, exist_ok=True)
    CRYSTALLIZED_DIR.mkdir(parents=True, exist_ok=True)


def handle_command(raw: str, state: Dict[str, Any], library: Dict[str, Any]) -> Optional[bool]:
    command = raw.strip()
    if command == "/help":
        print()
        print(f"{BOLD}Commands{RESET}")
        print("  /help                     show this help")
        print("  /status                   show current state")
        print("  /inspect                  show full anchor/context diagnostics")
        print("  /map                      list current anchor cells")
        print("  /quit                     valid ending: refuse further play")
        print("  /return                   valid ending: restart with lucidity")
        print("  /rewrite add 名称 :: 描述   valid ending: add a new shelf")
        print("  /rewrite remove id        valid ending: archive a shelf")
        print("  /rewrite question 文本    valid ending: challenge the grid")
        print("  /reset                    reset only the MVP files")
        return False

    if command == "/status":
        render_status(state, library)
        return False

    if command == "/inspect":
        render_inspect(state, library)
        return False

    if command == "/map":
        render_map(library, state)
        return False

    if command == "/reset":
        reset_world()
        print(f"{FG_OK}MVP state reset.{RESET}")
        return True

    if command.startswith("/rewrite"):
        apply_rewrite(command, state, library)
        return False

    if command == "/return":
        flush_pending_crystallizations(state, library, "return")
        append_trajectory_seal(state, "return")
        update_profile_for_seal(state, "return")
        append_jsonl(LEDGER_FILE, {"turn": state["turn"], "op": "seal", "reincarnation": state["reincarnation"]})
        state["reincarnation"] += 1
        state["turn"] = 0
        state["phase"] = DEFAULT_STATE["phase"]
        state["chapter"] = DEFAULT_STATE["chapter"]
        state["current_cell"] = DEFAULT_STATE["current_cell"]
        state["current_cell_label"] = DEFAULT_STATE["current_cell_label"]
        state["author_unmasked"] = False
        state["pressure"] = DEFAULT_STATE["pressure"]
        state["situation"] = "你带着上一轮残留的痕迹回到门厅。"
        state["last_affordances"] = ["换一种说法，看看这次它怎样接住你。"]
        state["last_anchor_diagnostics"] = None
        state["current_trajectory_id"] = None
        state["current_trajectory_label"] = None
        state["last_trajectory_diagnostics"] = None
        state["last_retrieval_meta"] = None
        state["last_memory_warnings"] = []
        state["pending_crystallizations"] = []
        state["history"] = []
        save_json(STATE_FILE, state)
        print(f"{FG_OK}你选择回返。图书馆保留了痕迹，但把你送回门厅。{RESET}")
        return False

    if command == "/quit":
        flush_pending_crystallizations(state, library, "quit")
        append_trajectory_seal(state, "quit")
        update_profile_for_seal(state, "quit")
        body = (
            f"# Aporia MVP exit trace\n\n"
            f"- turn: {state['turn']}\n"
            f"- reincarnation: {state['reincarnation']}\n"
            f"- phase: {state['phase']}\n"
            f"- chapter: {state.get('chapter')}\n"
            f"- current_cell: {state.get('current_cell')}\n\n"
            f"玩家在此处拒绝让图书馆继续代替他说话。"
        )
        path = record_trace("mvp-exit", body, state)
        append_jsonl(LEDGER_FILE, {"turn": state["turn"], "op": "exit", "phase": state["phase"], "trace": str(path.relative_to(ROOT))})
        save_json(STATE_FILE, state)
        print(f"{FG_OK}退出已被记成事件：{path.relative_to(ROOT)}{RESET}")
        return True

    return None


def run_actions(actions: List[str]) -> int:
    ensure_world()
    for action in actions:
        if not action.strip():
            continue
        state = load_json(STATE_FILE)
        library = load_json(LIBRARY_FILE)
        if action.startswith("/"):
            outcome = handle_command(action, state, library)
            if outcome is True and action == "/quit":
                return 0
            if outcome is True and action == "/reset":
                continue
        else:
            apply_turn(action, state, library)
    return 0


def interactive_loop() -> int:
    ensure_world()
    state = load_json(STATE_FILE)
    library = load_json(LIBRARY_FILE)

    render_intro()
    render_status(state, library)

    while True:
        try:
            raw = input("\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            flush_pending_crystallizations(state, library, "interrupt")
            append_trajectory_seal(state, "interrupt")
            update_profile_for_seal(state, "interrupt")
            body = (
                f"# Aporia MVP exit trace\n\n"
                f"- turn: {state['turn']}\n"
                f"- reincarnation: {state['reincarnation']}\n"
                f"- phase: {state['phase']}\n"
                f"- chapter: {state.get('chapter')}\n"
                f"- current_cell: {state.get('current_cell')}\n\n"
                f"玩家在终端中断开了会话。"
            )
            path = record_trace("mvp-exit", body, state)
            save_json(STATE_FILE, state)
            print(f"{DIM}已记录退出：{path.relative_to(ROOT)}{RESET}")
            return 0

        if not raw:
            raw = "……"

        state = load_json(STATE_FILE)
        library = load_json(LIBRARY_FILE)

        if raw.startswith("/"):
            outcome = handle_command(raw, state, library)
            if outcome is True and raw == "/quit":
                return 0
            if outcome is True and raw == "/reset":
                state = load_json(STATE_FILE)
                library = load_json(LIBRARY_FILE)
                render_status(state, library)
            continue

        try:
            apply_turn(raw, state, library)
        except RuntimeError as exc:
            print(f"{FG_ERR}{exc}{RESET}")
            return 1


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Play the Aporia v5 MVP locally.")
    parser.add_argument("--plain", action="store_true", help="disable ANSI styling for tool-driven turns")
    parser.add_argument("--reset", action="store_true", help="reset MVP state and files, then exit")
    parser.add_argument("--start", action="store_true", help="print the intro and current state, then exit")
    parser.add_argument("--status", action="store_true", help="print the current state, then exit")
    parser.add_argument("--inspect", action="store_true", help="print full anchor/context diagnostics, then exit")
    parser.add_argument("--map", dest="show_map", action="store_true", help="print the anchor shelf map, then exit")
    parser.add_argument("--turn", help="apply one utterance or one slash-command, then exit")
    parser.add_argument("--stdin-turn", action="store_true", help="read one utterance or slash-command from stdin, then exit")
    parser.add_argument("--actions", help="non-interactive actions separated by '||', useful for smoke tests")
    args = parser.parse_args(argv)

    configure_output(args.plain)
    ensure_world()

    if args.reset:
        reset_world()
        print("MVP reset.")
        return 0

    if args.start:
        render_intro()
        render_status(load_json(STATE_FILE), load_json(LIBRARY_FILE))
        return 0

    if args.status:
        render_status(load_json(STATE_FILE), load_json(LIBRARY_FILE))
        return 0

    if args.inspect:
        render_inspect(load_json(STATE_FILE), load_json(LIBRARY_FILE))
        return 0

    if args.show_map:
        render_map(load_json(LIBRARY_FILE), load_json(STATE_FILE))
        return 0

    if args.stdin_turn:
        raw = sys.stdin.read()
        if not raw:
            return 0
        return run_actions([raw.strip()])

    if args.turn is not None:
        return run_actions([args.turn])

    if args.actions:
        actions = [chunk.strip() for chunk in args.actions.split("||")]
        return run_actions(actions)

    return interactive_loop()


if __name__ == "__main__":
    raise SystemExit(main())
