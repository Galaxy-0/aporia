---
name: status
description: Show current game status - coordinates, resources, symbols, scene. Use when player asks where they are, what they have, or checks their state.
---

显示当前状态。

1. 读取 `world/state.json`
2. 以世界内的语言呈现（不是 JSON dump）：

风格示例：
```
你在 **开端** 之中。十字的四臂向空白延伸。

你的坐标：3·3·2·2（度 / 去蔽 / 保持 / 抉择）
清明：██░░░░░░ 2/8
压力：░░░░░░░░ 0/8

携带的符号：if, one
合成的符号：（无）

轮回：第 0 次  死亡：0 次
```

保持简洁。坐标用中文维度名。资源用 ASCII 条。
