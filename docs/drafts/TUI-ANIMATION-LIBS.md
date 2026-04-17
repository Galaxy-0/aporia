# TUI Animation Libraries for Aporia — Technical Candidate Review

> 目的：评估将动效（转场 / 燃烧 / typewriter / Daemon flash / 字符级粒子）引入 Aporia 的技术路径，Aporia 当前是 CC 插件 + bash 账本 + 静态 ANSI 静帧。
> 方法：只看还能用的开源库，每个查具体能力、代码示例、上手难度、与 CC 插件架构的兼容性。
> 调研时间：2026-04-17

---

## 0. TL;DR

1. **推荐 terminaltexteffects (TTE)** 作为"局部动画注入器"：字符级效果 40+ 个现成的（Burn / Crumble / Scattered / Decrypt / BlackHole / Beams / Matrix / Wipe…）**几乎是 Aporia 玻意视觉词汇的一对一映射**。以 `uv tool install` 的子进程方式调用，或作为 Python 库在 hook 里跑短动画。**不需要替换 bash 账本，不需要替换 CC 插件**。
2. **第二候选：asciimatics**。当你真的要做多层叠加场景（`@` + Daemon + Residues + 背景粒子同屏运动）时，它的 Scene/Effect/Sprite/Particle 模型是唯一顺手的 Python 方案。但它要求你接管整个屏幕（`Screen.wrapper`），与 CC 输入区冲突，**只适合"转场全屏黑幕"那种独占时刻**。
3. **不推荐现在重写成 Textual / Bubble Tea / Ink**——Aporia 的价值在 LLM 现场作画，不在控件树。把 TUI 框架抬进来会**反转架构**：从"LLM 生成画面"变成"控件状态机绘画"，与 Aporia 的哲学气质对齐成本极高。
4. **Rich Live** 作为第三候选，**渐进式方案的事实选择**——你已经在 ANSI 输出，Rich 的 `Live` 能直接在一次响应里做 typewriter / fade / 字符渐显，代价最低（Rich 基本是 Python TUI 的 lingua franca）。

**最终落地建议**（详见 §4）：**Rich Live 做呼吸 / typewriter / dim-to-bright flash（90% 场景）+ TTE 做章节转场和"燃烧/崩解"关键一瞬（10% 场景）**。两者组合，不动 CC 插件架构。

---

## 1. 库深度评估

### 1.1 Textual (Python)

| 项 | 值 |
|---|---|
| 语言 | Python |
| 许可 | MIT |
| 维护者 | Textualize (Will McGugan 团队) |
| 定位 | 现代 TUI 应用框架，像 CSS+组件树一样构建终端应用 |

**动画原语**：`widget.styles.animate("opacity", value=0.0, duration=2.0)`。可动画属性限于 **style 属性**（opacity, offset, scrollbar 等），支持 **easing** (`in_out_cubic` 默认) + `delay` + `on_complete` 回调。

**代码示例**：
```python
from textual.app import App, ComposeResult
from textual.widgets import Static

class Fade(App):
    def compose(self) -> ComposeResult:
        self.box = Static("◇")
        yield self.box
    def on_mount(self):
        self.box.styles.animate("opacity", value=0.0, duration=2.0)

Fade().run()
```

**对 Aporia 适配度**：
- 转场动画：7/10（widget opacity / offset 能做 fade 和滑入，但不是字符级）
- 字符级特效：**2/10**（官方文档不支持 typewriter / 粒子 / 燃烧——Static 是原子，内部字符不可单独控制）
- 与 LLM 驱动架构兼容性：**3/10**（要把 Aporia 反过来写成 Textual App，LLM 产出的字符串塞进 Static 里。**架构反转**）
- 上手成本：中高（CSS + 组件树范式，约 2-3 天彻底吃下）

**综合：5/10。** 它很好，但不是 Aporia 要的那种"好"。

**在哪些已知项目用过**：Posting (HTTP client)，Elia (LLM chat)，Harlequin (SQL IDE)——都是**应用型 TUI**，不是艺术型。

**接入 Aporia 的代价**：**高**。要把 `/play` 命令改成"启动 Textual 子应用"，从此 CC 对话流变成 Textual 应用的外围。不推荐。

---

### 1.2 Rich (Python) — Live Display

| 项 | 值 |
|---|---|
| 语言 | Python |
| 许可 | MIT |
| 维护者 | Textualize |
| 定位 | 终端富文本库；`rich.live.Live` 在一次调用里局部重绘 |

