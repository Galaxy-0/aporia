export type Locale = "zh" | "en";

export type LocalizedText = {
  en: string;
  zh: string;
};

export type DisplayText = LocalizedText | string;

export type SceneId =
  | "beginning"
  | "echo"
  | "playing-forth"
  | "foresight"
  | "leap"
  | "grounding"
  | "seyn"
  | "ones-to-come"
  | "last-god";

export type ChoiceTone = "normal" | "ritual" | "danger";

export type CoordinateDigit = 1 | 2 | 3 | 4;

export type Coordinates = {
  d1: CoordinateDigit; // Sein: 质/量/度/本质
  d2: CoordinateDigit; // Wahrheit: 符合/融贯/去蔽/裂隙
  d3: CoordinateDigit; // Zeitlichkeit: 当前化/保持/先行/瞬间
  d4: CoordinateDigit; // Praxis: 服从/抉择/创制/泰然任之
};

export type CoordinateMutation = Partial<Record<keyof Coordinates, -1 | 0 | 1>>;

export type SubjectId = `${CoordinateDigit}${CoordinateDigit}${CoordinateDigit}${CoordinateDigit}`;

export type Choice = {
  id: string;
  label: LocalizedText;
  hint: LocalizedText;
  tone?: ChoiceTone;
  enabled?: boolean;
  lockReason?: LocalizedText;
};

export type TranscriptRole = "player" | "world" | "system";

export type TranscriptEntry = {
  id: string;
  role: TranscriptRole;
  text: DisplayText;
  scene: SceneId;
};

export type WorldTone = "calm" | "tense" | "ritual" | "distant" | "hostile";

export type PresenceDistance = "near" | "mid" | "far";

export type WorldEntity = {
  id: string;
  name: LocalizedText;
  mood: LocalizedText;
  distance: PresenceDistance;
};

export type WorldResources = {
  clarity: number;
  strain: number;
};

export type WorldFlags = {
  echoSeamSeen: boolean;
  echoVoicesHeard: boolean;
  foresightReads: number;
  leapReady: boolean;
  gateOpen: boolean;
};

export type ViewportIntent = {
  glitch: number;
  scan: number;
  drift: number;
};

export type ComposerState = {
  status: "idle" | "thinking" | "streaming";
  streamEntryId: string | null;
  visibleCount: number;
};

export type ScenePatch = {
  scene?: SceneId;
  tone?: WorldTone;
  entities?: WorldEntity[];
  suggestions?: LocalizedText[];
  viewport?: Partial<ViewportIntent>;
};

export type StatePatch = {
  subjectId?: SubjectId;
  flags?: Partial<WorldFlags>;
  resources?: Partial<WorldResources>;
  unlockedSymbolsAdd?: string[];
  loopDelta?: number;
  cycleDelta?: number;
  deathsDelta?: number;
};

export type OrchestratorTurn = {
  reply: LocalizedText;
  narration?: LocalizedText;
  trace?: LocalizedText;
  scenePatch?: ScenePatch;
  statePatch?: StatePatch;
};

export type SceneDefinition = {
  id: SceneId;
  code: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  accent: string;
  doctrine: LocalizedText[];
  glyphs: string[];
  visual: string[];
  choices: (state: WorldState) => Choice[];
};

export type WorldState = {
  locale: Locale;
  scene: SceneId;
  cycle: number;
  loopCount: number;
  frame: number;
  deaths: number;
  subjectId: SubjectId;
  coordinates: Coordinates;
  lens: LensState;
  reading: ReadingState;
  selectedChoiceIndex: number;
  narration: LocalizedText;
  unlockedSymbols: string[];
  readFragments: string[];
  traces: LocalizedText[];
  resources: WorldResources;
  ritual: {
    active: boolean;
    kind: "echo-align" | null;
    target: number;
    window: number;
  };
  flags: WorldFlags;
  transcript: TranscriptEntry[];
  inputValue: string;
  pendingPrompt: string | null;
  composer: ComposerState;
  suggestions: LocalizedText[];
  entities: WorldEntity[];
  worldTone: WorldTone;
  viewport: ViewportIntent;
  ideologicalLock: {active: boolean; ticksRemaining: number};
  echoRhythm: {
    active: boolean;
    caughtCount: number;
    missStreak: number;
    scrollSpeed: number;
  };
};

export type LensId = string; // e.g. "$-1-1-1", "$-2-4-3"

export type LensState = {
  equipped: LensId | null;
  unlocked: LensId[];
  traces: LensId[]; // from previous cycles (dim ◇)
};

export type ReadingState = {
  active: boolean;
  currentFragment: string | null;
  dwellMs: number; // accumulated dwell time on current fragment
  completedFragments: string[];
};

export type WorldAction =
  | {type: "tick"}
  | {type: "appendInput"; value: string}
  | {type: "backspaceInput"}
  | {type: "pasteInput"; value: string}
  | {type: "submitPrompt"}
  | {type: "submitSyntheticPrompt"; prompt: string}
  | {type: "applyTurn"; turn: OrchestratorTurn}
  | {type: "returnToCrossing"}
  | {type: "resetRun"}
  | {type: "toggleLocale"}
  | {type: "mutateCoordinates"; mutation: CoordinateMutation}
  | {type: "equipLens"; lensId: LensId | null}
  | {type: "unlockLens"; lensId: LensId}
  | {type: "startReading"; fragmentId: string}
  | {type: "stopReading"}
  | {type: "submitJudgment"; direction: "affirm" | "negate" | "sublate"}
  | {type: "checkStrainLock"}
  | {type: "echoRhythmCatch"}
  | {type: "echoRhythmMiss"}
  | {type: "echoRhythmComplete"};
