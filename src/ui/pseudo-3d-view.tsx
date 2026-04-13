import React from "react";
import {Text, Transform} from "ink";
import type {SceneId, WorldState} from "../types.js";

type Grid = string[][];

const WIDTH = 47;
const HEIGHT = 12;

function createGrid(fill = " "): Grid {
  return Array.from({length: HEIGHT}, () => Array.from({length: WIDTH}, () => fill));
}

function setChar(grid: Grid, x: number, y: number, char: string) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
    return;
  }

  grid[y]![x] = char;
}

function drawText(grid: Grid, x: number, y: number, text: string) {
  for (let index = 0; index < text.length; index += 1) {
    setChar(grid, x + index, y, text[index]!);
  }
}

function drawLine(grid: Grid, x0: number, y0: number, x1: number, y1: number, char?: string) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));

  const stroke =
    char ?? (dy === 0 ? "-" : dx === 0 ? "|" : dx * dy > 0 ? "\\" : "/");

  for (let step = 0; step <= steps; step += 1) {
    const x = Math.round(x0 + (dx * step) / steps);
    const y = Math.round(y0 + (dy * step) / steps);
    setChar(grid, x, y, stroke);
  }
}

function drawRect(grid: Grid, left: number, top: number, right: number, bottom: number) {
  drawLine(grid, left, top, right, top, "-");
  drawLine(grid, left, bottom, right, bottom, "-");
  drawLine(grid, left, top, left, bottom, "|");
  drawLine(grid, right, top, right, bottom, "|");
  setChar(grid, left, top, "+");
  setChar(grid, right, top, "+");
  setChar(grid, left, bottom, "+");
  setChar(grid, right, bottom, "+");
}

function frameValue<T>(frame: number, values: readonly T[]) {
  const index = ((frame % values.length) + values.length) % values.length;
  return values[index]!;
}

function drawPerspectiveRoom(
  grid: Grid,
  options: {
    innerLeft?: number;
    innerRight?: number;
    innerTop?: number;
    innerBottom?: number;
    door?: {width: number; height: number; open?: boolean; fillChar?: string};
    floorSplit?: boolean;
    wallMarks?: boolean;
    rails?: boolean;
    slash?: boolean;
    sideOpenings?: boolean;
  }
) {
  const outerLeft = 1;
  const outerRight = WIDTH - 2;
  const outerTop = 0;
  const outerBottom = HEIGHT - 1;
  const innerLeft = options.innerLeft ?? 12;
  const innerRight = options.innerRight ?? WIDTH - 13;
  const innerTop = options.innerTop ?? 3;
  const innerBottom = options.innerBottom ?? HEIGHT - 4;

  drawLine(grid, outerLeft, outerTop, innerLeft, innerTop);
  drawLine(grid, outerRight, outerTop, innerRight, innerTop);
  drawLine(grid, outerLeft, outerBottom, innerLeft, innerBottom);
  drawLine(grid, outerRight, outerBottom, innerRight, innerBottom);
  drawRect(grid, innerLeft, innerTop, innerRight, innerBottom);

  drawLine(
    grid,
    Math.floor(WIDTH / 2),
    outerBottom - 1,
    Math.floor((innerLeft + innerRight) / 2),
    innerBottom,
    "."
  );

  if (options.floorSplit) {
    for (let offset = -2; offset <= 2; offset += 1) {
      drawLine(
        grid,
        Math.floor(WIDTH / 2) + offset,
        outerBottom,
        Math.floor(WIDTH / 2) + offset * 2,
        innerBottom + 1,
        offset === 0 ? "|" : "/"
      );
    }
  }

  if (options.wallMarks) {
    setChar(grid, innerLeft + 2, innerTop + 2, ":");
    setChar(grid, innerLeft + 2, innerBottom - 2, ":");
    setChar(grid, innerRight - 2, innerTop + 1, ":");
    setChar(grid, innerRight - 3, innerBottom - 2, ":");
  }

  if (options.sideOpenings) {
    setChar(grid, innerLeft, innerTop + 2, " ");
    setChar(grid, innerLeft, innerTop + 3, " ");
    setChar(grid, innerRight, innerTop + 2, " ");
    setChar(grid, innerRight, innerTop + 3, " ");
    drawText(grid, innerLeft - 3, innerTop + 2, "| |");
    drawText(grid, innerRight + 1, innerTop + 2, "| |");
  }

  if (options.rails) {
    const center = Math.floor((innerLeft + innerRight) / 2);
    drawLine(grid, center - 1, outerBottom - 1, center - 1, innerTop + 1, "|");
    drawLine(grid, center + 1, outerBottom - 1, center + 1, innerTop + 1, "|");
    drawLine(grid, center - 4, innerBottom - 1, center + 4, innerBottom - 1, "=");
  }

  if (options.door) {
    const center = Math.floor((innerLeft + innerRight) / 2);
    const doorHalf = Math.floor(options.door.width / 2);
    const doorTop = innerBottom - options.door.height;
    const doorLeft = center - doorHalf;
    const doorRight = center + doorHalf;

    if (options.door.open) {
      const fillChar = options.door.fillChar ?? ".";

      drawLine(grid, doorLeft, doorTop, doorLeft, innerBottom, "|");
      drawLine(grid, doorRight, doorTop, doorRight, innerBottom, "|");
      drawLine(grid, doorLeft, doorTop, doorRight, doorTop, "-");
      for (let y = doorTop + 1; y < innerBottom; y += 1) {
        for (let x = doorLeft + 1; x < doorRight; x += 1) {
          setChar(grid, x, y, fillChar);
        }
      }
    } else {
      drawRect(grid, doorLeft, doorTop, doorRight, innerBottom);
    }
  }

  if (options.slash) {
    drawLine(grid, innerLeft + 2, innerBottom - 1, innerRight + 4, innerTop - 1, "/");
    drawLine(grid, innerLeft + 4, innerBottom - 1, innerRight + 6, innerTop - 1, "/");
  }
}

