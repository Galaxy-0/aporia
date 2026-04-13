import React from "react";
import {Box, Static, Text} from "ink";

export type HistoryEntry = {
  id: string;
  accent: string;
  code: string;
  sceneTitle: string;
  tag: string;
  text: string;
};

function compactText(text: string, maxLength = 68) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

export function HistoryFeed({entries}: {entries: HistoryEntry[]}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Static items={entries}>
      {(entry) => (
        <Box key={entry.id}>
          <Text color={entry.accent}>[{entry.tag} {entry.code}]</Text>
          <Text> {entry.sceneTitle} :: </Text>
          <Text dimColor>{compactText(entry.text)}</Text>
        </Box>
      )}
    </Static>
  );
}
