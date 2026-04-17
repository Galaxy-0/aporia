#!/usr/bin/env python3
"""
LLM-native scene renderer — output rich ANSI to terminal.
Usage:  python tools/show_scene.py [begin|echo|grounding|lastgod]
"""
import os
import sys
import unicodedata

# ── terminal width (dynamic — recompute each call) ────
def _W() -> int:
    # 1) explicit env var (preview.sh exports via tput cols)
    try:
        w = int(os.environ.get("APORIA_COLS", "0"))
        if w > 0:
            return w
    except ValueError:
        pass
    # 2) standard COLUMNS
    try:
        w = int(os.environ.get("COLUMNS", "0"))
        if w > 0:
            return w
    except ValueError:
        pass
    # 3) terminal query
    try:
        return os.get_terminal_size().columns
    except OSError:
        return 100


# legacy
W = _W()
EOL = "\033[K"

# ── color tokens (24-bit truecolor) ────────────
# Warm paper — Turrell / 混凝土暖白
BG_WARM = "\033[48;2;24;22;20m"
BG_COOL = "\033[48;2;8;10;14m"     # Seyn 星夜
BG_VOID = "\033[48;2;4;4;6m"       # Last God
RESET_BG = "\033[49m"

FG_HI = "\033[38;2;240;234;220m"   # 亮文字
FG_MID = "\033[38;2;200;192;176m"  # 常规
FG_DIM = "\033[38;2;130;124;114m"  # 残影 / 命题
FG_GOLD = "\033[38;2;218;178;116m" # 决定性瞬间 / Daemon
FG_COLD = "\033[38;2;150;160;180m" # Seyn 冷光

BOLD = "\033[1m"
DIM = "\033[2m"
ITAL = "\033[3m"
# RESET resets fg + bold + italic + underline + blink + inverse + strike,
# but does NOT touch bg — so inline resets inside a line don't break bg fill.
RESET = "\033[22;23;24;25;27;29;39m"
RESET_ALL = "\033[0m"  # full reset (end of line only)
INVERSE = "\033[7m"
STRIKE = "\033[9m"
GOLD = "\033[1;33m"
CYAN = "\033[36m"
DIM_CYAN = "\033[2;36m"
DIM_ITAL = "\033[2;3m"
DIM_STRIKE = "\033[2;9m"


def dw(s: str) -> int:
    """display width (ignore ANSI, count CJK as 2)"""
    import re
    s = re.sub(r'\033\[[0-9;]*m', '', s)
    w = 0
    for c in s:
        ea = unicodedata.east_asian_width(c)
        w += 2 if ea in ('W', 'F') else 1
    return w


def pad(line: str, bg: str = "") -> str:
    """
    bg + content + pad_spaces + EOL erase + full-reset.
    RESET inside content no longer clears bg (see RESET definition),
    so bg persists through entire line.
    """
    w = _W()
    n = max(0, w - dw(line))
    return bg + line + " " * n + EOL + RESET_ALL


