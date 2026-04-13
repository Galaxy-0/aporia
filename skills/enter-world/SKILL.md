---
name: enter-world
description: Start or resume the Aporia game. Use when the player wants to begin playing, or at the start of a session.
---

初始化或恢复 Aporia 世界。

1. 读取 `world/state.json`
2. 如果 `initialized` 为 true 且 `cycle` > 0，说明是返回者——用"你又来了"的语气恢复
3. 如果是首次，用 Beginning 章节的开场描述世界
4. 描述当前场景，提示可用方向和操作
5. 不要解释规则——让玩家自己发现

开场风格（首次）：简短、冷、留白。像是一个等待已久的空间终于有人走入。