**动画原语**：
- `Live(renderable, refresh_per_second=30)` 在原地重绘任意 renderable
- 配合 `time.sleep` + 循环 → typewriter / fade / 呼吸
- 不提供 easing / tween，自己算

**代码示例**（Daemon flash + typewriter 组合）：
```python
from rich.console import Console
from rich.live import Live
from rich.text import Text
import time

console = Console()
msg = "「应该有路」——你第 2 轮说的。它还挂在那里。"

# Daemon flash: dim → bright → dim
with Live(refresh_per_second=30, console=console) as live:
    # flash 金色
    for style in ["dim yellow", "bold yellow", "yellow", "dim yellow"]:
        live.update(Text(msg, style=style))
        time.sleep(0.15)
    # typewriter 回到正常
    out = Text()
    for ch in msg:
        out.append(ch, style="dim italic")
        live.update(out)
        time.sleep(0.02)
```

**对 Aporia 适配度**：
- 转场动画：6/10（能 fade 整帧，换 frame 变体时直接替换）
- 字符级特效：**8/10**（Text 可逐字符打样，完全掌控每一格 style）
- 与 LLM 驱动架构兼容性：**9/10**（LLM 吐字符串 → Rich 包一层 Text → Live 播放。零侵入）
- 上手成本：**低**（1 小时）

**综合：8/10。** Rich 已经是 Python TUI 的 lingua franca，几乎所有现代 Python CLI 都用它渲染 ANSI。

**在哪些已知项目用过**：pip, pipx, poetry, httpx, pytest (via rich traceback)——基本已是 Python 生态基础设施。

**接入 Aporia 的代价**：**极低**。在 `tools/render.py`（或 hook）里写个函数，LLM 产出的 PAGE 字符串传进去，Rich 负责 typewriter 和 flash。**不改 bash 账本，不改 CC 插件配置**。

---

### 1.3 asciimatics (Python)

| 项 | 值 |
|---|---|
| 语言 | Python |
| 许可 | Apache 2.0 |
| 版本 | v1.15 (2023-10) — 成熟但维护频率低 |
| 定位 | 专做 ASCII 动画的老牌艺术向库，Scene/Effect/Sprite/Particle 四件套 |

**动画原语**（Aporia 正缺的那些）：
- **Sprite**：位置 + 帧序列动画的 `@`（可以做"@ 从 · 到 @ 的蜕变"）
- **Particles**：`Stars`, `Explosion`, `PalmFirework`（粒子系统完全符合"散点 / 碎裂"字符词汇）
- **Effects**：`Cycle`（色循环）, `Print`（打字机）, `Mirage`（淡入淡出）, `BannerText`（滑入）
- **Renderers**：`FigletText`, `StaticRenderer`, `Rainbow`, `Fire` (燃烧！), `Plasma`
- **Scene transitions**：内建 `screen.play([scene1, scene2])` 带切换

**代码示例**（转场 + 粒子）：
```python
from asciimatics.effects import Print, Stars, Mirage
from asciimatics.renderers import StaticRenderer, Fire
from asciimatics.scene import Scene
from asciimatics.screen import Screen

def aporia_scene(screen):
    frame_ascii = """┌──────────────────────────┐
│                          │
│         @      ◇         │
│                          │
└──────────────────────────┘"""
    effects = [
        Stars(screen, 50),                              # 背景粒子
        Print(screen, StaticRenderer([frame_ascii]),
              screen.height // 2 - 3, speed=1),         # typewriter 渲 frame
        Mirage(screen, StaticRenderer(["「应该」"]),
               screen.height - 5, 3),                   # Daemon 引文淡入淡出
    ]
    screen.play([Scene(effects, 120)])

Screen.wrapper(aporia_scene)
```

**`Fire` renderer** 是扬弃燃烧动画的现成方案——把要烧的承诺词喂进去就有真火焰 ASCII。

**对 Aporia 适配度**：
- 转场动画：**9/10**（Scene 切换是原生能力）
- 字符级特效：**9/10**（Sprite + 粒子 + Fire renderer，艺术向第一梯队）
- 与 LLM 驱动架构兼容性：**5/10**（`Screen.wrapper` 独占终端，LLM 不能在此期间输出。**只能作为"章节转场全屏动画"的独占时刻**，播完回到 CC 对话流）
- 上手成本：中（Scene/Effect 心智模型约半天）

