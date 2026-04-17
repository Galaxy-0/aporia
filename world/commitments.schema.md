# commitments.jsonl — 账本 Schema

**物理 append-only**。每行一个事件。四种 `op`。

## commit — 新承诺（非空输入抽出）

```json
{
  "turn": 5,
  "op": "commit",
  "id": "c5-1",
  "verbatim": "我看看周围",
  "extracted": "主客二分的知觉结构",
  "modality": "presuppositional",
  "intensity": 0.6
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `turn` | int ≥ 0 | 当前回合 |
| `op` | `"commit"` | 操作类型 |
| `id` | `"c{turn}-{i}"` | 本轮第 i 条 commit，i 从 1 起 |
| `verbatim` | string | 玩家原句（必须一字不差） |
| `extracted` | string | 一句话说出"这话必须预设了什么" |
| `modality` | enum | `alethic` / `epistemic` / `deontic` / `presuppositional` |
| `intensity` | 0.0–1.0 | 此抵押的分量 |

## silence — 沉默也是承诺

```json
{
  "turn": 5,
  "op": "silence",
  "id": "c5-s",
  "verbatim": "",
  "extracted": "拒绝定位",
  "modality": "presuppositional",
  "intensity": 0.3
}
```

空输入或只有标点时抽一条。id 固定为 `c{turn}-s`。

## annotate — 活物状态（回写旧条目）

```json
{
  "turn": 50,
  "op": "annotate",
  "target": "c5-1",
  "status": "背弃",
  "note": "玩家否认了自己作为主体"
}
```

- `target`：被标注的旧条目 id
- `status`：`已兑现` / `背弃` / `沉睡`
- `note`：一句话解释（可选）

## burn — 扬弃燃烧

```json
{
  "turn": 60,
  "op": "burn",
  "target": "c5-1",
  "by": "c60-2",
  "reason": "扬弃合成为 mitsein"
}
```

- `target`：被燃烧的旧条目 id
- `by`：触发燃烧的新条目 id
- `reason`：一句话说扬弃的形式

燃烧后原条目**不删除**。它保留在账本里作为残影，且 prompt 读取时仍可见。

## seal — 轮回封印（仅 Last God 崩溃时触发）

```json
{
  "turn": 314,
  "op": "seal",
  "reincarnation": 0
}
```

标记本轮结束。下一轮从 `reincarnation+1` 开始，旧事件全部保留但属于"上一世"。

## 不变量

- 文件**物理 append-only**。只能向末尾追加，不能修改/删除已有行
- 每行是合法 JSON
- `id` 全局唯一
- `target` 必须指向已存在的 `id`
- commit/silence 的 `turn` 必须单调不减