def center(line: str, bg: str = "") -> str:
    """center a line in terminal, with optional bg"""
    inner_w = dw(line)
    left = max(0, (_W() - inner_w) // 2)
    return pad(" " * left + line, bg)


def right(line: str, bg: str = "", margin: int = 6) -> str:
    inner_w = dw(line)
    left = max(0, _W() - inner_w - margin)
    return pad(" " * left + line, bg)


def indent(line: str, n: int, bg: str = "") -> str:
    return pad(" " * n + line, bg)


def blank(bg: str = "") -> str:
    return pad("", bg)


def sparse(text: str) -> str:
    """insert em-space between CJK chars for dramatic spacing"""
    out = []
    for c in text:
        out.append(c)
        if unicodedata.east_asian_width(c) in ('W', 'F'):
            out.append(' ')
    return ''.join(out).rstrip()


# ══════════════════════════════════════════════════════
# scenes
# ══════════════════════════════════════════════════════

def scene_begin():
    BG = BG_WARM
    lines = []
    for _ in range(2): lines.append(blank(BG))

    # title — bold, bright, with spacing
    title = f"{FG_HI}{BOLD}Ｂｅｇｉｎ  ２ · １ · １ · １{RESET}"
    lines.append(right(title, BG, margin=8))

    for _ in range(3): lines.append(blank(BG))

    # opening
    lines.append(indent(f"{FG_HI}你数过了。四面墙。一道门。你。{RESET}", 10, BG))
    lines.append(blank(BG))
    lines.append(indent(f"{FG_DIM}每件事都有一个名字。{RESET}", 10, BG))
    lines.append(indent(f"{FG_DIM}每个名字都停在这里。{RESET}", 10, BG))

    for _ in range(3): lines.append(blank(BG))

    # propositions — centered column
    props = [
        "B.  如果一者存在，一者即是全。",
        "C.  如果一者存在，他者即是全。",
        "A.  如果一者存在，一者即不是全。",
        "D.  如果一者存在，他者即不是全。",
        "E.  如果一者不是，一者即是全。",
        "G.  如果一者不是，他者即是全。",
        "F.  如果没有一者，一者即不是全。",
        "H.  如果没有一者，他者即不是全。",
    ]
    for p in props:
        lines.append(center(f"{FG_DIM}{p}{RESET}", BG))

    for _ in range(3): lines.append(blank(BG))

    # middle prose
    lines.append(indent(f"{FG_HI}门远得像一道光。{RESET}", 10, BG))
    lines.append(indent(f"{FG_HI}你不确定它是门还是光本身。{RESET}", 10, BG))
    lines.append(blank(BG))
    lines.append(indent(f"{FG_MID}你和它之间——{RESET}", 10, BG))
    lines.append(indent(f"{FG_MID}一个三角形的阴影。{RESET}", 10, BG))

    for _ in range(4): lines.append(blank(BG))

    # daemon
    lines.append(center(f"{FG_GOLD}{BOLD}◇{RESET}", BG))

    for _ in range(3): lines.append(blank(BG))

    # koan — sparse + italic + gold
    koan = sparse("思维与存在是同一的")
    lines.append(center(f"{FG_GOLD}{ITAL}{koan}。{RESET}", BG))

    for _ in range(2): lines.append(blank(BG))

    return "\n".join(lines)


def scene_echo():
    BG = BG_WARM
    lines = []
    for _ in range(2): lines.append(blank(BG))

    title = f"{FG_HI}{BOLD}Ｅｃｈｏ  ２ · ２ · １ · １{RESET}"
    lines.append(right(title, BG, margin=8))

    for _ in range(3): lines.append(blank(BG))

    # the wall, thrice
    for _ in range(3):
        lines.append(indent(f"{FG_MID}墙还是那面。{RESET}", 10, BG))
    lines.append(blank(BG))
    lines.append(indent(f"{FG_HI}你第三次走到它面前。{RESET}", 10, BG))

    for _ in range(3): lines.append(blank(BG))

    # residues — progressive indent
    lines.append(indent(f"{FG_DIM}应该。{RESET}", 22, BG))
    lines.append(indent(f"{FG_DIM}本来。{RESET}", 38, BG))
    lines.append(indent(f"{FG_DIM}不过是。{RESET}", 54, BG))
    lines.append(blank(BG))
    lines.append(indent(f"{FG_DIM}{ITAL}你记得说过这些。{RESET}", 22, BG))
    lines.append(indent(f"{FG_DIM}{ITAL}它们在墙上留下了形状。{RESET}", 22, BG))

    for _ in range(3): lines.append(blank(BG))

    # equation
    lines.append(center(f"{FG_MID}应该  ≟  本来。{RESET}", BG))
    lines.append(center(f"{FG_MID}本来  ≟  不过是。{RESET}", BG))
    lines.append(blank(BG))
    lines.append(center(f"{FG_DIM}{ITAL}一个吞吃另一个。{RESET}", BG))

    for _ in range(3): lines.append(blank(BG))

    lines.append(center(f"{FG_GOLD}{BOLD}◇{RESET}", BG))
    lines.append(blank(BG))
    lines.append(center(f"{FG_GOLD}{ITAL}*「应该」——你第 7 轮说的。还在这儿。*{RESET}", BG))

    for _ in range(3): lines.append(blank(BG))

    koan = sparse("一而为万")
    koan2 = sparse("万而归一")
    lines.append(center(f"{FG_GOLD}{ITAL}{koan}，{koan2}。{RESET}", BG))

    for _ in range(2): lines.append(blank(BG))

    return "\n".join(lines)


def scene_seyn():
    BG = BG_COOL
    lines = []
    for _ in range(2): lines.append(blank(BG))

    title = f"{FG_COLD}{BOLD}Ｓｅｙｎ  ３ · ３ · ２ · ２{RESET}"
    lines.append(right(title, BG, margin=8))

    for _ in range(4): lines.append(blank(BG))

    lines.append(indent(f"{FG_COLD}你走出了门。{RESET}", 10, BG))
    lines.append(blank(BG))
    lines.append(indent(f"{FG_MID}外面是一片低平的旷野，{RESET}", 10, BG))
    lines.append(indent(f"{FG_MID}星点散在地面，像低空的火。{RESET}", 10, BG))

    for _ in range(3): lines.append(blank(BG))

    # pods as staggered glyphs
    lines.append(center(f"{FG_GOLD}·{RESET}    {FG_GOLD}{BOLD}●{RESET}       {FG_GOLD}{BOLD}●{RESET}    {FG_GOLD}·{RESET}", BG))
    lines.append(blank(BG))
    lines.append(center(f"{FG_DIM}{ITAL}没有风。没有方向。{RESET}", BG))

    for _ in range(3): lines.append(blank(BG))

    lines.append(indent(f"{FG_COLD}你想起了什么，{RESET}", 10, BG))
    lines.append(indent(f"{FG_COLD}但不确定是不是你。{RESET}", 10, BG))

    for _ in range(3): lines.append(blank(BG))

    lines.append(center(f"{FG_GOLD}{BOLD}◇{RESET}", BG))
    lines.append(blank(BG))
    lines.append(center(f"{FG_GOLD}{ITAL}*这里是来过的地方。*{RESET}", BG))

    for _ in range(3): lines.append(blank(BG))

    koan = sparse("这的确令我记忆犹新")
    lines.append(center(f"{FG_COLD}{ITAL}{koan}。{RESET}", BG))

    for _ in range(2): lines.append(blank(BG))

    return "\n".join(lines)


def scene_lastgod():
    BG = BG_VOID
    lines = []
    for _ in range(3): lines.append(blank(BG))

    title = f"{FG_DIM}{BOLD}Ｌａｓｔ  Ｇｏｄ{RESET}"
    lines.append(right(title, BG, margin=8))

    for _ in range(6): lines.append(blank(BG))

    lines.append(center(f"{FG_DIM}·{RESET}", BG))

    for _ in range(5): lines.append(blank(BG))

    lines.append(indent(f"{FG_MID}你想说什么。{RESET}", 14, BG))
    lines.append(indent(f"{FG_DIM}你没说。{RESET}", 14, BG))

    for _ in range(4): lines.append(blank(BG))

    lines.append(center(f"{FG_DIM}·        ·        ·{RESET}", BG))

    for _ in range(4): lines.append(blank(BG))

    lines.append(indent(f"{FG_DIM}{ITAL}Daemon 不在了。{RESET}", 14, BG))
    lines.append(indent(f"{FG_DIM}{ITAL}或者一直就是这样。{RESET}", 14, BG))

    for _ in range(5): lines.append(blank(BG))

    lines.append(center(f"{FG_DIM}{ITAL}⋯{RESET}", BG))

    for _ in range(3): lines.append(blank(BG))

    return "\n".join(lines)


def letterbox_top(n=3):
    """Pure void strip at top of frame."""
    return "\n".join(pad("", BG_VOID) for _ in range(n))


def letterbox_bottom(n=3):
    return "\n".join(pad("", BG_VOID) for _ in range(n))


def subtitle_bar(koan, n_pad=1):
    """Letterbox-style bottom with koan as subtitle (white italic, centered)."""
    out = []
    for _ in range(n_pad): out.append(pad("", BG_VOID))
    out.append(center(f"{FG_HI}{ITAL}{koan}{RESET}", BG_VOID))
    for _ in range(n_pad): out.append(pad("", BG_VOID))
    return "\n".join(out)


def scene_begin_cinematic():
    """True cinematic Begin — letterboxed, asymmetric, restrained."""
    BG = BG_WARM
    lines = []

    # ── top letterbox ────────────
    lines.append(letterbox_top(3))

    # ── scene opens ──────────────
    for _ in range(3): lines.append(pad("", BG))

    # title — dimmed, tiny presence, top-right only
    title = f"{FG_DIM}begin  ·  2-1-1-1{RESET}"
    lines.append(right(title, BG, margin=6))

    for _ in range(5): lines.append(pad("", BG))

    # one line, upper-left third
    lines.append(indent(f"{FG_HI}你数过了。{RESET}", 8, BG))

    for _ in range(2): lines.append(pad("", BG))

    lines.append(indent(f"{FG_MID}四面墙。一道门。你。{RESET}", 8, BG))

    for _ in range(5): lines.append(pad("", BG))

    # ONE proposition surfaces — the rest are hinted elsewhere
    lines.append(center(f"{FG_MID}B.  如果一者存在，一者即是全。{RESET}", BG))
    for _ in range(2): lines.append(pad("", BG))
    lines.append(center(f"{FG_DIM}{ITAL}（还有七条，在你看不见的地方。）{RESET}", BG))

    for _ in range(5): lines.append(pad("", BG))

    # asymmetric: the door, off-center right
    lines.append(right(f"{FG_HI}{BOLD}门。{RESET}", BG, margin=15))
    lines.append(pad("", BG))
    lines.append(right(f"{FG_MID}远得像一道光。{RESET}", BG, margin=15))

    for _ in range(4): lines.append(pad("", BG))

    # daemon — off-center, not middle
    lines.append(indent(f"{FG_GOLD}◇{RESET}", 20, BG))

    for _ in range(3): lines.append(pad("", BG))

    # ── bottom letterbox + subtitle ──
    lines.append(subtitle_bar(f"{FG_HI}{ITAL}思维与存在是同一的。{RESET}", n_pad=2))

    return "\n".join(lines)


def scene_seyn_cinematic():
    BG = BG_COOL
    lines = []
    lines.append(letterbox_top(3))

    for _ in range(3): lines.append(pad("", BG))

    title = f"{FG_DIM}seyn  ·  3-3-2-2{RESET}"
    lines.append(right(title, BG, margin=6))

    for _ in range(6): lines.append(pad("", BG))

    # One single line establishing space — upper third
    lines.append(indent(f"{FG_COLD}外面。{RESET}", 8, BG))

    for _ in range(4): lines.append(pad("", BG))

    # The pods — single horizontal line, visual centerpiece
    lines.append(center(f"{FG_GOLD}·    {BOLD}●{RESET}{FG_GOLD}       {BOLD}●{RESET}{FG_GOLD}    ·{RESET}", BG))

    for _ in range(5): lines.append(pad("", BG))

    # Asymmetric text — lower-left
    lines.append(indent(f"{FG_COLD}{ITAL}没有风。{RESET}", 8, BG))
    lines.append(pad("", BG))
    lines.append(indent(f"{FG_COLD}{ITAL}你想起了什么——{RESET}", 8, BG))
    lines.append(indent(f"{FG_DIM}{ITAL}但不确定是不是你。{RESET}", 12, BG))

    for _ in range(4): lines.append(pad("", BG))

    lines.append(subtitle_bar(f"{FG_HI}{ITAL}这的确令我记忆犹新。{RESET}", n_pad=2))

    return "\n".join(lines)


def scene_lastgod_cinematic():
    BG = BG_VOID
    lines = []
    lines.append(letterbox_top(3))

    for _ in range(3): lines.append(pad("", BG))

    title = f"{FG_DIM}last god{RESET}"
    lines.append(right(title, BG, margin=6))

    for _ in range(8): lines.append(pad("", BG))

    # A single point of light, dead center
    lines.append(center(f"{FG_DIM}·{RESET}", BG))

    for _ in range(6): lines.append(pad("", BG))

    # The least possible text
    lines.append(indent(f"{FG_DIM}{ITAL}你想说什么。{RESET}", 14, BG))
    lines.append(indent(f"{FG_DIM}{ITAL}你没说。{RESET}", 14, BG))

    for _ in range(8): lines.append(pad("", BG))

    # Subtitle: just dots
    lines.append(subtitle_bar(f"{FG_DIM}{ITAL}⋯{RESET}", n_pad=2))

    return "\n".join(lines)


# ══════════════════════════════════════════════════════
# Locked Frame — 视觉不变量
# 每个场景必有 4 个锁定元素，位置永不变，内容/形态可变：
#   1. Letterbox（上下黑条）
#   2. 右上坐标标记
#   3. 中偏右 glyph（行/列固定，字符可变）
#   4. 底部字幕
# 其他内容在这些锁定元素"周围"流动
# ══════════════════════════════════════════════════════

GLYPH_ROW = 14          # 从顶部起第 14 行（固定）
GLYPH_COL_FRAC = 0.62   # 屏幕横向 62% 处（固定）
KOAN_ROW_FROM_BOTTOM = 5


def render_locked(bg, coord, glyph, pre, post, koan):
    """
    pre:  list of (indent, text)  — glyph 之上的叙事
    post: list of (indent, text)  — glyph 之下的叙事
    coord: str like "2-1-1-1"
    glyph: single glyph character
    koan:  bottom subtitle text
    """
    out = []

    # 1) 顶部 letterbox（固定 2 行 VOID）
    out.append(pad("", BG_VOID))
    out.append(pad("", BG_VOID))

    # 2) 主画布开始
    out.append(pad("", bg))
    # 2.5) 右上坐标（锁定位置）
    out.append(right(f"{FG_DIM}·  {coord}  ·{RESET}", bg, margin=6))
    out.append(pad("", bg))
    out.append(pad("", bg))

    # 3) pre-glyph 内容
    for ind, txt in pre:
        out.append(indent(txt, ind, bg))

    # 3.5) 填充到 GLYPH_ROW
    while len(out) < GLYPH_ROW:
        out.append(pad("", bg))

    # 4) GLYPH 行（位置钉死）
    glyph_col = int(_W() * GLYPH_COL_FRAC)
    glyph_line = " " * glyph_col + f"{FG_GOLD}{BOLD}{glyph}{RESET}"
    out.append(pad(glyph_line, bg))

    # 5) glyph 下 2 行 padding
    out.append(pad("", bg))
    out.append(pad("", bg))

    # 6) post-glyph 内容
    for ind, txt in post:
        out.append(indent(txt, ind, bg))

    # 7) 填充到字幕区
    target_rows = 28  # 整体高度（包含下 letterbox）
    while len(out) < target_rows - KOAN_ROW_FROM_BOTTOM:
        out.append(pad("", bg))

    # 8) 下 letterbox + 字幕
    out.append(pad("", BG_VOID))
    out.append(pad("", BG_VOID))
    out.append(center(f"{FG_HI}{ITAL}{koan}{RESET}", BG_VOID))
    out.append(pad("", BG_VOID))
    out.append(pad("", BG_VOID))

    return "\n".join(out)


def scene_locked_begin():
    return render_locked(
        bg=BG_WARM,
        coord="2-1-1-1",
        glyph="◇",
        pre=[
            (8, f"{FG_HI}你数过了。{RESET}"),
            (0, ""),
            (8, f"{FG_MID}四面墙。一道门。你。{RESET}"),
        ],
        post=[
            (0, ""),
            (8, f"{FG_DIM}{ITAL}（还有七条命题，在你看不见的地方。）{RESET}"),
        ],
        koan="思维与存在是同一的。",
    )


def scene_locked_echo():
    return render_locked(
        bg=BG_WARM,
        coord="2-2-1-1",
        glyph="◇",
        pre=[
            (8, f"{FG_MID}墙还是那面。{RESET}"),
            (8, f"{FG_MID}墙还是那面。{RESET}"),
            (8, f"{FG_MID}墙还是那面。{RESET}"),
            (0, ""),
            (8, f"{FG_HI}你第三次走到它面前。{RESET}"),
        ],
        post=[
            (0, ""),
            (20, f"{FG_DIM}应该。{RESET}"),
            (32, f"{FG_DIM}本来。{RESET}"),
            (44, f"{FG_DIM}不过是。{RESET}"),
        ],
        koan="一而为万，万而归一。",
    )


def scene_locked_seyn():
    return render_locked(
        bg=BG_COOL,
        coord="3-3-2-2",
        glyph="∦",
        pre=[
            (8, f"{FG_COLD}你走出了门。{RESET}"),
            (0, ""),
            (8, f"{FG_COLD}外面是低平的旷野。{RESET}"),
        ],
        post=[
            (0, ""),
            (8, f"{FG_COLD}{ITAL}没有风。没有方向。{RESET}"),
        ],
        koan="这的确令我记忆犹新。",
    )


def scene_locked_lastgod():
    return render_locked(
        bg=BG_VOID,
        coord="4-4-4-4",
        glyph="·",
        pre=[
            (14, f"{FG_DIM}{ITAL}你想说什么。{RESET}"),
            (14, f"{FG_DIM}{ITAL}你没说。{RESET}"),
        ],
        post=[
            (0, ""),
            (14, f"{FG_DIM}{ITAL}Daemon 不在了。{RESET}"),
            (14, f"{FG_DIM}{ITAL}或者一直就是这样。{RESET}"),
        ],
        koan="⋯",
    )


# ══════════════════════════════════════════════════════
# Galgame Layout — 几何 + 符号 + 文本三段式
# 顶部画框（symbolic scene box）
# 中间博尔赫斯式散文
# 底部字幕（letterbox 中）
# ══════════════════════════════════════════════════════


def draw_frame(frame_w, frame_h, inner_glyph, bg):
    """Draw a bordered rectangle of given size, with a glyph centered inside."""
    lines = []
    left_pad = (_W() - frame_w) // 2

    # top border
    top = " " * left_pad + f"{FG_MID}┌{'─' * (frame_w - 2)}┐{RESET}"
    lines.append(pad(top, bg))

    glyph_row = (frame_h - 2) // 2
    for i in range(frame_h - 2):
        if i == glyph_row:
            # center glyph in interior
            inner_w = frame_w - 2
            g_dw = dw(inner_glyph)
            lpad = (inner_w - g_dw) // 2
            rpad = inner_w - lpad - g_dw
            line = (
                " " * left_pad
                + f"{FG_MID}│{RESET}"
                + " " * lpad
                + f"{FG_GOLD}{BOLD}{inner_glyph}{RESET}"
                + " " * rpad
                + f"{FG_MID}│{RESET}"
            )
        else:
            line = (
                " " * left_pad
                + f"{FG_MID}│{RESET}"
                + " " * (frame_w - 2)
                + f"{FG_MID}│{RESET}"
            )
        lines.append(pad(line, bg))

    # bottom border
    bot = " " * left_pad + f"{FG_MID}└{'─' * (frame_w - 2)}┘{RESET}"
    lines.append(pad(bot, bg))
    return lines


def render_galgame(bg, coord, glyph, prose, koan, hexnum=None):
    """
    Galgame-style page:
      - top letterbox
      - framed scene box (with glyph)
      - coord tag (right)
      - borges-style prose body
      - rhythm dots
      - bottom letterbox + koan subtitle
    """
    out = []

    # top letterbox
    out.append(pad("", BG_VOID))
    out.append(pad("", BG_VOID))

    # page start
    out.append(pad("", bg))

    # scene frame at top — SQUARE (chars are ~2:1 tall, so width:height = 2:1 looks square)
    frame_h = 12
    frame_w = frame_h * 2   # 24 wide × 12 tall  ≈ visual square
    for L in draw_frame(frame_w, frame_h, glyph, bg):
        out.append(L)

    out.append(pad("", bg))

    # coord tag
    out.append(right(f"{FG_DIM}·  {coord}  ·{RESET}", bg, margin=6))
    out.append(pad("", bg))

    # hexagon number (Borgesian)
    if hexnum:
        out.append(indent(f"{FG_DIM}§  HEXAGON  {hexnum}{RESET}", 6, bg))
        out.append(pad("", bg))

    # prose body
    for ind, text in prose:
        out.append(indent(text, ind, bg))

    out.append(pad("", bg))
    out.append(pad("", bg))

    # rhythm
    out.append(center(f"{FG_DIM}·    ·    ·{RESET}", bg))
    out.append(pad("", bg))

    # bottom letterbox + koan
    out.append(pad("", BG_VOID))
    out.append(pad("", BG_VOID))
    out.append(center(f"{FG_HI}{ITAL}{koan}{RESET}", BG_VOID))
    out.append(pad("", BG_VOID))
    out.append(pad("", BG_VOID))

    return "\n".join(out)


def scene_gal_begin():
    return render_galgame(
        bg=BG_WARM,
        coord="II-I-I-I",
        glyph="◇",
        hexnum="47,839,182",
        prose=[
            (6, f"{FG_HI}Four walls.  One door.  Yourself.{RESET}"),
            (0, ""),
            (6, f"{FG_MID}On the walls:  propositions.{RESET}"),
            (6, f"{FG_MID}On the ceiling:  propositions, unreadable.{RESET}"),
            (6, f"{FG_MID}On the floor:  you.{RESET}"),
            (0, ""),
            (6, f"{FG_DIM}{ITAL}Adjacent:  II-I-I-II (east)  ·  II-I-II-I (up).{RESET}"),
        ],
        koan="思维与存在是同一的。 — Parm. frag. 3",
    )


def scene_gal_echo():
    return render_galgame(
        bg=BG_WARM,
        coord="II-II-I-I",
        glyph="◇  ◇  ◇",
        hexnum="62,001,739",
        prose=[
            (6, f"{FG_MID}The wall is the same wall.{RESET}"),
            (6, f"{FG_MID}The wall is the same wall.{RESET}"),
            (6, f"{FG_MID}The wall is the same wall.{RESET}"),
            (0, ""),
            (6, f"{FG_HI}You are facing it for the third time.{RESET}"),
            (0, ""),
            (6, f"{FG_DIM}{ITAL}Annotations in the margin (your own): 应该, 本来, 不过是。{RESET}"),
        ],
        koan="一而为万，万而归一。 — cf. 庄子·齐物论",
    )


def scene_gal_seyn():
    return render_galgame(
        bg=BG_COOL,
        coord="III-III-II-II",
        glyph="∦",
        hexnum="—  (gallery unnumbered)",
        prose=[
            (6, f"{FG_COLD}You have walked out of the library.{RESET}"),
            (0, ""),
            (6, f"{FG_COLD}Outside:  a field, and scattered fires.{RESET}"),
            (6, f"{FG_COLD}No wind.  No direction.{RESET}"),
            (0, ""),
            (6, f"{FG_DIM}{ITAL}This room is not in the catalogue; it corresponds to nothing.{RESET}"),
        ],
        koan="这的确令我记忆犹新。 — cf. Borges, 'La Biblioteca'",
    )


def scene_gal_lastgod():
    return render_galgame(
        bg=BG_VOID,
        coord="IV-IV-IV-IV",
        glyph="·",
        hexnum="0",
        prose=[
            (6, f"{FG_DIM}{ITAL}You wanted to say something.{RESET}"),
            (6, f"{FG_DIM}{ITAL}You did not say it.{RESET}"),
            (0, ""),
            (6, f"{FG_DIM}{ITAL}The gallery has no walls.  No ceiling.  No floor.{RESET}"),
            (6, f'{FG_DIM}{ITAL}Only a catalogue entry remains:  "this room".{RESET}'),
        ],
        koan="⋯",
    )


SCENES = {
    "begin": scene_begin,
    "echo": scene_echo,
    "seyn": scene_seyn,
    "lastgod": scene_lastgod,
    "begin_c": scene_begin_cinematic,
    "seyn_c": scene_seyn_cinematic,
    "lastgod_c": scene_lastgod_cinematic,
    "lock_begin": scene_locked_begin,
    "lock_echo": scene_locked_echo,
    "lock_seyn": scene_locked_seyn,
    "lock_lastgod": scene_locked_lastgod,
    # galgame — geometric frame + Borges prose + koan subtitle
    "gal_begin": scene_gal_begin,
    "gal_echo": scene_gal_echo,
    "gal_seyn": scene_gal_seyn,
    "gal_lastgod": scene_gal_lastgod,
}


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else "begin"
    if which not in SCENES:
        print(f"unknown scene: {which}. options: {list(SCENES)}")
        sys.exit(1)
    print(SCENES[which]())
    print(RESET)


if __name__ == "__main__":
    main()
