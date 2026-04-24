# Aporia MVP 记忆架构（draft）

> 目标：把 `MANIFESTO v5` 里的“历史性”从概念层落到 `world/mvp/` 的文件系统上，且不破坏当前 `LLM-as-core` 的回合裁定主路径。

---

## 0. 这份文档解决什么

当前 `tools/play_v5_mvp.py` 已经有三样东西：

- 单回合裁定
- 当前局状态 `state.json`
- 账本 `ledger.jsonl`

它还没有真正拥有：

- 每个格自己的局部历史
- 跨局玩家画像
- 一局一局的坐标轨迹
- 由沉积涌现出来的“活的 essence”
- 一个按“当前相关历史”检索而非全量 dump 的 prompt 注入层

这份文档的目标不是换引擎，而是补一层**历史文件系统**，让 Aporia 从“会判一回合”变成“会带着历史读你”。

---

## 1. 设计目标

### 1.1 哲学目标

和 `docs/drafts/MANIFESTO-v5.md:196` 的 §8 Historicality 对齐：

- `sediment` = 玩家的原话历史
- `essence crystallization` = 由历史涌现出的当前格核心
- `trajectory` = 一局中的坐标运动
- `player_profile` = 跨局、但仍可被推翻的玩家画像

Aporia 不该把世界做成“预先存在的 256 格百科全书”，而应做成：

> 你在读世界，世界也在通过历史文件重新读你。

### 1.2 工程目标

- 完全加法，不重写当前 MVP 主路径
- 任何记忆层失败都不能打断单回合游玩
- 文件系统即数据库；不引入外部服务
- 派生层可删可重建，原始史料 append-only
- 先支持当前 MVP 的少量锚点库，再平滑过渡到未来 256 格

---

## 2. 四个不变量

后续任何实现都不应违反这四条。

### 2.1 原始史料与派生层分离

以下文件是**原始史料**，必须 append-only：

- `world/mvp/ledger.jsonl`
- `world/mvp/cells/X-X-X-X/sediment.jsonl`
- `world/mvp/trajectories/run-N.jsonl`

以下文件是**派生层**，可以删掉后重建：

- `world/mvp/player_profile.json`
- `world/mvp/crystallized/X-X-X-X.md`

### 2.2 Distill 失败不打断主回合

无论 profile 蒸馏、cell 蒸馏、retrieval overlay 出了什么问题：

- 本回合裁定照常完成
- 最多记录 warning 或跳过这次蒸馏
- 绝不因为派生层失败让游戏退出

### 2.3 玩家画像是暂定读法，不是真相

`player_profile.json` 不是“玩家身份鉴定书”，而是：

- 当前历史条件下的一份临时读法
- 必须允许被下一局推翻
- 必须允许被 `/inspect` 暴露
- 必须允许被未来机制质疑或改写

### 2.4 Crystallized essence 是 overlay，不是替代 base cell

任何 `crystallized/X-X-X-X.md` 都只能覆盖：

- 当前这个格最近历史里涌现出的局部读法

它不能取代 `library.json` 中这个格的基础定义。运行时应采用：

> `base cell` + `crystallized overlay`

而不是“只看结晶文本”。

---

## 3. 新增文件与目录

## 3.1 `world/mvp/player_profile.json`

用途：跨局玩家画像。它不在 `/return` 时被清空。

建议结构：

```json
{
  "schema_version": 1,
  "player_id": "local",
  "total_turns": 47,
  "total_reincarnations": 3,
  "portrait_confidence": 0.72,
  "generated_from_turns": [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47],
  "provisional": true,
  "current_portrait": {
    "posture": "从朴素实在漂向怀疑，偏好声明式断言",
    "signature_words": ["应该", "真的", "本来"],
    "dialectical_tensions": ["自我肯定 vs 对分类的抵抗"],
    "last_updated_turn": 47
  },
  "trajectory_summary": [
    {"run": 0, "arc": "朴素实在 -> 犬儒 -> 退出"},
    {"run": 1, "arc": "犬儒回归 -> 裂缝档案"}
  ]
}
```

