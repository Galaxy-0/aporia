# Honcho / hermes 记忆模块侦察

研究日期：2026-04-17
研究者：Claude (Opus 4.7, 1M)
目标：评估 Honcho (plastic-labs/honcho) 和 hermes-agent (NousResearch/hermes-agent) 的记忆相关模块，判断是否值得集成进 Aporia。

所有结论基于公开 README / 官方文档 / GitHub 源码，未 clone。

---

## TL;DR

1. **不要用 Honcho。** AGPL-3.0 和 Aporia 的 Apache-2.0 直接冲突；且必须跑 `api + deriver + postgres(pgvector) + redis` 四件套 self-hosted，或依赖 `demo.honcho.dev` / `app.honcho.dev` 云服务——两条路都是大红旗。
2. **hermes 的 skill-emergence 思路可以抄。** 它的核心是 `~/.hermes/skills/<name>/SKILL.md`（YAML frontmatter + Markdown body + 可选 `scripts/`），由 agent 自己写入。这个 pattern 和 Aporia 的 cell essence / L4 改写天然对齐，**不需要引入 hermes 本身任何一行代码**。
3. **推荐路径：方案 C**——不引入任何外部依赖；在 `play_v5_mvp.py` 里新增一个 ~60 行的 `player_profile.py` 模块，用第二次 `codex exec` 调用按 Aporia 自己的 schema 蒸馏 `player_model`；cell essence 的"结晶"直接写到 `world/mvp/library.json` 的现有结构里。这条路和 V5 MANIFESTO 的哲学（系统必须承认自己的搭建偏置）完全自洽。

---

## Honcho 详细报告

### 1. 是什么 / 一句话定位

> **Honcho 是一个有状态 agent 的"记忆服务"——你把对话消息塞进去，它在后台 deriver 进程里用 LLM 持续推导一份关于每个 peer 的"理论心智"（theory of mind）/ representation，然后你可以用自然语言查询。**

