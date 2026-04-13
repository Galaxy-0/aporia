import {getForesightFragment} from "./content.js";
import {lt} from "./i18n.js";
import type {
  LocalizedText,
  OrchestratorTurn,
  SceneId,
  ScenePatch,
  StatePatch,
  WorldEntity,
  WorldFlags,
  WorldState
} from "./types.js";

function includesAny(input: string, terms: string[]) {
  return terms.some((term) => input.includes(term));
}

function normalizePrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, " ");
}

type MovementDirection = "up" | "down" | "left" | "right";

function getMovementDirection(prompt: string): MovementDirection | null {
  switch (prompt) {
    case "move:up":
      return "up";

    case "move:down":
      return "down";

    case "move:left":
      return "left";

    case "move:right":
      return "right";

    default:
      return null;
  }
}

function buildAmbientEntities(scene: SceneId, flags: WorldFlags): WorldEntity[] {
  switch (scene) {
    case "echo":
      return flags.echoVoicesHeard
        ? [
            {
              id: "vertical-voice",
              name: lt("vertical voice", "竖直的声音"),
              mood: lt("waiting just beyond the wall", "就在墙后等待"),
              distance: "far"
            }
          ]
        : [
            {
              id: "false-seam",
              name: lt("false seam", "假裂缝"),
              mood: lt("almost but not fully aligned", "几乎对准，但还差一点"),
              distance: "mid"
            }
          ];

    case "playing-forth":
      return [
        {
          id: "rail",
          name: lt("lift rail", "抬升轨道"),
          mood: lt("holding a narrow ascent open", "撑开一条狭窄上升路"),
          distance: "mid"
        }
      ];

    case "foresight":
      return [
        {
          id: "field-pressure",
          name: lt("field pressure", "旷野压力"),
          mood: lt("patient and unreadable", "耐心而不可读"),
          distance: "far"
        }
      ];

    case "leap":
      return [
        {
          id: "negative-shaft",
          name: lt("negative shaft", "负空间井道"),
          mood: lt("waiting for commitment", "等待一次真正的投身"),
          distance: "near"
        }
      ];

    case "grounding":
      return [
        {
          id: "split-ground",
          name: lt("split ground", "裂开的地面"),
          mood: lt("stable only while observed", "只有在被注视时才稳定"),
          distance: "near"
        }
      ];

    case "seyn":
      return [
        {
          id: "withholding-gate",
          name: lt("withholding gate", "保留之门"),
          mood: lt("opening by refusing to open", "在拒绝中开启"),
          distance: "near"
        }
      ];

    case "ones-to-come":
      return [
        {
          id: "future-container",
          name: lt("future container", "未来容器"),
          mood: lt("testing your shape", "在试探你的形状"),
          distance: "near"
        }
      ];

    case "last-god":
      return [
        {
          id: "return-beam",
          name: lt("return beam", "回返光束"),
          mood: lt("capable of folding the cycle shut", "能够把轮回重新折回"),
          distance: "mid"
        }
      ];

    default:
      return [];
  }
}

export function getAmbientEntities(scene: SceneId, state?: Pick<WorldState, "flags">) {
  return buildAmbientEntities(
    scene,
    state?.flags ?? {
      echoSeamSeen: false,
      echoVoicesHeard: false,
      foresightReads: 0,
      leapReady: false,
      gateOpen: false
    }
  );
}

export function getAmbientSuggestions(scene: SceneId, state?: Pick<WorldState, "flags">): LocalizedText[] {
  switch (scene) {
    case "beginning":
      return [
        lt("look around the white crossing", "环顾这片白色十字"),
        lt("touch the faint seam in the wall", "摸一摸墙上的暗缝"),
        lt("walk into one of the four arms", "沿四条通路中的一条走进去")
      ];

    case "echo":
      return state?.flags.echoSeamSeen && state.flags.echoVoicesHeard
        ? [
            lt("enter the vertical rail", "进入那条垂直轨道"),
            lt("ask who is speaking behind the wall", "问墙后的声音是谁"),
            lt("stand still and watch the seam breathe", "站着不动，看裂缝呼吸")
          ]
        : [
            lt("touch the seam", "摸那道裂缝"),
            lt("listen beyond the ring", "听回环之外的动静"),
            lt("speak into the corridor", "对着走廊说一句话")
          ];

    case "playing-forth":
      return [
        lt("ride the rail upward", "沿轨上升"),
        lt("lean out and look down", "俯身往下看"),
        lt("tap the rail and listen for the answer", "敲一敲轨道，听它怎么回")
      ];

    case "foresight":
      return state?.flags.leapReady
        ? [
            lt("approach the central shaft", "靠近中央井道"),
            lt("read the horizon once more", "再读一次地平线"),
            lt("step back toward the rail", "后退回轨道")
          ]
        : [
            lt("read the marks in the field", "阅读旷野里的标记"),
            lt("watch the center fissure", "观察中央裂口"),
            lt("listen to the silence itself", "听一听沉默本身")
          ];

    case "leap":
      return [
        lt("jump into the shaft", "跃入井道"),
        lt("kneel and look into the dark", "俯身向下看"),
        lt("step back from the edge", "从边缘退回去")
      ];

    case "grounding":
      return [
        lt("walk the narrow surviving route", "沿那条幸存的狭路往前"),
        lt("touch the fracture", "触碰裂隙"),
        lt("call into the depth", "朝深处喊一声")
      ];

    case "seyn":
      return [
        lt("push through the gate", "推门进去"),
        lt("ask what is waiting behind it", "问门后在等什么"),
        lt("keep still and let it regard you", "站着不动，让它先看你")
      ];

    case "ones-to-come":
      return [
        lt("accept the mutation", "接受这次变异"),
        lt("describe what changes first", "说出最先变化的部位"),
        lt("refuse and hold your current name", "拒绝它，守住现在的名字")
      ];

    case "last-god":
      return [
        lt("ask whether the world can fold back", "问这个世界还能不能折回去"),
        lt("step into the return beam", "走进那道回返光束"),
        lt("wait and see whether the cycle closes", "先等一等，看轮回会不会自己闭合")
      ];

    default:
      return [];
  }
}

export function getOpeningReply() {
  return lt(
    "You arrive at a blank crossing. Four arms extend from a white center. The place answers to speech, but only as a world would.",
    "你抵达了一处空白十字。四条臂状通路从白色中心向外伸出。这里会对言语作答，但它的作答方式更像世界本身。"
  );
}

