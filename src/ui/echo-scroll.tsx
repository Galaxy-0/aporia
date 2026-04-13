import React, {useCallback, useEffect, useRef, useState} from "react";
import {Box, Text, useInput} from "ink";
import {txt} from "../i18n.js";
import type {LocalizedText, WorldAction, WorldState} from "../types.js";

type EchoScrollProps = {
  state: WorldState;
  dispatch: React.Dispatch<WorldAction>;
  onComplete: () => void;
};

type ScrollLine = {
  text: LocalizedText;
  isCrack: boolean;
};

const LINES: ScrollLine[] = [
  {text: {en: "The corridor repeats itself without end.", zh: "走廊无尽地重复着自身。"}, isCrack: false},
  {text: {en: "Nothing changes. Nothing was meant to.", zh: "什么都没有改变。本来就不该改变。"}, isCrack: false},
  {text: {en: "You have walked this path before.", zh: "你曾走过这条路。"}, isCrack: false},
  {text: {en: "The wall carries the same stain.", zh: "墙上带着同样的污渍。"}, isCrack: false},
  {text: {en: "Meaning dissolved long ago.", zh: "意义早就溶解了。"}, isCrack: true},
  {text: {en: "Each step echoes the last.", zh: "每一步都在回响上一步。"}, isCrack: false},
  {text: {en: "The air smells of repetition.", zh: "空气中弥漫着重复的味道。"}, isCrack: false},
  {text: {en: "There is no exit — only return.", zh: "没有出口——只有折返。"}, isCrack: false},
  {text: {en: "A thought rises and folds back.", zh: "一个念头升起，又折了回去。"}, isCrack: false},
  {text: {en: "The loop does not care about you.", zh: "回环并不在乎你。"}, isCrack: false},
  {text: {en: "Silence wraps around the corridor.", zh: "沉默包裹着走廊。"}, isCrack: true},
  {text: {en: "You forget why you started walking.", zh: "你忘了自己为什么开始行走。"}, isCrack: false},
  {text: {en: "The pattern is the prison.", zh: "模式就是监牢。"}, isCrack: false},
  {text: {en: "Time folds over itself like paper.", zh: "时间像纸一样折叠起来。"}, isCrack: false},
  {text: {en: "Purpose evaporated three loops ago.", zh: "目的在三个回环之前就蒸发了。"}, isCrack: false},
  {text: {en: "The crack behind the wall breathes.", zh: "墙后的裂缝在呼吸。"}, isCrack: true},
  {text: {en: "You are the corridor's memory.", zh: "你是走廊的记忆。"}, isCrack: false},
  {text: {en: "Repetition is the only structure left.", zh: "重复是唯一剩下的结构。"}, isCrack: false},
  {text: {en: "The floor whispers the same word.", zh: "地面低语着同一个字。"}, isCrack: false},
  {text: {en: "A thin fracture runs through the void.", zh: "一道细小的裂痕贯穿虚空。"}, isCrack: true},
];

const HINT_LINES: LocalizedText[] = [
  {en: "Watch for the crack character: ⌇", zh: "注意裂缝字符：⌇"},
  {en: "The center line is your target.", zh: "中心行就是你的目标。"},
  {en: "Timing is everything — wait for the mark.", zh: "时机就是一切——等待标记。"},
];

const VISIBLE_LINES = 9;
const CENTER_INDEX = Math.floor(VISIBLE_LINES / 2);
const CRACK_CHAR = "⌇";
const TOTAL_CRACKS = 4;

const TIMING_WINDOWS = [500, 350, 250, 150];

