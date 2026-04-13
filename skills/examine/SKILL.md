---
name: examine
description: Examine something in the current scene more closely. Use when player wants to look at, inspect, touch, or investigate something specific.
---

玩家仔细观察某个事物。$ARGUMENTS 是观察目标。

1. 读取 `world/state.json`
2. 根据当前场景和目标生成描述
3. **Clarity 影响描述深度**：
   - Clarity 1-2：只能看到表面（"一面墙"、"一道裂缝"）
   - Clarity 3-4：看到细节（"墙上有划痕，似乎是某种符号的一部分"）
   - Clarity 5-6：看到隐藏层（"划痕构成了一个词：'being'。旁边有一个你之前没注意到的凹陷"）
   - Clarity 7-8：看到本质（"这面墙不是阻隔——它是一个被凝固的命题。它在等待被否定或被肯定"）
4. 如果观察揭示了新符号，添加到 symbols
5. 写回 state.json

**examine 不消耗资源**——看是免费的。这鼓励探索。
