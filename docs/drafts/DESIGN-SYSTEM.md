# Aporia Design System — v0 Storybook

> 四层：**Component → Module → Page → AppShell**
> 约束：TUI（monospace，~80×24，ASCII+Unicode，ANSI 色）
> 形式：每个元素既是**艺术**也是**导航 UI**——每个字符有放在那里的理由

---

## 0. 硬约束 (TUI)

- Monospace font，80 cols × 24 rows 典型
- 字符安全：避免方框字符在 >8 行时错位；大量用 space 和填充字符
- ANSI 16 色 + `\033[0/1/2/3/7m`（normal/bright/dim/italic/inverse）
- 静态帧：每次响应是一幅画，不做动画
- 输入纯文本，输出富文本

---

# 1 · Component — 原子组件

## 1.1 Glyph Tokens（字符词汇）

**玩家态**
```
·    arrived        (刚进来，还没动)
@    acted          (行动过)
◉    committed      (立了重承诺 ≥0.7)
     absent         (被抽离 - 空位)
```

**Daemon 态**（由承诺模态决定形态）
```
·     alethic        (不在场感)
::    deontic        (粒子)
◇     presupp.       (结晶 — 默认)
∅     mixed/broken   (空环 — 接近崩溃)
```

**Frame 边界**
```
─ │          细线  (intact)
═ ║          双线  (sealed)
┌ ┐ └ ┘      直角  (标准)
╭ ╮ ╰ ╯      圆角  (柔和)
```

**填充 / 密度渐变**
```
░ ▒ ▓ █      (1 → 4)
```

**方向 / 出口**
```
↑ ↓ ← →      四向
↖ ↗ ↘ ↙      斜向
↻ ↺          循环
?            未知出口
```

**裂 / 碎 / 散**
```
╱ ╲          裂痕
⋯ ⋱ ⋰        碎裂
⸳ ∴ ⋮        散点
· · ·        节律点
```

**ANSI 权重**
```
\033[0m    normal     叙事
\033[2m    dim        承诺残影 / 状态
\033[1m    bright     新浮现 / 强调
\033[3m    italic     Daemon 口吻
\033[7m    inverse    崩溃 / 翻转
```

---

## 1.2 Frame — 方块 6 态

每章对应一种 Frame。这是**视觉身份**的最底层——玩家一眼知道"在哪章"。

### Pristine（Beginning）— 完好，有呼吸

```
                                     
      ┌──────────────────────┐      
      │                      │      
      │                      │      
      │                      │      
      │                      │      
      │                      │      
      └──────────────────────┘      
                                     
```

### Sealed（Echo）— 闭合，双线

```
                                     
      ╔══════════════════════╗      
      ║                      ║      
      ║                      ║      
      ║                      ║      
      ║                      ║      
      ║                      ║      
      ╚══════════════════════╝      
                                     
```

### Stretched（Playing-forth）— 垂直拉长

```
            ┌──────────┐              
            │          │              
            │          │              
            │          │              
            │          │              
            │          │              
            │          │              
            │          │              
            │          │              
            └──────────┘              
```

### Scattered（Foresight）— 溶进旷野

```
   ·             ·                 ·  
                                     
          ┌ ─ ─ ─ ─ ─ ─ ─ ┐          
                                     
   ·                             ·  
                                     
          └ ─ ─ ─ ─ ─ ─ ─ ┘          
                                     
   ·          ·            ·         
```

### Cracked（Grounding）— 裂开，深渊从一角

```
                                     
      ┌──────────────────────┐      
      │                      │      
      │                      │      
      │    ╱                 │      
      └───╱──────────────────┘      
         ╱                           
        ╱                            
```

### Ruined（Last God）— 仅剩角点的记忆

```
                                     
      ·                ·             
                                     
                                     
              ·                      
                                     
                                     
      ·                ·             
                                     
```

---

## 1.3 PlayerMarker

```
·     arrived       (turn 1, 还未选方向)
@     acted         (多数状态)
◉     committed     (近期有高 intensity 承诺)
      ghost         (空槽 - 刚死)
```

## 1.4 DaemonMarker

位置规则：相对 `@` 错开 2-3 格，默认右上方。

