#!/usr/bin/env python3
"""
Aporia scene renderer — Turrell-esque minimalist architectural compositions.

Usage:
    python tools/render_scene.py [scene.json] [output.png]

If no scene.json given, renders a Beginning 2-1-1-1 demo.
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

# ─── Canvas ─────────────────────────────────────────
WIDTH, HEIGHT = 1600, 900

# ─── Palette ────────────────────────────────────────
BG = (16, 16, 18)
LIGHT_WARM = (248, 240, 220)   # Turrell warm white
DIM_WHITE = (195, 195, 190)
MID_GRAY = (85, 85, 88)
SHADOW = (30, 30, 32)
ACCENT = (18, 18, 18)  # for "Echo" black cube

# ─── Fonts ──────────────────────────────────────────
FONT_CN = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_EN = "/System/Library/Fonts/Helvetica.ttc"


def load_font(path: str, size: int, index: int = 0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            return ImageFont.load_default()


def radial_gradient(size, center, inner, outer, radius, falloff=2.2):
    """Smooth radial gradient using numpy."""
    w, h = size
    cx, cy = center
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    t = np.clip(dist / radius, 0, 1) ** (1.0 / falloff)
    t = t * t * (3 - 2 * t)  # smoothstep
    r = inner[0] * (1 - t) + outer[0] * t
    g = inner[1] * (1 - t) + outer[1] * t
    b = inner[2] * (1 - t) + outer[2] * t
    arr = np.stack([r, g, b], axis=-1).astype(np.uint8)
    return Image.fromarray(arr)


def vertical_gradient(size, top, bottom):
    w, h = size
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    for i in range(h):
        t = i / (h - 1)
        arr[i, :] = [
            int(top[0] * (1 - t) + bottom[0] * t),
            int(top[1] * (1 - t) + bottom[1] * t),
            int(top[2] * (1 - t) + bottom[2] * t),
        ]
    return Image.fromarray(arr)


def draw_glow_rect(base, center, size, color, glow_radius=80, alpha=230):
    """Draw a rectangle with a soft outer glow."""
    cx, cy = center
    w, h = size
    # Make a canvas with glow
    glow_canvas = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_canvas)
    # Inner rectangle
    gd.rectangle(
        [cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2],
        fill=(color[0], color[1], color[2], alpha),
    )
    # Apply glow blur on a copy
    glow = glow_canvas.filter(ImageFilter.GaussianBlur(glow_radius))
    # Composite: glow first, then sharp rect on top
    base.paste(glow, (0, 0), glow)
    base.paste(glow_canvas, (0, 0), glow_canvas)
    return base


def render_beginning(params):
    """
    Beginning chapter scene — single central doorway of light,
    perspective floor, small figure silhouette, minimal overlay.
    """
    # Dark vertical gradient base
    img = vertical_gradient((WIDTH, HEIGHT), (22, 22, 24), (10, 10, 12))

    # Large soft halo at center (Turrell pool of light)
    halo = radial_gradient(
        (WIDTH, HEIGHT), (WIDTH // 2, HEIGHT // 2 - 40),
        LIGHT_WARM, (16, 16, 18),
        radius=520, falloff=1.8,
    )
    img = Image.blend(img, halo, 0.55)

    # Bright door rectangle (the light source)
    door_w, door_h = 170, 340
    cx = WIDTH // 2
    cy = HEIGHT // 2 - 20
    img = img.convert("RGBA")
    img = draw_glow_rect(
        img, (cx, cy), (door_w, door_h), LIGHT_WARM,
        glow_radius=60, alpha=245,
    )

    # Perspective floor — two diagonal lines converging
    draw = ImageDraw.Draw(img, "RGBA")
    floor_y = cy + door_h // 2
    draw.line(
        [(0, HEIGHT + 20), (cx - door_w // 2 + 5, floor_y)],
        fill=(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2], 140), width=1,
    )
    draw.line(
        [(WIDTH, HEIGHT + 20), (cx + door_w // 2 - 5, floor_y)],
        fill=(MID_GRAY[0], MID_GRAY[1], MID_GRAY[2], 140), width=1,
    )

    # Small triangle silhouette (player figure, far-back)
    fig_x = cx
    fig_y = floor_y + 180
    draw.polygon(
        [(fig_x, fig_y - 30), (fig_x - 14, fig_y), (fig_x + 14, fig_y)],
        fill=(55, 55, 58),
    )

    # ─── Text layer ─────────────────────────────────
    title = params.get("title", "Begin 2-1-1-1")
    props = params.get("propositions", [])
    koan = params.get("koan", "")

    font_title = load_font(FONT_EN, 68)
    font_body = load_font(FONT_EN, 22)
    font_koan = load_font(FONT_CN, 30)

    # Title top-right
    bbox = draw.textbbox((0, 0), title, font=font_title)
    tw = bbox[2] - bbox[0]
    draw.text((WIDTH - tw - 80, 56), title, fill=(230, 230, 225), font=font_title)

    # Propositions left column
    y = 230
    for p in props:
        draw.text((80, y), p, fill=DIM_WHITE, font=font_body)
        y += 32

    # Kōan bottom center
    if koan:
        bbox = draw.textbbox((0, 0), koan, font=font_koan)
        kw = bbox[2] - bbox[0]
        draw.text(
            ((WIDTH - kw) // 2, HEIGHT - 90),
            koan, fill=(215, 215, 210), font=font_koan,
        )

    return img.convert("RGB")


def render_corridor(params):
    """
    Long corridor variant (Begin 2-1-1-2 style) — deep perspective,
    single bright doorway at end.
    """
    img = vertical_gradient((WIDTH, HEIGHT), (14, 14, 16), (4, 4, 6))
    # Very tight central glow for depth
    halo = radial_gradient(
        (WIDTH, HEIGHT), (WIDTH // 2, HEIGHT // 2 - 10),
        LIGHT_WARM, (6, 6, 8),
        radius=340, falloff=1.4,
    )
    img = Image.blend(img, halo, 0.65)

    # Tiny distant door
    cx = WIDTH // 2
    cy = HEIGHT // 2 - 30
    door_w, door_h = 70, 180
    img = img.convert("RGBA")
    img = draw_glow_rect(
        img, (cx, cy), (door_w, door_h), LIGHT_WARM,
        glow_radius=100, alpha=255,
    )

    # Strong perspective lines (corridor walls)
    draw = ImageDraw.Draw(img, "RGBA")
    # Floor
    draw.line([(0, HEIGHT + 10), (cx - door_w // 2, cy + door_h // 2)],
              fill=(60, 60, 62, 180), width=2)
    draw.line([(WIDTH, HEIGHT + 10), (cx + door_w // 2, cy + door_h // 2)],
              fill=(60, 60, 62, 180), width=2)
    # Ceiling
    draw.line([(0, -10), (cx - door_w // 2, cy - door_h // 2)],
              fill=(40, 40, 42, 140), width=1)
    draw.line([(WIDTH, -10), (cx + door_w // 2, cy - door_h // 2)],
              fill=(40, 40, 42, 140), width=1)

    # Triangle figure approaching the door
    fig_x = cx
    fig_y = HEIGHT - 140
    draw.polygon(
        [(fig_x, fig_y - 22), (fig_x - 10, fig_y), (fig_x + 10, fig_y)],
        fill=(70, 70, 72),
    )

    # Title
    title = params.get("title", "Begin 2-1-1-2")
    koan = params.get("koan", "")
    props = params.get("propositions", [])

    font_title = load_font(FONT_EN, 60)
    font_body = load_font(FONT_EN, 22)
    font_koan = load_font(FONT_CN, 28)

    bbox = draw.textbbox((0, 0), title, font=font_title)
    tw = bbox[2] - bbox[0]
    draw.text((WIDTH - tw - 80, 58), title, fill=(225, 225, 220), font=font_title)

    y = 260
    for p in props:
        draw.text((80, y), p, fill=DIM_WHITE, font=font_body)
        y += 32

    if koan:
        bbox = draw.textbbox((0, 0), koan, font=font_koan)
        kw = bbox[2] - bbox[0]
        draw.text(((WIDTH - kw) // 2, HEIGHT - 80),
                  koan, fill=(215, 215, 210), font=font_koan)

    return img.convert("RGB")


def render_seyn(params):
    """
    Seyn chapter — dark alien landscape with glowing pods / fog / low horizon.
    Matches user's 图片7 (Seyn 3-3-2-2) aesthetic.
    """
    # Sky: deep navy to slightly lighter near horizon
    sky_top = (6, 6, 10)
    sky_horizon = (30, 28, 36)
    img = vertical_gradient((WIDTH, HEIGHT), sky_top, sky_horizon).convert("RGBA")

    # Ground: slightly warmer dark (earth/landscape)
    ground_top = (25, 22, 28)
    ground_bottom = (10, 8, 12)
    horizon_y = int(HEIGHT * 0.58)
    ground = vertical_gradient(
        (WIDTH, HEIGHT - horizon_y), ground_top, ground_bottom
    ).convert("RGBA")
    img.paste(ground, (0, horizon_y), ground)

    draw = ImageDraw.Draw(img, "RGBA")

    # Scattered stars in sky
    rng = np.random.default_rng(seed=42)
    for _ in range(120):
        sx = rng.integers(0, WIDTH)
        sy = rng.integers(0, horizon_y - 20)
        sz = rng.integers(70, 200)
        sr = 1 if rng.random() < 0.7 else 2
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr],
                     fill=(sz, sz, sz + 5, 255))

    # Horizon line — subtle glow
    horizon_glow = radial_gradient(
        (WIDTH, HEIGHT), (WIDTH // 2, horizon_y),
        (80, 70, 90), (sky_top[0], sky_top[1], sky_top[2]),
        radius=600, falloff=1.4,
    ).convert("RGBA")
    img = Image.alpha_composite(img, Image.blend(
        Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0)),
        horizon_glow, 0.35,
    ))

    # Multiple glowing pods on landscape
    draw = ImageDraw.Draw(img, "RGBA")
    pod_positions = [
        (0.20, 0.70, 60, 0.8),
        (0.35, 0.72, 90, 1.0),
        (0.52, 0.74, 140, 1.0),
        (0.68, 0.72, 85, 0.85),
        (0.82, 0.70, 55, 0.7),
        (0.15, 0.85, 35, 0.5),
        (0.88, 0.87, 30, 0.5),
    ]
    for rx, ry, radius, intensity in pod_positions:
        px, py = int(WIDTH * rx), int(HEIGHT * ry)
        # Soft glow around pod
        glow = radial_gradient(
            (WIDTH, HEIGHT), (px, py),
            (int(220 * intensity), int(210 * intensity), int(190 * intensity)),
            (0, 0, 0), radius=radius * 2, falloff=1.6,
        ).convert("RGBA")
        img = Image.blend(img, glow, 0.35 * intensity)
        # Bright core
        draw = ImageDraw.Draw(img, "RGBA")
        core_r = max(4, int(radius * 0.15))
        draw.ellipse(
            [px - core_r, py - core_r, px + core_r, py + core_r],
            fill=(240, 230, 200, int(255 * intensity)),
        )

    # ─── Text layer ─────────────────────────────────
    draw = ImageDraw.Draw(img, "RGBA")
    title = params.get("title", "Seyn 3-3-2-2")
    koan = params.get("koan", "这的确令我记忆犹新。")
    props = params.get("propositions", [])

    font_title = load_font(FONT_EN, 60)
    font_body = load_font(FONT_EN, 20)
    font_koan = load_font(FONT_CN, 28)

    bbox = draw.textbbox((0, 0), title, font=font_title)
    tw = bbox[2] - bbox[0]
    draw.text((WIDTH - tw - 80, 60), title, fill=(220, 220, 215), font=font_title)

    y = 250
    for p in props:
        draw.text((80, y), p, fill=DIM_WHITE, font=font_body)
        y += 30

    if koan:
        bbox = draw.textbbox((0, 0), koan, font=font_koan)
        kw = bbox[2] - bbox[0]
        draw.text(
            ((WIDTH - kw) // 2, HEIGHT - 80),
            koan, fill=(210, 205, 195), font=font_koan,
        )

    return img.convert("RGB")


def render_beginning_with_portal(params):
    """
    Beginning variant — adds the Echo black portal cube on side wall
    (matches user's 图片1 aesthetic more closely).
    """
    img = render_beginning(params).convert("RGBA")
    draw = ImageDraw.Draw(img, "RGBA")

    # Echo portal: solid black square with subtle white border on right side
    portal_size = 160
    px = int(WIDTH * 0.75)
    py = HEIGHT // 2
    # Outer glow around portal (inverse — darkness pool)
    for i in range(8):
        alpha = 50 - i * 6
        pad = i * 3
        draw.rectangle(
            [px - portal_size // 2 - pad, py - portal_size // 2 - pad,
             px + portal_size // 2 + pad, py + portal_size // 2 + pad],
            outline=(10, 10, 12, max(0, alpha)), width=1,
        )
    # Main portal — pure black with subtle border
    draw.rectangle(
        [px - portal_size // 2, py - portal_size // 2,
         px + portal_size // 2, py + portal_size // 2],
        fill=(8, 8, 10, 255),
        outline=(200, 200, 195, 160), width=1,
    )
    # "Echo" label inside portal
    font_label = load_font(FONT_EN, 24)
    bbox = draw.textbbox((0, 0), "Echo", font=font_label)
    lw = bbox[2] - bbox[0]
    lh = bbox[3] - bbox[1]
    draw.text(
        (px + portal_size // 2 - lw - 12, py + portal_size // 2 - lh - 12),
        "Echo", fill=(220, 220, 215), font=font_label,
    )

    return img.convert("RGB")


RENDERERS = {
    "beginning": render_beginning,
    "beginning_portal": render_beginning_with_portal,
    "corridor": render_corridor,
    "seyn": render_seyn,
    "begin_2-1-1-1": render_beginning,
    "begin_2-1-1-2": render_corridor,
    "seyn_3-3-2-2": render_seyn,
}


def main():
    if len(sys.argv) > 1 and sys.argv[1].endswith(".json"):
        with open(sys.argv[1]) as f:
            params = json.load(f)
        out = sys.argv[2] if len(sys.argv) > 2 else "world/scene.png"
    else:
        # Demo: Beginning 2-1-1-1
        params = {
            "chapter": "beginning",
            "coord": "2-1-1-1",
            "title": "Begin 2-1-1-1",
            "propositions": [
                "B. If One is, the One is all.",
                "C. If One is, the Others is all.",
                "A. If there is One, the one is not all.",
                "D. If there is One, the Others are not all.",
                "E. If One is not, the One is all.",
                "G. If One is not, the Others are all.",
                "F. If there is no One, the One is not all.",
                "H. If there is no One, the Others are not all.",
            ],
            "koan": "思维与存在是同一的。",
        }
        out = sys.argv[1] if len(sys.argv) > 1 else "world/scene.png"

    chapter = params.get("chapter", "beginning")
    renderer = RENDERERS.get(chapter, render_beginning)
    img = renderer(params)

    # Ensure output dir exists
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    img.save(out, optimize=True)
    print(f"rendered → {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
