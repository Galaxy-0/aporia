import React from "react";
import {Box, Text} from "ink";
import {displayText} from "../i18n.js";
import type {TranscriptEntry, WorldState} from "../types.js";

function roleLabel(entry: TranscriptEntry, locale: WorldState["locale"]) {
  switch (entry.role) {
    case "player":
      return locale === "zh" ? "你" : "you";
    case "system":
      return locale === "zh" ? "档案" : "archive";
    default:
      return locale === "zh" ? "场域" : "field";
  }
}

function roleColor(entry: TranscriptEntry) {
  switch (entry.role) {
    case "player":
      return "cyan";
    case "system":
      return "yellow";
    default:
      return "white";
  }
}

function visibleTextForEntry(entry: TranscriptEntry, state: WorldState) {
  const fullText = displayText(state.locale, entry.text);

  if (state.composer.status === "streaming" && state.composer.streamEntryId === entry.id) {
    return `${fullText.slice(0, state.composer.visibleCount)}_`;
  }

  return fullText;
}

export function TranscriptView({state, accentColor}: {state: WorldState; accentColor: string}) {
  const recentEntries = state.transcript.slice(-7);
  const thinkingText =
    state.composer.status === "thinking"
      ? state.locale === "zh"
        ? "场域正在重组回应..."
        : "the field is reorganizing its reply..."
      : null;

  return (
    <Box flexDirection="column">
      {recentEntries.map((entry) => (
        <Box key={entry.id} flexDirection="column" marginBottom={1}>
          <Text color={entry.role === "world" ? accentColor : roleColor(entry)}>
            {roleLabel(entry, state.locale)}
          </Text>
          <Text wrap="wrap">{visibleTextForEntry(entry, state)}</Text>
        </Box>
      ))}
      {thinkingText ? <Text dimColor>{thinkingText}</Text> : null}
    </Box>
  );
}