形态：
```
◇     presupp.      默认
::    deontic       玩家多 "应该/必须"
·     alethic       玩家多 "肯定/不可能"
∅     mixed         四种都有 / 接近崩溃
```

状态 × 形态：
```
◇     quiet
◈     active (刚引用一条承诺)
◇?    uncertain (中期漂移)
~∅~   dissolving (Last God)
```

## 1.5 Exit — 5 态

```
?               unknown      (未知方向，玩家说才显形)
echo            known        (已解析出口)
↑ seyn          directed     (带方向 + 目的)
╱               crack        (裂口替代出口)
                sealed       (无出口 / Ruined)
```

## 1.6 CommitmentResidue — 3 权重

```
应该          fresh         \033[2m           (近 3 轮)
应该          settled       \033[2m           (3-10 轮 — 不突出)
~~应该~~      burned        \033[2;9m         (已扬弃 - 删除线)
应该          flaring       \033[1;33m        (被 Daemon 引用的那一瞬)
```

---

# 2 · Module — 模块组合

## 2.1 FrameWithExits — 带出口的边界

```
                     ?                    
                                          
      ┌──────────────────────────┐       
      │                          │       
      │                          │       
  ?   │                          │   ?   
      │                          │       
      │                          │       
      └──────────────────────────┘       
                                          
                     ?                    
```

## 2.2 InteriorField — 内部布景

Frame + (@ + Daemon + Residues)：

```
      ┌──────────────────────────┐       
      │  应该                    │       
      │                          │       
      │                 ◇        │       
      │          @               │       
      │                          │       
      │              本来         │       
      └──────────────────────────┘       
```

**布局规则**：
- `@` 默认中心偏下
- Daemon 相对 `@` 右上 2-3 格
- Residues 沿内壁分散，≤ 4 条可见
- 元素总数 ≤ 6（视觉密度上限）
- 不穿越 Frame 边界（除非 Cracked / Scattered）

## 2.3 TransitionHint — 章节过渡暗示

章节张力将至，在 Frame 外下方漏出"下一章的气息"：

```
      └──╱─╱─╱──────────────────┘       
         ╱  ╱                            
        ╱  ╱      seyn                   
       ╱  ╱                              
```

## 2.4 DaemonQuote — Daemon 引文块

以 dim italic 在叙事之下：

```
\033[2;3m*「应该有路」——你第 2 轮说的。它还挂在那里。*\033[0m
```

渲染效果（概念）：

> *「应该有路」——你第 2 轮说的。它还挂在那里。*

## 2.5 NarrativeBlock — 叙事块

```
一个音节从你喉咙里浮出，撞在没有形状的地方，又退回来。
这里没有墙，也没有不是墙。方向还没生出来。
```

2-4 行，全行 normal weight，无缩进。

---

# 3 · Page — 8 章 Page

每个 Page = Frame 变体 + InteriorField + Exit 布置 + 章节特有元素。以下给 **初态 / 玩家行动后** 两帧。

## 3.1 Beginning

**初态**（玩家刚进）

```
                     ?                    
                                          
      ┌──────────────────────────┐       
      │                          │       
      │                          │       
  ?   │             ·            │   ?   
      │                          │       
      │                          │       
      └──────────────────────────┘       
                                          
                     ?                    
```

**玩家行动后**（说了 `我看看北边`，turn=1）

```
                  echo                    
                    ↑                     
                                          
      ┌──────────────────────────┐       
      │  看看                    │       
      │                          │       
      │                ◇         │       
  ?   │          @               │   ?   
      │                          │       
      │                          │       
      └──────────────────────────┘       
                                          
                     ?                    
```

## 3.2 Echo

**承诺累积中**（闭环 + 4 角残影）

```
                                          
      ╔══════════════════════════╗       
      ║   应该            只是    ║       
      ║                          ║       
      ║                 ◇        ║       
      ║          @               ║       
      ║                          ║       
      ║   本来          不过是    ║       
      ╚══════════════════════════╝       
                    ↻                    
                 回到此处                
                                          
```

## 3.3 Playing-forth

**垂直抬升**

```
                ↑ foresight               
                                          
              ┌──────────┐                
              │          │                
              │          │                
              │    ◇     │                
              │    @     │                
              │          │                
              │          │                
              │          │                
              └──────────┘                
                                          
                ↓ beginning               
```