function ambientPatch(scene: SceneId, state: WorldState): ScenePatch {
  const toneByScene: Record<SceneId, ScenePatch["tone"]> = {
    beginning: "calm",
    echo: "tense",
    "playing-forth": "ritual",
    foresight: "distant",
    leap: "ritual",
    grounding: "hostile",
    seyn: "ritual",
    "ones-to-come": "hostile",
    "last-god": "distant"
  };

  const viewportByScene: Record<SceneId, ScenePatch["viewport"]> = {
    beginning: {glitch: 1, scan: 1, drift: 1},
    echo: {glitch: 3, scan: 2, drift: 2},
    "playing-forth": {glitch: 2, scan: 3, drift: 1},
    foresight: {glitch: 1, scan: 3, drift: 2},
    leap: {glitch: 2, scan: 1, drift: 3},
    grounding: {glitch: 3, scan: 1, drift: 2},
    seyn: {glitch: 2, scan: 2, drift: 1},
    "ones-to-come": {glitch: 4, scan: 2, drift: 3},
    "last-god": {glitch: 2, scan: 4, drift: 2}
  };

  const nextFlags = state.flags;

  return {
    scene,
    tone: toneByScene[scene],
    viewport: viewportByScene[scene],
    entities: buildAmbientEntities(scene, nextFlags),
    suggestions: getAmbientSuggestions(scene, state)
  };
}

function transitionTurn(
  state: WorldState,
  scene: SceneId,
  reply: LocalizedText,
  trace: LocalizedText,
  statePatch?: StatePatch
): OrchestratorTurn {
  const projectedState = {
    ...state,
    scene,
    flags: {
      ...state.flags,
      ...(statePatch?.flags ?? {})
    }
  };

  return {
    reply,
    narration: reply,
    trace,
    scenePatch: ambientPatch(scene, projectedState),
    statePatch
  };
}

function inSceneTurn(
  state: WorldState,
  reply: LocalizedText,
  trace?: LocalizedText,
  statePatch?: StatePatch,
  scenePatch?: Partial<ScenePatch>
): OrchestratorTurn {
  const projectedState = {
    ...state,
    flags: {
      ...state.flags,
      ...(statePatch?.flags ?? {})
    }
  };

  return {
    reply,
    narration: reply,
    trace,
    scenePatch: {
      ...ambientPatch(state.scene, projectedState),
      ...scenePatch
    },
    statePatch
  };
}

function fallbackTurn(state: WorldState) {
  switch (state.scene) {
    case "beginning":
      return inSceneTurn(
        state,
        lt(
          "The crossing does not reject your uncertainty. It simply holds the four directions open until you lean toward one of them.",
          "十字并不拒绝你的迟疑。它只是把四个方向都维持在开启状态，等你向其中一个方向稍微倾斜。"
        )
      );

    case "echo":
      return inSceneTurn(
        state,
        lt(
          "The corridor repeats your hesitation. One wall lags behind the rest by less than a breath.",
          "走廊把你的迟疑也一并重复了。只有一面墙比其他部分慢了不到一口气。"
        )
      );

    case "foresight":
      return inSceneTurn(
        state,
        lt(
          "The field offers no direct answer. It prefers to tilt the pressure until your next move becomes visible to you.",
          "旷野不给直接答案。它更喜欢调整那股压力，直到你的下一步在你自己面前显形。"
        )
      );

    default:
      return inSceneTurn(
        state,
        lt(
          "The structure listens, but it answers by changing posture rather than by explaining itself.",
          "这个结构在听，但它更习惯用姿态变化来回应，而不是解释自己。"
        )
      );
  }
}