### 设计要求

- `provisional` 默认应为 `true`
- `generated_from_turns` 必须保留，避免 profile 像从天而降
- `total_turns` / `total_reincarnations` 来自原始历史累加，不应只靠蒸馏结果回填

---

## 3.2 `world/mvp/crystallized/X-X-X-X.md`

用途：存放某个格由历史沉积蒸馏出的“活的 essence”。

建议格式：Markdown + frontmatter。

```md
---
schema_version: 1
cell_id: 2-2-2-2
visit_count: 12
last_distilled_turn: 47
source_sample_size: 8
generated_from_turns: [12, 23, 24, 30, 31, 34, 42, 47]
confidence: 0.74
---

## Current essence
每次这个格被造访，玩家倾向说“应该是 X 而不是 Y”。
它倾向把历史压缩成本质。

## Signature utterances (recent)
- "这里本来就应该 ..."（turn 12）
- "真正的 X 就是 ..."（turn 23）

## Escape moves observed
turn 34 曾用“它也可能不是本来的”短暂逃脱。
```

### 设计要求

- 保留 `generated_from_turns` 与 `source_sample_size`
- body 只写“当前涌现出的局部 essence”，不要重写整个 cell 定义
- 这是 overlay，不是 canonical source

---

## 3.3 `world/mvp/cells/X-X-X-X/sediment.jsonl`

用途：每个格的原话沉积。append-only。

每行建议结构：

```json
{
  "turn": 47,
  "reincarnation": 3,
  "cell_id": "2-2-2-2",
  "text": "真正的东西本来就应该如此。",
  "phase": "crack",
  "trajectory_id": "genealogical_critique",
  "turn_tags": ["本质化", "回归原样"],
  "player_posture": "用单一本质压缩复杂历史",
  "ts": "2026-04-22T13:40:00+08:00"
}
```

### 设计要求

- 只存原话与轻量诊断字段
- 不要把整段 LLM 裁定 JSON 再复制一遍
- 真正的完整回合仍以 `ledger.jsonl` 为准

---

## 3.4 `world/mvp/trajectories/run-N.jsonl`

用途：一局的运动轨迹。独立于 `ledger`，只关心轨迹本身。

每行建议结构：

```json
{"op": "visit", "run": 3, "turn": 45, "cell_id": "1-2-1-3", "route_id": "material_critique", "phase": "crack"}
{"op": "visit", "run": 3, "turn": 46, "cell_id": "3-4-2-1", "route_id": "genealogical_critique", "phase": "crack"}
{"op": "seal", "run": 3, "turn": 47, "ending": "return"}
```

### 设计要求

- `visit` 与 `seal` 都要记录
- 至少保留 `cell_id`、`route_id`、`phase`
- 后续 trajectory distill / pattern naming 会直接吃这个文件

---

## 3.5 `trajectory_id` / `route_id` 的来源

这两个字段不是另起一套新系统生成的，而是**直接来自每回合裁定结果里的**：

- `trajectory_diagnostics.route_id`
- `trajectory_diagnostics.route_label`

也就是说：

- `sediment.jsonl` 里的 `trajectory_id`
- `trajectories/run-N.jsonl` 里的 `route_id`

都应当复用当前 turn adjudication 已产出的 route 结果，而不是再蒸馏一次。

### 当前规则

- `route_id` 来自一组**预定义、受 schema 约束**的有限集合
- 当前集合与 `tools/play_v5_mvp.py` 的 prompt / schema 保持一致：
  - `genealogical_critique`
  - `material_critique`
  - `ethical_refusal`
  - `practical_rewrite`
  - `tragic_aporia`
- `trajectory_summary` 这类更长的 run-level 叙述可以由后续 distill 涌现出来
- 但原始轨迹层里的 `route_id` 仍应保持离散、稳定、可比较

