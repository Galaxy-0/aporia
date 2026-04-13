import {lt, nextLocale} from "./i18n.js";
import {coordinatesFromSubjectId, subjectIdFromCoordinates} from "./content.js";
import {getAmbientEntities, getAmbientSuggestions, getOpeningReply} from "./mock-orchestrator.js";
import type {
  ComposerState,
  CoordinateDigit,
  CoordinateMutation,
  Coordinates,
  DisplayText,
  LensState,
  OrchestratorTurn,
  ReadingState,
  TranscriptEntry,
  WorldAction,
  WorldResources,
  WorldState
} from "./types.js";

function clampDigit(v: number): CoordinateDigit {
  return Math.max(1, Math.min(4, Math.round(v))) as CoordinateDigit;
}

function applyMutation(coords: Coordinates, mutation: CoordinateMutation): Coordinates {
  return {
    d1: clampDigit(coords.d1 + (mutation.d1 ?? 0)),
    d2: clampDigit(coords.d2 + (mutation.d2 ?? 0)),
    d3: clampDigit(coords.d3 + (mutation.d3 ?? 0)),
    d4: clampDigit(coords.d4 + (mutation.d4 ?? 0))
  };
}

const INITIAL_LENS: LensState = {
  equipped: null,
  unlocked: [],
  traces: []
};

const INITIAL_READING: ReadingState = {
  active: false,
  currentFragment: null,
  dwellMs: 0,
  completedFragments: []
};

const FRAME_LENGTH = 24;
const INPUT_LIMIT = 220;
const STREAM_STEP = 3;
const IDLE_COMPOSER: ComposerState = {
  status: "idle",
  streamEntryId: null,
  visibleCount: 0
};

function createEntryId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function displayLength(value: DisplayText) {
  return typeof value === "string" ? value.length : Math.max(value.en.length, value.zh.length);
}

function appendTrace(state: WorldState, trace: WorldState["traces"][number]) {
  return {
    ...state,
    traces: [...state.traces, trace].slice(-6)
  };
}

function appendTranscript(state: WorldState, entry: TranscriptEntry, composer?: Partial<ComposerState>) {
  return {
    ...state,
    transcript: [...state.transcript, entry].slice(-12),
    composer: {
      ...state.composer,
      ...composer
    }
  };
}

function withSceneAmbient(state: WorldState, scene = state.scene) {
  return {
    ...state,
    suggestions: getAmbientSuggestions(scene, state),
    entities: getAmbientEntities(scene, state)
  };
}

function getSyntheticPromptText(prompt: string): DisplayText {
  switch (prompt) {
    case "move:up":
      return lt("move forward", "向前移动");

    case "move:down":
      return lt("step back", "向后撤步");

    case "move:left":
      return lt("probe the left side", "向左试探");

    case "move:right":
      return lt("probe the right side", "向右试探");

    default:
      return prompt;
  }
}

function queuePrompt(state: WorldState, prompt: string, text: DisplayText) {
  return appendTranscript(
    {
      ...state,
      inputValue: "",
      pendingPrompt: prompt,
      composer: {
        status: "thinking",
        streamEntryId: null,
        visibleCount: 0
      } as ComposerState
    },
    {
      id: createEntryId("player"),
      role: "player",
      scene: state.scene,
      text
    }
  );
}

function applySlashCommand(state: WorldState, prompt: string) {
  const command = prompt.trim().toLowerCase();

  if (command === "/lang") {
    const locale = nextLocale(state.locale);
    const nextState: WorldState = {
      ...state,
      locale,
      inputValue: "",
      composer: IDLE_COMPOSER
    };

    return appendTranscript(
      nextState,
      {
        id: createEntryId("system"),
        role: "system",
        scene: state.scene,
        text: lt(
          "Language toggled. Subsequent world replies follow the active locale.",
          "语言已切换。后续世界回应会跟随当前语言。"
        )
      }
    );
  }

  if (command === "/reset") {
    const locale = state.locale;
    return {
      ...initialState,
      locale
    };
  }

  if (command === "/help") {
    return appendTranscript(
      {
        ...state,
        inputValue: "",
        composer: IDLE_COMPOSER
      },
      {
        id: createEntryId("system"),
        role: "system",
        scene: state.scene,
        text: lt(
          "Type plain language or use the arrow keys. Try look, touch, listen, ask, step forward, refuse. Commands: /lang, /reset.",
          "可以直接输入自然语言，也可以用方向键。试试：看、摸、听、问、往前走、拒绝。命令：/lang、/reset。"
        )
      }
    );
  }

  return null;
}

