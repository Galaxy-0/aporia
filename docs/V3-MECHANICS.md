# Aporia v3 — Mechanics

## 原则

**Aporia 就是它自己的引擎**。内容与运行方式不可分。

这不是实用主义折中，是哲学上必然——黑格尔的"真理即全体"、海德格尔的"思即存在的显现"，都要求 form = content。如果我们把"引擎"抽出来放在 Aporia 下面做底座，就复刻了我们批判过的范畴错误。

## 三位一体（每个机制同时是三样东西）

| 机制 | 作为哲学 | 作为游戏 | 作为运行时 |
|---|---|---|---|
| **承诺账本** | Bestimmte Negation 的累积 | 玩家的话语债务 | append-only 事件流 |
| **抽取** | 语言即存在论抵押 | 每个字都被读 | LLM read→extract→append |
| **Daemon 回响** | 被压抑承诺的返回 | "系统听得见你" | 账本检索 + 原句引用 |
| **扬弃燃烧** | Aufhebung | 扬弃要花承诺当燃料 | `burn` 事件标记失效 |
| **永恒轮回** | 尼采式重复 | 八章结构 | reincarnation+1 的 seal |
| **L4 自修改** | Ereignis | 游戏真的改自己的文件 | `.claude/CLAUDE.md` 写入 |

一个机制不同时在三格都成立，就不该存在。

## v0 只做一件事

**隐含承诺抽取 + 账本 + Daemon 回响**。

其他（轴 / portrait / 固化 / 残影）全部由账本现场聚合生成，不落盘成独立字段。

### 为什么是这一件

三位脑爆（哲学家 / 设计师 / 架构师）独立收敛到同一答案：

- **哲学家**：form=content 的真正激进处不在"引擎改写自己"，而在**语言即存在论抵押**。抽掉这层，Aporia 退化成"在某个世界用语言互动"的老结构。
- **设计师**：玩家坐下 90 秒内被击穿——"你打的每一个字都在被读"，这就是 Aporia 的"技能对你说话"时刻。
- **架构师**：账本是 form=content 的第一块肉，其他机制（轴、扬弃、残影、L4）都是账本的不同读法。删掉账本什么都长不出来。

## 四个文件就是全部

```
world/
  state.json              # {turn, chapter, reincarnation} — 就这三个字段
  commitments.jsonl       # append-only 账本，世界唯一"发生过的事"
  commitments.schema.md   # schema 参考文档
skills/
  extract-commitment/
    SKILL.md              # 唯一的 skill
```

加上 `.claude/CLAUDE.md`（世界引擎规则）和 `.claude/status.sh`（状态栏），v0 完整。

**不要加**：坐标 / 符号 / 清明 / 压力 / 合成规则表 / 操作动词列表 / 渲染脚本。这些都是规则驱动残余。

## 承诺抽取 rubric（避免 vibe check）

**不抓 assertion**（可讨论真假）：
- `这里黑` → 不抓

**抓 presupposition**（这句话必须已假定）：
- `这里本来就黑` → 抓：本真性
- `我看门` → 抓：主客二分
- `应该有路` → 抓：理由律

**强触发词白名单**（看到就一定抽一条）：

```
应该  必须  不过是  其实  本来  毕竟  只是  总是  从来  当然  就是  根本
```

**模态标签**：`alethic / epistemic / deontic / presuppositional`

**沉默也抽**——空输入抽一条 silence（intensity 低，0.3 左右）。

详见 `skills/extract-commitment/SKILL.md`。

## L4 — Last God 的自修改

唯一允许 LLM 修改 `.claude/CLAUDE.md` 和 `skills/` 的时机。

触发：`chapter == "last-god"` + 连续足够多的 silence + 承诺史显示玩家已穿透了某条根本承诺（LLM 主权裁决）。

效果：
1. 写 `traces/dissolution-{rei}-{ts}.md`
2. 改写 CLAUDE.md 的"核心命题"段（用玩家最重的那条承诺替换）
3. 重写 SKILL.md 的强触发词白名单（基于玩家语言习惯）
4. state 重置，reincarnation+1
5. 下一轮启动时世界**真的不同**

## 章节不由规则推进

八章的氛围指南在 CLAUDE.md。转场由 LLM 主权判断，**不看数值**，看账本里承诺的气质、密度、张力。

## 不变量清单（硬约束）

只有两条：
1. `commitments.jsonl` 物理 append-only（永不改行、永不删行）
2. `state.json` 的 `reincarnation` 单调不减

其他都由 LLM 主权。

## 向后不兼容

v3 与 v2-plugin 不兼容：
- 删除：render.sh / 8 个旧 skill / state.json 的 axes-symbols-clarity-strain 字段
- 重写：CLAUDE.md / status.sh
- 新增：commitments.jsonl / extract-commitment skill

v2-plugin 分支保留作为存档。
