/**
 * Headless mode — same game logic, plain text I/O.
 * Works in non-interactive terminals (CI, piped input, Claude's bash).
 *
 * Usage:
 *   echo "move:up" | npx tsx src/headless.ts
 *   echo -e "move:up\nmove:left\nlook" | npx tsx src/headless.ts
 *   npx tsx src/headless.ts --actions "move:up,echo:rhythm"
 */

import {worldReducer, initialState} from "./reducer.js";
import {getScene, describeSubject, scenes} from "./content.js";
import {displayText} from "./i18n.js";
import {resolveMockTurn} from "./mock-orchestrator.js";
import type {WorldState, SceneId} from "./types.js";

const SCENE_ORDER: SceneId[] = [
  "beginning", "echo", "playing-forth", "foresight",
  "leap", "grounding", "seyn", "ones-to-come", "last-god"
];

const SCENE_SHORT: Record<SceneId, string> = {
  "beginning": "Beginning",
  "echo": "Echo",
  "playing-forth": "Rail",
  "foresight": "Foresight",
  "leap": "Leap",
  "grounding": "Grounding",
  "seyn": "Seyn",
  "ones-to-come": "Ones-to-Come",
  "last-god": "Last God"
};

function renderState(state: WorldState): string {
  const scene = getScene(state);
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push(`  ${scene.code} ${displayText(state.locale, scene.title)}`);
  lines.push(`  ${displayText(state.locale, scene.subtitle)}`);
  lines.push("-".repeat(60));

  // coordinates
  const desc = describeSubject(state.subjectId, state.locale);
  lines.push(`  coord ${state.subjectId}  |  ${desc.join(" . ")}`);

  // resources
  const clarityBar = "#".repeat(state.resources.clarity) + ".".repeat(8 - state.resources.clarity);
  const strainBar = "#".repeat(state.resources.strain) + ".".repeat(8 - state.resources.strain);
  lines.push(`  clarity [${clarityBar}] ${state.resources.clarity}  strain [${strainBar}] ${state.resources.strain}`);

  // status
  lines.push(`  cycle=${state.cycle} loop=${state.loopCount} deaths=${state.deaths} symbols=[${state.unlockedSymbols.join(",")}]`);

  // ideological lock
  if (state.ideologicalLock.active) {
    lines.push(`  !! ideological lock active (${Math.ceil(state.ideologicalLock.ticksRemaining * 0.11)}s)`);
  }

  // lens
  if (state.lens.equipped) {
    lines.push(`  lens: ${state.lens.equipped}`);
  }

  // narration
  lines.push("-".repeat(60));
  const narration = displayText(state.locale, state.narration);
  lines.push(`  ${narration.slice(0, 200)}`);

  // last transcript
  const lastWorld = [...state.transcript].reverse().find(e => e.role === "world");
  if (lastWorld && lastWorld.text !== state.narration) {
    lines.push(`  > ${displayText(state.locale, lastWorld.text).slice(0, 200)}`);
  }

  // choices
  lines.push("-".repeat(60));
  const choices = scene.choices(state);
  choices.forEach((c, i) => {
    const lock = c.enabled === false ? ` [locked] ${c.lockReason ? displayText(state.locale, c.lockReason) : ""}` : "";
    lines.push(`  [${i}] ${displayText(state.locale, c.label)}${lock}`);
    lines.push(`      ${displayText(state.locale, c.hint)}`);
  });

  // echo rhythm status
  if (state.echoRhythm.active) {
    const caught = "+".repeat(state.echoRhythm.caughtCount) + "-".repeat(4 - state.echoRhythm.caughtCount);
    lines.push(`  rhythm [${caught}]  speed=${state.echoRhythm.scrollSpeed}ms  misses=${state.echoRhythm.missStreak}`);
  }

  // operations hint
  lines.push("  Operations: [N]egate a line  [A]ffirm a symbol  [S]ublate two elements");

  lines.push("=".repeat(60));
  return lines.join("\n");
}

