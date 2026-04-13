import React from "react";
import {Box, useFocusManager} from "ink";
import {getScene} from "../content.js";
import type {WorldState} from "../types.js";
import {CenterViewport} from "./center-viewport.js";
import {FogOverlay} from "./fog-overlay.js";
import {getPanelLabel, PANEL_IDS} from "./focus-ids.js";
import {HeaderBar} from "./header-bar.js";
import {LeftPanel} from "./left-panel.js";
import {LensPanel} from "./lens-panel.js";
import {LockOverlay} from "./lock-overlay.js";
import {SubtitleBar} from "./subtitle-bar.js";

type ShellProps = {
  state: WorldState;
  lensOverlayOpen: boolean;
  lensCursor: number;
};

export function AporiaShell({state, lensOverlayOpen, lensCursor}: ShellProps) {
  const scene = getScene(state);
  const {activeId} = useFocusManager();
  const activePanel = getPanelLabel(activeId ?? PANEL_IDS.footer, state.locale);

  return (
    <Box flexDirection="column" width="100%">
      <HeaderBar scene={scene} state={state} activePanel={activePanel} />
      <Box marginTop={1}>
        <LeftPanel scene={scene} state={state} />
        {lensOverlayOpen ? (
          <LensPanel
            locale={state.locale}
            lens={state.lens}
            coordinates={state.coordinates}
            cursorIndex={lensCursor}
          />
        ) : (
          <FogOverlay clarity={state.resources.clarity} width={50} height={20}>
            <CenterViewport scene={scene} state={state} />
          </FogOverlay>
        )}
      </Box>
      {state.ideologicalLock.active && <LockOverlay state={state} />}
      <Box marginTop={1}>
        <SubtitleBar scene={scene} state={state} activePanel={activePanel} />
      </Box>
    </Box>
  );
}
