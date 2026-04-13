import {lt} from "../i18n.js";
import type {Coordinates, LensId, LocalizedText, SceneId} from "../types.js";

export type LensNode = {
  id: LensId;
  name: LocalizedText;
  tier: "domain" | "family" | "leaf";
  parent: LensId | null;
  children: LensId[];
  affinityScenes: SceneId[];
};

// ---------------------------------------------------------------------------
// Full $ hierarchy
// ---------------------------------------------------------------------------
// $-1: chapters beginning -> leap
// $-2: chapters grounding -> last-god

const node = (
  id: LensId,
  name: LocalizedText,
  tier: LensNode["tier"],
  parent: LensId | null,
  children: LensId[],
  affinityScenes: SceneId[]
): LensNode => ({id, name, tier, parent, children, affinityScenes});

const allNodes: LensNode[] = [
  // ── Domain 1 ──────────────────────────────────────────────
  node("$-1", lt("Domain I", "大域 I"), "domain", null, ["$-1-1", "$-1-2", "$-1-3", "$-1-4"], [
    "beginning", "echo", "playing-forth", "foresight", "leap"
  ]),

  // Family $-1-1  PURE THINKING
  node("$-1-1", lt("Pure Thinking", "纯粹思维"), "family", "$-1", ["$-1-1-1", "$-1-1-2", "$-1-1-3"], [
    "beginning", "echo"
  ]),
  node("$-1-1-1", lt("Being", "存在"), "leaf", "$-1-1", [], ["beginning"]),
  node("$-1-1-2", lt("Nothing", "虚无"), "leaf", "$-1-1", [], ["beginning"]),
  node("$-1-1-3", lt("Becoming", "变易"), "leaf", "$-1-1", [], ["echo"]),

  // Family $-1-2  SYMBOL SYSTEM
  node("$-1-2", lt("Symbol System", "符号体系"), "family", "$-1", ["$-1-2-1", "$-1-2-2", "$-1-2-3"], [
    "echo", "playing-forth"
  ]),
  node("$-1-2-1", lt("Sign", "符号"), "leaf", "$-1-2", [], ["echo"]),
  node("$-1-2-2", lt("Glyph", "铭文"), "leaf", "$-1-2", [], ["playing-forth"]),
  node("$-1-2-3", lt("Cipher", "暗号"), "leaf", "$-1-2", [], ["playing-forth"]),

  // Family $-1-3  ESSENCE
  node("$-1-3", lt("Essence", "本质"), "family", "$-1", ["$-1-3-1", "$-1-3-2", "$-1-3-3"], [
    "playing-forth", "foresight"
  ]),
  node("$-1-3-1", lt("Identity", "同一"), "leaf", "$-1-3", [], ["playing-forth"]),
  node("$-1-3-2", lt("Difference", "差异"), "leaf", "$-1-3", [], ["foresight"]),
  node("$-1-3-3", lt("Ground", "根据"), "leaf", "$-1-3", [], ["foresight"]),

  // Family $-1-4  APPEARANCE
  node("$-1-4", lt("Appearance", "现象"), "family", "$-1", ["$-1-4-1", "$-1-4-2", "$-1-4-3"], [
    "foresight", "leap"
  ]),
  node("$-1-4-1", lt("Form", "形式"), "leaf", "$-1-4", [], ["foresight"]),
  node("$-1-4-2", lt("Content", "内容"), "leaf", "$-1-4", [], ["leap"]),
  node("$-1-4-3", lt("Relation", "关系"), "leaf", "$-1-4", [], ["leap"]),

  // ── Domain 2 ──────────────────────────────────────────────
  node("$-2", lt("Domain II", "大域 II"), "domain", null, ["$-2-1", "$-2-2", "$-2-3", "$-2-4"], [
    "grounding", "seyn", "ones-to-come", "last-god"
  ]),

  // Family $-2-1  ABSOLUTE
  node("$-2-1", lt("Absolute", "绝对"), "family", "$-2", ["$-2-1-1", "$-2-1-2", "$-2-1-3"], [
    "grounding"
  ]),
  node("$-2-1-1", lt("Substance", "实体"), "leaf", "$-2-1", [], ["grounding"]),
  node("$-2-1-2", lt("Causality", "因果"), "leaf", "$-2-1", [], ["grounding"]),
  node("$-2-1-3", lt("Reciprocity", "交互"), "leaf", "$-2-1", [], ["grounding"]),

  // Family $-2-2  CONCEPTION
  node("$-2-2", lt("Conception", "概念"), "family", "$-2", ["$-2-2-1", "$-2-2-2", "$-2-2-3"], [
    "seyn"
  ]),
  node("$-2-2-1", lt("Universal", "普遍"), "leaf", "$-2-2", [], ["seyn"]),
  node("$-2-2-2", lt("Particular", "特殊"), "leaf", "$-2-2", [], ["seyn"]),
  node("$-2-2-3", lt("Singular", "个别"), "leaf", "$-2-2", [], ["seyn"]),

  // Family $-2-3  OBJECTIVITY
  node("$-2-3", lt("Objectivity", "客观性"), "family", "$-2", ["$-2-3-1", "$-2-3-2", "$-2-3-3"], [
    "ones-to-come"
  ]),
  node("$-2-3-1", lt("Mechanism", "机械"), "leaf", "$-2-3", [], ["ones-to-come"]),
  node("$-2-3-2", lt("Chemism", "化合"), "leaf", "$-2-3", [], ["ones-to-come"]),
  node("$-2-3-3", lt("Teleology", "目的"), "leaf", "$-2-3", [], ["ones-to-come"]),

  // Family $-2-4  IDEA
  node("$-2-4", lt("Idea", "理念"), "family", "$-2", ["$-2-4-1", "$-2-4-2", "$-2-4-3"], [
    "last-god"
  ]),
  node("$-2-4-1", lt("Life", "生命"), "leaf", "$-2-4", [], ["last-god"]),
  node("$-2-4-2", lt("Cognition", "认识"), "leaf", "$-2-4", [], ["last-god"]),
  node("$-2-4-3", lt("Absolute Idea", "绝对理念"), "leaf", "$-2-4", [], ["last-god"]),
];

