import React from "react";
import {Box, Text} from "ink";
import {txt} from "../i18n.js";
import {flatLensOrder, lensDepth, lensTree, isLensVisible} from "../lens/lens-data.js";
import type {LensState, Locale, Coordinates} from "../types.js";

type LensPanelProps = {
  locale: Locale;
  lens: LensState;
  coordinates: Coordinates;
  cursorIndex: number;
};

export function LensPanel({locale, lens, coordinates, cursorIndex}: LensPanelProps) {
  const allIds = flatLensOrder();
  const visibleIds = allIds.filter((id) => isLensVisible(id, coordinates));

  const labels = locale === "zh"
    ? {title: "$ 透镜", hint: "↑↓ 导航  Enter 装备  $ / Esc 关闭", empty: "尚无可见透镜"}
    : {title: "$ Lens", hint: "Up/Down navigate  Enter equip  $ / Esc close", empty: "No visible lenses"};

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      paddingX={1}
      paddingY={0}
      width={40}
    >
      <Text bold color="yellow">{labels.title}</Text>
      <Text dimColor>{labels.hint}</Text>
      <Text> </Text>

      {visibleIds.length === 0 ? (
        <Text dimColor>{labels.empty}</Text>
      ) : (
        visibleIds.map((id, index) => {
          const node = lensTree[id];
          if (!node) return null;

          const depth = lensDepth(id);
          const indent = "  ".repeat(depth);
          const isEquipped = lens.equipped === id;
          const isUnlocked = lens.unlocked.includes(id);
          const isTrace = lens.traces.includes(id);
          const isCursor = index === cursorIndex;

          let marker: string;
          if (isEquipped) {
            marker = "◆";
          } else if (isUnlocked) {
            marker = "◇";
          } else if (isTrace) {
            marker = "◇";
          } else {
            marker = " ";
          }

          const name = txt(locale, node.name);
          const prefix = isCursor ? ">" : " ";

          return (
            <Text key={id} dimColor={isTrace && !isUnlocked && !isEquipped}>
              {prefix} {indent}{marker} {id} {name}
            </Text>
          );
        })
      )}
    </Box>
  );
}