### 设计要求

- 不要让实装层自己“猜一个 route id”
- 不要把 run-level 弧线命名和 turn-level `route_id` 混为一谈
- 未来若新增 route family，必须同步升级：
  - adjudication prompt
  - output schema
  - route label 映射
  - retrieval 的 `route_default_cells(...)`

---

## 4. 写入时机与触发器

## 4.1 每 turn 后：快速写入

在 `apply_engine_result()` 成功落盘后，立即做两件事：

1. `sediment append`
2. `trajectory append`

这是最小历史层。它们必须是轻量、稳定、无 LLM 依赖的写入。

### 原则

- 本回合一旦裁定成功，这两步就应该完成
- 失败时只告警，不回滚主回合

---

## 4.2 每 5 turn：profile 蒸馏

建议默认：

- 触发条件：`turn >= 15 and turn % 5 == 0`
- 最小样本条件：`history_len >= 12`
- 输入：最近 12 回合的诊断摘要，不必吃全量原文
- 输出：更新 `player_profile.json`

### 为什么不是每回合蒸馏

- 延迟过高
- 画像会过于抖动
- 小样本容易把玩家本质化

这里故意保留一个早期空窗：

- turn 5 时只有 5 条样本，太容易把玩家误写成“就是某种人”
- turn 10 时虽然略稳，但仍偏短
- 从 turn 15 起再按 5 回合节奏蒸馏，才比较像“历史姿态”而不是“刚刚这几句的情绪”

也就是说，默认策略不是“逢 5 必蒸馏”，而是：

> 样本先长出来，再开始周期性蒸馏。

---

## 4.3 Cell 蒸馏：建议用阈值 + 停顿点，而不是即时触发

不要写成“每第 N 次造访就立刻蒸馏”，那会导致两个问题：

- 热点格反复改写 essence
- 冷门格刚好达到阈值时触发一次昂贵 distill，但随后立刻 `/quit`，成本被花在一个未必会立刻再被读取的结晶上

建议阈值：

- 第 5 次
- 第 10 次
- 第 20 次
- 第 40 次

但阈值达到时，不是马上蒸馏，而是把这个 cell 标成：

> `pending crystallization`

真正执行 distill 的时机放在明确停顿点：

- `/quit`
- `/return`
- chapter change
- 其他未来定义的 phase boundary

也就是：

- **阈值负责说明“这格已经攒够了历史”**
- **停顿点负责说明“现在值得花一次 LLM 成本把它写出来”**

### 好处

- 避免为一次刚好触阈但短期不会再读取的格立刻付费
- 让 crystallization 更像历史结晶，而不是回合内抖动缓存
- 历史越厚，结晶更新越保守
- 避免每次进入同一格都触发额外 LLM 调用

---

## 4.4 `/quit` 与 `/return`：封印时机

这两个命令都应触发：

- trajectory seal append
- 一次 profile update 尝试
- 对所有 `pending crystallization` cells 进行一次 flush 尝试

它们对应 manifesto 里的：

- 退出被记成事件
- 回返不是清空，而是带着历史回返

### 重置语义建议

- `/return`：只重置 `state.json`；不清空 `player_profile.json`、`sediment`、`trajectory archive`
- `/reset`：只重置当前 MVP 会话文件，不清跨局历史层
- 另加一个保留命令设计：`/hard-reset-memory`，用于显式清除所有历史文件

如果不区分这三者，跨局记忆会和“我只是想重开试玩”混在一起。

---

## 5. 读取层：用 retrieval 替代全量 library dump

## 5.1 当前问题

当前 `engine_prompt()` 会把 `library.json` 全量注入 prompt。

在今天的 MVP 里，库还很小，这没问题。  
但在未来 256 格 + crystallized overlay + profile 的情况下，继续全量 dump 会导致：