function applyTurnPatch(state: WorldState, turn: OrchestratorTurn) {
  const scene = turn.scenePatch?.scene ?? state.scene;
  const entryId = createEntryId("world");
  const nextResources: WorldResources = {
    ...state.resources,
    ...(turn.statePatch?.resources ?? {})
  };
  const nextStateBase: WorldState = {
    ...state,
    scene,
    narration: turn.narration ?? turn.reply,
    pendingPrompt: null,
    subjectId: turn.statePatch?.subjectId ?? state.subjectId,
    cycle: state.cycle + (turn.statePatch?.cycleDelta ?? 0),
    loopCount: state.loopCount + (turn.statePatch?.loopDelta ?? 0),
    deaths: state.deaths + (turn.statePatch?.deathsDelta ?? 0),
    resources: nextResources,
    flags: {
      ...state.flags,
      ...(turn.statePatch?.flags ?? {})
    },
    unlockedSymbols: Array.from(
      new Set([...state.unlockedSymbols, ...(turn.statePatch?.unlockedSymbolsAdd ?? [])])
    ),
    worldTone: turn.scenePatch?.tone ?? state.worldTone,
    viewport: {
      ...state.viewport,
      ...(turn.scenePatch?.viewport ?? {})
    },
    suggestions: turn.scenePatch?.suggestions ?? getAmbientSuggestions(scene, state),
    entities: turn.scenePatch?.entities ?? getAmbientEntities(scene, state),
    composer: {
      status: "streaming",
      streamEntryId: entryId,
      visibleCount: 1
    },
    ritual: {
      active: false,
      kind: null,
      target: 0,
      window: 0
    }
  };

  nextStateBase.suggestions = turn.scenePatch?.suggestions ?? getAmbientSuggestions(scene, nextStateBase);
  nextStateBase.entities = turn.scenePatch?.entities ?? getAmbientEntities(scene, nextStateBase);

  const withTrace = turn.trace ? appendTrace(nextStateBase, turn.trace) : nextStateBase;

  return appendTranscript(withTrace, {
    id: entryId,
    role: "world",
    scene,
    text: turn.reply
  });
}

const openingReply = getOpeningReply();

export const initialState: WorldState = {
  locale: "zh",
  scene: "beginning",
  cycle: 0,
  loopCount: 0,
  frame: 0,
  deaths: 0,
  subjectId: "3322",
  coordinates: coordinatesFromSubjectId("3322"),
  lens: INITIAL_LENS,
  reading: INITIAL_READING,
  selectedChoiceIndex: 0,
  narration: openingReply,
  unlockedSymbols: ["if", "one"],
  readFragments: [],
  traces: [lt("cycle 00 initialized", "轮回 00 已初始化")],
  resources: {
    clarity: 2,
    strain: 0
  },
  ritual: {
    active: false,
    kind: null,
    target: 0,
    window: 0
  },
  flags: {
    echoSeamSeen: false,
    echoVoicesHeard: false,
    foresightReads: 0,
    leapReady: false,
    gateOpen: false
  },
  transcript: [
    {
      id: "world-opening",
      role: "world",
      scene: "beginning",
      text: openingReply
    }
  ],
  inputValue: "",
  pendingPrompt: null,
  composer: {
    status: "streaming",
    streamEntryId: "world-opening",
    visibleCount: 1
  },
  suggestions: getAmbientSuggestions("beginning"),
  entities: getAmbientEntities("beginning"),
  worldTone: "calm",
  viewport: {
    glitch: 1,
    scan: 1,
    drift: 1
  },
  ideologicalLock: {active: false, ticksRemaining: 0},
  echoRhythm: {
    active: false,
    caughtCount: 0,
    missStreak: 0,
    scrollSpeed: 800
  }
};