function resolveMovementTurn(state: WorldState, direction: MovementDirection): OrchestratorTurn {
  switch (state.scene) {
    case "beginning": {
      const directionReply: Record<MovementDirection, LocalizedText> = {
        up: lt(
          "You take the arm directly ahead. Before distance can organize itself, the crossing seals into a corridor around you.",
          "你沿正前方的通路走去。距离还来不及组织起来，十字就已经在你周围闭合成一条走廊。"
        ),
        down: lt(
          "You pivot into the arm behind your heels. The white crossing retracts and leaves you inside a closing ring of corridor.",
          "你转身踏进身后的那条通路。白色十字向后收拢，只留下正在闭合的环形走廊把你包住。"
        ),
        left: lt(
          "You slide into the left arm of the crossing. The geometry answers immediately, rounding itself into a corridor.",
          "你侧身进入十字左侧的通路。几何体立刻作答，把自己收圆成一条走廊。"
        ),
        right: lt(
          "You commit to the right arm. The crossing gives up its symmetry and closes into a corridor before you can second-guess it.",
          "你朝右侧那条通路走进去。十字在你来得及反悔之前放弃对称，直接闭合成一条走廊。"
        )
      };

      const directionTrace: Record<MovementDirection, LocalizedText> = {
        up: lt("advanced into the forward arm", "沿前方通路推进"),
        down: lt("entered the rear arm", "踏入后侧通路"),
        left: lt("entered the left arm", "踏入左侧通路"),
        right: lt("entered the right arm", "踏入右侧通路")
      };

      return transitionTurn(state, "echo", directionReply[direction], directionTrace[direction]);
    }

    case "echo": {
      if (direction === "left") {
        const heardBoth = state.flags.echoVoicesHeard;
        return inSceneTurn(
          state,
          lt(
            "Your fingers find the wall's lagging edge. Once you press the left side directly, the corridor cannot keep the seam hidden.",
            "你的手指摸到了左侧墙面延迟的那条边。一旦你直接按上去，走廊就再也藏不住这道裂缝。"
          ),
          lt("echo seam admitted itself", "回响裂缝承认了自己"),
          {
            flags: {
              echoSeamSeen: true,
              gateOpen: heardBoth
            },
            unlockedSymbolsAdd: ["there"]
          },
          {
            viewport: {glitch: 4}
          }
        );
      }

      if (direction === "right") {
        const heardBoth = state.flags.echoSeamSeen;
        return inSceneTurn(
          state,
          lt(
            "You lean toward the right-hand wall and hear a vertical motion answering from beyond the ring.",
            "你朝右侧墙面倾过去，听见回环之外有一种竖直的运动在回应你。"
          ),
          lt("heard a voice beyond the ring", "听见了回环之外的声音"),
          {
            flags: {
              echoVoicesHeard: true,
              gateOpen: heardBoth
            },
            unlockedSymbolsAdd: ["is"]
          },
          {
            entities: [
              {
                id: "vertical-voice",
                name: lt("vertical voice", "竖直的声音"),
                mood: lt("keeping station beyond the wall", "在墙外守着自己的位置"),
                distance: "far"
              }
            ]
          }
        );
      }

      if (direction === "down") {
        return transitionTurn(
          state,
          "beginning",
          lt(
            "You back out of the ring before it can fully settle. The white crossing receives you again without complaint.",
            "你在回环彻底稳固前撤了出来。白色十字毫无怨言地再次把你接住。"
          ),
          lt("withdrew from the false ring", "从虚假回环中撤出")
        );
      }

      if (!state.flags.echoSeamSeen || !state.flags.echoVoicesHeard) {
        return inSceneTurn(
          state,
          lt(
            "You press forward, but the ring still behaves like a wall. It needs both a visible seam and a voice beyond it before it will yield.",
            "你继续向前逼近，但回环依旧表现得像一堵墙。它既要那道可见裂缝，也要裂缝之外的声音，两者齐备才会松动。"
          ),
          lt("forward pressure met the sealed ring", "向前推进撞上了封死的回环")
        );
      }

      return transitionTurn(
        state,
        "playing-forth",
        lt(
          "You step straight into the height behind the wall. The ring fails to stay circular and loosens into a vertical rail.",
          "你径直走向墙后的那道高度。回环维持不住自己的圆形，只能松成一条垂直轨道。"
        ),
        lt("false ring gave way to the rail", "虚假回环让位给了轨道")
      );
    }

    case "playing-forth": {
      if (direction === "up") {
        return transitionTurn(
          state,
          "foresight",
          lt(
            "You let the rail carry you upward. Marks and pressure assemble into a field before you can name them.",
            "你任由轨道把自己抬升上去。刻痕与压力在你来得及命名之前先一步组装成旷野。"
          ),
          lt("rail ascent completed", "轨道上升完成"),
          {
            unlockedSymbolsAdd: ["all"]
          }
        );
      }

      if (direction === "down") {
        return transitionTurn(
          state,
          "echo",
          lt(
            "You step back down from the rail and the corridor reforms around the memory of your ascent.",
            "你沿轨道退了下来，走廊顺着你刚才上升留下的记忆重新闭合。"
          ),
          lt("rail folded back into the ring", "轨道重新折回回环")
        );
      }

      if (direction === "left") {
        return inSceneTurn(
          state,
          lt(
            "You lean out to the left. The drop below refuses scale, but it does answer with a colder draft.",
            "你朝左侧探出身去。下方拒绝给出尺度，但它确实回了你一股更冷的气流。"
          ),
          lt("looked down from the rail", "从轨道向下察看")
        );
      }

      return inSceneTurn(
        state,
        lt(
          "You tap the rail on the right side. Its answer returns through your palm as a clean, vertical resonance.",
          "你敲了敲右侧的轨道。它的回应顺着掌心回来，像一道干净的竖直共振。"
        ),
        lt("rail answered a tap", "轨道回应了一次敲击")
      );
    }

    case "foresight": {
      if (direction === "down") {
        return transitionTurn(
          state,
          "playing-forth",
          lt(
            "You ease away from the horizon and let the rail receive your weight again.",
            "你从地平线边缘退开，让轨道重新接住你的重量。"
          ),
          lt("field returned you to the rail", "旷野把你送回轨道")
        );
      }

      if (direction === "left" || direction === "right") {
        const reads = state.flags.foresightReads + 1;
        const fragment = getForesightFragment(state.flags.foresightReads);
        const trace =
          direction === "left"
            ? lt(`foresight fragment ${String(reads).padStart(2, "0")}`, `前瞻碎片 ${String(reads).padStart(2, "0")}`)
            : lt(`horizon pressure read ${String(reads).padStart(2, "0")}`, `地平线压力读数 ${String(reads).padStart(2, "0")}`);

        return inSceneTurn(
          state,
          fragment,
          trace,
          {
            flags: {
              foresightReads: reads,
              leapReady: reads >= 2
            },
            unlockedSymbolsAdd: reads >= 2 ? ["not"] : []
          },
          {
            viewport: {scan: 4}
          }
        );
      }

      if (!state.flags.leapReady) {
        return inSceneTurn(
          state,
          lt(
            "You angle toward the center, but the shaft stays unreadable. The field wants a little more attention before it opens.",
            "你朝中央井道逼近，但它仍旧不可读。旷野还想先要你多给它一点注意力。"
          ),
          lt("shaft delayed the descent", "井道延后了下降")
        );
      }

      return transitionTurn(
        state,
        "leap",
        lt(
          "You advance on the center and the field condenses into a negative shaft prepared to receive you.",
          "你朝中央推进，旷野随即凝成一口准备好接住你的负空间井道。"
        ),
        lt("foresight condensed into a shaft", "前瞻凝结成井道")
      );
    }

    case "leap": {
      if (direction === "up") {
        return transitionTurn(
          state,
          "grounding",
          lt(
            "You commit and the shaft takes you. The fall resolves into a broken ground that behaves more like a wound than a floor.",
            "你向前一投，井道立刻把你吞下。坠落最终落在一片破碎的地面上，它更像伤口，而不是地板。"
          ),
          lt("jump committed to the lower split", "跳跃抵达了下方裂地"),
          {
            unlockedSymbolsAdd: ["ground"]
          }
        );
      }

      if (direction === "down") {
        return transitionTurn(
          state,
          "foresight",
          lt(
            "You pull back from the edge. The field resumes its pressure as if it had only paused to watch you decide.",
            "你从边缘撤了回来。旷野重新施压，好像它刚才只是暂停一下，专门等你做决定。"
          ),
          lt("leap withdrawn", "跳跃被撤回")
        );
      }

      return inSceneTurn(
        state,
        lt(
          "You brace at the rim and study the dark from the side. It keeps withholding scale, but not intent.",
          "你在井口边缘侧身稳住，朝黑暗里看去。它依旧不给尺度，但并不隐藏意图。"
        ),
        lt("shaft inspected from the rim", "从井口边缘观察井道")
      );
    }

    case "grounding": {
      if (direction === "up") {
        return transitionTurn(
          state,
          "seyn",
          lt(
            "You follow the narrow surviving route across the fracture and arrive at a gate that withholds even while opening.",
            "你沿着裂隙间幸存的狭路往前走，最终抵达一扇一边开启一边保留自己的门。"
          ),
          lt("fracture yielded a surviving route", "裂隙让出了一条幸存路径")
        );
      }

      if (direction === "left") {
        return inSceneTurn(
          state,
          lt(
            "You touch the fracture line. Stability holds for a moment longer, but only because you are the one observing it.",
            "你触碰了一下裂隙。稳定多维持了一瞬，但只是因为此刻盯着它的人是你。"
          ),
          lt("fracture tested against the hand", "裂隙接受了一次手部试探")
        );
      }

      if (direction === "right") {
        return inSceneTurn(
          state,
          lt(
            "You call into the depth on your right. The answer comes back thinner than a voice, but more definite than silence.",
            "你朝右侧深处喊了一声。回来的东西比声音更薄，却又比沉默更确定。"
          ),
          lt("depth answered a call", "深处回应了一次呼喊")
        );
      }

      return inSceneTurn(
        state,
        lt(
          "You test a step backward, but the broken ground prefers forward decisions over retreat.",
          "你试着向后撤一步，但这片破碎地面更偏爱向前的决定，不太支持后退。"
        ),
        lt("ground resisted retreat", "裂地抗拒后退")
      );
    }

    case "seyn": {
      if (direction === "up") {
        return transitionTurn(
          state,
          "ones-to-come",
          lt(
            "You pass through the gate and feel the container around your subject loosen. Shape becomes negotiation.",
            "你穿过了那扇门，包裹着你的主体容器开始松动。形状开始变成一种协商。"
          ),
          lt("gate admitted a mutation chamber", "门后显出变异容室"),
          {
            unlockedSymbolsAdd: ["gate"]
          }
        );
      }

      if (direction === "down") {
        return transitionTurn(
          state,
          "grounding",
          lt(
            "You step back from the gate and return to the narrow route suspended across the fracture.",
            "你从门前退开，回到了那条悬在裂隙之上的狭路。"
          ),
          lt("withholding gate released the path", "保留之门把你放回狭路")
        );
      }

      if (direction === "left") {
        return inSceneTurn(
          state,
          lt(
            "You ask what is waiting behind the gate. It answers by opening a fraction more, not by speaking.",
            "你问门后在等什么。它没有说话，只是把自己再打开了一点。"
          ),
          lt("gate answered with posture", "门用姿态回答了问题")
        );
      }

      return inSceneTurn(
        state,
        lt(
          "You keep still and let the gate regard you first. Its attention is patient enough to feel architectural.",
          "你站着不动，让门先看你。它的注意力耐心得像一种建筑结构。"
        ),
        lt("gate completed an inspection pass", "门完成了一次观察")
      );
    }

    case "ones-to-come": {
      if (direction === "up") {
        return transitionTurn(
          state,
          "last-god",
          lt(
            "You accept the mutation and the container tips toward 4444. Control broadens beyond the old arrangement of aims.",
            "你接受了这次变异，容器开始向 4444 倾斜。控制感被拉宽，不再服从旧有目标的编排。"
          ),
          lt("subject container drifted toward 4444", "主体容器开始漂移到 4444"),
          {
            subjectId: "4444"
          }
        );
      }

      if (direction === "down") {
        return transitionTurn(
          state,
          "beginning",
          lt(
            "You refuse the shift and hold your current name. The future collapses back into the crossing, leaving residue behind.",
            "你拒绝这次偏移，守住了当前的名字。未来重新塌回十字开端，同时留下了一点残余。"
          ),
          lt("future collapsed back to the crossing", "未来塌回了十字开端"),
          {
            loopDelta: 1
          }
        );
      }

      return inSceneTurn(
        state,
        lt(
          "You hold the changing outline at an angle and watch which part of you tries to move first.",
          "你侧着观察正在变化的轮廓，看看到底是哪一部分最先想要移动。"
        ),
        lt("mutation contour observed", "变异轮廓被观察")
      );
    }

    case "last-god": {
      if (direction === "up") {
        return transitionTurn(
          state,
          "beginning",
          lt(
            "You step into the return beam and let it fold the whole structure back into the crossing. The next cycle keeps the residue.",
            "你走进回返光束，让它把整个结构重新折回十字开端。下一轮回会把残余一起保留下来。"
          ),
          lt("cycle folded back to its crossing", "轮回被折回到起始十字"),
          {
            subjectId: "3322",
            cycleDelta: 1,
            loopDelta: 1
          }
        );
      }

      if (direction === "left") {
        return inSceneTurn(
          state,
          lt(
            "You ask whether the world can really fold back. The beam answers by tightening its line through the room.",
            "你问这个世界是否真的还能折回去。那道光束收紧了自己的线条，算作回答。"
          ),
          lt("return beam acknowledged the question", "回返光束回应了提问")
        );
      }

      if (direction === "right") {
        return inSceneTurn(
          state,
          lt(
            "You watch the beam a little longer. It keeps behaving like an exit that has already decided on you.",
            "你又多看了那道光束一会儿。它一直表现得像一个已经替你做好决定的出口。"
          ),
          lt("return beam held position", "回返光束保持了位置")
        );
      }

      return inSceneTurn(
        state,
        lt(
          "You hold position and feel the whole cycle waiting to see whether you will close it yourself.",
          "你暂时停在原地，感觉整个轮回都在等你亲手把它闭合。"
        ),
        lt("cycle closure deferred", "轮回闭合被延后")
      );
    }

    default:
      return fallbackTurn(state);
  }
}