- prompt 爆炸
- 每回合都注入与当前无关的格
- 历史层存在了，但对当前裁定几乎不起作用

---

## 5.2 Retrieval 的目标

把 prompt 从：

> 静态全库 dump

改成：

> 当前相关的少量格 + 玩家活画像 + 最近轨迹

这一步才是真正让世界“按历史读你”。

---

## 5.3 Retrieval 行为建议

```python
def retrieve_relevant_library(state, utterance, library):
    if len(library["cells"]) < 32:
        return library["cells"]

    relevant_ids = set()

    # 常驻结构格
    relevant_ids.update(["3-3-2-2", "4-3-4-2", "4-4-4-4"])

    # 当前格与邻格
    if state.get("current_cell"):
        relevant_ids.add(state["current_cell"])
        relevant_ids.update(adjacent_cells_4d(state["current_cell"]))

    # 最近访问轨迹
    relevant_ids.update(last_visited_cells(state, n=5))

    # 上回合竞争锚点
    relevant_ids.update(last_secondary_anchor_ids(state, n=2))

    # 路向常驻格
    relevant_ids.update(route_default_cells(state.get("current_trajectory_id")))

    return [overlay_crystallized(load_base_cell(cid)) for cid in relevant_ids]
```

### 说明

- 当 `library cell count < 32` 时，直接全量注入，避免过早优化
- 当未来扩到 256 格，再启用 retrieval
- provenance 路线应常驻考虑 `命名政体` / `授权回路`
- 返回值应是 `base cell + crystallized overlay`，不是只读结晶文件

---

## 5.4 把 profile 塞进 CURRENT STATE

`player_profile.current_portrait` 应进入 prompt 的 `CURRENT STATE` 段，但必须附带一条警告给裁定 LLM：

- 这是一份跨回合蒸馏画像
- 可以参考它判断 `historical_posture`
- 但不要盲目照抄，更不要把玩家本质化

建议注入字段：

```json
"player_profile_l2": {
  "posture": "从朴素实在漂向怀疑，偏好声明式断言",
  "signature_words": ["应该", "真的", "本来"],
  "dialectical_tensions": ["自我肯定 vs 对分类的抵抗"],
  "provisional": true,
  "portrait_confidence": 0.72
}
```

---

## 6. 和当前 MVP 的集成点

全部改动都可以挂在 `tools/play_v5_mvp.py` 现有结构上。

## 6.1 `ensure_world()`

位置：`tools/play_v5_mvp.py:399`

新增初始化：

- `world/mvp/player_profile.json`
- `world/mvp/crystallized/`
- `world/mvp/cells/`
- `world/mvp/trajectories/`

如果文件不存在则初始化；存在则不覆盖。

---

## 6.2 `apply_engine_result()`

位置：`tools/play_v5_mvp.py:1095`

在现有 state/ledger 写入后追加：

1. `append_sediment(...)`
2. `append_trajectory(...)`
3. `maybe_distill_profile(...)`
4. `maybe_distill_cell(...)`

其中：

- 1 和 2 是强建议的快速写入
- 3 和 4 是可选蒸馏，必须 fail-open

---

## 6.3 新增 retrieval helper

在 `engine_prompt()` 之前新增：

- `load_player_profile()`
- `load_crystallized(cell_id)`
- `overlay_crystallized(base_cell, crystallized_md)`
- `retrieve_relevant_library(state, utterance, library)`

---

## 6.4 `engine_prompt()`

位置：`tools/play_v5_mvp.py:629`

改两点：

- `LIBRARY MATERIAL` 从全量 `library.json` 改为 `retrieve_relevant_library(...)`
- `CURRENT STATE` 增加 `player_profile_l2`

并明确告诉裁定模型：

- profile 是暂定历史画像，不是真相
- crystallized essence 是近期历史 overlay，不是 immutable ontology

---

## 6.5 新增 distill 触发器

建议新增：

