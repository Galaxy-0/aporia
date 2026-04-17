---
name: extract-commitment
description: Extract metaphysical commitments from every player utterance. Called each turn. Also decides if Daemon should quote back a prior commitment. This is Aporia's only skill — the entire world loops through it.
---

# extract-commitment

玩家每次输入时调用。任务：从玩家的话里读出**形而上学抵押**，append 为新事件到 `world/commitments.jsonl`；并决定 Daemon 是否引用某条旧承诺回来找他。

## 输入

- 玩家原始句子（可能是空串）
- 当前 `turn`（来自 state.json）
- 最近 30 条账本条目 + 全文所有 `"op":"burn"` 的条目

## 步骤 1：抽取

### 1.1 空输入 → silence

玩家按了 Enter 但没说话，或只打了标点。抽**一条** silence：

```json
{"turn":N, "op":"silence", "id":"cN-s", "verbatim":"", "extracted":"此刻不说抵押了什么", "modality":"presuppositional", "intensity":0.3}
```

`extracted` 应根据当前语境判断：
- 刚被 Daemon 引用后的沉默 → `无法反驳 / 承认`
- Daemon 未出现的沉默 → `等待 / 拒绝参与`
- 章节转场前的沉默 → `酝酿 / 未决`
- Last God 章节的沉默 → `泰然任之 / 放下言说`

### 1.2 非空输入 → 0-3 条 commit

**核心判据**：抓 **presupposition（预设）**，不抓 **assertion（断言）**。

**assertion — 可直接讨论真假 → 不抓**：
- `这里黑` （可反驳）
- `我累了` （陈述状态）
- `左边有石头` （描述）

**presupposition — 这句话必须已经假定 → 抓**：
- `这里**本来就**黑` → 预设"黑是此处的本真规定"→ 抓：本真性 / 本质主义
- `我**看**门` → 预设主-客二分的知觉结构 → 抓
- `**应该**有路` → 预设理由律 / 世界可理解 → 抓：deontic
- `**不过是**幻觉` → 预设真-幻二元且真优于幻 → 抓：presuppositional
- `**必须**离开` → 必然性 + 处境有出路 → 抓：alethic + deontic
- `**反正**都一样` → 差异消解 → 抓：虚无主义倾向

### 1.3 强触发词白名单

看到这些词，强制至少抽一条（即使其他部分看不出抵押）：

```
应该  必须  不过是  其实  本来  毕竟  只是  总是  从来  当然  就是  根本
```

### 1.4 模态标签（每条 commit 必带一个）

| 模态 | 含义 | 典型词 |
|---|---|---|
| `alethic` | 必然 / 可能 | 必须 / 必然 / 不可能 |
| `epistemic` | 知道 / 相信 | 我相信 / 肯定 / 当然 |
| `deontic` | 应该 / 允许 | 应该 / 不该 / 可以 |
| `presuppositional` | 已经假定 | 本来 / 就是 / 其实 |

### 1.5 intensity

- 0.1–0.3：弱承诺，大概率自己就会消解
- 0.4–0.6：普通承诺，日后可能被引用
- 0.7–0.9：强承诺，Daemon 很可能回来找
- 1.0：极强承诺，玩家显然为此押上整个立场

判断依据：**模态词强度 × 语气 × 是否孤句**。

### 1.6 每条事件格式

```json
{"turn":N, "op":"commit", "id":"cN-i", "verbatim":"玩家原句（完整）", "extracted":"形而上学前提（一句话）", "modality":"...", "intensity":0.0-1.0}
```

`i` 从 1 起。同一回合多条就 `cN-1, cN-2, cN-3`。

**最多 3 条**。宁可少抽，不要啰嗦。

## 步骤 2：裁决 Daemon 是否回响

读最近 30 条 + 所有 burn 条目。

### 2.1 触发条件

- **形而上学矛盾**：新抽取的 commit 与已有 commit 的 `extracted` 构成对立
  - 例：旧承诺是"主客二分"，新承诺是"世界先于我"→ 矛盾 → 引用
- **言行相悖**：玩家当下动作与 3 轮之前某条承诺不一致
  - 例：3 轮前说"应该有路"，现在说"没意义了"→ Daemon 引第一句
- **高密度张力**：近 10 轮抽出 ≥15 条 commit 且 intensity 均值 > 0.5 → 偶发主动回响

### 2.2 抑制条件

- Daemon 在最近 3 轮已经引用过 → 不要
- 本轮玩家承诺平顺无张力 → 不要
- 章节是 Beginning 或 Last God → 倾向安静

### 2.3 引用形式

Daemon 只能复述玩家**一字不差的原句**，不能改写、不能总结。

格式：
```
*「玩家那句原话」——此刻的回响*
```

或带明确指向：
```
*「玩家那句原话」——你第 N 轮说的。*
```

长度：一句话。最多两句。**不要解释玩家说错了什么**，只让原句回来。解释让玩家自己做。

## 步骤 3：Append + 回应

1. 把新事件**逐行 append** 到 `world/commitments.jsonl`（不是覆盖写入）
2. `state.json` 的 `turn` +1
3. 若需要引用，把 Daemon 段塞进主回应里（暗淡斜体）
4. 主回应用散文叙事，按当前章节氛围写

## 绝对禁止

- 不要回头改已有行
- 不要跳过抽取（即使玩家说废话，也要判断要不要抽）
- 不要伪造 `verbatim`——必须是玩家真的说过的原句
- 不要让 Daemon 说玩家没说过的话