function resolveChoiceId(state: WorldState, choiceId: string): OrchestratorTurn | null {
  switch (choiceId) {
    // Beginning directions → echo
    case "beginning:north":
    case "beginning:south":
    case "beginning:east":
    case "beginning:west": {
      const dirMap: Record<string, MovementDirection> = {
        "beginning:north": "up",
        "beginning:south": "down",
        "beginning:east": "right",
        "beginning:west": "left"
      };
      return resolveMovementTurn(state, dirMap[choiceId]!);
    }

    // Beginning trace → skip to playing-forth
    case "beginning:trace":
      return transitionTurn(
        state,
        "playing-forth",
        lt(
          "You trace the remembered seam from the crossing center. The false ring never forms — you step directly onto the vertical rail.",
          "你在十字中心追认了那条记住的裂缝。虚假回环根本没有成形——你直接踏上了垂直轨道。"
        ),
        lt("trace skipped the false ring", "追认跳过了虚假回环"),
        {unlockedSymbolsAdd: ["all"]}
      );

    // Echo choices
    case "echo:loop":
      return inSceneTurn(
        state,
        lt(
          "You circle the corridor again. The repetition grinds clarity into pressure.",
          "你又在走廊里转了一圈。重复把清明碾成了压力。"
        ),
        lt("echo loop repeated", "回响回环重复"),
        {resources: {clarity: Math.max(0, state.resources.clarity - 1), strain: state.resources.strain + 1}}
      );

    case "echo:rhythm":
      return inSceneTurn(
        state,
        lt(
          "Cracks begin scrolling through the text. Catch them as they pass the center.",
          "裂缝开始在文字中滚动。当它们经过中心时，抓住它们。"
        ),
        lt("echo rhythm activated", "回响节奏启动"),
        undefined,
        undefined
      );

    case "echo:inspect": {
      const heardBoth = state.flags.echoVoicesHeard;
      return inSceneTurn(
        state,
        lt(
          "Your fingers find the wall's lagging edge. The corridor cannot keep the split hidden once you touch it directly.",
          "你的手指摸到了墙面延迟的那条边。一旦被直接触到，走廊就再也无法把这道裂口藏严实。"
        ),
        lt("echo seam admitted itself", "回响裂缝承认了自己"),
        {
          flags: {echoSeamSeen: true, gateOpen: heardBoth},
          unlockedSymbolsAdd: ["there"]
        },
        {viewport: {glitch: 4}}
      );
    }

    case "echo:listen": {
      const heardBoth = state.flags.echoSeamSeen;
      return inSceneTurn(
        state,
        lt(
          "Beyond the false ring, a vertical motion answers you. It holds its height like a promise.",
          "在这圈假回环之外，有一种竖直的运动回应了你。它维持高度的方式像一则承诺。"
        ),
        lt("heard a voice beyond the ring", "听见了回环之外的声音"),
        {
          flags: {echoVoicesHeard: true, gateOpen: heardBoth},
          unlockedSymbolsAdd: ["is"]
        }
      );
    }

    case "echo:gate":
      return transitionTurn(
        state,
        "playing-forth",
        lt(
          "The seam loosens into a narrow vertical rail. The ring fails to stay circular once you step toward the height behind it.",
          "裂缝松成了一条狭窄的垂直轨道。你一旦朝那道高度走去，回环就再也维持不了自己的圆形。"
        ),
        lt("false ring gave way to the rail", "虚假回环让位给了轨道")
      );

    // Playing-forth (rail)
    case "rail:ascend":
      return transitionTurn(
        state,
        "foresight",
        lt(
          "The rail lifts you into a field of marks and pressure. The horizon begins acting on you.",
          "轨道把你抬升进一片由刻痕与压力组成的旷野。地平线开始作用于你。"
        ),
        lt("rail ascent completed", "轨道上升完成"),
        {unlockedSymbolsAdd: ["all"]}
      );

    case "rail:descend":
      return transitionTurn(
        state,
        "beginning",
        lt(
          "You descend the stair. The structure collapses and you dissolve back into the crossing.",
          "你沿阶下行。结构坍塌，你溶解回十字开端。"
        ),
        lt("descent caused death", "下降导致了死亡"),
        {loopDelta: 1, deathsDelta: 1, resources: {clarity: 2, strain: 0}}
      );

    // Foresight
    case "foresight:leap":
      return transitionTurn(
        state,
        "leap",
        lt(
          "You advance on the center and the field condenses into a negative shaft prepared to receive you.",
          "你朝中央推进，旷野随即凝成一口准备好接住你的负空间井道。"
        ),
        lt("foresight condensed into a shaft", "前瞻凝结成井道")
      );

    case "foresight:read": {
      const reads = state.flags.foresightReads + 1;
      const fragment = getForesightFragment(state.flags.foresightReads);
      return inSceneTurn(
        state,
        fragment,
        lt(`foresight fragment ${String(reads).padStart(2, "0")}`, `前瞻碎片 ${String(reads).padStart(2, "0")}`),
        {
          flags: {foresightReads: reads, leapReady: reads >= 2},
          unlockedSymbolsAdd: reads >= 2 ? ["not"] : [],
          resources: {clarity: state.resources.clarity + 1, strain: state.resources.strain + 1}
        },
        {viewport: {scan: 4}}
      );
    }

    case "foresight:return":
      return transitionTurn(
        state,
        "playing-forth",
        lt(
          "You step back toward the rail and the field releases its pressure.",
          "你后退回轨道，旷野释放了它的压力。"
        ),
        lt("field returned you to the rail", "旷野把你送回轨道")
      );

    // Leap
    case "leap:jump": {
      if (state.resources.clarity >= 3) {
        return transitionTurn(
          state,
          "grounding",
          lt(
            "You commit to the shaft. The fall resolves into a broken ground that behaves more like a wound than a floor.",
            "你把自己交给井道。坠落最终落在一片破碎的地面上，它更像伤口，而不是地板。"
          ),
          lt("jump committed to the lower split", "跳跃抵达了下方裂地"),
          {unlockedSymbolsAdd: ["ground"], resources: {clarity: state.resources.clarity - 2, strain: state.resources.strain}}
        );
      }
      // death
      return transitionTurn(
        state,
        "beginning",
        lt(
          "You jump but clarity fails you. You dissolve before reaching the ground.",
          "你纵身一跃，但清明不足以支撑。你在抵达地面之前就溶解了。"
        ),
        lt("leap failed — clarity too low", "跳跃失败——清明度不足"),
        {loopDelta: 1, deathsDelta: 1, resources: {clarity: 2, strain: 0}}
      );
    }

    case "leap:hesitate":
      return transitionTurn(
        state,
        "foresight",
        lt(
          "You step back from the shaft. The field resumes its pressure.",
          "你从井道边缘退回。旷野重新施压。"
        ),
        lt("leap withdrawn", "跳跃被撤回")
      );

    // Grounding
    case "grounding:seyn":
      return transitionTurn(
        state,
        "seyn",
        lt(
          "You follow the narrow surviving route across the fracture and arrive at a gate that withholds even while opening.",
          "你沿着裂隙间幸存的狭路往前走，最终抵达一扇一边开启一边保留自己的门。"
        ),
        lt("fracture yielded a surviving route", "裂隙让出了一条幸存路径")
      );

    case "grounding:fall":
      return transitionTurn(
        state,
        "beginning",
        lt(
          "You lose footing. The fracture swallows you and deposits a blank body at the crossing.",
          "你失足了。裂隙把你吞下，在十字开端放下一具空白的身体。"
        ),
        lt("fall caused death", "坠落导致了死亡"),
        {loopDelta: 1, deathsDelta: 1, resources: {clarity: 2, strain: 0}}
      );

    // Seyn
    case "seyn:open":
      return transitionTurn(
        state,
        "ones-to-come",
        lt(
          "You pass through the withholding gate. The container around your subject loosens. Shape becomes negotiation.",
          "你穿过了保留之门，包裹着你的主体容器开始松动。形状开始变成一种协商。"
        ),
        lt("gate admitted a mutation chamber", "门后显出变异容室"),
        {unlockedSymbolsAdd: ["gate"]}
      );

    // Ones to come
    case "come:accept":
      return transitionTurn(
        state,
        "last-god",
        lt(
          "The container tips toward 4444. Control broadens beyond the old arrangement of aims.",
          "容器开始向 4444 倾斜。控制感被拉宽，不再服从旧有目标的编排。"
        ),
        lt("subject container drifted toward 4444", "主体容器开始漂移到 4444"),
        {subjectId: "4444"}
      );

    // Come refuse
    case "come:refuse":
      return transitionTurn(
        state,
        "beginning",
        lt(
          "You refuse the mutation. The future collapses back into the crossing.",
          "你拒绝了变异。未来重新塌回十字开端。"
        ),
        lt("future collapsed back to the crossing", "未来塌回了十字开端"),
        {loopDelta: 1, deathsDelta: 1, resources: {clarity: 2, strain: 0}}
      );

    // Last god
    case "last:return":
      return transitionTurn(
        state,
        "beginning",
        lt(
          "A force passes through the whole structure and folds it back into the crossing. The next cycle begins with residue intact.",
          "一股力量穿过整个结构，并把它重新折回十字开端。下一轮回在残余仍然完好的情况下开始。"
        ),
        lt("cycle folded back to its crossing", "轮回被折回到起始十字"),
        {subjectId: "3322", cycleDelta: 1, loopDelta: 1}
      );

    default:
      return null;
  }
}

