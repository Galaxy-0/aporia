import React from "react";
import {Box, Text, useFocus} from "ink";
import {describeSubject} from "../content.js";
import {txt} from "../i18n.js";
import type {SceneDefinition, WorldState} from "../types.js";
import {PANEL_IDS} from "./focus-ids.js";

export function LeftPanel({scene, state}: {scene: SceneDefinition; state: WorldState}) {
  const {isFocused} = useFocus({id: PANEL_IDS.left});
  const subjectLines = describeSubject(state.subjectId, state.locale);
  const labels =
    state.locale === "zh"
      ? {
          doctrine: "观念轴",
          subject: "主体",
          status: "场域状态",
          presence: "临近存在",
          none: "当前没有可识别存在",
          tone: "气氛",
          stream: "输出",
          glyphs: "符号账本",
          traces: "残余痕迹",
          focus: "焦点",
          hint: "Tab 切焦；直接打字会自动跳回输入台"
        }
      : {
          doctrine: "Doctrine",
          subject: "Subject",
          status: "Field state",
          presence: "Presences",
          none: "No readable presence nearby",
          tone: "tone",
          stream: "output",
          glyphs: "Glyph ledger",
          traces: "Trace residue",
          focus: "focus",
          hint: "Tab cycles focus; typing jumps back to console"
        };
  const accentColor = isFocused ? "white" : scene.accent;
  const presenceDistance =
    state.locale === "zh"
      ? {
          near: "近",
          mid: "中",
          far: "远"
        }
      : {
          near: "near",
          mid: "mid",
          far: "far"
        };
  const toneLabel =
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
  const streamLabel =
    state.composer.status === "thinking"
      ? state.locale === "zh"
        ? "思考中"
        : "thinking"
      : state.composer.status === "streaming"
        ? state.locale === "zh"
          ? "流式输出"
          : "streaming"
        : state.locale === "zh"
          ? "空闲"
          : "idle";

  return (
    <Box width={34} flexDirection="column" borderStyle="round" borderColor={accentColor} paddingX={1} marginRight={1}>
      <Text bold color={accentColor}>
        {labels.doctrine}
        {isFocused ? `  [${labels.focus}]` : ""}
      </Text>
      {scene.doctrine.map((line) => (
        <Text key={line.en}>- {txt(state.locale, line)}</Text>
      ))}

      <Text> </Text>
      <Text bold color={accentColor}>{labels.subject}</Text>
      <Text>ID {state.subjectId}</Text>
      {subjectLines.map((line) => (
        <Text key={line}>{line}</Text>
      ))}

      <Text> </Text>
      <Text bold color={accentColor}>{labels.status}</Text>
      <Text>{labels.tone}  {toneLabel[state.worldTone]}</Text>
      <Text>{labels.stream}  {streamLabel}</Text>

      <Text> </Text>
      <Text bold color={accentColor}>{labels.presence}</Text>
      {state.entities.length === 0 ? <Text dimColor>{labels.none}</Text> : null}
      {state.entities.map((entity) => (
        <Text key={entity.id}>
          {presenceDistance[entity.distance]}  {txt(state.locale, entity.name)}  /  {txt(state.locale, entity.mood)}
        </Text>
      ))}

      <Text> </Text>
      <Text bold color={accentColor}>{labels.glyphs}</Text>
      <Text wrap="wrap">{state.unlockedSymbols.join("  ")}</Text>

      <Text> </Text>
      <Text bold color={accentColor}>{labels.traces}</Text>
      {state.traces.map((trace, index) => (
        <Text key={`${trace.en}-${index}`} dimColor>{txt(state.locale, trace)}</Text>
      ))}
      {isFocused ? (
        <>
          <Text> </Text>
          <Text color={accentColor}>{labels.hint}</Text>
        </>
      ) : null}
    </Box>
  );
}