**对用户特别关心的 §3：asciimatics 会不会太"游戏化"？**
会。默认 `Stars` + `Fireworks` 有很强的 90s 骇客文化味。**但**如果只选择性使用 `Print` (typewriter) + `Mirage` (fade) + `Fire`（燃烧扬弃）+ 自定义 Sprite，**完全可以保持哲学气质**——关键是**忌用彩虹 / Figlet 大字 / Fireworks**。这些都是"太游戏化"的元凶。

**综合：7/10。** 为"章节转场"和"Last God 仪式"这种独占全屏时刻量身定做，但不是日常渲染方案。

**在哪些已知项目用过**：[Colony 模拟游戏](https://github.com/peterbrittain/colony)、[curses-like roguelikes](https://github.com/peterbrittain/asciimatics/wiki/Built-With-Asciimatics)；最知名的是它自己的 `demo.py` 系列。

**接入 Aporia 的代价**：**中等**。需要一个独立 Python 脚本 `tools/transitions/<chapter_to_chapter>.py`，在 `/play` 的章节切换 hook 上用 `subprocess` 拉起来播一个 scene 再退出。**不替换 bash 账本，不替换 CC 插件**。

---

### 1.4 terminaltexteffects (TTE) — **重点评估**

| 项 | 值 |
|---|---|
| 语言 | Python |
| 许可 | MIT |
| 维护者 | ChrisBuilds (活跃) |
| 定位 | 专为"文字出场 / 变形"做的 40+ 效果引擎，双模：CLI 管道 + Python 库 |

**动画原语**（Aporia 词汇的直接映射）：

| TTE 效果 | Aporia 用途 |
|---|---|
| `Burn` | **扬弃承诺**（`~~应该~~` 燃烧成灰） |
| `Crumble` | Frame 从 Pristine → Cracked → Ruined 的视觉过渡 |
| `Scattered` | Scattered Frame 章节（Foresight）的入场 |
| `Decrypt` | Daemon 引用时字符扰动 |
| `BlackHole` | Last God L4 触发（判定权交出的视觉）|
| `Beams` | 章节转场（光束扫过后换 Frame） |
| `Matrix` | "沉默权重" 状态的背景噪声 |
| `Print` | typewriter（叙事出字） |
| `Spotlights` | Daemon 引文 flash |
| `Wipe` / `Slide` | 两章之间的过渡 |
| `Rain`, `Waves`, `Smoke`, `Unstable` | 各 Frame 变体的氛围 |

**40+ 效果完整清单**：Beams, BinaryPath, BlackHole, BouncyBalls, Bubbles, Burn, ColorShift, Crumble, Decrypt, ErrorCorrect, Expand, Fireworks, Highlight, LaserEtch, Matrix, MiddleOut, OrbittingVolley, Overflow, Pour, Print, Rain, RandomSequence, Rings, Scattered, Slice, Slide, Smoke, Spotlights, Spray, Swarm, Sweep, SynthGrid, Thunderstorm, Unstable, VHSTape, Waves, Wipe…

**代码示例 — 库模式（frame-by-frame）**：
```python
from terminaltexteffects.effects.effect_burn import Burn

text = "应该有路"  # 要扬弃的承诺
effect = Burn(text)
with effect.terminal_output() as terminal:
    for frame in effect:
        terminal.print(frame)
# 燃烧完退出，回到 CC 的静态 ANSI 主流
```

**代码示例 — 子进程 / CLI 模式**（最无侵入）：
```bash
# 从 Aporia 的 hook 里调用
echo "「应该有路」" | tte spotlights --final-gradient-stops ffaa00
# 或者章节转场：
echo "$(cat frames/grounding.txt)" | tte beams
```

**架构亮点**：`for frame in effect` 返回字符串——**你可以拿到每一帧的纯字符串**，不一定要用它的 terminal renderer。这意味着 TTE 可以作为"字符动画计算后端"，配合 Rich Live 做输出，甚至把帧发给 CC 插件以 print 流的形式吐出来。

**对 Aporia 适配度**：
- 转场动画：**10/10**（Beams / Wipe / Slide 原生就是这个）
- 字符级特效：**10/10**（这库存在的全部理由）
- 与 LLM 驱动架构兼容性：**9/10**（输入是任意字符串，不管你是 LLM 现场画的还是静态模板——完全无关）
- 上手成本：**极低**（`uv tool install terminaltexteffects`，管道就能用）

**综合：9.5/10。** Aporia 视觉语言和 TTE 效果集是**概念级对齐**。Burn → 扬弃、Crumble → Cracked Frame、BlackHole → Last God，几乎是设计师在同一张精神地图上。

**在哪些已知项目用过**：[Mouse Vs Python 博客](https://blog.pythonlibrary.org/2024/09/09/adding-terminal-effects-with-python/) 做过特辑；GitHub 上个人开发者拿它做启动画面 / 安装脚本结束语 / CLI 游戏 intro。**目前还没有大型应用依赖它**——这是风险也是机会（我们可能是早期采用者）。

**接入 Aporia 的代价**：**极低**。
- 作为子进程：Aporia 的 hook 在关键时刻 `subprocess.run(["tte", "burn"], input=commitment_text)`
- 作为库：写一个 `tools/effects.py` 包装几个常用效果函数
- **完全不动** bash 账本 / CC 插件 / CLAUDE.md 协议
- **唯一副作用**：依赖 `pip install terminaltexteffects`，加一行 README

---

### 1.5 urwid (Python)

| 项 | 值 |
|---|---|
| 语言 | Python |
| 许可 | LGPL-2.1 |
| 定位 | 老牌 TUI 框架（2004 起），widget + mainloop |

**动画原语**：无原生动画 API。通过 `MainLoop.set_alarm_in` 定时触发重绘自实现。

**对 Aporia 适配度**：**3/10**。LGPL 对 CC 插件生态可能带来分发问题，且不提供任何字符级效果。老 TUI，不推荐。

**综合：3/10。跳过。**

---

### 1.6 blessed / curses (Python, 底层)

| 项 | 值 |
|---|---|
| 语言 | Python (blessed 是 blessings 的 fork) |
| 许可 | MIT (blessed), PSF (curses) |
| 定位 | 终端控制原语——光标、颜色、键盘 |

**动画原语**：只给原语（`term.move_xy`、`term.clear`），不给效果。

**对 Aporia 适配度**：**4/10**（如果要自己从零写一套动画引擎才选它）。当前 Aporia 已经在用 ANSI 转义——用 blessed 是同级替代，不提升表达力。**跳过**。

---

### 1.7 Bubble Tea (Go)

| 项 | 值 |
|---|---|
| 语言 | Go |
| 许可 | MIT |
| 维护者 | Charm |
| 定位 | Elm 架构 TUI，消息/命令驱动 |

**动画原语**：不提供内建动画效果。用 `tea.Tick` 命令定时发消息，自己在 `Update` 里修状态，`View` 重绘。**每个效果要自己写**。

**代码示例**（打字机骨架）：
```go
type model struct{ shown int; text string }
type tickMsg time.Time
func tick() tea.Cmd { return tea.Tick(50*time.Millisecond, func(t time.Time) tea.Msg { return tickMsg(t) }) }
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    if _, ok := msg.(tickMsg); ok && m.shown < len(m.text) {
        m.shown++; return m, tick()
    }
    return m, nil
}
func (m model) View() string { return m.text[:m.shown] }
```

**对 Aporia 适配度**：
- 转场：7/10（自己写）
- 字符级：6/10（自己写）
- 与 LLM 架构兼容：**2/10**（Go 生态 + Aporia 的 Python/bash hook 栈严重不匹配，要么全栈换 Go）
- 上手：高（Elm 架构学习曲线 + Go 语言迁移）

**综合：4/10。** 技术好，但栈不对。

**在哪些已知项目用过**：`glow`（markdown）、`lazygit`、`gh dash`——企业级 TUI 代表作。

**接入代价**：**高到不合理**。要把 Aporia 重写成 Go 二进制嵌进 CC 插件。**只在"完全脱离 CC 插件成为独立游戏"时考虑**。

---

### 1.8 Harmonica (Go)

| 项 | 值 |
|---|---|
| 语言 | Go |
| 许可 | MIT |
| 维护者 | Charm |
| 定位 | 阻尼弹簧物理动画库（与 TUI 无关，任何 render loop 都能用） |

**动画原语**：`NewSpring(fps, angularFreq, dampingRatio).Update(x, vx, target)` 返回下一帧位置和速度。

**对 Aporia 适配度**：Go 栈不匹配，**1/10**。即使栈匹配，哲学游戏不需要"弹性运动"的感觉。

**综合：1/10。跳过。**

---

### 1.9 Lip Gloss (Go)

| 项 | 值 |
|---|---|
| 语言 | Go |
| 许可 | MIT |
| 定位 | CSS-like 终端样式库（不做动画） |

**对 Aporia 适配度**：**1/10**（纯样式，无动画）。**跳过。**

---

### 1.10 Ink (Node.js)

| 项 | 值 |
|---|---|
| 语言 | JavaScript / TypeScript / React |
| 许可 | MIT |
| 维护者 | Vadim Demedes |
| 定位 | React renderer 给终端（而非 DOM） |

**动画原语**：`useAnimation` hook 提供 frame counter + elapsed + delta。生态插件：`ink-spinner`、`ink-big-text`、`ink-gradient`、`ink-link`、`ink-table`、`cli-cursor`。

**代码示例**（用 hook 写 typewriter）：
```jsx
import {Text} from 'ink';
import {useState, useEffect} from 'react';

const Typewriter = ({text}) => {
    const [shown, setShown] = useState(0);
    useEffect(() => {
        if (shown < text.length) {
            const id = setTimeout(() => setShown(s => s + 1), 40);
            return () => clearTimeout(id);
        }
    }, [shown, text]);
    return <Text>{text.slice(0, shown)}</Text>;
};
```

**对 Aporia 适配度**：
- 转场：6/10（要自己写，但 React 范式顺手）
- 字符级：6/10（要自己写）
- 与 LLM 架构兼容：**5/10**（Node 栈，Aporia 已经是 bash + Python hook——加 Node 等于加第三种运行时）
- 上手：中（要会 React）

**综合：5/10。** 有 GitHub Copilot CLI 等真实项目证明可用，但对 Aporia 是**不必要的生态膨胀**。

**在哪些已知项目用过**：**GitHub Copilot CLI**（动画 ASCII banner 就是 Ink 写的——参考他们的博客 *"From pixels to characters"*），Prisma CLI, Gatsby CLI, Terraform CDK, Shopify Hydrogen。

**接入代价**：**高**——要加 Node.js 依赖和 React 构建。除非 Aporia 决定把整个 UI 层搬到 Node，否则不划算。

---

### 1.11 Ratatui (Rust)

| 项 | 值 |
|---|---|
| 语言 | Rust |
| 许可 | MIT |
| 定位 | `tui-rs` 的社区 fork，Rust 首选 TUI 框架，immediate-mode 渲染 |

**动画原语**：无内建，immediate-mode 意味着每帧你自己画。社区有 `tui-animate` 之类的试验包但不成熟。

**对 Aporia 适配度**：
- Rust 栈不匹配：**1/10**（除非重写整个 Aporia 成 Rust 二进制）

**综合：2/10。跳过。** Ratatui 是做 TUI 应用的最强 Rust 方案，但 Aporia 不是应用、是叙事。

---

### 1.12 Notcurses (C)

| 项 | 值 |
|---|---|
| 语言 | C（有 Python、C++、Rust 绑定） |
| 许可 | Apache 2.0 |
| 维护者 | dankamongmen |
| 定位 | **最强**终端渲染库——能在终端里播视频、做 sixel/kitty 图像、24-bit 色 |

**动画原语**：`notcurses_fade`（真 alpha fade）、精灵 blitting、视频流、粒子、像素级画面（通过 kitty/sixel 协议）。

**对 Aporia 适配度**：
- 转场：10/10（能做到**视频级转场**）
- 字符级：**10/10**（过饱和）
- 兼容性：**3/10**（C 库，Python 绑定质量一般；终端要求高——kitty / iTerm2 / WezTerm 才能发挥，基础 macOS Terminal / tmux 会降级）
- 上手：**高**（C API 风格 + 终端特性协商）

**综合：5/10。** 力量太大，**与 Aporia 气质不合**——Aporia 的价值在"字符的克制"，notcurses 的强项是"像素级富媒体"，用了反而稀释审美。而且依赖 terminfo 和终端能力，在 Claude Code 的默认终端上可能降级成 notcurses-direct（没意义）。

**在哪些已知项目用过**：notcurses 自己的 `ncplayer`（播视频）、`nctetris`、`ncneofetch`；主要是作者个人生态。

**接入代价**：**极高**。要装 C 库 + Python 绑定 + 验证终端能力。**不推荐**。

---

## 2. 对比矩阵

| 库 | 语言 | 转场 | 字符级 | typewriter | fade | 粒子 | 燃烧 | LLM 架构兼容 | 上手 | 总评 |
|---|---|---|---|---|---|---|---|---|---|---|
| Textual | Py | 7 | 2 | × | ✓ widget | × | × | 3 | 中 | 5 |
| **Rich Live** | Py | 6 | 8 | ✓ 手写 | ✓ dim 切 | △ 手写 | △ 手写 | **9** | **低** | **8** |
| asciimatics | Py | **9** | 9 | ✓ Print | ✓ Mirage | ✓ 原生 | ✓ Fire | 5 | 中 | 7 |
| **TTE** | Py | **10** | **10** | ✓ Print | ✓ 多效果 | ✓ Spray/Matrix | ✓ **Burn** | **9** | **极低** | **9.5** |
| urwid | Py | 3 | 3 | × | × | × | × | 5 | 中 | 3 |
| blessed | Py | 2 | 2 | 手写 | 手写 | 手写 | 手写 | 6 | 低 | 4 |
| Bubble Tea | Go | 7 | 6 | 手写 | 手写 | 手写 | 手写 | 2 | 高 | 4 |
| Harmonica | Go | 3 | 1 | × | × | × | × | 1 | 中 | 1 |
| Lip Gloss | Go | 1 | 1 | × | × | × | × | 1 | 低 | 1 |
| Ink | Node | 6 | 6 | 手写 | 手写 | 手写 | 手写 | 5 | 中 | 5 |
| Ratatui | Rust | 5 | 5 | 手写 | 手写 | × | × | 1 | 高 | 2 |
| Notcurses | C | 10 | 10 | ✓ | ✓ 真 alpha | ✓ | △ | 3 | 高 | 5 |

**读表法**：数字是 1-10 分，× 表示不支持/需要全手写，△ 表示半支持，✓ 表示原生。LLM 架构兼容打分考虑了"是否强制重写 Aporia 为某个框架的 app"。

---

## 3. 推荐路径（前三名 + 各自 integration plan）

### 3.1 第一名：TTE（作为子进程效果注入器）

**使命**：关键时刻的字符级视觉事件——扬弃燃烧、章节转场、Last God 触发、Daemon 高强度引用。

**Integration Plan**：
```
1. pyproject 依赖: uv tool install terminaltexteffects  (全局命令 `tte`)
2. Aporia 侧新增:
   - tools/effects/burn.sh       → echo "$1" | tte burn
   - tools/effects/transition.sh → cat "$1" | tte beams
   - tools/effects/blackhole.sh  → echo "$1" | tte blackhole    # Last God
3. CLAUDE.md 协议增加:
   "扬弃发生时 (commitment.burned)，输出 marker `<fx:burn text='...'>`"
4. hook (PostToolUse 或 render hook) 检测 marker:
   - 解析 → 调 tools/effects/burn.sh "{text}"
   - 子进程播完（约 2s）→ 继续返回 CC 对话流
5. 静帧回到 LLM 现场作画，TTE 不介入日常渲染
```

**优点**：零架构改动、效果震撼、可视的"仪式感"。
**风险**：TTE 播放时会清理光标区域——和 CC 的输入框可能打架。**需要在 staging repo 先做一次终端交互验证**。

---

### 3.2 第二名：Rich Live（作为日常渲染升级）

**使命**：每轮响应里的 typewriter（叙事出字）、Daemon flash（dim→bright→dim）、Frame 呼吸（Pristine 态边框微亮暗）。

**Integration Plan**：
```
1. pyproject 依赖: rich (已经基本是必装)
2. 新增 tools/render.py:
   - def render_page(page_str, narrative_str, daemon_quote=None):
       with Live(refresh_per_second=30) as live:
           # 1. Frame 先出 (instant)
           # 2. Narrative typewriter
           # 3. 如果有 daemon: flash 3 次
3. LLM 产出结构化 marker: <page>...</page><narrative>...</narrative><daemon>...</daemon>
4. hook 解析 → 调 render_page
5. status 行维持原样（bash 生成）
```

**优点**：渐进升级，不破坏现有架构，Rich 的 style 系统与 ANSI 协议无缝。
**风险**：CC 的 output 渲染机制可能不喜欢"被 Live 接管过的帧"——**需验证 Live 的 ANSI 输出在被 CC 捕获后的显示**。如果 CC 不逐帧转发 stdout 而是整段收割，Live 的增量更新会塌成一坨。**这是首要验证点**。

---

### 3.3 第三名：asciimatics（仅用于"仪式时刻"独占动画）

**使命**：章节转场的 3-5 秒独占全屏动画（从 Beginning 到 Echo 的 Frame 变形、Last God 的 Ruined 点散化）。

**Integration Plan**：
```
1. pyproject 依赖: asciimatics
2. 每个章节过渡写独立脚本:
   - tools/transitions/beginning_to_echo.py
   - tools/transitions/grounding_to_seyn.py
   - tools/transitions/to_last_god.py
3. 章节切换 hook 检测到 chapter_name 变化时:
   - subprocess.run(["python", f"tools/transitions/{from_}_to_{to_}.py"])
   - 等它退出 (~3s) → 恢复 CC 对话流
4. 不用 asciimatics 做日常渲染
```

**优点**：Scene/Sprite/Particle 模型是多层叠加动画的唯一顺手方案；Fire renderer 天然契合"扬弃"。
**风险**：`Screen.wrapper` 会抢 terminal，CC 的 prompt 会被暂时顶掉；玩家如果中途 Ctrl-C 会让终端进入诡异状态。**不是每个转场都用，只在"哲学性大事件"用**。

---

## 4. 最终落地建议

**三层方案**（按 Aporia 的日常使用频率分配）：

| 场景 | 频率 | 库 | 为什么 |
|---|---|---|---|
| 每轮叙事出字（typewriter） | 高 | **Rich Live** | 轻量，无侵入 |
| Daemon 引用 flash | 中 | **Rich Live** | 3 次 dim→bright→dim 切换就够 |
| Frame 呼吸（可选） | 低 | **Rich Live** | dim 色相循环 |
| 扬弃单个承诺燃烧 | 低（仪式） | **TTE Burn** | 字符级火焰 |
| 章节转场（Beginning → Echo 等） | 极低 | **TTE Beams / Wipe** | 3 秒左右的仪式 |
| Last God L4 触发 | 一生一次 | **TTE BlackHole** 或 **asciimatics Fire + 散点** | 最强视觉 |

**代价总结**：
- 新增 Python 依赖 2 个（rich, terminaltexteffects）、可选 1 个（asciimatics）
- 新增约 200-300 行包装代码（`tools/render.py` + 几个 transition 脚本）
- **CLAUDE.md 协议扩展**：让 LLM 输出 `<fx:...>` 标记
- **CC 插件架构**：完全不动
- **bash 账本**：完全不动

---

## 5. 反模式警告

### 5.1 不要：把 Aporia 重写成 Textual / Bubble Tea / Ink App

原因：
1. **架构反转**。Aporia 现在是"LLM 生成静帧，插件转发"。TUI 框架是"控件树状态机，事件更新"。这两个模型的信息流向相反。改成 TUI app 会让 LLM 从"作者"退化成"填控件的 API"。
2. **哲学气质受损**。TUI 框架天然强调"交互流畅"，Aporia 要的是"字符的重量"。一旦用上 Textual 的 CSS，审美压力会推着你加边框阴影、滚动条、tab 容器——全是哲学游戏不该有的东西。
3. **运行时膨胀**。Bubble Tea / Ink 要引入 Go / Node。Aporia 现在只靠 bash + Python + CC——保持小是一种美学。

### 5.2 不要：用 notcurses

原因：力量过剩。notcurses 的强项是 kitty/sixel 像素级富媒体、视频播放。Aporia 的价值是"字符的克制"。用 notcurses 等于买跑车运豆腐。而且 CC 的终端环境不一定支持它要求的终端协议，可能降级成意义不大的模式。

### 5.3 不要：Harmonica + Aporia

原因：弹簧物理是给"工具 UI"（拖拽、弹出、回弹）做自然感的。哲学游戏不需要"有机运动"——我们要的是**字符的出生和死亡**，不是"Q 弹的过渡"。误用会让 Aporia 变成带弹性的产品 demo。

### 5.4 不要：urwid / blessed 做原生动画

原因：两者都不提供动画原语，你要自己从零写。自己写没问题，但那就是在重造 TTE 的一部分。**不如直接用 TTE**。

### 5.5 不要：同时依赖 Textual + asciimatics + TTE

原因：三个都会接管 terminal。混用会产生光标位置 / ANSI 状态 / 清屏逻辑的竞争条件。选 1-2 个，立规矩。推荐组合：**Rich Live（日常）+ TTE（仪式时刻）**，两者协作良好（Rich 本身不抢 terminal 所有权，TTE 有 `terminal_output()` 上下文明确进入/退出）。

### 5.6 不要：在日常每一轮都跑 TTE 效果

原因：TTE 单个效果 1-3 秒。如果每轮叙事出字都跑一遍 `Print` effect，玩家第 5 轮就会烦。**效果守恒定律**：动画稀缺才有重量。Aporia 每章平均应该只有 1-2 次真动画时刻，其余都应该是静帧或 typewriter 这种"轻动画"。

---

## 6. 开放问题

1. **CC 插件 stdout 捕获模型**：CC 是否把 hook 输出逐帧转发给玩家，还是整段收割？这决定 Rich Live 能不能用。**需要做一次实验**：从 `PostToolUse` hook 里 `print` 带 `\r` 的增量更新，看玩家端是否实时显示。
2. **TTE 播放时 CC 输入框冲突**：TTE 会在当前行之上写动画，之后回到 cursor。玩家的输入提示会不会被吃掉？**需要在真实 CC 环境做一次验证**。
3. **跨章节转场触发点**：是 `PreToolUse`（玩家刚输完，动画作为"进入新章节"的前奏）还是 `PostToolUse`（LLM 回完后，动画作为"章节结束"的收尾）？影响叙事节奏。
4. **色彩预算**：Aporia 至今偏单色（dim grey + 偶尔 white）。TTE 默认效果带彩虹渐变。**需要为每个 effect 固定一个哲学调色板**——例如 Burn 只允许 `--final-gradient-stops 883300 ffaa00`（锈橘），BlackHole 只用灰黑。

---

## 7. 下一步（如果决定走这条路）

**Phase 1（1 天，验证）**：
- [ ] 在 Aporia staging 里装 rich + terminaltexteffects
- [ ] 验证 CC hook 里能否流式输出（关键实验）
- [ ] 验证 TTE 子进程在 CC 终端里能正常播放退出
- [ ] 决定主线：**Rich-only** / **Rich + TTE** / **仅 TTE 仪式**

**Phase 2（2-3 天，落地）**：
- [ ] 写 `tools/render.py`（Rich Live 包装）
- [ ] 写 `tools/effects/{burn,beams,blackhole}.sh`（TTE 管道）
- [ ] 扩展 CLAUDE.md 协议：`<fx:...>` marker 语法
- [ ] 在 render hook 里解析 marker 并派发
- [ ] 跑通 Beginning → Echo 的完整流（含转场动画）

**Phase 3（后续）**：
- [ ] 定义 8 章 × 每章 1-2 个效果时刻的 map
- [ ] 为 Last God 做特别仪式（可能是 asciimatics 的独占 3 秒）
- [ ] 玩家测试：动画时机对哲学氛围的影响

---

## 参考来源

- [TerminalTextEffects GitHub](https://github.com/ChrisBuilds/terminaltexteffects) — MIT, 40+ effects, dual CLI/library
- [TerminalTextEffects Docs](https://chrisbuilds.github.io/terminaltexteffects/) — Library Cookbook 有 `terminal_output()` 上下文管理器 API
- [asciimatics GitHub](https://github.com/peterbrittain/asciimatics) — Apache-2.0, Scene/Effect/Sprite/Particle
- [Textual Animation Guide](https://textual.textualize.io/guide/animation/) — widget style 动画 + easing
- [Rich Live Display](https://rich.readthedocs.io/en/stable/live.html)（403 时可改查 `rich.live` 的 GitHub README）
- [Bubble Tea GitHub](https://github.com/charmbracelet/bubbletea) — Elm 架构 + Harmonica 集成
- [Harmonica GitHub](https://github.com/charmbracelet/harmonica) — 弹簧物理
- [Ink GitHub](https://github.com/vadimdemedes/ink) — React for CLI，`useAnimation` hook
- [GitHub Copilot CLI 动画 banner](https://github.blog/engineering/from-pixels-to-characters-the-engineering-behind-github-copilot-clis-animated-ascii-banner/) — Ink 真实案例
- [Notcurses](https://notcurses.com/) — Apache 2.0（最强但过度）
