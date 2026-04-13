import React from "react";
import {Box, Text} from "ink";
import {txt} from "../i18n.js";
import {getScene} from "../content.js";
import type {WorldState} from "../types.js";

const DOCTRINE_CYCLE_TICKS = 18; // ~2 seconds at 110ms per tick

export function LockOverlay({state}: {state: WorldState}) {
  const lock = state.ideologicalLock;
  if (!lock.active) return null;

  const scene = getScene(state);
  const doctrine = scene.doctrine;
  const elapsed = 273 - lock.ticksRemaining;
  const doctrineIndex = Math.floor(elapsed / DOCTRINE_CYCLE_TICKS) % doctrine.length;
  const currentDoctrine = doctrine[doctrineIndex];

  const secondsLeft = Math.ceil((lock.ticksRemaining * 110) / 1000);
  const progress = Math.round(((273 - lock.ticksRemaining) / 273) * 10);
  const bar = "█".repeat(progress) + "░".repeat(10 - progress);

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width="100%"
      paddingY={2}
      borderStyle="double"
      borderColor="red"
    >
      <Text bold color="red" dimColor>
        {state.locale === "zh" ? "意识形态固化" : "IDEOLOGICAL LOCK"}
      </Text>
      <Text> </Text>
      {currentDoctrine && (
        <Text color="yellow" dimColor italic>
          {txt(state.locale, currentDoctrine)}
        </Text>
      )}
      <Text> </Text>
      <Text color="red" dimColor>
        {state.locale === "zh" ? "意识形态固化" : "IDEOLOGICAL LOCK"} {bar} {secondsLeft}s
      </Text>
    </Box>
  );
}