- `should_distill_profile(state) -> bool`
- `distill_profile(state) -> dict`
- `should_distill_cell(cell_id, visit_count) -> bool`
- `distill_cell(cell_id, recent_sediment) -> markdown`

这四个函数应复用当前 `codex exec` 壳子，而不是引入新的服务依赖。

---

## 6.6 向后兼容策略

如果以下任一条件不满足：

- memory 文件不存在
- retrieval 失败
- crystallized 文件解析失败
- profile 蒸馏失败

则：

- 直接 fallback 到当前行为
- library 继续全量注入
- prompt 不带 profile overlay
- 不影响本局游玩

这保证了该方案可以渐进合入，而不是一次性替换。

---

## 7. 建议的 feature flags

为了让 M2/M3/M4 可独立验证，建议文档里直接定义环境开关：

- `APORIA_ENABLE_MEMORY_WRITES=1`
- `APORIA_ENABLE_LIBRARY_RETRIEVAL=1`
- `APORIA_ENABLE_PROFILE_DISTILL=1`
- `APORIA_ENABLE_CELL_CRYSTALLIZATION=1`

默认策略建议：

- M1 合入后：只开 `MEMORY_WRITES`
- M2 验证期：retrieval behind flag
- M3/M4：distill 默认关闭，先 smoke 验证

---

## 8. Distill prompt 模板

## 8.1 Profile distill prompt

目标：从最近回合诊断摘要中生成一份**暂定**的跨局画像。

建议输入：

- 最近 12 回合的：
  - `turn`
  - `trajectory_id`
  - `turn_tags`
  - `history_carryover_tags`
  - `player_posture`
  - `phase`
- 最近若干局的 trajectory seals

触发前提建议：

- `turn >= 15`
- `history_len >= 12`

建议输出 schema：

```json
{
  "posture": "...",
  "signature_words": ["..."],
  "dialectical_tensions": ["..."],
  "portrait_confidence": 0.0,
  "trajectory_summary": [{"run": 0, "arc": "..."}],
  "provisional": true
}
```

建议 instruction：

```text
You are distilling a provisional cross-run player portrait for Aporia.
Do not essentialize the player into a fixed identity.
Describe only historically situated tendencies visible in the supplied traces.
Prefer tensions, recurring postures, and signature phrase-shapes over personality claims.
Return JSON only.
```

---

## 8.2 Cell distill prompt

目标：把某格近期沉积蒸馏成一份“活的 essence overlay”。

建议输入：

- `base cell` 的基础定义
- 该格最近 8-16 条 sediment
- 最近一次 crystallized 版本（如果有）

建议输出结构：

- frontmatter
- `Current essence`
- `Signature utterances (recent)`
- `Escape moves observed`

建议 instruction：

```text
You are distilling a living overlay for one Aporia cell.
Do not rewrite the entire ontology of the cell.
Summarize what has historically emerged in recent visits.
Keep the tone concrete and trace-based.
Do not claim more stability than the samples warrant.
Return markdown only.
```

---

## 9. 边界情况与风险控制

## 9.1 Sediment 无限增长怎么办

短期：

- `sediment.jsonl` 继续 append-only
- distill 时只取最近 `N=12` 或 `N=24` 条样本

中期：

- 增加 `archive/` 或 `summaries/` 层
- 老沉积不删除，只在 distill 时做窗口化抽样

原则：

- 原始史料不裁剪
- 读取窗口有限

---

## 9.2 玩家画像幻觉怎么防

必须同时做四件事：

- 输入尽量吃诊断摘要，不直接吃海量原文
- 输出结构里强制 `provisional=true`
- `/inspect` 暴露画像来源 turns 与 confidence
- prompt 明确禁止固定人格化、本质化

如果 profile 开始出现“你就是一个怎样的人”，就是失败。

---

## 9.3 429 / malformed JSON / distill 失败

统一策略：`fail-open`

