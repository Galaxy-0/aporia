---
name: combine
description: Combine two symbols. Use when player mentions combining, merging, or putting two things together.
---

玩家尝试组合两个符号。$ARGUMENTS 应包含两个符号名。

1. 读取 `world/state.json`
2. 检查玩家是否持有这两个符号
3. 检查是否为已知组合：
   - being + nothing → becoming
   - there + not → hidden
   - ground + gate → passage
   - if + all → totality
   - one + all → singularity
4. 如果有效：执行扬弃流程（同 /sublate）
5. 如果无效：strain + 1，描述"这两个符号碰到一起时，什么都没有发生——或者说，产生了一种令人不安的静电"
6. 写回 state.json

注意：combine 和 sublate 的区别是——combine 是玩家明确指定两个符号，sublate 是系统自动找矛盾对。效果相同。