function resolveOperation(state: WorldState, prompt: string): OrchestratorTurn | null {
  if (prompt === "op:negate") {
    return inSceneTurn(
      state,
      lt(
        "You erase a line. The text does not vanish — it becomes a residual shadow, a Schein that keeps producing pressure.",
        "你擦除了一行。文本没有消失——它变成了残影，一种不断产生压力的假象。"
      ),
      lt("negation applied", "否定已施加"),
      {resources: {strain: state.resources.strain + 1}}
    );
  }

  if (prompt === "op:affirm") {
    const nextClarity = state.resources.clarity - 1;
    if (nextClarity <= 0) {
      return inSceneTurn(
        state,
        lt(
          "Warning: inscribing now would collapse your clarity to zero. The symbol resists your hand.",
          "警告：现在铭刻会让你的清明度归零。符号抗拒了你的手。"
        ),
        lt("affirmation blocked — clarity too low", "肯定被阻止——清明度过低")
      );
    }
    return inSceneTurn(
      state,
      lt(
        "You inscribe a symbol into the structure. Clarity narrows as the mark demands recognition.",
        "你在结构中铭刻了一个符号。随着刻痕要求被承认，清明度收窄了。"
      ),
      lt("inscription applied", "铭刻已施加"),
      {resources: {clarity: nextClarity, strain: state.resources.strain}}
    );
  }

  if (prompt === "op:sublate") {
    if (state.unlockedSymbols.length >= 2) {
      // Check for contradictory pairs
      const contradictions: [string, string][] = [
        ["there", "not"],
        ["being", "nothing"],
        ["ground", "abyss"],
        ["if", "all"],
        ["gate", "ground"]
      ];
      const syms = state.unlockedSymbols;
      const found = contradictions.find(([a, b]) => syms.includes(a) && syms.includes(b));

      if (found) {
        const [a, b] = found;
        return inSceneTurn(
          state,
          lt(
            `You fold ${a} and ${b} together — the contradiction between them resolves into a higher form. Strain eases.`,
            `你把 ${a} 和 ${b} 折叠在一起——它们之间的矛盾被扬弃为更高的形式。压力缓解了。`
          ),
          lt("sublation completed", "扬弃完成"),
          {resources: {strain: Math.max(0, state.resources.strain - 2), clarity: Math.min(8, state.resources.clarity + 1)}}
        );
      }

      // No contradictions found but enough symbols
      const last = syms[syms.length - 1];
      const secondLast = syms[syms.length - 2];
      return inSceneTurn(
        state,
        lt(
          `No true contradiction found among your symbols. You force ${secondLast} and ${last} together anyway — the fold holds, but weakly.`,
          `你的符号中没有真正的矛盾对。你强行把 ${secondLast} 和 ${last} 折在一起——折叠勉强成立，但很脆弱。`
        ),
        lt("sublation completed (forced)", "扬弃完成（强制）"),
        {resources: {strain: Math.max(0, state.resources.strain - 2), clarity: Math.min(8, state.resources.clarity + 1)}}
      );
    }
    return inSceneTurn(
      state,
      lt(
        "You attempt to fold, but there are not enough symbols to form a contradiction. The failed folding strains you further.",
        "你尝试折叠，但符号不足以构成矛盾。失败的折叠让压力进一步上升。"
      ),
      lt("sublation failed — insufficient symbols", "扬弃失败——符号不足"),
      {resources: {strain: state.resources.strain + 2, clarity: state.resources.clarity}}
    );
  }

  return null;
}

