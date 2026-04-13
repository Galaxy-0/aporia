import React from "react";
import {Box, Text} from "ink";
import {txt} from "../i18n.js";
import type {Choice, Locale} from "../types.js";

function toneColor(tone: Choice["tone"]) {
  switch (tone) {
    case "ritual":
      return "green";
    case "danger":
      return "red";
    default:
      return "white";
  }
}

export function ChoiceList({
  choices,
  selectedIndex,
  locale,
  isActive
}: {
  choices: Choice[];
  selectedIndex: number;
  locale: Locale;
  isActive: boolean;
}) {
  return (
    <Box flexDirection="column">
      {choices.map((choice, index) => {
        const selected = index === selectedIndex;
        const enabled = choice.enabled !== false;
        const detail = selected ? txt(locale, enabled ? choice.hint : choice.lockReason ?? choice.hint) : "";
        const marker = selected ? (isActive ? ">" : ":") : enabled ? " " : "x";
        const color = selected
          ? isActive
            ? enabled
              ? "cyan"
              : "yellow"
            : enabled
              ? "white"
              : "gray"
          : enabled
            ? toneColor(choice.tone)
            : "gray";

        return (
          <Text key={choice.id} color={color}>
            {marker} {txt(locale, choice.label)}
            {!selected ? "" : `   ${detail}`}
          </Text>
        );
      })}
    </Box>
  );
}