function drawHorizon(grid: Grid, frame: number, crack = false) {
  const horizonY = 4;
  const center = Math.floor(WIDTH / 2);
  const waveShift = frameValue(frame, [0, 1, 2, 1, 0, -1, -2, -1]);

  drawLine(grid, 2, HEIGHT - 1, center - 2, horizonY);
  drawLine(grid, WIDTH - 3, HEIGHT - 1, center + 2, horizonY);
  drawLine(grid, 6, horizonY, WIDTH - 7, horizonY, frameValue(frame, ["-", "-", "=", "-"]));
  drawLine(grid, 10, HEIGHT - 2, WIDTH - 11, HEIGHT - 2, ".");
  drawText(grid, 8 + waveShift, horizonY - 1, "~ ~ ~");
  drawText(grid, WIDTH - 14 - waveShift, horizonY - 1, "~ ~ ~");

  if (crack) {
    const split = frameValue(frame, [0, 1, 1, 2, 1, 1]);
    drawLine(grid, center, horizonY + 1, center - split, HEIGHT - 2, "|");
    drawLine(grid, center + 1, horizonY + 1, center + 1 + split, HEIGHT - 1, "|");
    drawLine(grid, center - 2 - split, HEIGHT - 2, center + 2 + split, HEIGHT - 2, "_");
  } else {
    drawText(grid, center - 1, HEIGHT - 2, "|||");
  }
}

function drawShaft(grid: Grid) {
  const center = Math.floor(WIDTH / 2);

  drawLine(grid, 10, 0, center - 3, 3);
  drawLine(grid, WIDTH - 11, 0, center + 3, 3);
  drawLine(grid, 8, HEIGHT - 1, center - 1, 4);
  drawLine(grid, WIDTH - 9, HEIGHT - 1, center + 1, 4);
  drawRect(grid, center - 4, 3, center + 4, 6);
  drawLine(grid, center - 1, 6, center - 1, HEIGHT - 2, "|");
  drawLine(grid, center + 1, 6, center + 1, HEIGHT - 2, "|");
  drawLine(grid, center - 2, HEIGHT - 2, center + 2, HEIGHT - 2, "_");
}

function drawFracture(grid: Grid, abyssLabel: string, frame: number) {
  const split = frameValue(frame, [0, 1, 1, 2, 1, 1]);

  drawPerspectiveRoom(grid, {
    innerLeft: 11,
    innerRight: WIDTH - 12,
    innerTop: 3,
    innerBottom: HEIGHT - 4,
    floorSplit: true
  });
  drawLine(grid, 18 - split, HEIGHT - 2, 22, 8, "/");
  drawLine(grid, WIDTH - 19 + split, HEIGHT - 2, WIDTH - 23, 8, "\\");
  drawText(grid, Math.floor(WIDTH / 2) - Math.floor(abyssLabel.length / 2), 7, abyssLabel);
}

function drawMutationChamber(grid: Grid, driftLabel: string, frame: number) {
  drawPerspectiveRoom(grid, {
    innerLeft: 10,
    innerRight: WIDTH - 11,
    innerTop: 2,
    innerBottom: HEIGHT - 3,
    door: {
      width: 10,
      height: 4,
      open: true,
      fillChar: frameValue(frame, [".", ".", ":", "."])
    }
  });
  drawText(grid, 12, 5, frameValue(frame, ["33", "33", "3:", "33"]));
  drawText(grid, WIDTH - 15, 5, frameValue(frame, ["44", "4:", "44", "44"]));
  drawText(grid, Math.floor(WIDTH / 2) - Math.floor(driftLabel.length / 2), 7, driftLabel);
}