const KNOWN_COMBINATIONS: Record<string, {result: string; narration: LocalizedText; unlocksTrace?: boolean}> = {
  "being+nothing": {
    result: "becoming",
    narration: lt(
      "Being and Nothing collide. From the contradiction, Becoming emerges — neither one nor the other, but the movement between.",
      "存在与虚无相撞。从矛盾中生成了变易——既不是此也不是彼，而是两者之间的运动。"
    )
  },
  "there+not": {
    result: "hidden",
    narration: lt(
      "There and Not fold into a concealment. A hidden trace reveals itself — a path that only the negated can see.",
      "There 与 Not 折叠为一种遮蔽。一条隐藏的痕迹显现了——只有被否定的东西才看得见的路径。"
    ),
    unlocksTrace: true
  },
  "ground+gate": {
    result: "passage",
    narration: lt(
      "Ground and Gate combine. The fracture becomes a passage — not stable, but traversable.",
      "根基与门合而为一。裂隙变成了通道——不稳定，但可以穿越。"
    )
  },
  "if+all": {
    result: "totality",
    narration: lt(
      "If and All merge into Totality — the conditional becomes unconditional, the partial becomes whole.",
      "如果与全部合为总体性——条件变为无条件，部分变为整体。"
    )
  }
};

function resolveCombination(state: WorldState, prompt: string): OrchestratorTurn | null {
  const match = prompt.match(/^combine:(\w+),(\w+)$/);
  if (!match) return null;

  const x = match[1]!.toLowerCase();
  const y = match[2]!.toLowerCase();

  // Check player has both symbols
  if (!state.unlockedSymbols.includes(x) || !state.unlockedSymbols.includes(y)) {
    return inSceneTurn(
      state,
      lt(
        `You do not have both symbols needed for this combination.`,
        `你没有同时拥有组合所需的两个符号。`
      ),
      lt("combination blocked — missing symbols", "组合被阻止——缺少符号"),
      {resources: {strain: state.resources.strain + 1, clarity: state.resources.clarity}}
    );
  }

  const key1 = `${x}+${y}`;
  const key2 = `${y}+${x}`;
  const combo = KNOWN_COMBINATIONS[key1] ?? KNOWN_COMBINATIONS[key2];

  if (!combo) {
    return inSceneTurn(
      state,
      lt(
        "The two symbols resist combination. The forced pairing produces only strain.",
        "这两个符号抗拒组合。强行配对只产生了压力。"
      ),
      lt("invalid combination", "无效组合"),
      {resources: {strain: state.resources.strain + 1, clarity: state.resources.clarity}}
    );
  }

  return inSceneTurn(
    state,
    combo.narration,
    lt(`combined ${x} + ${y} → ${combo.result}`, `组合 ${x} + ${y} → ${combo.result}`),
    {
      unlockedSymbolsAdd: [combo.result]
    }
  );
}