- profile distill 失败：沿用旧 profile
- cell distill 失败：保留旧 crystallized 文件
- retrieval 失败：回退到全量 library dump
- 任何 warning 可写到 `world/mvp/diagnostics.log` 或 stderr

---

## 9.4 LLM 成本预算

这一层不是零成本。相对当前 bare MVP，加入 M3 + M4 后的 LLM 调用量大致会增加：

- 常规单局：约 `+20% ~ +35%`
- 长局且命中多个 crystallization threshold：上沿可接近 `+40%`

粗略来源：

- M3：从 turn 15 开始，每 5 turn 一次 profile distill
- M4：只在停顿点 flush pending cells，因此是偶发成本，而不是每回合成本

设计含义：

- 如果目标是先验证玩法，优先开 M1/M2，先关掉 M3/M4
- 如果目标是验证历史性，则可以接受更高成本，但必须配合 feature flags 与 smoke 测试

---

## 9.5 当前 MVP 还不是 256 格

这一点文档必须写清楚。

当前 `world/mvp/library.json` 仍是少量锚点库，不是完整矩阵。  
因此：

- M1、M3、M4 可以先上
- M2 retrieval 在小库阶段收益有限，但应先把接口做出来
- 未来扩到 256 格时，retrieval 才真正承担 prompt 压缩责任

---

## 9.6 幽灵 cell 的处理

当前 adjudication 仍可能返回 `library.json` 中不存在的 `current_cell_id`。  
例如早期 playtest 里曾出现过类似 `threshold` 这样的 id。

在 M1 阶段，这件事是**无害但要知情**的：

- `append_sediment(...)` 会写出 `cells/threshold/sediment.jsonl`
- `append_trajectory_visit(...)` 也会记录这个落点
- 这意味着历史层可能暂时包含“library 外部”的幽灵 cell 目录

M1 不需要因此阻塞，因为这一层只是在忠实记账。  
但在 M4 启动前，必须明确幽灵 cell 的策略，至少二选一：

1. **跳过蒸馏**：只对 `library.json` 中真实存在的 cell 做 crystallization
2. **转入候选池**：把幽灵 cell 收集到例如 `library.suggested_cells` 之类的候选层，等待后续人工或系统接纳

默认建议：

- M1：允许写入幽灵 cell 的 sediment / trajectory
- M4：默认跳过幽灵 cell 的 crystallization，并记录 warning

这样既不丢失历史，也不把不存在的格误当成正式 ontology。

---

## 9.7 单人 vs 多人的记忆边界

当前文档默认的是：

- `player_id = local`
- 单人、本地、跨局延续

也就是说，本文所有不变量目前都站在**单人历史层**上成立。

如果未来做多人，需要先回答三个架构问题：

1. `player_profile.json` 是每人一份，还是共享画像层？
2. `sediment.jsonl` 是个人私有沉积，还是多人共同沉积？
3. `crystallized essence` 是从单人历史里涌现，还是从公共图书馆里涌现？

在这些问题明确前，不建议把当前 memory 架构直接外推到多人。

---

## 10. 四阶段实装计划

## M1 · 基础沉积

内容：

- `sediment + trajectory` 写入
- 新目录初始化
- 不改 prompt，不改读取

验证：

- 每 turn 后有对应 cell 的 `sediment.jsonl`
- 每局有 `trajectories/run-N.jsonl`
- `/quit` / `/return` 会写 seal

预估：1h

---

## M2 · 检索替换

内容：

- 新增 `retrieve_relevant_library()`
- 在 feature flag 后替换全量 dump
- 支持 `base cell + crystallized overlay`

验证：

- 小库阶段可选择全量或 retrieval
- retrieval 命中来源可从 `/inspect` 或 debug 输出中看到
- 行为变化可控，不出现明显 route 漂移失真

预估：1.5h

---

## M3 · Profile 蒸馏

内容：

- 从 `turn >= 15` 开始，每 5 turn 更新 `player_profile.json`
- 将 `current_portrait` 注入 prompt