function simulateTicks(state: WorldState, count = 5): WorldState {
  let s = state;
  for (let i = 0; i < count; i++) {
    s = worldReducer(s, {type: "tick"});
  }
  // check strain lock (skip during active echo rhythm)
  if (s.resources.strain >= s.resources.clarity && !s.ideologicalLock.active && s.resources.clarity > 0 && !s.echoRhythm.active) {
    s = worldReducer(s, {type: "checkStrainLock"});
  }
  return s;
}

function applyDeathCheck(state: WorldState): WorldState {
  if (state.resources.clarity <= 0) {
    // Traces persist through death
    const traces = state.traces;
    const deathScene = state.scene;
    const finalSymbols = state.unlockedSymbols.join(", ") || "(none)";
    let s = worldReducer(state, {type: "applyTurn", turn: {
      reply: {en: "Your clarity fades to nothing. You forget everything.", zh: "你的清明归零。你遗忘了一切。"},
      scenePatch: {scene: "beginning", tone: "calm"},
      statePatch: {subjectId: "1111", loopDelta: 1, deathsDelta: 1, resources: {clarity: 2, strain: 0}}
    }});
    s = {...s, traces};
    console.log(`  ** DEATH in [${deathScene}]: clarity reached zero. Symbols carried: [${finalSymbols}]. Reborn at the crossing. Traces persist. **`);
    return s;
  }
  return state;
}

function renderInventory(state: WorldState): string {
  const lines: string[] = [];
  lines.push("--- INVENTORY ---");

  // Symbols
  lines.push("  Symbols:");
  if (state.unlockedSymbols.length === 0) {
    lines.push("    (none)");
  } else {
    for (const sym of state.unlockedSymbols) {
      lines.push(`    * ${sym}`);
    }
  }

  // Lens
  lines.push(`  Lens: ${state.lens.equipped ?? "(none)"}`);

  // Coordinates
  const desc = describeSubject(state.subjectId, state.locale);
  lines.push(`  Coordinates: ${state.subjectId} (${desc.join(" | ")})`);

  // Resources
  lines.push(`  Clarity: ${state.resources.clarity}/8  Strain: ${state.resources.strain}/8`);

  lines.push("-----------------");
  return lines.join("\n");
}

function renderMap(state: WorldState): string {
  const visited = new Set<SceneId>();
  // Mark scenes as visited based on transcript
  for (const entry of state.transcript) {
    visited.add(entry.scene);
  }
  // Also always mark current scene
  visited.add(state.scene);

  const lines: string[] = [];
  lines.push("--- MAP ---");
  for (const sceneId of SCENE_ORDER) {
    const isCurrent = state.scene === sceneId;
    const isVisited = visited.has(sceneId);
    const marker = isCurrent ? "[*]" : isVisited ? "[v]" : "[ ]";
    const name = SCENE_SHORT[sceneId];
    const code = scenes[sceneId].code;
    lines.push(`  ${marker} ${code} ${name}`);
  }
  lines.push("-----------");
  return lines.join("\n");
}