export function worldReducer(state: WorldState, action: WorldAction) {
  switch (action.type) {
    case "tick": {
      const nextFrame = (state.frame + 1) % FRAME_LENGTH;

      const nextReading = state.reading.active
        ? {...state.reading, dwellMs: state.reading.dwellMs + 110}
        : state.reading;

      // Handle ideological lock countdown
      let nextLock = state.ideologicalLock;
      let nextResources = state.resources;
      if (nextLock.active) {
        const remaining = nextLock.ticksRemaining - 1;
        if (remaining <= 0) {
          nextLock = {active: false, ticksRemaining: 0};
          nextResources = {
            ...state.resources,
            strain: Math.max(0, state.resources.strain - 2)
          };
        } else {
          nextLock = {...nextLock, ticksRemaining: remaining};
        }
      }

      if (state.composer.status !== "streaming" || !state.composer.streamEntryId) {
        return {
          ...state,
          frame: nextFrame,
          reading: nextReading,
          ideologicalLock: nextLock,
          resources: nextResources
        };
      }

      const activeEntry = state.transcript.find((entry) => entry.id === state.composer.streamEntryId);
      const nextVisibleCount = state.composer.visibleCount + STREAM_STEP;

      if (!activeEntry || nextVisibleCount >= displayLength(activeEntry.text)) {
        return {
          ...state,
          frame: nextFrame,
          composer: IDLE_COMPOSER,
          ideologicalLock: nextLock,
          resources: nextResources
        };
      }

      return {
        ...state,
        frame: nextFrame,
        reading: nextReading,
        composer: {
          ...state.composer,
          visibleCount: nextVisibleCount
        },
        ideologicalLock: nextLock,
        resources: nextResources
      };
    }

    case "appendInput": {
      if (state.inputValue.length >= INPUT_LIMIT) {
        return state;
      }

      return {
        ...state,
        inputValue: `${state.inputValue}${action.value}`.slice(0, INPUT_LIMIT)
      };
    }

    case "backspaceInput": {
      if (!state.inputValue) {
        return state;
      }

      return {
        ...state,
        inputValue: state.inputValue.slice(0, -1)
      };
    }

    case "pasteInput": {
      const pasted = action.value.replace(/\s+/g, " ").trim();

      if (!pasted) {
        return state;
      }

      const separator = state.inputValue ? " " : "";
      return {
        ...state,
        inputValue: `${state.inputValue}${separator}${pasted}`.slice(0, INPUT_LIMIT)
      };
    }

    case "submitPrompt": {
      if (state.composer.status === "thinking" || state.composer.status === "streaming") {
        return state;
      }

      const prompt = state.inputValue.trim();
      if (!prompt) {
        return state;
      }

      const commandResult = prompt.startsWith("/") ? applySlashCommand(state, prompt) : null;
      if (commandResult) {
        return withSceneAmbient(commandResult);
      }

      const withPlayerEntry = queuePrompt(state, prompt, prompt);

      return {
        ...withPlayerEntry
      };
    }

    case "submitSyntheticPrompt": {
      if (state.composer.status === "thinking" || state.composer.status === "streaming") {
        return state;
      }

      if (state.inputValue.trim()) {
        return state;
      }

      const prompt = action.prompt.trim();
      if (!prompt) {
        return state;
      }

      return queuePrompt(state, prompt, getSyntheticPromptText(prompt));
    }

    case "applyTurn": {
      let next = applyTurnPatch(state, action.turn);

      // Death check: clarity <= 0
      if (next.resources.clarity <= 0) {
        const deathCoords = coordinatesFromSubjectId("1111");
        next = {
          ...next,
          scene: "beginning",
          coordinates: deathCoords,
          subjectId: "1111" as const,
          loopCount: next.loopCount + 1,
          deaths: next.deaths + 1,
          resources: {...next.resources, clarity: 2, strain: 0},
          ideologicalLock: {active: false, ticksRemaining: 0},
          narration: lt(
            "Clarity collapsed. You dissolve and reform at the blank crossing.",
            "清明度归零。你溶解了，又在空白十字处重新凝聚。"
          ),
          worldTone: "calm",
          viewport: {glitch: 1, scan: 1, drift: 1},
          suggestions: getAmbientSuggestions("beginning", next),
          entities: getAmbientEntities("beginning", next)
        };
      }

      // Check strain lock after applying turn
      if (next.resources.strain >= next.resources.clarity && !next.ideologicalLock.active) {
        next = {...next, ideologicalLock: {active: true, ticksRemaining: 273}};
      }

      return next;
    }

    case "checkStrainLock": {
      if (state.resources.strain >= state.resources.clarity && !state.ideologicalLock.active) {
        return {...state, ideologicalLock: {active: true, ticksRemaining: 273}};
      }
      return state;
    }

    case "returnToCrossing": {
      return applyTurnPatch(state, {
        reply: lt(
          "You force the structure to fold early. The blank crossing receives the interruption without protest.",
          "你强行让结构提前折回。空白十字平静地接住了这次打断。"
        ),
        narration: lt(
          "You force the structure to fold early. The blank crossing receives the interruption without protest.",
          "你强行让结构提前折回。空白十字平静地接住了这次打断。"
        ),
        trace: lt("manual return to the crossing", "手动返回十字开端"),
        scenePatch: {
          scene: "beginning",
          tone: "calm",
          suggestions: getAmbientSuggestions("beginning"),
          entities: getAmbientEntities("beginning"),
          viewport: {
            glitch: 1,
            scan: 1,
            drift: 1
          }
        },
        statePatch: {
          loopDelta: 1,
          deathsDelta: 1,
          subjectId: "3322"
        }
      });
    }

    case "resetRun": {
      return {
        ...initialState,
        locale: state.locale
      };
    }

    case "toggleLocale": {
      return {
        ...state,
        locale: nextLocale(state.locale)
      };
    }

    case "mutateCoordinates": {
      const nextCoords = applyMutation(state.coordinates, action.mutation);
      return {
        ...state,
        coordinates: nextCoords,
        subjectId: subjectIdFromCoordinates(nextCoords)
      };
    }

    case "equipLens": {
      return {
        ...state,
        lens: {...state.lens, equipped: action.lensId}
      };
    }

    case "unlockLens": {
      if (state.lens.unlocked.includes(action.lensId)) {
        return state;
      }

      return {
        ...state,
        lens: {...state.lens, unlocked: [...state.lens.unlocked, action.lensId]}
      };
    }

    case "startReading": {
      return {
        ...state,
        reading: {
          ...state.reading,
          active: true,
          currentFragment: action.fragmentId,
          dwellMs: 0
        }
      };
    }

    case "stopReading": {
      const completed = state.reading.currentFragment && state.reading.dwellMs >= 3000
        ? [...state.reading.completedFragments, state.reading.currentFragment]
        : state.reading.completedFragments;

      return {
        ...state,
        reading: {
          ...INITIAL_READING,
          completedFragments: Array.from(new Set(completed))
        }
      };
    }

    case "submitJudgment": {
      const mutation: CoordinateMutation =
        action.direction === "affirm" ? {d1: 1}
          : action.direction === "negate" ? {d2: 1}
            : {d3: 1}; // sublate

      const nextCoords = applyMutation(state.coordinates, mutation);
      return {
        ...state,
        coordinates: nextCoords,
        subjectId: subjectIdFromCoordinates(nextCoords)
      };
    }

    case "echoRhythmCatch": {
      const nextCaught = state.echoRhythm.caughtCount + 1;
      const nextSpeed = Math.round(state.echoRhythm.scrollSpeed * 0.85);
      return {
        ...state,
        echoRhythm: {
          ...state.echoRhythm,
          caughtCount: nextCaught,
          missStreak: 0,
          scrollSpeed: nextSpeed
        },
        resources: {
          ...state.resources,
          strain: state.resources.strain + 1
        }
      };
    }

    case "echoRhythmMiss": {
      const nextMissStreak = state.echoRhythm.missStreak + 1;
      return {
        ...state,
        echoRhythm: {
          ...state.echoRhythm,
          missStreak: nextMissStreak >= 3 ? 0 : nextMissStreak
        }
      };
    }

    case "echoRhythmComplete": {
      return {
        ...state,
        echoRhythm: {
          ...state.echoRhythm,
          active: false
        },
        flags: {
          ...state.flags,
          echoSeamSeen: true,
          echoVoicesHeard: true
        },
        resources: {
          ...state.resources,
          clarity: state.resources.clarity + 1
        },
        unlockedSymbols: Array.from(new Set([...state.unlockedSymbols, "there", "is"]))
      };
    }

    default:
      return state;
  }
}