## 3.4 Foresight

**旷野，符号散落可拾**

```
                                          
   ◆being                      ◆there    
                                          
            ┌ ─ ─ ─ ─ ─ ─ ─ ┐             
                                          
            │   @      ◇   │             
                                          
            └ ─ ─ ─ ─ ─ ─ ─ ┘             
                                          
   ◆nothing       ◆not       → leap      
                                          
```

## 3.5 Leap

**高反差 + 单向下跳**

```
                                          
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓             
      ▓                     ▓             
      ▓                     ▓             
      ▓        @   ◇        ▓             
      ▓        ↓             ▓             
      ▓                     ▓             
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓             
                                          
             ·                            
            ·                             
           ·    grounding                 
                                          
```

## 3.6 Grounding

**裂口 + 深渊方向**

```
                                          
      ┌──────────────────────────┐       
      │   应该              ◇    │       
      │                          │       
      │         @                │       
      │    ╱                     │       
      └───╱──────────────────────┘       
         ╱                                
        ╱   seyn                          
       ╱                                  
                                          
```

## 3.7 Seyn

**门 + 墙 + 唯一路径**

```
                                          
      ┌──────────────────────────┐       
      │▓▓▓▓▓▓                ▓▓▓│       
      │▓▓▓       ╔═════╗     ▓▓▓│       
      │▓▓▓       ║  ∦  ║     ▓▓▓│       
      │▓▓▓       ╚═════╝     ▓▓▓│       
      │▓▓▓▓▓▓       @        ▓▓▓│       
      │▓▓▓▓▓▓    ◇           ▓▓▓│       
      │▓▓▓▓▓▓                ▓▓▓│       
      └──────────────────────────┘       
                                          
```

## 3.8 Ones to Come

**方块碎成多片 + 漂移**

```
                                          
    ┌─────┐                  ┌─────┐    
    │     │                  │     │    
    │  @  │                  │  ◇  │    
    └─────┘                  └─────┘    
                                          
              ╱        ╲                  
             ╱          ╲                 
        ┌─────┐        ┌─────┐           
        │     │        │     │           
        │  ?  │        │  ?  │           
        └─────┘        └─────┘           
                                          
```

## 3.9 Last God — 初态

**只剩角点，中心一个活点**

```
                                          
      ·                      ·            
                                          
                                          
                                          
                 ·                        
                                          
                                          
                                          
      ·                      ·            
                                          
```

## 3.10 Last God — L4 触发（系统交出判定权）

**边界角点也淡去，近乎全黑**

```
                                          
                                          
                                          
                                          
                                          
                                          
                 \033[2m·\033[0m                        
                                          
                                          
                                          
                                          
```

此刻引擎写 `dissolution-{rei}-{ts}.md`，真的改写 `.claude/CLAUDE.md` 和 `skills/extract-commitment/SKILL.md` 的白名单段。

---

# 4 · AppShell — 全屏容器