function processCommand(state: WorldState, cmd: string): WorldState {
  const c = cmd.trim().toLowerCase();

  // echo rhythm catches and sublate/fold bypass strain lock
  if (c === "catch" || c === "miss" || c === "sublate" || c === "fold") {
    // handled below, skip lock check
  } else if (state.ideologicalLock.active) {
    // Task 6: Strain lock enforcement
    console.log("  !! You are locked in ideological fixation. Most actions are blocked. Try: sublate, fold");
    return simulateTicks(state, 273);
  }

  // direction shortcuts
  if (["n", "north", "up", "w"].includes(c)) return applyDeathCheck(processAction(state, "move:up"));
  if (["s", "south", "down", "x"].includes(c)) return applyDeathCheck(processAction(state, "move:down"));
  if (["e", "east", "right", "d"].includes(c)) return applyDeathCheck(processAction(state, "move:right"));
  if (["west", "left", "a"].includes(c)) return applyDeathCheck(processAction(state, "move:left"));

  // help command
  if (c === "help") {
    console.log("Commands:");
    console.log("  0-9      Select a choice");
    console.log("  n/s/e/w  Move in a direction");
    console.log("  negate   Erase/deny (costs strain)");
    console.log("  affirm   Inscribe/confirm (costs clarity)");
    console.log("  sublate  Fold contradictions (heals strain, needs 2+ symbols)");
    console.log("  combine:X,Y  Combine two symbols");
    console.log("  inv      Show inventory");
    console.log("  map      Show world map");
    console.log("  help     This message");
    return state;
  }

  // Task 8: inventory + map
  if (c === "inventory" || c === "inv") {
    console.log(renderInventory(state));
    return state;
  }
  if (c === "map") {
    console.log(renderMap(state));
    return state;
  }

  // Task 1: choice by index - wire to choice ID
  if (/^\d$/.test(c)) {
    const scene = getScene(state);
    const choices = scene.choices(state);
    const choice = choices[Number(c)];
    if (choice && choice.enabled !== false) {
      const result = processAction(state, choice.id);
      return applyDeathCheck(result);
    }
    console.log(`  (choice ${c} not available)`);
    return state;
  }

  // special commands
  if (c === "status" || c === "?") return state; // just re-render
  if (c === "reset") return initialState;

  // coordinate mutation test
  if (c.startsWith("mutate:")) {
    const parts = c.slice(7).split(",");
    const mutation: Record<string, number> = {};
    for (const p of parts) {
      const [k, v] = p.split("=");
      if (k && v) mutation[k] = Number(v);
    }
    return worldReducer(state, {type: "mutateCoordinates", mutation: mutation as any});
  }

  // echo rhythm simulation (Task 5)
  if (c === "catch") {
    let s = worldReducer(state, {type: "echoRhythmCatch"});
    if (s.echoRhythm.caughtCount >= 4) {
      s = worldReducer(s, {type: "echoRhythmComplete"});
      console.log("  ** Echo rhythm complete! The gate is now open. **");
    }
    // No simulateTicks for rhythm catches — they happen in rapid succession
    return applyDeathCheck(s);
  }
  if (c === "miss") return applyDeathCheck(worldReducer(state, {type: "echoRhythmMiss"}));

  // Task 2: N/A/S operations via processAction
  if (c === "negate" || c === "deny") {
    const s = processAction(state, "op:negate");
    const s2 = worldReducer(s, {type: "mutateCoordinates", mutation: {d2: 1}});
    return applyDeathCheck(simulateTicks(s2));
  }
  if (c === "affirm" || c === "inscribe") {
    const s = processAction(state, "op:affirm");
    const s2 = worldReducer(s, {type: "mutateCoordinates", mutation: {d1: 1}});
    return applyDeathCheck(simulateTicks(s2));
  }
  if (c === "sublate" || c === "fold") {
    const s = processAction(state, "op:sublate");
    const s2 = worldReducer(s, {type: "mutateCoordinates", mutation: {d3: 1}});
    return applyDeathCheck(simulateTicks(s2));
  }

  // Task 3: combine command
  if (c.startsWith("combine:")) {
    const s = processAction(state, c);
    return applyDeathCheck(simulateTicks(s));
  }

  // pass as natural language
  return applyDeathCheck(simulateTicks(processAction(state, c)));
}

function processAction(state: WorldState, prompt: string): WorldState {
  const turn = resolveMockTurn(state, prompt);
  return worldReducer(state, {type: "applyTurn", turn});
}

// --- main ---
async function main() {
  let state = initialState;
  console.log(renderState(state));

  // check for --actions flag
  const actionsArg = process.argv.find(a => a.startsWith("--actions="));
  if (actionsArg) {
    const actions = actionsArg.slice(10).split(",");
    for (const action of actions) {
      console.log(`\n>> ${action}`);
      state = processCommand(state, action);
      console.log(renderState(state));
    }
    return;
  }

  // read from stdin (piped or interactive line mode)
  const readline = await import("readline");
  const rl = readline.createInterface({input: process.stdin, output: process.stdout, terminal: false});

  rl.on("line", (line: string) => {
    if (!line.trim()) return;
    console.log(`\n>> ${line.trim()}`);
    state = processCommand(state, line.trim());
    console.log(renderState(state));
  });

  rl.on("close", () => {
    console.log("\n[session ended]");
  });
}

main().catch(console.error);