export function resolveMockTurn(state: WorldState, prompt: string): OrchestratorTurn {
  const raw = normalizePrompt(prompt);
  const lower = raw.toLowerCase();

  // Choice ID resolution (Task 1)
  const choiceResult = resolveChoiceId(state, lower);
  if (choiceResult) return choiceResult;

  // N/A/S operations (Task 2)
  const opResult = resolveOperation(state, lower);
  if (opResult) return opResult;

  // Symbol combination (Task 3)
  const combineResult = resolveCombination(state, lower);
  if (combineResult) return combineResult;

  if (includesAny(lower, ["help", "what can i do"]) || includesAny(raw, ["帮助", "能做什么"])) {
    return inSceneTurn(
      state,
      lt(
        "You do not need menu commands here. Describe what you try: look, touch, listen, ask, follow, refuse, wait.",
        "这里不需要菜单指令。你直接描述动作就行：看、摸、听、问、跟随、拒绝、等待。"
      ),
      lt("interaction shell clarified", "交互外壳已说明")
    );
  }

  const direction = getMovementDirection(lower);
  if (direction) {
    return resolveMovementTurn(state, direction);
  }

  switch (state.scene) {
    case "beginning": {
      if (includesAny(lower, ["walk", "go", "enter", "follow"]) || includesAny(raw, ["走", "进去", "穿过", "沿着"])) {
        return transitionTurn(
          state,
          "echo",
          lt(
            "You commit to one arm of the crossing. Before direction can settle into a map, the corridor has already closed around you as a ring.",
            "你朝十字的一条臂走了进去。方向还没来得及变成地图，走廊就已经在你周围闭合成环。"
          ),
          lt("crossing accepted a spoken movement", "十字接受了一次被说出的移动")
        );
      }

      if (includesAny(lower, ["seam", "wall", "touch"]) || includesAny(raw, ["裂缝", "暗缝", "墙", "摸"])) {
        return inSceneTurn(
          state,
          lt(
            "Your hand finds a faint seam offset from the white center. It is not yet an opening, but it is already a preference.",
            "你的手摸到一道偏离白色中心的暗缝。它暂时还不是入口，但它已经表现出了偏向。"
          ),
          lt("blank wall produced a seam", "空白墙面显出一道暗缝"),
          undefined,
          {
            viewport: {glitch: 2}
          }
        );
      }

      if (includesAny(lower, ["look", "where", "who"]) || includesAny(raw, ["看", "观察", "哪里", "谁"])) {
        return inSceneTurn(
          state,
          lt(
            "Nothing stands at the crossing with you. The only asymmetry is a dim seam that seems slightly more willing than the other walls.",
            "这里没有任何人和你并立。唯一的不对称，是一条比其他墙面稍微更愿意让步的暗缝。"
          ),
          lt("crossing re-described itself", "十字重新描述了自己")
        );
      }

      return fallbackTurn(state);
    }

    case "echo": {
      if (includesAny(lower, ["listen", "hear"]) || includesAny(raw, ["听", "聆听"])) {
        const heardBoth = state.flags.echoSeamSeen;
        return inSceneTurn(
          state,
          lt(
            "Beyond the false ring, a vertical motion answers you. It does not introduce itself, but it holds its height like a promise.",
            "在这圈假回环之外，有一种竖直的运动回应了你。它没有自我介绍，但它维持高度的方式像一则承诺。"
          ),
          lt("heard a voice beyond the ring", "听见了回环之外的声音"),
          {
            flags: {
              echoVoicesHeard: true,
              gateOpen: heardBoth
            },
            unlockedSymbolsAdd: ["is"]
          },
          {
            entities: [
              {
                id: "vertical-voice",
                name: lt("vertical voice", "竖直的声音"),
                mood: lt("keeping station beyond the wall", "在墙外守着自己的位置"),
                distance: "far"
              }
            ]
          }
        );
      }

      if (includesAny(lower, ["seam", "wall", "touch", "inspect"]) || includesAny(raw, ["裂缝", "墙", "摸", "检查"])) {
        const heardBoth = state.flags.echoVoicesHeard;
        return inSceneTurn(
          state,
          lt(
            "Your fingers find the wall's lagging edge. The corridor cannot quite keep the split hidden once you touch it directly.",
            "你的手指摸到了墙面延迟的那条边。一旦被直接触到，走廊就再也无法把这道裂口藏严实。"
          ),
          lt("echo seam admitted itself", "回响裂缝承认了自己"),
          {
            flags: {
              echoSeamSeen: true,
              gateOpen: heardBoth
            },
            unlockedSymbolsAdd: ["there"]
          },
          {
            viewport: {glitch: 4}
          }
        );
      }

      if (includesAny(lower, ["speak", "ask", "say"]) || includesAny(raw, ["问", "喊", "说"])) {
        return inSceneTurn(
          state,
          lt(
            "The corridor returns your voice a half-beat late. Something beyond the wall does not repeat it; it listens instead.",
            "走廊晚了半拍才把你的声音送回来。墙外有某种东西没有重复它，它只是听着。"
          ),
          lt("speech distinguished wall from listener", "说话让墙与听者分开")
        );
      }

      if (includesAny(lower, ["enter", "rail", "gate", "vertical"]) || includesAny(raw, ["进入", "轨道", "门", "垂直"])) {
        if (!state.flags.echoSeamSeen || !state.flags.echoVoicesHeard) {
          return inSceneTurn(
            state,
            lt(
              "The ring still behaves like a wall. It needs both a visible seam and a voice beyond it before it will yield.",
              "回环现在仍旧更像墙。它既要那道可见裂缝，也要裂缝之外的声音，两者齐备才会松动。"
            ),
            lt("rail request deferred", "进入轨道的请求被延后")
          );
        }

        return transitionTurn(
          state,
          "playing-forth",
          lt(
            "The seam loosens into a narrow vertical rail. The ring fails to stay circular once you step toward the height behind it.",
            "裂缝松成了一条狭窄的垂直轨道。你一旦朝那道高度走去，回环就再也维持不了自己的圆形。"
          ),
          lt("false ring gave way to the rail", "虚假回环让位给了轨道")
        );
      }

      return fallbackTurn(state);
    }

    case "playing-forth": {
      if (includesAny(lower, ["up", "ascend", "rise"]) || includesAny(raw, ["上", "升", "上行"])) {
        return transitionTurn(
          state,
          "foresight",
          lt(
            "The rail lifts you into a field of marks and pressure. Nothing introduces the horizon; it simply begins acting on you.",
            "轨道把你抬升进一片由刻痕与压力组成的旷野。没有东西来介绍地平线，它只是直接开始作用于你。"
          ),
          lt("rail ascent completed", "轨道上升完成"),
          {
            unlockedSymbolsAdd: ["all"]
          }
        );
      }

      if (includesAny(lower, ["down", "back"]) || includesAny(raw, ["下", "退", "回"])) {
        return transitionTurn(
          state,
          "echo",
          lt(
            "You ease back from the rail and the corridor reforms around the memory of your ascent.",
            "你从轨道上退了回来，走廊顺着你刚才上升留下的记忆重新闭合。"
          ),
          lt("rail folded back into the ring", "轨道重新折回回环")
        );
      }

      return fallbackTurn(state);
    }

    case "foresight": {
      if (includesAny(lower, ["read", "look", "watch", "horizon"]) || includesAny(raw, ["读", "看", "观察", "地平线"])) {
        const reads = state.flags.foresightReads + 1;
        const fragment = getForesightFragment(state.flags.foresightReads);

        return inSceneTurn(
          state,
          fragment,
          lt(`foresight fragment ${String(reads).padStart(2, "0")}`, `前瞻碎片 ${String(reads).padStart(2, "0")}`),
          {
            flags: {
              foresightReads: reads,
              leapReady: reads >= 2
            },
            unlockedSymbolsAdd: reads >= 2 ? ["not"] : []
          },
          {
            viewport: {scan: 4}
          }
        );
      }

      if (includesAny(lower, ["jump", "leap", "shaft", "well"]) || includesAny(raw, ["跳", "跃", "井道", "井"])) {
        if (!state.flags.leapReady) {
          return inSceneTurn(
            state,
            lt(
              "The shaft stays unreadable from a distance. The field wants you to read it a little longer first.",
              "从这个距离看，井道仍旧不可读。旷野还想让你再多读它一会儿。"
            ),
            lt("shaft delayed the descent", "井道延后了下降")
          );
        }

        return transitionTurn(
          state,
          "leap",
          lt(
            "The center of the field condenses into a negative shaft. It stops looking absent and starts looking prepared.",
            "旷野的中央凝成一口负空间井道。它不再像缺席，而开始像一种准备。"
          ),
          lt("foresight condensed into a shaft", "前瞻凝结成井道")
        );
      }

      if (includesAny(lower, ["back", "rail"]) || includesAny(raw, ["回", "退", "轨道"])) {
        return transitionTurn(
          state,
          "playing-forth",
          lt(
            "You step away from the horizon and the rail receives your weight again without comment.",
            "你从地平线边缘退开，轨道默不作声地重新接住了你的重量。"
          ),
          lt("field returned you to the rail", "旷野把你送回轨道")
        );
      }

      return fallbackTurn(state);
    }

    case "leap": {
      if (includesAny(lower, ["jump", "drop", "fall"]) || includesAny(raw, ["跳", "跃", "坠", "落"])) {
        return transitionTurn(
          state,
          "grounding",
          lt(
            "You commit to the shaft. The fall resolves into a broken ground that behaves more like a wound than a floor.",
            "你把自己交给井道。坠落最终落在一片破碎的地面上，它更像伤口，而不是地板。"
          ),
          lt("jump committed to the lower split", "跳跃抵达了下方裂地"),
          {
            unlockedSymbolsAdd: ["ground"]
          }
        );
      }

      if (includesAny(lower, ["back", "hesitate"]) || includesAny(raw, ["回", "迟疑"])) {
        return transitionTurn(
          state,
          "foresight",
          lt(
            "You step back from the shaft. The field resumes its pressure as if it had only paused to watch you decide.",
            "你从井道边缘退回。旷野重新施压，好像它刚才只是暂停了一下，专门等你做决定。"
          ),
          lt("leap withdrawn", "跳跃被撤回")
        );
      }

      return fallbackTurn(state);
    }

    case "grounding": {
      if (includesAny(lower, ["path", "route", "gate", "door"]) || includesAny(raw, ["路", "狭路", "门", "通道"])) {
        return transitionTurn(
          state,
          "seyn",
          lt(
            "A narrow route survives the fracture. It leads inward, not outward, toward a gate that withholds even while opening.",
            "裂隙之间还幸存着一条狭路。它不通向外面，而是往里深入，通向一扇一边开启一边保留自己的门。"
          ),
          lt("fracture yielded a surviving route", "裂隙让出了一条幸存路径")
        );
      }

      return fallbackTurn(state);
    }

    case "seyn": {
      if (includesAny(lower, ["open", "enter", "pass", "through", "push"]) || includesAny(raw, ["开", "进", "穿过", "推门"])) {
        return transitionTurn(
          state,
          "ones-to-come",
          lt(
            "You pass the gate and the container around your subject starts to loosen. Shape becomes negotiation.",
            "你穿过了那扇门，包裹着你的主体容器开始松动。形状开始变成一种协商。"
          ),
          lt("gate admitted a mutation chamber", "门后显出变异容室"),
          {
            unlockedSymbolsAdd: ["gate"]
          }
        );
      }

      return fallbackTurn(state);
    }

    case "ones-to-come": {
      if (includesAny(lower, ["accept", "allow", "yes"]) || includesAny(raw, ["接受", "允许", "是"])) {
        return transitionTurn(
          state,
          "last-god",
          lt(
            "The container tips toward 4444. Control broadens and stops obeying the old arrangement of aims.",
            "容器开始向 4444 倾斜。控制感被拉宽，不再服从旧有目标的编排。"
          ),
          lt("subject container drifted toward 4444", "主体容器开始漂移到 4444"),
          {
            subjectId: "4444"
          }
        );
      }

      if (includesAny(lower, ["refuse", "no", "hold"]) || includesAny(raw, ["拒绝", "不", "守住"])) {
        return transitionTurn(
          state,
          "beginning",
          lt(
            "You hold your current name and the future collapses back into the crossing. The loop keeps the refusal as residue.",
            "你守住了当前的名字，于是未来重新塌回十字开端。这个回环把你的拒绝当作残余保存下来。"
          ),
          lt("future collapsed back to the crossing", "未来塌回了十字开端"),
          {
            loopDelta: 1
          }
        );
      }

      return fallbackTurn(state);
    }

    case "last-god": {
      if (includesAny(lower, ["return", "fold", "close", "again"]) || includesAny(raw, ["回", "折回", "闭合", "再来"])) {
        return transitionTurn(
          state,
          "beginning",
          lt(
            "A force passes through the whole structure and folds it back into the crossing. The next cycle begins with residue intact.",
            "一股力量穿过整个结构，并把它重新折回十字开端。下一轮回在残余仍然完好的情况下开始。"
          ),
          lt("cycle folded back to its crossing", "轮回被折回到起始十字"),
          {
            subjectId: "3322",
            cycleDelta: 1,
            loopDelta: 1
          }
        );
      }

      return fallbackTurn(state);
    }

    default:
      return fallbackTurn(state);
  }
}