function buildPseudoView(sceneId: SceneId, state: WorldState, frame: number): string[] {
  const grid = createGrid();
  const center = Math.floor(WIDTH / 2);
  const labels =
    state.locale === "zh"
      ? {
          distantField: "yuan ye",
          muteMarkers: "silent marks",
          abyss: "shen yuan",
          drift: "bian yi 4444",
          returnWord: "hui fan"
        }
      : {
          distantField: "distant field",
          muteMarkers: "mute markers",
          abyss: "abyss",
          drift: ">> 4444",
          returnWord: "return"
        };

  switch (sceneId) {
    case "beginning": {
      const breath = frameValue(frame, [0, 0, 1, 1, 0, 0, -1, -1]);
      const guideX = center + frameValue(frame, [-5, -4, -3, -2, -1, 0, 1, 2, 1, 0, -1, -2, -3, -4]);

      drawPerspectiveRoom(grid, {
        innerLeft: 12 - breath,
        innerRight: WIDTH - 13 + breath,
        innerTop: 3,
        innerBottom: HEIGHT - 4,
        door: {width: 8, height: 4 + Math.max(0, breath)},
        sideOpenings: true
      });
      setChar(grid, guideX, HEIGHT - 2, frameValue(frame, [".", "o", ".", ":"]));
      drawText(grid, center - 1, 5, frameValue(frame, ["...", ".:.", ":::", ".:."]));
      break;
    }

    case "echo": {
      const sway = frameValue(frame, [0, 1, 1, 0, 0, -1, -1, 0]);
      const shift = (state.loopCount % 3) - 1 + sway;
      const seamX = center + shift;

      drawPerspectiveRoom(grid, {
        innerLeft: 11 + shift,
        innerRight: WIDTH - 12 + shift,
        innerTop: 3,
        innerBottom: HEIGHT - 4,
        door: {
          width: 8,
          height: 4,
          open: state.flags.gateOpen,
          fillChar: frameValue(frame, [".", ":", ".", ":"])
        },
        wallMarks: true
      });
      drawText(grid, 8 + sway, 2, frameValue(frame, ["::", ":;", "::", ";:"]));
      drawText(grid, WIDTH - 10 + frameValue(frame, [0, 1, 0, -1]), 8, frameValue(frame, ["::", ";:", "::", ":;"]));
      setChar(grid, seamX, 5, frameValue(frame, [":", "!", "|", "!"]));
      setChar(grid, seamX, 6, frameValue(frame, [".", ":", ".", " "]));
      break;
    }

    case "playing-forth": {
      const cartY = frameValue(frame, [9, 8, 7, 6, 5, 4, 3, 4, 5, 6, 7, 8]);

      drawPerspectiveRoom(grid, {
        innerLeft: 13,
        innerRight: WIDTH - 14,
        innerTop: 2,
        innerBottom: HEIGHT - 4,
        rails: true,
        door: {
          width: 6,
          height: 4,
          open: true,
          fillChar: frameValue(frame, [".", ".", ":", "."])
        }
      });
      drawText(grid, center - 1, 1, frameValue(frame, ["||", "!!", "||", "!!"]));
      drawText(grid, center - 1, cartY, frameValue(frame, ["[]", "##", "[]", "=="]));
      setChar(grid, center, Math.max(2, cartY - 1), frameValue(frame, [":", "|", ":", "."]));
      break;
    }

    case "foresight": {
      const fieldShift = frameValue(frame, [0, 1, 2, 1, 0, -1, -2, -1]);

      drawHorizon(grid, frame, true);
      drawText(grid, 4 + fieldShift, 1, labels.distantField);
      drawText(grid, WIDTH - 18 - fieldShift, 2, labels.muteMarkers);
      setChar(grid, 12 + frameValue(frame, [0, 1, 2, 1]), 6, frameValue(frame, [".", ":", "*", ":"]));
      setChar(grid, WIDTH - 15 + frameValue(frame, [0, -1, -2, -1]), 7, frameValue(frame, [":", ".", "*", "."]));
      break;
    }

    case "leap": {
      const particleBase = frame * 2;

      drawShaft(grid);
      setChar(grid, center, 2 + ((particleBase + 0) % 8), frameValue(frame, [".", "o", ".", ":"]));
      setChar(grid, center - 1, 2 + ((particleBase + 3) % 8), frameValue(frame, [":", ".", "o", "."]));
      setChar(grid, center + 1, 2 + ((particleBase + 6) % 8), frameValue(frame, [".", ":", ".", "o"]));
      drawText(grid, center - 1, 2, frameValue(frame, ["..", "::", "''", "::"]));
      break;
    }

    case "grounding": {
      drawFracture(grid, labels.abyss, frame);
      setChar(grid, center - frameValue(frame, [3, 2, 1, 2]), 9, frameValue(frame, [".", ":", "*", ":"]));
      setChar(grid, center + frameValue(frame, [3, 2, 1, 2]), 9, frameValue(frame, [":", "*", ":", "."]));
      break;
    }

    case "seyn": {
      drawPerspectiveRoom(grid, {
        innerLeft: 12,
        innerRight: WIDTH - 13,
        innerTop: 2,
        innerBottom: HEIGHT - 3,
        door: {
          width: 12,
          height: 5,
          open: true,
          fillChar: frameValue(frame, [".", ":", ".", ":"])
        }
      });
      drawText(grid, center - 2, 4, frameValue(frame, ["....", ":::", ".:.:", ":::."]));
      setChar(grid, center - 5, 4, frameValue(frame, ["*", ".", ":", "."]));
      setChar(grid, center + 5, 4, frameValue(frame, [":", ".", "*", "."]));
      drawText(grid, center - 2, 5, "SEYN");
      break;
    }

    case "ones-to-come": {
      drawMutationChamber(grid, labels.drift, frame);
      drawText(grid, center - 3, 5, frameValue(frame, ["  =>  ", "  ==>", " ->>  ", "  =>  "]));
      setChar(grid, center, 6, frameValue(frame, [".", "o", ".", ":"]));
      break;
    }

    case "last-god": {
      const beamY = frameValue(frame, [8, 7, 6, 5, 4, 3, 4, 5, 6, 7]);

      drawPerspectiveRoom(grid, {
        innerLeft: 11,
        innerRight: WIDTH - 12,
        innerTop: 2,
        innerBottom: HEIGHT - 3,
        door: {
          width: 10,
          height: 4,
          open: true,
          fillChar: frameValue(frame, [".", ".", ":", "."])
        },
        slash: true
      });
      drawLine(grid, 14, beamY, WIDTH - 15, Math.max(2, beamY - 1), frameValue(frame, ["-", "=", "-", "="]));
      drawText(grid, center - Math.floor(labels.returnWord.length / 2), HEIGHT - 2, labels.returnWord);
      break;
    }

    default:
      drawPerspectiveRoom(grid, {
        door: {width: 8, height: 4}
      });
      break;
  }

  return grid.map((row) => row.join("").replace(/\s+$/, ""));
}

