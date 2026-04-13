import React from "react";
import {Box, Text} from "ink";

type FogOverlayProps = {
  clarity: number;
  children: React.ReactNode;
  width: number;
  height: number;
};

/**
 * Determines the number of visible (clear) lines based on clarity.
 * clarity=2 -> 3 lines, clarity=4 -> 7 lines, clarity=6 -> 11 lines, clarity=8 -> all.
 * Formula: visibleLines = clarity * 2 - 1, clamped to [1, height].
 */
function getVisibleLines(clarity: number, height: number): number {
  if (clarity >= 8) return height;
  if (clarity <= 0) return 0;
  return Math.min(height, clarity * 2 - 1);
}

function getFogChar(distanceFromVisible: number): string {
  if (distanceFromVisible <= 1) return "░";
  if (distanceFromVisible <= 2) return "▓";
  return "█";
}

export function FogOverlay({clarity, children, width, height}: FogOverlayProps) {
  if (clarity >= 8) {
    return <>{children}</>;
  }

  const visibleLines = getVisibleLines(clarity, height);
  const centerLine = Math.floor(height / 2);
  const halfVisible = Math.floor(visibleLines / 2);
  const visibleTop = centerLine - halfVisible;
  const visibleBottom = centerLine + halfVisible;

  const fogLines: React.ReactNode[] = [];
  for (let y = 0; y < height; y++) {
    if (y >= visibleTop && y <= visibleBottom) {
      continue;
    }

    const distFromEdge = y < visibleTop
      ? visibleTop - y
      : y - visibleBottom;

    const fogChar = getFogChar(distFromEdge);
    const fogLine = fogChar.repeat(Math.max(1, width));

    fogLines.push(
      <Box key={`fog-${y}`} position="absolute" marginTop={y} marginLeft={0}>
        <Text dimColor color="gray">
          {fogLine}
        </Text>
      </Box>
    );
  }

  return (
    <Box position="relative" flexDirection="column">
      {children}
      {fogLines}
    </Box>
  );
}