它解决的是："我要跨 session 追踪用户是谁、他相信什么、他做什么"。
来源：[README](https://github.com/plastic-labs/honcho)、[pyproject.toml](https://raw.githubusercontent.com/plastic-labs/honcho/main/pyproject.toml)（`description = "Honcho Server"`）。

### 2. 库、服务、还是服务+库？

**是"服务 + 瘦客户端 SDK"。** 不能 `uv add honcho` 当纯库用。

- Python 包：`honcho-ai`（SDK），只是 HTTP 客户端。
- 真正的逻辑都在 server 里：`src.deriver` 进程 + FastAPI API + Postgres(pgvector) + Redis。
- 你有两个选择：
  - (a) 用托管服务 `app.honcho.dev`（需 API key） / `demo.honcho.dev`（无 key 但是 demo 环境）——**这意味着玩家的对话被发到 plastic-labs 的服务器**。
  - (b) 自己 self-host——必须 `docker compose up` 跑 **4 个服务**。

来源：[docker-compose.yml.example](https://raw.githubusercontent.com/plastic-labs/honcho/main/docker-compose.yml.example) 里明确定义了 `api / deriver / database(pgvector/pgvector:pg15) / redis` 四个 service。

> 这是第一个**大红旗**。Aporia 是一个单文件 Python CLI，跑一个 `codex exec` 子进程就够了。引入 Honcho 意味着：要么部署 4-service docker stack，要么把玩家数据外包给第三方。

### 3. API 形状（真实代码示例）

**quickstart（托管模式）** ——来源：[docs.honcho.dev/v2/documentation/introduction/quickstart](https://docs.honcho.dev/v2/documentation/introduction/quickstart)

```python
from honcho import Honcho

honcho = Honcho()  # 默认连 demo.honcho.dev，无 API key

alice = honcho.peer("alice")
bob = honcho.peer("bob")
session = honcho.session("session_1")
session.add_peers([alice, bob])

session.add_messages([
    alice.message("Hi Bob, how are you?"),
    bob.message("I'm going to the gym! I've been trying to get back in shape."),
])

response = bob.chat("Tell me about Bob's interests and habits")
print(response)
# -> "Bob is health-conscious and has been working on getting back in shape.
#     He regularly goes to the gym, particularly in the evenings, and finds
#     exercise helps him relax."
```

**关键 API 签名** ——来源：[sdks/python/src/honcho/peer.py](https://raw.githubusercontent.com/plastic-labs/honcho/main/sdks/python/src/honcho/peer.py)

```python
def chat(
    self,
    query: str,
    *,
    target: str | PeerBase | None = None,
    session: str | SessionBase | None = None,
    reasoning_level: Literal["minimal", "low", "medium", "high", "max"] | None = None,
) -> str | None: ...

def representation(
    self,
    session: str | SessionBase | None = None,
    target: str | PeerBase | None = None,
    search_query: str | None = None,
    search_top_k: int | None = None,
    search_max_distance: float | None = None,
    include_most_frequent: bool | None = None,
    max_conclusions: int | None = None,
) -> str: ...
```

**注意返回类型：都是 `str`**，不是结构化 dict / pydantic。

### 4. "辩证用户建模"是怎么实现的？

宣传层面：Honcho 的 tagline 是 "Theory of Mind for AI agents"。
实际机制（我从代码和 docs 能确认的部分）：

- 消息写入 session 后，**deriver 后台进程**拉队列，对每条新消息调 LLM（OpenAI / Anthropic / Gemini 之一，Honcho 配了多家 adapter）推导"结论 conclusions"。
- 结论用 pgvector 存成 embeddings。
- 调 `peer.chat(query)` 时：做向量召回 + LLM 推理，返回一段**散文字符串**。

**它不是给你一个结构化的姿态/张力分解。** 它给你的是"让另一个 LLM 回答你关于 user 的问题"这个能力。等价于：你自己维护一个消息 log，每次要用户画像时喂给 LLM 出一段话——Honcho 帮你管理了 log + embeddings + 后台蒸馏。

### 5. 和 Aporia `player_model` 结构的对齐程度

Aporia 要的：
```json
{
  "current_posture": "string",
  "historical_posture": "string",
  "tension": "string",
  "confidence": 0-1
}
```

Honcho 给的：一个 `str`（或 `None`）。

**对得上吗？不直接对得上。**

唯一能让 Honcho 产出这个结构的方法是：
1. 用 `bob.chat("以 JSON 输出 {current_posture, historical_posture, tension, confidence}，player 的当前姿态和历史姿态")`
2. 祈祷 LLM 听话
3. 自己 `json.loads()` + fallback

但这一步本身就是"再开一次 LLM"。**既然都要再开一次 LLM，为什么不直接用 Aporia 已有的 `codex exec` 做？** Honcho 在这个链路里只剩"帮你存消息 + 做 embeddings 召回"的价值，而这两件事对 Aporia 的规模（单玩家，每局 ~50 回合）是 overkill。

### 6. 依赖 / 许可证 / 成熟度

来源：[GitHub API repo metadata](https://github.com/plastic-labs/honcho) (2026-04-21)

| 维度 | 值 | 备注 |
|---|---|---|
| License | **AGPL-3.0** | **红旗 #2**：和 Aporia Apache-2.0 冲突 |
| Python | `>=3.10` | OK |
| Stars | 2,696 | 小众活跃 |
| Forks | 311 | |
| 最近 push | 2026-04-21（研究时此刻） | 非常活跃 |
| 主要依赖 | fastapi, sqlalchemy, pgvector, psycopg, openai, google-genai, redis, cashews, lancedb, turbopuffer, tiktoken, langfuse, sentry-sdk | **30+ 个生产依赖**，远大于 Aporia 整体体量 |
| 运行时 | `api + deriver + postgres(pgvector:pg15) + redis` | 4 service |
| 生产用例 | 主要是 plastic-labs 自己的产品 Bloom / Tutor-GPT；README 未列独立第三方生产案例 | |

**License 分析：**
- Aporia 想走 Apache-2.0（宽松开源）。
- Honcho 是 **AGPL-3.0**。如果 Aporia 把 Honcho SDK 作为 Python 依赖 import，而 Honcho SDK 本身在 AGPL 仓库里（`sdks/python/src/honcho/`），那 SDK 是否感染？AGPL 对"通过网络提供服务"有额外传染条款。**最保守的结论**：为了不给 Aporia 埋法律不确定性，避开。
- 来源：[Honcho repo license field = AGPL-3.0](https://github.com/plastic-labs/honcho/blob/main/LICENSE)。

---

## hermes skill-emergence 模式

### 7. 独立可学性

**是的，完全可以不引入 hermes 本身。** 这个模式极其轻量，本质是"agent 自己写 markdown 文件"。

**核心发现**（来源：[tools/skill_manager_tool.py](https://raw.githubusercontent.com/NousResearch/hermes-agent/main/tools/skill_manager_tool.py) 文件头注释，commit on main branch 2026-04-21）：

```
Skill Manager Tool -- Agent-Managed Skill Creation & Editing

Allows the agent to create, update, and delete skills, turning successful
approaches into reusable procedural knowledge. New skills are created in
~/.hermes/skills/.

Skills are the agent's procedural memory: they capture *how to do a specific
type of task* based on proven experience.

Directory layout for user skills:
    ~/.hermes/skills/
    ├── my-skill/
    │   ├── SKILL.md
    │   ├── references/
    │   ├── templates/
    │   ├── scripts/
    │   └── assets/
```

**SKILL.md 的格式**（来源：[optional-skills/productivity/memento-flashcards/SKILL.md](https://raw.githubusercontent.com/NousResearch/hermes-agent/main/optional-skills/productivity/memento-flashcards/SKILL.md)）：

```markdown
---
name: memento-flashcards
description: >-
  Spaced-repetition flashcard system. ...
version: 1.0.0
author: Memento AI
license: MIT
platforms: [macos, linux]
metadata:
  hermes:
    tags: [Education, Flashcards, Spaced Repetition, ...]
    requires_toolsets: [terminal]
    category: productivity
---

# Memento Flashcards — Spaced-Repetition Flashcard Skill

## Overview
...

## When to Use
...

## Quick Reference
| User intent | Action |
|---|---|
...
```

**整个模式的"哲学"——可以搬进 Aporia**：

1. Skill = **YAML frontmatter + markdown body**。可读、可 diff、可 git，人也能改、agent 也能改。
2. "Emergence" 不是什么神秘机制——就是让 LLM 在某些触发条件（"complex task done"）下，**把轨迹凝练成一个新 SKILL.md**，写到 `~/.hermes/skills/<slug>/SKILL.md`。
3. 之后这个 skill 就是 agent 的"程序性记忆"，下次遇到类似任务时被召回。

**Aporia 可以直接挪用的映射**：
- Aporia 的 cell essence 已经是 `id + name + essence + blindspot + trap + keywords`（见 `library.json`）——这已经是一个"skill-like"的小卡片。
- Aporia 的 L4 "rewrite add/remove/question" 已经在写 `library.json`——这就是 agent 级别的 emergence 写入。
- 缺的只是：一个**由 LLM 在关键 turn 触发的"结晶"循环**——例如连续 3 回合命中同一 trap cell 且 player_model.tension 持续升高时，让 LLM 生成一份新 cell essence 候选，写进 `world/mvp/library.json` 或 `world/crystallized/<slug>.md`。

**hermes 代码本身能不能用？** 可以看 [agent/skill_commands.py](https://raw.githubusercontent.com/NousResearch/hermes-agent/main/agent/skill_commands.py) 和 [agent/skill_utils.py](https://raw.githubusercontent.com/NousResearch/hermes-agent/main/agent/skill_utils.py) 的 YAML frontmatter 解析 + template 变量 `${HERMES_SKILL_DIR}` / `${HERMES_SESSION_ID}` 替换 + 内联 shell 执行 `!`cmd`` 的 pattern——**但那些都是 10-30 行的小工具函数**，直接看了抄过来就行，不值得引入 hermes 作为依赖（hermes 是个巨型 agent 框架，MIT 许可友好但 106k 星的复杂度不适合 Aporia 的规模）。

---

## 集成 Aporia 的 3 种方案

### 方案 A ── 完全用 Honcho 托管 player_model

思路：每回合把 utterance + adjudication.reading 作为消息写进 Honcho session；`engine_prompt()` 之前调 `player.chat("以 JSON 返回 current_posture / historical_posture / tension / confidence")` 拿到 player_model，放进 prompt。

| 维度 | 值 |
|---|---|
| 工作量 | 2-3 天（含 docker-compose self-host + SDK 调试 + JSON 解析 fallback） |
| 新增依赖 | `honcho-ai` (SDK) + self-hosted stack：docker, postgres, redis, pgvector |
| 新增代码量 | ~150 行 Python + docker-compose.yml + 环境变量/配置 |
| 风险 | **AGPL-3.0 许可感染**；4-service 部署直接把 Aporia 从"单文件脚本"变成"需要运维的系统"；player 对话数据如果用托管模式会出域；Honcho 返回字符串需要再解析一层；Honcho 的 derivation 是异步的，player_model 可能滞后数秒 |
| 推荐情况 | **不推荐**。License 和部署成本都是 deal-breaker |

### 方案 B ── 只用 Honcho 的某个子能力

可选子能力分析：

- **"消息持久化"** ——Aporia 已经有 `ledger.jsonl`，不需要。
- **"向量召回 256 cell 里最相关的"** ——Aporia 还没做，但 256 个 cell 用 LLM 直接全量注入 prompt 就够了（已经这样做）；将来要做也可以用 `sentence-transformers` + `numpy` 一个 20 行脚本，不需要 pgvector+postgres+redis+deriver 四件套。
- **"dialectic user modeling"** ——这就是方案 A 的核心；见上。

| 维度 | 值 |
|---|---|
| 工作量 | 1-2 天 |
| 新增依赖 | 依然要 Honcho server（子能力也跑在 server 里） |
| 新增代码量 | ~80 行 |
| 风险 | 同 A：AGPL、部署、数据外流。为了用 Honcho 的一小部分付出整个 server 成本，**性价比倒挂** |
| 推荐情况 | **不推荐**。如果真的只要向量召回，用 `chromadb` 或 `lancedb` 本地文件库反而更轻 |

### 方案 C ── 放弃 Honcho，抄思路自己实现（推荐）

思路：
1. **player_model 蒸馏**：在 `play_v5_mvp.py` 里新增一个 `distill_player_profile()` 函数，**每 N 回合**（比如 N=5）调用一次 `codex exec`，输入 `state["history"][-12:]` 中的 `turn_tags / player_posture / trajectory_id`，输出固定 schema 的 `{current_posture, historical_posture, tension, confidence}`，写入 `world/mvp/player_profile.json`。
2. **cell essence 结晶**（抄 hermes 思路）：当某个 cell 被连续命中 M 次且 `tension` 持续高位，让 LLM 生成一份新 cell 的 YAML-frontmatter markdown，写到 `world/mvp/crystallized/<slug>.md`，同时在 `library.json.mutations` 里记录一条 `{op: "crystallize", source_cells: [...], ts: ...}`。这一步和现有 `/rewrite add` 在语义上是同构的，只是触发方从玩家变成了 LLM 自己。
3. **跨局持久化**：`player_profile.json` 不在 `/return` 时重置（只重置 `state.json`），让它成为真正的 L2 记忆。

| 维度 | 值 |
|---|---|
| 工作量 | **4-6 小时** |
| 新增依赖 | **零**（所有现有依赖已满足：`codex exec` + `json` 标准库 + `pathlib`） |
| 新增代码量 | ~60-80 行 Python，加到 `play_v5_mvp.py` 或拆到 `tools/player_profile.py` |
| 风险 | LLM 蒸馏结果质量取决于 prompt 工程；需要设计好触发频率避免每回合都多一次 codex 调用增加延迟 |
| 推荐情况 | **强烈推荐**。和 V5 MANIFESTO 的"系统必须承认自己的搭建偏置"哲学自洽——我们自己写的 player_model 蒸馏可以被玩家看见、被质疑、被 `/rewrite question` |

---

## 具体代码草案（仅写在本研究文档里，不进项目）

如果走方案 C，在 `play_v5_mvp.py` 里的嵌入点是 `engine_prompt()` **之前**（把 profile 注入到 `compact_state` 里让本轮裁定 LLM 看见），以及 `apply_engine_result()` **之后**（吸收本轮的新诊断去更新 profile）。

```python
# 假想位置：play_v5_mvp.py 里 engine_prompt() 之前
PROFILE_FILE = MVP_DIR / "player_profile.json"
PROFILE_REFRESH_EVERY = 5  # 每 5 回合刷新一次，避免每回合多一次 LLM 调用

def load_player_profile() -> Dict[str, Any]:
    if not PROFILE_FILE.exists():
        return {"current_posture": "", "historical_posture": "",
                "tension": "", "confidence": 0.0, "last_refreshed_turn": 0}
    return json.loads(PROFILE_FILE.read_text(encoding="utf-8"))

def maybe_distill_profile(state: Dict[str, Any]) -> Dict[str, Any]:
    profile = load_player_profile()
    turn = state.get("turn", 0)
    if turn - profile.get("last_refreshed_turn", 0) < PROFILE_REFRESH_EVERY:
        return profile  # 用缓存，不触发 LLM
    # 蒸馏 prompt：只吃 history 里的诊断字段，不吃原文，降低漂移
    history_digest = [
        {"turn": h["turn"], "posture": h.get("player_posture"),
         "route": h.get("trajectory_id"), "tags": h.get("turn_tags", [])}
        for h in state.get("history", [])[-12:]
    ]
    prompt = (
        "根据以下 Aporia 玩家近 12 回合的诊断摘要，产出 JSON："
        '{"current_posture":str,"historical_posture":str,"tension":str,"confidence":0-1}. '
        "current_posture 是本局近几轮的稳定姿态；historical_posture 是本局更早或此前转世残留的位置；"
        "tension 是两者的张力。严格 JSON，不要任何其他文字。\n\n"
        f"DIGEST:\n{json.dumps(history_digest, ensure_ascii=False, indent=2)}"
    )
    # 复用现有的 codex exec 壳子（run_llm_turn 的简化版，不带 schema 文件）
    # ...调用 codex, 解析 JSON, 带 try/except fallback 到旧 profile
    new_profile = _call_codex_for_profile(prompt)
    new_profile["last_refreshed_turn"] = turn
    save_json(PROFILE_FILE, new_profile)
    return new_profile

# 在 engine_prompt() 里把 profile 注入 compact_state：
# compact_state["player_profile_l2"] = maybe_distill_profile(state)
# 并告诉裁定 LLM："player_profile_l2 是跨回合蒸馏的玩家画像，本轮 anchor_diagnostics.player_model 可以参考它判断 historical_posture，但不要盲目照抄"
```

这段代码示意性地把 **L2（跨回合但本局内的画像）** 独立于每回合的 L0 adjudication，同时喂回给下一回合做 context——正是 V5 MANIFESTO 里"世界也在读你"的机制化落地。

cell essence 结晶的代码更简单：在 `apply_engine_result()` 尾部加一段"如果 current_cell 连续命中 ≥ M 次且本轮 crack=true，生成一份 crystallized markdown"；篇幅所限此处省略，结构同理。

---

## 风险清单

1. **Honcho AGPL-3.0 vs Aporia Apache-2.0（致命）**
   把 `honcho-ai` Python SDK 作为依赖 import 时，AGPL 的传染性不清晰（AGPL 对"network use"的额外条款和传统 GPL 不同）。在没律师 review 之前，把 AGPL 库作为依赖进 Apache-2.0 项目就是给未来埋雷。

2. **Honcho self-host 把 Aporia 的部署故事毁掉**
   Aporia 现在是"`uv run play_v5_mvp.py`"一行启动。装 Honcho 变成"docker compose up 四个服务 + 配置 postgres 密码 + 选一个 LLM provider key"。这和 Aporia 的"终端哲学游戏"定位严重错配——**玩家为了玩一个 ASCII 游戏不应该运维一个 data stack**。

3. **依赖 demo.honcho.dev 的数据主权问题**
   如果走托管模式，玩家的每一句哲学表达会被发到 plastic-labs 的服务器、存到他们 postgres、被 LLM 推导结论。对一个以"意识形态批判"为主题的游戏来说，**把对话外包给第三方的政治讽刺本身就是 bug**。

4. **Honcho 的 chat() 返回自由文本，仍要二次 LLM 解析**
   `peer.chat()` 返回 `str | None`。要拿到 Aporia schema 的 `{posture, tension, confidence}` 必须再开一次 LLM 做 JSON 结构化——那一步用自己的 codex exec 做，等价但不需要 Honcho。

5. **方案 C 自己实现的质量风险**
   如果 prompt 工程做得差，`distill_player_profile()` 会产出漂移的 / 幻觉的 / 本质化玩家的结果——这正好违反 V5 MANIFESTO 第 7.9 节（"Do not essentialize the player into a fixed identity"）。缓解：profile 要显示给玩家看（已有 `/inspect` 命令），并允许 `/rewrite question` 对 profile 本身质疑。

6. **hermes skill-emergence 如果照搬可能过度工程**
   hermes 里的 `skill_manager_tool.py` 带了安全扫描、模板变量替换、内联 shell 执行——这些对 Aporia 完全不需要。抄思路时只抄"YAML frontmatter + markdown body + agent 自己写"这一句话，不要把 hermes 的复杂性也抄过来。

---

## 我的最终建议

**走方案 C。完全不要引入 Honcho。** 

理由三条按重要性排序：

1. **许可证冲突是硬伤**。Honcho 是 AGPL-3.0，Aporia 目标是 Apache-2.0——这不是 nice-to-have，是合规问题。即使将来允许，也没必要在一个 MVP 阶段就背这个复杂度。

2. **Honcho 解决的问题对 Aporia 是 overkill**。Aporia 是一个单玩家、单局 ~50 回合的终端游戏。它需要的 L2 跨局记忆是一份 JSON 文件加一个每 5 回合跑一次的 LLM 调用——而不是 postgres + pgvector + redis + deriver queue + fastapi。杀鸡用牛刀的代价是：Aporia 从此变成一个"要运维的系统"而不是"一个能在 terminal 里跑的哲学实验"。

3. **hermes 的 skill-emergence 思路恰好完美对齐 Aporia 已有的 L4 rewrite 机制**。cell essence + `library.json.mutations` 已经在做 hermes 做的事情，只是触发方还是玩家。让 LLM 也能在满足条件时写 `world/mvp/crystallized/<slug>.md`，就是 skill-emergence 在 Aporia 语境里的本地化——**0 新依赖，~80 行代码，哲学上自洽**。

方案 C 的实施顺序：
1. 先加 `player_profile.json` 和 `maybe_distill_profile()`（~40 行，4 小时）。
2. 跑 10 局验证蒸馏结果质量、调 prompt。
3. 再加 cell essence 结晶（~40 行，另外 2 小时）。
4. 在 `/inspect` 里显示 profile + crystallized cell 数量，让结构裂缝显影——这是 V5 要的"玩家看见世界在读他"的落地。

如果三个月后 Aporia 做到了多人、跨局、公开沉积（见 MANIFESTO 第 13 节开放问题 #2），再重新评估是否引入像 Honcho 这样的 memory service——那时候 4-service stack 才有合理性。**现在不是那个时候。**

---

## 来源索引

- Honcho 仓库元数据：`gh api repos/plastic-labs/honcho`（2026-04-21, 2696★, AGPL-3.0, push 2026-04-21）
- Honcho docker-compose：https://raw.githubusercontent.com/plastic-labs/honcho/main/docker-compose.yml.example
- Honcho pyproject：https://raw.githubusercontent.com/plastic-labs/honcho/main/pyproject.toml
- Honcho Peer SDK：https://raw.githubusercontent.com/plastic-labs/honcho/main/sdks/python/src/honcho/peer.py
- Honcho quickstart：https://docs.honcho.dev/v2/documentation/introduction/quickstart
- hermes-agent 元数据：`gh api repos/NousResearch/hermes-agent`（2026-04-21, 106.9k★, MIT, push 2026-04-21）
- hermes skill_manager_tool.py：https://raw.githubusercontent.com/NousResearch/hermes-agent/main/tools/skill_manager_tool.py
- hermes skill_commands.py：https://raw.githubusercontent.com/NousResearch/hermes-agent/main/agent/skill_commands.py
- hermes skill_utils.py：https://raw.githubusercontent.com/NousResearch/hermes-agent/main/agent/skill_utils.py
- hermes 样本 SKILL.md：https://raw.githubusercontent.com/NousResearch/hermes-agent/main/optional-skills/productivity/memento-flashcards/SKILL.md

Web 查询总计：5 次 WebFetch + 0 次 WebSearch（配额预算 10 内）。