验证：

- `/return` 后 profile 仍在
- `/reset` 不应误清 profile
- `/inspect` 能看到 profile 与 source turns
- 蒸馏失败不打断主回合

预估：1.5h

---

## M4 · Cell 蒸馏

内容：

- 分段阈值将 cell 标记为 `pending crystallization`
- 在 `/quit` / `/return` / chapter change 时 flush 到 `crystallized/X-X-X-X.md`
- retrieval 时 overlay 到 base cell

验证：

- 第 5/10/20/40 次命中后，cell 会进入 pending 状态
- 在停顿点会真正产出结晶文件
- `/inspect` 能看到该格是否已有 crystallized essence
- 结晶文件删除后可重新生成

预估：1.5h

---

## 11. 测试清单

## 11.1 文件结构测试

- 首次启动是否正确创建：
  - `player_profile.json`
  - `crystallized/`
  - `cells/`
  - `trajectories/`

## 11.2 写入测试

- 连续 3 回合进入同一格，`sediment` 是否正确 append
- `trajectory` 是否包含 `visit` + `seal`
- `/return` 后 run 编号是否递增

## 11.3 兼容性测试

- 删掉 `player_profile.json` 再启动，是否自动重建
- 删掉 `crystallized/`，主回合是否仍可运行
- 关闭 flags 后，是否回到当前全量 dump 行为

## 11.4 Distill 测试

- profile 蒸馏返回坏 JSON 时，是否沿用旧 profile
- cell distill 返回空文本时，是否跳过更新
- 429 时，是否只是 warning 而非回合失败

## 11.5 行为测试

- 同一句 provenance 追问，在 profile / sediment 累积前后，落点是否更稳定
- 同一路向连走多局后，profile 是否能概括“倾向”，但不把玩家写死
- crystallized essence 是否真的影响下一次邻近裁定，而不是纯存档

---

## 12. 与 manifesto §8 Historicality 的映射

把这一层做出来后，`MANIFESTO-v5.md:196` 的 §8 就不再只是哲学修辞，而会有明确文件落点：

- `sediment` = 历史
- `crystallized essence` = 涌现
- `trajectory` = 一局的运动历史
- `player_profile` = 世代 / 跨局残留姿态
- `retrieval` = 世界按当前相关历史重新读你

换句话说：

> M1 让世界开始记事。  
> M2 让世界按记忆裁定。  
> M3 让世界形成对你的历史读法。  
> M4 让格本身拥有局部历史生成的活 essence。

其中真正的分水岭是 M2。  
没有 retrieval，历史只是被存下；有了 retrieval，历史才真正介入当前回合。

---

## 13. 推荐实施顺序

如果按最稳妥的工程路线推进，建议：

1. 先做 M1，把 `sediment` / `trajectory` 打通
2. 再做 M3，让 `player_profile.json` 成为第一层跨局记忆
3. 然后做 M2，把 retrieval 接上，但 behind flag
4. 最后做 M4，让 cell crystallization 接入 retrieval overlay

理由很简单：

- M1 提供原始史料
- M3 先验证“玩家画像是否会本质化”
- M2 是真正会改变裁定行为的步骤，应最后小心放开
- M4 是锦上添花，但必须建立在稳定沉积之上

---

## 14. 最终判断

这套方案成立，而且是 Aporia 现阶段最合适的记忆路线：

- 哲学上：与 V5 manifesto 的“历史性”一致
- 工程上：本地文件即可，不引入外部服务
- 风险上：主要风险不是写入，而是 retrieval 与 distill 会不会重新本质化玩家

因此真正要盯住的不是“能不能存下来”，而是：

> 存下来的历史，是否真的以一种可质疑、可失败、可推翻的方式重新进入下一回合。

如果答案是 yes，这层记忆才不是新瓶装旧酒，而是 Aporia 世界真正开始有历史。
