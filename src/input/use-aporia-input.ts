import {useApp, useFocusManager, useInput, usePaste} from "ink";
import {useCallback, useState, type Dispatch} from "react";
import {flatLensOrder, isLensVisible} from "../lens/lens-data.js";
import type {Coordinates, WorldAction, WorldState} from "../types.js";
import {PANEL_IDS} from "../ui/focus-ids.js";

function isPrintableInput(input: string, key: {ctrl: boolean; meta: boolean; escape: boolean}) {
  return input.length > 0 && !/[\u0000-\u001F\u007F]/.test(input) && !key.ctrl && !key.meta && !key.escape;
}

function getMovementPrompt(key: {
  upArrow?: boolean;
  downArrow?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
}) {
  if (key.upArrow) {
    return "move:up";
  }

  if (key.downArrow) {
    return "move:down";
  }

  if (key.leftArrow) {
    return "move:left";
  }

  if (key.rightArrow) {
    return "move:right";
  }

  return null;
}

function visibleCount(coordinates: Coordinates): number {
  return flatLensOrder().filter((id) => isLensVisible(id, coordinates)).length;
}

export function useAporiaInput(
  dispatch: Dispatch<WorldAction>,
  composerStatus: WorldState["composer"]["status"],
  inputValue: WorldState["inputValue"],
  coordinates?: Coordinates,
  ideologicalLockActive = false
) {
  const {exit} = useApp();
  const {activeId, focus} = useFocusManager();
  const consoleActive = (activeId ?? PANEL_IDS.footer) === PANEL_IDS.footer;

  const [lensOverlayOpen, setLensOverlayOpen] = useState(false);
  const [lensCursor, setLensCursor] = useState(0);

  const closeLensOverlay = useCallback(() => {
    setLensOverlayOpen(false);
  }, []);

  usePaste(
    (text) => {
      if (lensOverlayOpen) return;

      if (!consoleActive) {
        focus(PANEL_IDS.footer);
      }

      dispatch({type: "pasteInput", value: text});
    },
    {isActive: true}
  );

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
      return;
    }

    // Swallow all input during ideological lock
    if (ideologicalLockActive) {
      return;
    }

    // Toggle lens overlay with '$'
    if (input === "$") {
      setLensOverlayOpen((prev) => {
        if (!prev) {
          setLensCursor(0);
        }
        return !prev;
      });
      return;
    }

    // ── Lens overlay mode ──────────────────────────────────
    if (lensOverlayOpen) {
      if (key.escape) {
        closeLensOverlay();
        return;
      }

      const total = coordinates ? visibleCount(coordinates) : 0;

      if (key.upArrow) {
        setLensCursor((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      }

      if (key.downArrow) {
        setLensCursor((prev) => (prev < total - 1 ? prev + 1 : prev));
        return;
      }

      if (key.return) {
        if (coordinates && total > 0) {
          const visibleIds = flatLensOrder().filter((id) => isLensVisible(id, coordinates));
          const selectedId = visibleIds[lensCursor];
          if (selectedId) {
            dispatch({type: "equipLens", lensId: selectedId});
          }
        }
        closeLensOverlay();
        return;
      }

      // Swallow all other keys while overlay is open
      return;
    }

    // ── Normal mode (unchanged) ────────────────────────────
    const movementPrompt = getMovementPrompt(key);
    if (movementPrompt && composerStatus === "idle" && !inputValue.trim()) {
      dispatch({type: "submitSyntheticPrompt", prompt: movementPrompt});
      return;
    }

    if (!consoleActive && isPrintableInput(input, key)) {
      focus(PANEL_IDS.footer);
      dispatch({type: "appendInput", value: input});
      return;
    }

    if (!consoleActive) {
      return;
    }

    if (key.return || input === "\r" || input === "\n") {
      if (composerStatus === "idle") {
        dispatch({type: "submitPrompt"});
      }
      return;
    }

    if (key.backspace || key.delete) {
      dispatch({type: "backspaceInput"});
      return;
    }

    if (key.escape) {
      focus(PANEL_IDS.center);
      return;
    }

    if (isPrintableInput(input, key)) {
      dispatch({type: "appendInput", value: input});
    }
  });

  return {lensOverlayOpen, lensCursor};
}
