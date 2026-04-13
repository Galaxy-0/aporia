import React from "react";
import {Box, Text, useFocus} from "ink";
import {txt} from "../i18n.js";
import type {SceneDefinition, WorldState} from "../types.js";
import {PANEL_IDS} from "./focus-ids.js";
import {canRead} from "./reading-overlay.js";

const DWELL_TARGET = 3000;
const BAR_WIDTH = 10;

function buildReadingBar(dwellMs: number): string {
  const filled = Math.min(BAR_WIDTH, Math.floor((dwellMs / DWELL_TARGET) * BAR_WIDTH));
  const empty = BAR_WIDTH - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

function getMovementHint(state: WorldState) {
  switch (state.scene) {
    case "beginning":
      return state.locale === "zh"
        ? "方向键：任选方向进入一条通路"
        : "Arrows: pick any direction to enter one arm";

    case "echo":
      return state.locale === "zh"
        ? "方向键：↑ 前逼  ↓ 退回十字  ← 摸裂缝  → 听墙外"
        : "Arrows: Up push forward, Down retreat, Left find seam, Right listen out";

    case "playing-forth":
      return state.locale === "zh"
        ? "方向键：↑ 上升  ↓ 退回  ← 俯看  → 敲轨"
        : "Arrows: Up ascend, Down return, Left look down, Right tap rail";

    case "foresight":
      return state.locale === "zh"
        ? "方向键：↑ 靠近井道  ↓ 回轨道  ←/→ 阅读旷野"
        : "Arrows: Up approach shaft, Down back to rail, Left/Right read the field";

    case "leap":
      return state.locale === "zh"
        ? "方向键：↑ 投身  ↓ 撤回  ←/→ 观察井口"
        : "Arrows: Up commit, Down withdraw, Left/Right inspect the rim";

    case "grounding":
      return state.locale === "zh"
        ? "方向键：↑ 走狭路  ↓ 稳住  ← 触碰裂隙  → 朝深处喊"
        : "Arrows: Up take route, Down hold, Left touch fracture, Right call down";

    case "seyn":
      return state.locale === "zh"
        ? "方向键：↑ 穿门  ↓ 退回狭路  ← 发问  → 保持不动"
        : "Arrows: Up pass gate, Down return, Left ask, Right hold still";

    case "ones-to-come":
      return state.locale === "zh"
        ? "方向键：↑ 接受  ↓ 拒绝  ←/→ 观察变化"
        : "Arrows: Up accept, Down refuse, Left/Right inspect mutation";

    case "last-god":
      return state.locale === "zh"
        ? "方向键：↑ 折回轮回  ↓ 等待  ← 发问  → 观察光束"
        : "Arrows: Up fold cycle, Down wait, Left ask, Right watch beam";

    default:
      return state.locale === "zh"
        ? "方向键：↑ 前进  ↓ 后退  ← 左探  → 右探"
        : "Arrows: Up forward, Down back, Left probe left, Right probe right";
  }
}

export function SubtitleBar({
  scene,
  state,
  activePanel
}: {
  scene: SceneDefinition;
  state: WorldState;
  activePanel: string;
}) {
  const {isFocused} = useFocus({id: PANEL_IDS.footer, autoFocus: true});
  const hint =
    state.locale === "zh"
      ? "自然语言和方向键都可用；命令：/lang /reset；Esc 回视域；Ctrl+C 退出"
      : "Natural language and arrow keys both work; commands: /lang /reset; Esc returns to view; Ctrl+C quits";
  const status =
    state.locale === "zh"
      ? `活动面板 ${activePanel}`
      : `active ${activePanel}`;
  const promptLabel = state.locale === "zh" ? "输入台" : "console";
  const suggestionsLabel = state.locale === "zh" ? "可试试" : "try";
  const cursor = isFocused && state.composer.status !== "thinking" ? (state.frame % 8 < 4 ? "█" : " ") : "";
  const inputLine = state.inputValue ? `${state.inputValue}${cursor}` : cursor;
  const inputPlaceholder =
    state.locale === "zh"
      ? "比如：摸墙上的裂缝 / 听一会儿 / 问门后是谁"
      : "For example: touch the wall seam / listen for a while / ask who's behind the gate";
  const composerLabel =
    state.composer.status === "thinking"
      ? state.locale === "zh"
        ? "场域正在组织回应..."
        : "the field is composing a reply..."
      : state.composer.status === "streaming"
        ? state.locale === "zh"
          ? "回应正在流出..."
          : "reply streaming..."
        : state.locale === "zh"
          ? "等待你的下一句"
          : "waiting for your next line";
  const borderColor = isFocused ? "white" : scene.accent;
  const suggestionLine = state.suggestions.map((item) => txt(state.locale, item)).join("  /  ");
  const movementHint = getMovementHint(state);

  return (
    <Box borderStyle="round" borderColor={borderColor} paddingX={1} flexDirection="column">
      <Text dimColor>{hint}</Text>
      <Text color={borderColor}>{status}</Text>
      <Text color={scene.accent}>
        {promptLabel}
        {isFocused ? state.locale === "zh" ? "  [焦点]" : "  [focus]" : ""}
      </Text>
      {state.reading.active ? (
        <Text color="blue">[R] {state.locale === "zh" ? "阅读中" : "reading"} {buildReadingBar(state.reading.dwellMs)}</Text>
      ) : (
        inputLine ? <Text>{">"} {inputLine}</Text> : <Text dimColor>{">"} {inputPlaceholder}</Text>
      )}
      <Text dimColor>{composerLabel}</Text>
      <Text dimColor>{movementHint}</Text>
      {state.reading.completedFragments.length > 0 && canRead(state) && !state.reading.active ? (
        <Text dimColor>[J] {state.locale === "zh" ? "判断" : "judgment"}</Text>
      ) : null}
      <Text dimColor>{suggestionsLabel}: {suggestionLine}</Text>
    </Box>
  );
}