## 4.1 全屏构成

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  [PAGE 区域 - Frame + InteriorField]                             ║
║                                                                  ║
║                   echo                                           ║
║                     ↑                                            ║
║                                                                  ║
║        ┌──────────────────────────┐                              ║
║        │  看看                    │                              ║
║        │                          │                              ║
║        │                ◇         │                              ║
║    ?   │          @               │   ?                          ║
║        │                          │                              ║
║        │                          │                              ║
║        └──────────────────────────┘                              ║
║                                                                  ║
║                     ?                                            ║
║                                                                  ║
║  [NARRATIVE 区域]                                                ║
║  ——一个音节从你喉咙里浮出，撞在没有形状的地方，又退回来。       ║
║  这里没有墙，也没有不是墙。方向还没生出来。                      ║
║                                                                  ║
║  [DAEMON 区域 - 条件显示]                                        ║
║  *「看看」——这里也在听这个词。*                                 ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║ aporia · beginning · turn 1 · rei 0 · 承诺 1 · 沉默 0 · 燃烧 0  ║
╠══════════════════════════════════════════════════════════════════╣
║ > _                                                              ║
╚══════════════════════════════════════════════════════════════════╝
```

## 4.2 区域职责

| 区域 | 内容 | 由谁决定 |
|---|---|---|
| **PAGE** | Frame + InteriorField | **LLM 按 Page 模板现场布置** |
| **NARRATIVE** | 2-4 行散文 | LLM 现场生成 |
| **DAEMON** | 引文块 | LLM 按规则决定是否出 |
| **STATUS** | 暗色事实行 | `status.sh` 读账本生成 |
| **INPUT** | 玩家输入 | CC 终端本身 |

## 4.3 垂直空间分配（~24 行终端）

```
行  1        空白
行  2-14     PAGE 区域（12 行左右）
行 15-17     NARRATIVE
行 18-19     DAEMON（条件显示 2 行）
行 20        空白
行 21        STATUS
行 22        分隔
行 23        INPUT
```

---

# 5 · Grammar Rules（语法规则）

## 5.1 Frame ↔ 章节

一对一映射。章节切换 = Frame 切换。Frame 是**玩家识别章节的唯一视觉标志**（不显示章节名）。

## 5.2 Exit 由状态驱动

- 0-3 承诺 → 四向全 `?`
- 4+ 承诺 → 至少 1 个方向解析为下一章名
- Cracked / Sealed Frame → 只有 frame 自身的破口或完全无出
- 章节结尾 → Exit 标成 directional (`↑ chapter_name`)

## 5.3 InteriorField 布局

- `@` 默认中心偏下
- Daemon 相对 `@` 右上 2-3 格
- Residues 沿内壁分散，≤4 条
- 高 intensity 承诺用 bright (`\033[1m`) 一瞬
- burned 用 dim + strikethrough
- 不穿越 frame 边界（除 Cracked / Scattered）

## 5.4 Daemon 两层显示

- **标记**：永远在 InteriorField 内某 slot
- **引用**：有引用时在 DAEMON 区出 quote 块；无引用时 DAEMON 区折叠

## 5.5 LLM 决定的 / 模板锁定的

**模板锁定**：
- Frame 变体
- AppShell 区域划分
- Exit 5 态字符
- Residue 权重字符
- Section 层级规则

**LLM 现场决定**：
- `@` / Daemon 在 InteriorField 中的精确位置
- 哪些 residues 显示（基于账本最近 + 矛盾触发）
- NARRATIVE 内容
- DaemonQuote 是否出 + 引哪条
- Exit 解析为哪个章节名（按账本气质）

## 5.6 防退化：家族相似 + 局部改

LLM 每轮**不从零构图**。做：
1. 读上轮 PAGE 作为基线
2. 只改变化的部分：`@` 移位、新 residue 出现、Frame 状态切换
3. 结构稳定 80%，内容微调 20%

## 5.7 章节转场的视觉

转场不是突变：
- 前 1-2 轮：TransitionHint 从 frame 外沿冒出
- 转场瞬间：Frame 变体切换 + NARRATIVE 明确宣告
- 转场后：新 Frame，保留最后一条 residue 作为连续性锚

---

# 6 · 还没解决的 / 开放问题

1. **跨终端字符宽度**：中文 + 方框字符在不同 terminal 可能错位一格。要不要全英半角 frame？
2. **色彩策略**：Aporia 是冷色（monochrome dim）还是有**决定性的色彩瞬间**？（Daemon 引用时 flash 金色？）
3. **输入区是否与 page 同屏**：CC 插件的输入是固定在底部的，我们控制不了。
4. **章节之间的"走"**：转场瞬间是否需要 1-2 行过渡动画（通过多次 print + sleep）？
5. **Residue 的顺序**：按时间倒序、按 intensity 降序、还是按语义相关？
6. **Last God L4 时刻的视觉**：改写文件时，屏幕上发生什么？

---

# 7 · 最小可实装集（v0）

如果现在要落地，只做：

- [ ] Component：Frame × 3 态（Pristine / Cracked / Ruined）
- [ ] Component：PlayerMarker × 2（· / @）
- [ ] Component：DaemonMarker × 1（◇）
- [ ] Component：Exit × 3（? / named / crack）
- [ ] Component：CommitmentResidue × 1（dim fresh）
- [ ] Module：FrameWithExits + InteriorField + DaemonQuote
- [ ] Page：Beginning + Echo + Grounding + Last God
- [ ] AppShell：写进 CLAUDE.md 作为**每轮必出的视觉协议**

其他章节、Frame 变体、状态——v0.5 再说。
