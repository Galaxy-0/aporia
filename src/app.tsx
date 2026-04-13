import React, {useEffect, useReducer, useRef, useState} from "react";
import {Box} from "ink";
import {getScene} from "./content.js";
import {txt} from "./i18n.js";
import {resolveMockTurn} from "./mock-orchestrator.js";
import {worldReducer, initialState} from "./reducer.js";
import {useAporiaInput} from "./input/use-aporia-input.js";
import {AporiaShell} from "./ui/aporia-shell.js";
import {HistoryFeed, type HistoryEntry} from "./ui/history-feed.js";
import type {WorldState} from "./types.js";

function getHistorySnapshot(state: WorldState) {
  const latestTrace = state.traces.at(-1);

  if (!latestTrace) {
    return null;
  }

  const scene = getScene(state);

  return {
    signature: `${state.scene}|${latestTrace.en}|${state.cycle}|${state.loopCount}|${state.deaths}`,
    entry: {
      accent: scene.accent,
      code: scene.code,
      sceneTitle: txt(state.locale, scene.title),
      tag: state.locale === "zh" ? "档案" : "archive",
      text: txt(state.locale, latestTrace)
    }
  };
}

export function App() {
  const [state, dispatch] = useReducer(worldReducer, initialState);
  const stateRef = useRef(state);
  const shouldTick = state.composer.status !== "idle" || state.ideologicalLock.active;
  const initialHistory = getHistorySnapshot(initialState);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(
    initialHistory
      ? [
          {
            id: `history-0-${initialHistory.signature}`,
            ...initialHistory.entry
          }
        ]
      : []
  );
  const lastHistorySignatureRef = useRef<string | null>(initialHistory?.signature ?? null);

  useEffect(() => {
    if (!shouldTick) {
      return;
    }

    const timer = setInterval(() => {
      dispatch({type: "tick"});
    }, 110);

    return () => clearInterval(timer);
  }, [shouldTick]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const snapshot = getHistorySnapshot(state);

    if (!snapshot || snapshot.signature === lastHistorySignatureRef.current) {
      return;
    }

    lastHistorySignatureRef.current = snapshot.signature;
    setHistoryEntries((current) => [
      ...current,
      {
        id: `history-${current.length}-${snapshot.signature}`,
        ...snapshot.entry
      }
    ]);
  }, [state]);

  useEffect(() => {
    if (!state.pendingPrompt) {
      return;
    }

    const timer = setTimeout(() => {
      const currentState = stateRef.current;
      const turn = resolveMockTurn(currentState, currentState.pendingPrompt ?? "");
      dispatch({type: "applyTurn", turn});
    }, 320);

    return () => clearTimeout(timer);
  }, [dispatch, state.pendingPrompt]);

  const {lensOverlayOpen, lensCursor} = useAporiaInput(
    dispatch,
    state.composer.status,
    state.inputValue,
    state.coordinates,
    state.ideologicalLock.active
  );

  return (
    <Box width="100%" flexDirection="column">
      <HistoryFeed entries={historyEntries} />
      <AporiaShell state={state} lensOverlayOpen={lensOverlayOpen} lensCursor={lensCursor} />
    </Box>
  );
}
