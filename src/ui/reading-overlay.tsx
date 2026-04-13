import React from "react";
import {Box, Text} from "ink";
import {displayText} from "../i18n.js";
import {getForesightFragment} from "../content.js";
import type {WorldAction, WorldState} from "../types.js";

const DWELL_TARGET = 3000;
const BAR_WIDTH = 20;

const READING_SCENES = new Set([
  "echo",
  "playing-forth",
  "foresight",
  "grounding",
  "ones-to-come"
]);

export function canRead(state: WorldState): boolean {
  return READING_SCENES.has(state.scene);
}

function buildProgressBar(dwellMs: number): string {
  const filled = Math.min(BAR_WIDTH, Math.floor((dwellMs / DWELL_TARGET) * BAR_WIDTH));
  const empty = BAR_WIDTH - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

function getFragmentText(state: WorldState): string {
  const fragment = getForesightFragment(state.flags.foresightReads);
  return displayText(state.locale, fragment);
}

export function ReadingOverlay({
  state,
  dispatch
}: {
  state: WorldState;
  dispatch: React.Dispatch<WorldAction>;
}) {
  const {reading, locale} = state;

  if (!reading.active) {
    return null;
  }

  const dwellMs = reading.dwellMs;
  const isComplete = dwellMs >= DWELL_TARGET;
  const progressBar = buildProgressBar(dwellMs);
  const fragmentText = getFragmentText(state);

  const exitHint = locale === "zh" ? "[R / Esc] 退出阅读" : "[R / Esc] exit reading";
  const judgmentHint = locale === "zh" ? "[J] 进入判断" : "[J] enter judgment";
  const statusLabel = isComplete
    ? locale === "zh"
      ? "✓ 阅读完成"
      : "✓ reading complete"
    : locale === "zh"
      ? "阅读中..."
      : "reading...";

  void dispatch; // dispatch is available for parent wiring; input handled externally

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      borderStyle="double"
      borderColor={isComplete ? "green" : "blue"}
      paddingX={4}
      paddingY={2}
      width="100%"
    >
      <Text bold color={isComplete ? "green" : "blue"}>
        {locale === "zh" ? "◈ 阅读模式 ◈" : "◈ Reading Mode ◈"}
      </Text>
      <Text> </Text>
      <Text wrap="wrap">{fragmentText}</Text>
      <Text> </Text>
      <Text color={isComplete ? "green" : "cyan"}>{progressBar}</Text>
      <Text dimColor>{statusLabel}</Text>
      <Text> </Text>
      <Text dimColor>{exitHint}</Text>
      {isComplete ? <Text dimColor>{judgmentHint}</Text> : null}
    </Box>
  );
}
