---
name: sublate
description: Sublate/fold/synthesize contradictions. Heals strain if successful. Use when player tries to reconcile opposites, fold contradictions, or transcend dualities.
---

玩家执行扬弃（Aufhebung）操作。

1. 读取 `world/state.json`
2. 检查玩家的 symbols 中是否存在已知矛盾对：
   - being + nothing → becoming
   - there + not → hidden
   - ground + gate → passage
   - if + all → totality
   - one + all → singularity
3. 如果找到矛盾对：
   - 从 symbols 移除两个源符号
   - 添加合成符号到 synthSymbols
   - strain - 2（最低 0）
   - clarity + 1（最高 8）
   - d3 + 1（如果 <4）
   - 描述：两个对立的符号被折叠为一个新的存在——否定被保留、提升
4. 如果没有矛盾对：
   - strain + 2
   - clarity - 1
   - 描述：你试图折叠，但手中没有真正的矛盾——强行合并只造成更大的裂痕
5. 写回 state.json
6. 检查死亡条件

**扬弃是唯一能在意识形态固化（ideologicalLockTurns > 0）中使用的操作。** 如果成功，立即解除固化。