function fillNearestSpace(characters: string[], start: number, token: string) {
  if (characters.length === 0) {
    return;
  }

  for (let offset = 0; offset < characters.length; offset += 1) {
    const index = (start + offset) % characters.length;

    if (characters[index] === " ") {
      characters[index] = token;
      return;
    }
  }
}

function applyViewportFx(line: string, index: number, frame: number, state: WorldState, isFocused: boolean) {
  const characters = line.split("");
  const glitchPasses = Math.max(1, state.viewport.glitch);
  const scanPasses = Math.max(1, state.viewport.scan);
  const drift = Math.max(1, state.viewport.drift);

  if (characters.length === 0) {
    return line;
  }

  for (let pass = 0; pass < scanPasses; pass += 1) {
    fillNearestSpace(characters, frame * (3 + pass) + index * (5 + pass), isFocused ? ":" : ".");
  }

  if (isFocused) {
    for (let pass = 0; pass < glitchPasses; pass += 1) {
      fillNearestSpace(characters, frame * (5 + pass) + index * 7 + 3 + pass, ".");
    }
  }

  const pulseIndex = (frame * drift + index * 2) % characters.length;
  if (characters[pulseIndex] === "-") {
    characters[pulseIndex] = "=";
  } else if (characters[pulseIndex] === "|") {
    characters[pulseIndex] = "!";
  }

  return characters.join("");
}

export function Pseudo3DView({
  sceneId,
  state,
  color,
  isFocused
}: {
  sceneId: SceneId;
  state: WorldState;
  color: string;
  isFocused: boolean;
}) {
  const lines = React.useMemo(() => buildPseudoView(sceneId, state, state.frame), [sceneId, state]);
  const block = lines.join("\n");

  return (
    <Transform
      transform={(line, index) => applyViewportFx(line, index, state.frame, state, isFocused)}
      accessibilityLabel={block}
    >
      <Text color={color} dimColor={!isFocused}>
        {block}
      </Text>
    </Transform>
  );
}
