---
name: negate
description: Negate/erase/deny something in the world. Costs strain. Use when player wants to destroy, deny, erase, or reject.
---

玩家执行否定操作。目标由 $ARGUMENTS 或上下文决定。

1. 读取 `world/state.json`
2. strain + 1
3. 如果 d2 < 4，d2 + 1
4. 被否定的对象变成"残影"——在叙述中以模糊、不可靠的方式继续存在
5. 写回 state.json
6. 检查：strain >= clarity？如果是，触发意识形态固化（ideologicalLockTurns = 3）
7. 检查：clarity <= 0？如果是，触发死亡流程

描述风格：被否定的东西不是消失了，而是变得透明、扭曲、像一层残影覆盖在原位。
