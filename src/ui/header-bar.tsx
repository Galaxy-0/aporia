import React from "react";
import {Box, Text} from "ink";
import {localeTag, txt} from "../i18n.js";
import type {SceneDefinition, WorldState} from "../types.js";

function toneLabel(state: WorldState) {
  const map =
    state.locale === "zh"
      ? {
          calm: "平静",
          tense: "绷紧",
          ritual: "仪式",
          distant: "遥远",
          hostile: "敌意"
        }
      : {
          calm: "calm",
          tense: "tense",
          ritual: "ritual",
          distant: "distant",
          hostile: "hostile"
        };

  return map[state.worldTone];
}

export function HeaderBar({
  scene,
  state,
  activePanel
}: {
  scene: SceneDefinition;
  state: WorldState;
  activePanel: string;
}) {
  const focusLabel = state.locale === "zh" ? "焦点" : "focus";
  const tone = state.locale === "zh" ? "气氛" : "tone";
  const node = state.locale === "zh" ? "主体" : "subject";

  return (
    <Box borderStyle="round" borderColor={scene.accent} paddingX={1} justifyContent="space-between">
      <Text color={scene.accent}>{scene.code}</Text>
      <Text bold>{txt(state.locale, scene.title)}</Text>
      <Text>
        {localeTag(state.locale)}  {node} {state.subjectId}  cycle {String(state.cycle).padStart(2, "0")}  loop {String(state.loopCount).padStart(2, "0")}  {tone} {toneLabel(state)}  {focusLabel} {activePanel}
      </Text>
    </Box>
  );
}
