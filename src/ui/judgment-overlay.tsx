import React, {useState, useCallback} from "react";
import {Box, Text} from "ink";
import {displayText} from "../i18n.js";
import {getForesightFragment} from "../content.js";
import type {WorldAction, WorldState} from "../types.js";

type Direction = "affirm" | "negate" | "sublate";

type JudgmentChoice = {
  direction: Direction;
  label: string;
  key: string;
};

function getChoices(locale: WorldState["locale"]): JudgmentChoice[] {
  return [
    {
      direction: "affirm",
      label: locale === "zh" ? "肯定 / Affirm" : "Affirm / 肯定",
      key: "1"
    },
    {
      direction: "negate",
      label: locale === "zh" ? "否定 / Negate" : "Negate / 否定",
      key: "2"
    },
    {
      direction: "sublate",
      label: locale === "zh" ? "扬弃 / Sublate" : "Sublate / 扬弃",
      key: "3"
    }
  ];
}

function getDirectionHint(direction: Direction, locale: WorldState["locale"]): string {
  switch (direction) {
    case "affirm":
      return locale === "zh"
        ? "存在 +1 — 你承认了这段文本中的在场。"
        : "Sein +1 — You affirmed the presence within the text.";
    case "negate":
      return locale === "zh"
        ? "真理 +1 — 你在真理结构中否定了它。"
        : "Wahrheit +1 — You negated it through the truth-structure.";
    case "sublate":
      return locale === "zh"
        ? "时间 +1 — 你在时间中扬弃了对立。"
        : "Zeit +1 — You sublated the opposition through time.";
  }
}

function getFragmentText(state: WorldState): string {
  const fragment = getForesightFragment(state.flags.foresightReads);
  return displayText(state.locale, fragment);
}

export function JudgmentOverlay({
  state,
  dispatch,
  onClose,
  selectedIndex,
  submitted
}: {
  state: WorldState;
  dispatch: React.Dispatch<WorldAction>;
  onClose: () => void;
  selectedIndex: number;
  submitted: Direction | null;
}) {
  const {locale} = state;
  const choices = getChoices(locale);
  const fragmentText = getFragmentText(state);

  const titleLabel = locale === "zh" ? "◈ 判断 ◈" : "◈ Judgment ◈";
  const instructionLabel = locale === "zh"
    ? "选择你对这段文本的判断方向（↑↓ 选择，Enter 确认）"
    : "Choose your judgment direction (Up/Down to select, Enter to confirm)";

  // After submission, show the result briefly
  if (submitted) {
    const hint = getDirectionHint(submitted, locale);
    return (
      <Box
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        borderStyle="double"
        borderColor="magenta"
        paddingX={4}
        paddingY={2}
        width="100%"
      >
        <Text bold color="magenta">{titleLabel}</Text>
        <Text> </Text>
        <Text wrap="wrap" color="white">{hint}</Text>
      </Box>
    );
  }

  void dispatch;
  void onClose;

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      borderStyle="double"
      borderColor="magenta"
      paddingX={4}
      paddingY={2}
      width="100%"
    >
      <Text bold color="magenta">{titleLabel}</Text>
      <Text> </Text>
      <Text wrap="wrap" dimColor>{fragmentText}</Text>
      <Text> </Text>
      <Text dimColor>{instructionLabel}</Text>
      <Text> </Text>
      {choices.map((choice, i) => {
        const isSelected = i === selectedIndex;
        return (
          <Text key={choice.direction} color={isSelected ? "magenta" : "white"} bold={isSelected}>
            {isSelected ? " ▸ " : "   "}[{choice.key}] {choice.label}
          </Text>
        );
      })}
      <Text> </Text>
      <Text dimColor>{locale === "zh" ? "[Esc] 取消" : "[Esc] cancel"}</Text>
    </Box>
  );
}
