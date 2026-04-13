import React from "react";
import {Box, Text} from "ink";
import type {WorldState} from "../types.js";

const TRACK_LENGTH = 12;

function buildTrack(state: WorldState) {
  const cursor = state.frame % TRACK_LENGTH;

  return Array.from({length: TRACK_LENGTH}, (_, index) => {
    const inWindow = Math.abs(index - state.ritual.target) <= state.ritual.window;

    if (index === cursor && inWindow) {
      return "@";
    }

    if (index === cursor) {
      return "o";
    }

    if (inWindow) {
      return "=";
    }

    return "-";
  }).join("");
}

export function RitualMeter({state, color}: {state: WorldState; color: string}) {
  if (!state.ritual.active) {
    return null;
  }

  const labels =
    state.locale === "zh"
      ? {
          title: "仪式校准",
          prompt: "等移动脉冲压住目标区时按下 enter"
        }
      : {
          title: "Ritual Alignment",
          prompt: "Press enter when the moving pulse overlaps the target zone"
        };

  return (
    <Box flexDirection="column">
      <Text color={color}>{labels.title}</Text>
      <Text color={color}>[{buildTrack(state)}]</Text>
      <Text dimColor>{labels.prompt}</Text>
    </Box>
  );
}