// ---------------------------------------------------------------------------
// Exported lookup structures
// ---------------------------------------------------------------------------

export const lensTree: Record<LensId, LensNode> = {};
for (const n of allNodes) {
  lensTree[n.id] = n;
}

/** Return direct children of a lens node. */
export function getLensChildren(id: LensId): LensNode[] {
  const n = lensTree[id];
  if (!n) return [];
  return n.children.map((cid) => lensTree[cid]).filter(Boolean);
}

/** Return ancestors from immediate parent up to the root, nearest first. */
export function getLensAncestors(id: LensId): LensNode[] {
  const result: LensNode[] = [];
  let current = lensTree[id];
  while (current?.parent) {
    const parent = lensTree[current.parent];
    if (!parent) break;
    result.push(parent);
    current = parent;
  }
  return result;
}

/**
 * Visibility rule:
 *  - $-1 (and its subtree) is visible when D1 <= 2
 *  - $-2 (and its subtree) is visible when D1 >= 3
 */
export function isLensVisible(id: LensId, coordinates: Coordinates): boolean {
  // Determine which domain this lens belongs to
  const domainId = id.startsWith("$-2") ? "$-2" : "$-1";
  if (domainId === "$-1") return coordinates.d1 <= 2;
  return coordinates.d1 >= 3;
}

/** Flat ordered list of all lens IDs in depth-first tree order. */
export function flatLensOrder(): LensId[] {
  const result: LensId[] = [];
  function walk(id: LensId) {
    result.push(id);
    const n = lensTree[id];
    if (n) {
      for (const child of n.children) walk(child);
    }
  }
  walk("$-1");
  walk("$-2");
  return result;
}

/** Depth of a lens in the tree (domain=0, family=1, leaf=2). */
export function lensDepth(id: LensId): number {
  const n = lensTree[id];
  if (!n) return 0;
  switch (n.tier) {
    case "domain": return 0;
    case "family": return 1;
    case "leaf": return 2;
  }
}
