import React from "react";
import {Box, Text, useFocus} from "ink";
import {txt} from "../i18n.js";
import type {SceneDefinition, WorldState} from "../types.js";
import {PANEL_IDS} from "./focus-ids.js";
import {Pseudo3DView} from "./pseudo-3d-view.js";
import {TranscriptView} from "./transcript-view.js";

export function CenterViewport({scene, state}: {scene: SceneDefinition; state: WorldState}) {
  const {isFocused} = useFocus({id: PANEL_IDS.center});
  const sectionLabels =
    state.locale === "zh"
      ? {narration: "对话流", view: "视域", focus: "焦点"}
      : {narration: "Transcript", view: "View", focus: "focus"};
  const accentColor = isFocused ? "white" : scene.accent;

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={accentColor} paddingX={1}>
      <Text bold color={accentColor}>
        {txt(state.locale, scene.subtitle)}
        {isFocused ? `  [${sectionLabels.focus}]` : ""}
      </Text>
      <Text> </Text>
      <Text color={accentColor}>{sectionLabels.view}</Text>
      <Pseudo3DView sceneId={scene.id} state={state} color={scene.accent} isFocused={isFocused} />
      <Text> </Text>
      <Text color={accentColor}>{sectionLabels.narration}</Text>
      <TranscriptView state={state} accentColor={scene.accent} />
    </Box>
  );
}