export function EchoScroll({state, dispatch, onComplete}: EchoScrollProps) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [caughtCount, setCaughtCount] = useState(0);
  const [missStreak, setMissStreak] = useState(0);
  const [hintMode, setHintMode] = useState(false);
  const [flashColor, setFlashColor] = useState<"green" | "red" | null>(null);
  const [scrollSpeed, setScrollSpeed] = useState(800);
  const [caughtCracks, setCaughtCracks] = useState<Set<number>>(new Set());

  const scrollSpeedRef = useRef(scrollSpeed);
  scrollSpeedRef.current = scrollSpeed;

  const locale = state.locale;

  // Scroll timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      setScrollOffset((prev) => (prev + 1) % LINES.length);
      timer = setTimeout(tick, scrollSpeedRef.current);
    };

    timer = setTimeout(tick, scrollSpeedRef.current);
    return () => clearTimeout(timer);
  }, [caughtCount]); // restart timer when speed changes via catch

  // Clear flash after short delay
  useEffect(() => {
    if (flashColor) {
      const t = setTimeout(() => setFlashColor(null), 200);
      return () => clearTimeout(t);
    }
  }, [flashColor]);

  const getVisibleLines = useCallback(() => {
    const result: Array<{line: ScrollLine; originalIndex: number}> = [];
    for (let i = 0; i < VISIBLE_LINES; i++) {
      const idx = (scrollOffset + i) % LINES.length;
      result.push({line: LINES[idx]!, originalIndex: idx});
    }
    return result;
  }, [scrollOffset]);

  const handleInput = useCallback(() => {
    if (caughtCount >= TOTAL_CRACKS) return;

    const visible = getVisibleLines();
    const centerEntry = visible[CENTER_INDEX]!;
    const centerLine = centerEntry.line;
    const centerOrigIdx = centerEntry.originalIndex;

    if (centerLine.isCrack && !caughtCracks.has(centerOrigIdx)) {
      // Caught a crack
      const newCount = caughtCount + 1;
      setCaughtCount(newCount);
      setCaughtCracks((prev) => new Set([...prev, centerOrigIdx]));
      setMissStreak(0);
      setFlashColor("green");
      const newSpeed = Math.round(scrollSpeed * 0.85);
      setScrollSpeed(newSpeed);
      dispatch({type: "echoRhythmCatch"});

      if (newCount >= TOTAL_CRACKS) {
        dispatch({type: "echoRhythmComplete"});
        setTimeout(() => onComplete(), 600);
      }
    } else {
      // Miss
      const newMissStreak = missStreak + 1;
      setFlashColor("red");
      dispatch({type: "echoRhythmMiss"});

      if (newMissStreak >= 3) {
        setMissStreak(0);
        setHintMode(true);
      } else {
        setMissStreak(newMissStreak);
      }
    }
  }, [caughtCount, caughtCracks, dispatch, getVisibleLines, missStreak, onComplete, scrollSpeed]);

  useInput((_input, key) => {
    if (key.return) {
      handleInput();
    }
  });

  const visible = getVisibleLines();
  const _timingWindow = TIMING_WINDOWS[Math.min(caughtCount, TIMING_WINDOWS.length - 1)]!;

  const caughtDisplay = Array.from({length: TOTAL_CRACKS}, (_, i) =>
    i < caughtCount ? "\u25C6" : "\u25C7"
  ).join("");

  const labels = locale === "zh"
    ? {title: "回响节奏", prompt: "裂缝经过中心时按 Enter", caught: `${CRACK_CHAR} ${caughtDisplay}`}
    : {title: "Echo Rhythm", prompt: "Press Enter when a crack passes the center", caught: `${CRACK_CHAR} ${caughtDisplay}`};

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="yellow">{labels.title}</Text>
      <Text dimColor>{labels.prompt}</Text>
      <Text color="yellow">{labels.caught}</Text>
      <Text> </Text>
      <Box flexDirection="column" borderStyle="single" borderColor={flashColor ?? "gray"} paddingX={1}>
        {visible.map((entry, i) => {
          const isCenter = i === CENTER_INDEX;
          const isCrack = entry.line.isCrack && !caughtCracks.has(entry.originalIndex);
          const lineText = txt(locale, entry.line.text);

          const prefix = isCenter ? ">" : " ";
          const displayText = isCrack ? `${lineText}  ${CRACK_CHAR}` : lineText;

          let color: string | undefined;
          if (isCenter && flashColor === "green") {
            color = "green";
          } else if (isCenter && flashColor === "red") {
            color = "red";
          } else if (isCenter) {
            color = "white";
          } else if (isCrack) {
            color = "yellow";
          }

          return (
            <Text
              key={`${entry.originalIndex}-${i}`}
              color={color}
              bold={isCenter}
              dimColor={!isCenter && !isCrack}
              inverse={isCenter && flashColor !== null}
            >
              {prefix} {displayText}
            </Text>
          );
        })}
      </Box>
      {hintMode && (
        <Box flexDirection="column" marginTop={1}>
          {HINT_LINES.map((hint, i) => (
            <Text key={i} color="cyan" dimColor>
              {txt(locale, hint)}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
