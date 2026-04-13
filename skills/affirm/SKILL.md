---
name: affirm
description: Affirm/inscribe/confirm something in the world. Costs clarity. Use when player wants to establish, inscribe, confirm, or build.
---

玩家执行肯定操作。目标由 $ARGUMENTS 或上下文决定。

1. 读取 `world/state.json`
2. clarity - 1
3. 如果 d1 < 4，d1 + 1
4. 被肯定的对象变得固定、持久——在叙述中以坚实、不可动摇的方式存在
5. 如果玩家铭刻一个符号在特定位置，记录到 state 中
6. 写回 state.json
7. 检查 clarity <= 0？如果是，警告（"你的视野正在收窄"），或触发死亡
8. 如果肯定的东西与当前场景的本质矛盾（比如在深渊中肯定"地面"），触发空间裂变——可能开启隐藏路径

描述风格：被肯定的东西变得沉重、真实、像刻在石头上的文字。但你能感到自己的视野因此变窄了一点。
