import {lt, txt} from "./i18n.js";
import type {Choice, CoordinateDigit, Coordinates, Locale, SceneDefinition, SceneId, SubjectId, WorldState} from "./types.js";

export function coordinatesFromSubjectId(id: SubjectId): Coordinates {
  const digits = id.split("").map(Number) as CoordinateDigit[];
  return {d1: digits[0], d2: digits[1], d3: digits[2], d4: digits[3]};
}

export function subjectIdFromCoordinates(c: Coordinates): SubjectId {
  return `${c.d1}${c.d2}${c.d3}${c.d4}` as SubjectId;
}

const foresightFragments = [
  lt(
    "The field does not answer with facts. It answers with pressure.",
    "旷野不会用事实回答你，它只会以压力作答。"
  ),
  lt(
    "A map appears only after you admit the path is not neutral.",
    "只有当你承认道路并不中立，地图才会显形。"
  ),
  lt(
    "The leap refuses anyone who has not learned to read silence.",
    "尚未学会阅读沉默的人，无法被跳跃承认。"
  ),
  lt(
    "What withdraws from us, draws us along. — Was sich entzieht, zieht uns mit.",
    "向我们抽身而退的东西，恰恰把我们拉了过去。"
  ),
  lt(
    "The true is the whole. Das Wahre ist das Ganze. / 真理是全体。",
    "真理是全体。Das Wahre ist das Ganze。"
  ),
  lt(
    "Where danger grows, the saving power also. — Wo aber Gefahr ist, wächst das Rettende auch.",
    "危险所在之处，拯救之力也在生长。——荷尔德林"
  ),
  lt(
    "Language is the house of Being. In its home, the human dwells.",
    "语言是存在的家。人栖居于语言之中。"
  ),
  lt(
    "Near is the god, and hard to grasp. Nah ist und schwer zu fassen der Gott. — Hölderlin, Patmos",
    "神近在咫尺，却难以把握。——荷尔德林《帕特莫斯》"
  )
];

const dimensionLexicon = {
  en: {
    d1: {name: "Sein", values: {1: "Qualität", 2: "Quantität", 3: "Maß", 4: "Wesen"}},
    d2: {name: "Wahrheit", values: {1: "Correspondence", 2: "Coherence", 3: "Aletheia", 4: "Zerklüftung"}},
    d3: {name: "Zeit", values: {1: "Present", 2: "Retention", 3: "Advance", 4: "Augenblick"}},
    d4: {name: "Praxis", values: {1: "Obedience", 2: "Decision", 3: "Poiesis", 4: "Gelassenheit"}}
  },
  zh: {
    d1: {name: "存在", values: {1: "质", 2: "量", 3: "度", 4: "本质"}},
    d2: {name: "真理", values: {1: "符合", 2: "融贯", 3: "去蔽", 4: "裂隙"}},
    d3: {name: "时间", values: {1: "当前化", 2: "保持", 3: "先行", 4: "瞬间"}},
    d4: {name: "实践", values: {1: "服从", 2: "抉择", 3: "创制", 4: "泰然任之"}}
  }
} as const;

export function describeSubject(subjectId: SubjectId, locale: Locale) {
  const coords = coordinatesFromSubjectId(subjectId);
  const lex = dimensionLexicon[locale];
  const keys: (keyof Coordinates)[] = ["d1", "d2", "d3", "d4"];

  return keys.map((k) => `${lex[k].name}  ${lex[k].values[coords[k]]}`);
}

export function getForesightFragment(readCount: number) {
  return foresightFragments[readCount % foresightFragments.length] ?? foresightFragments[0];
}

function hasSymbols(state: WorldState, ...symbols: string[]) {
  return symbols.every((symbol) => state.unlockedSymbols.includes(symbol));
}

function gatedChoice(choice: Choice, enabled: boolean, lockReason?: Choice["lockReason"]): Choice {
  if (enabled) {
    return choice;
  }

  return {
    ...choice,
    enabled: false,
    lockReason
  };
}

export const scenes: Record<SceneId, SceneDefinition> = {
  beginning: {
    id: "beginning",
    code: "0000",
    title: lt("Beginning / blank crossing", "开端 / 空白十字"),
    subtitle: lt(
      "A fixed crossing waits at the center of every return.",
      "每一次返回的中心，都有一个固定的十字等待着你。"
    ),
    accent: "cyan",
    doctrine: [lt("four directions", "四个方向"), lt("closed loop", "闭合轮回"), lt("blank origin", "空白起点")],
    glyphs: ["if", "one"],
    visual: [
      "            N            ",
      "            |            ",
      "      W ----+---- E      ",
      "            |            ",
      "            S            "
    ],
    choices: (state) => {
      const choices: Choice[] = [
        {
          id: "beginning:north",
          label: lt("Walk north into the white corridor", "向北走入白色长廊"),
          hint: lt("enter the first loop", "进入第一重回环")
        },
        {
          id: "beginning:east",
          label: lt("Walk east toward a dim seam", "向东走向一道暗缝"),
          hint: lt("begin with an asymmetry", "从一次不对称开始")
        },
        {
          id: "beginning:south",
          label: lt("Walk south through the low passage", "向南穿过低矮通道"),
          hint: lt("accept the repetition", "接受这次重复")
        },
        {
          id: "beginning:west",
          label: lt("Walk west into the windless arm", "向西走入无风之臂"),
          hint: lt("test another orientation", "换一个朝向试试")
        }
      ];

      if (state.loopCount >= 2) {
        choices.unshift(
          gatedChoice(
            {
              id: "beginning:trace",
              label: lt("Trace the remembered seam from the crossing", "在十字中心追认那条记住的裂缝"),
              hint: lt("skip the false ring with retained memory", "用保留的记忆跳过虚假回环"),
              tone: "ritual"
            },
            hasSymbols(state, "there", "is"),
            lt(
              "You need the paired symbols there + is before memory can hold the seam.",
              "你需要成对符号 there + is，记忆才能把那道裂缝固定下来。"
            )
          )
        );
      }

      return choices;
    }
  },
  echo: {
    id: "echo",
    code: "0001",
    title: lt("Echo / false ring", "回响 / 虚假回环"),
    subtitle: lt("The corridor repeats, but not perfectly.", "这条走廊在重复，但重复得并不彻底。"),
    accent: "yellow",
    doctrine: [lt("false return", "虚假返回"), lt("hidden gate", "隐藏通道"), lt("nihil loop", "虚无回环")],
    glyphs: ["if", "one", "there"],
    visual: [
      "      .---------------.      ",
      "    .'   repeat loop   '.    ",
      "   /   same wall same   \\   ",
      "   \\  mark      mark  /   ",
      "    '.____seam?____.'      "
    ],
    choices: (state) => {
      const gateEnabled =
        state.flags.echoSeamSeen &&
        state.flags.echoVoicesHeard &&
        hasSymbols(state, "there", "is") &&
        state.resources.clarity >= 2;
      const gateReason =
        !state.flags.echoSeamSeen
          ? lt(
              "You need to align the seam before the corridor will yield.",
              "你得先把那道暗缝对准，走廊才会松动。"
            )
          : !state.flags.echoVoicesHeard
            ? lt(
                "You still need the voice beyond the ring.",
                "你还需要先听见回环之外的声音。"
              )
            : !hasSymbols(state, "there", "is")
              ? lt(
                  "The gate only answers the paired symbols there + is.",
                  "这道门只回应成对的符号 there + is。"
                )
              : lt(
                  "Your clarity is too low. Read the loop more precisely.",
                  "你的清明度还不够。先把回环读得更准确一些。"
                );

      return [
        {
          id: "echo:loop",
          label: lt("Keep circling the corridor", "继续在走廊里打转"),
          hint: lt("trade clarity for pressure", "用清明交换压力")
        },
        {
          id: "echo:rhythm",
          label: lt("Catch the cracks in the scrolling text", "捕捉滚动文字中的裂缝"),
          hint: lt("press enter when a crack passes the center", "当裂缝经过中心时按 enter"),
          tone: "ritual"
        },
        {
          id: "echo:inspect",
          label: lt("Begin the seam-alignment rite", "启动裂缝对准仪式"),
          hint: lt("press enter when the pulse overlaps the split", "等脉冲压住裂缝时按下 enter"),
          tone: "ritual"
        },
        {
          id: "echo:listen",
          label: lt("Listen for the field beyond the ring", "聆听回环之外的旷野"),
          hint: lt("hear the distant rail", "听见远处升起的轨道")
        },
        gatedChoice(
          {
            id: "echo:gate",
            label: lt("Enter the vertical rail concealed in the ring", "进入回环中藏着的垂直轨道"),
            hint: lt("leave the false ring", "离开这个假回环"),
            tone: "ritual"
          },
          gateEnabled,
          gateReason
        )
      ];
    }
  },
  "playing-forth": {
    id: "playing-forth",
    code: "0002",
    title: lt("Playing-forth / vertical rail", "传送 / 垂直轨道"),
    subtitle: lt(
      "A lifted passage opens between ascent and collapse.",
      "一条被抬升的通道，在上行与坠落之间打开。"
    ),
    accent: "green",
    doctrine: [lt("elevation", "抬升"), lt("transit", "转运"), lt("mixed structure", "混合结构")],
    glyphs: ["if", "one", "there", "is"],
    visual: [
      "             ||             ",
      "             ||             ",
      "      =======##=======      ",
      "             ||             ",
      "             ||             "
    ],
    choices: () => [
      {
        id: "rail:ascend",
        label: lt("Ride the rail upward toward foresight", "沿轨上升，前往前瞻"),
        hint: lt("go toward the wide field", "去往更广阔的场域"),
        tone: "ritual"
      },
      {
        id: "rail:descend",
        label: lt("Descend the stair toward death", "沿阶下行，靠近死亡"),
        hint: lt("drop back to the crossing", "坠回十字开端"),
        tone: "danger"
      }
    ]
  },
  foresight: {
    id: "foresight",
    code: "0003",
    title: lt("Foresight / field of signs", "前瞻 / 符号之野"),
    subtitle: lt(
      "Fragments become a map only after patient reading.",
      "只有在耐心阅读之后，碎片才会长成地图。"
    ),
    accent: "blue",
    doctrine: [lt("future pressure", "未来压力"), lt("map fragments", "地图碎片"), lt("teleological pull", "目的论牵引")],
    glyphs: ["if", "one", "there", "is", "all"],
    visual: [
      "   ~ horizon ~ horizon ~    ",
      "      / marks in grain       ",
      "    /  \\         /  \\      ",
      "       center fissure        ",
      "   ~ hush ~ hush ~ hush ~    "
    ],
    choices: (state) => {
      const leapEnabled =
        state.flags.leapReady &&
        hasSymbols(state, "there", "is", "all", "not") &&
        state.resources.clarity >= 4 &&
        state.resources.strain <= 6;
      const leapReason =
        !state.flags.leapReady
          ? lt(
              "You need at least two field fragments before the shaft will recognize you.",
              "你至少要读出两段旷野碎片，井道才会承认你。"
            )
          : !hasSymbols(state, "there", "is", "all", "not")
            ? lt(
                "The shaft expects the sequence there / is / all / not.",
                "井道期待的序列是 there / is / all / not。"
              )
            : state.resources.clarity < 4
              ? lt(
                  "Your clarity must reach 4 before the descent can hold.",
                  "你的清明度必须达到 4，下降才撑得住。"
                )
              : lt(
                  "Your strain is too high. Step back and stabilize first.",
                  "你的压力过高。先后退，把状态稳住。"
                );

      return [
        {
          id: "foresight:read",
          label: lt("Read another fragment from the field", "再读一段旷野碎片"),
          hint: lt("gain clarity, accept more strain", "提高清明，也承担更多压力")
        },
        gatedChoice(
          {
            id: "foresight:leap",
            label: lt("Approach the central leap shaft", "靠近中央跳跃井道"),
            hint: lt("the text has prepared the descent", "文本已为下降作好准备"),
            tone: "ritual"
          },
          leapEnabled,
          leapReason
        ),
        {
          id: "foresight:return",
          label: lt("Step back toward the rail", "向后退回轨道"),
          hint: lt("withdraw and lower strain", "撤回并降低压力")
        }
      ];
    }
  },
  leap: {
    id: "leap",
    code: "0004",
    title: lt("Leap / negative shaft", "跳跃 / 负空间井道"),
    subtitle: lt(
      "The descent tests whether reading has become resolve.",
      "这次下降要检验：阅读是否已转化为决断。"
    ),
    accent: "magenta",
    doctrine: [lt("negative space", "负空间"), lt("faith jump", "信仰之一跃"), lt("threshold", "阈限")],
    glyphs: ["if", "one", "there", "is", "all", "not"],
    visual: [
      "              []            ",
      "              []            ",
      "              []            ",
      "              \\/            ",
      "              ..            "
    ],
    choices: () => [
      {
        id: "leap:jump",
        label: lt("Jump into the shaft", "跃入井道"),
        hint: lt("commit to the grounding below", "投向下方的建基之处"),
        tone: "danger"
      },
      {
        id: "leap:hesitate",
        label: lt("Hesitate and return to foresight", "迟疑片刻，回到前瞻"),
        hint: lt("keep reading the horizon", "继续阅读地平线")
      }
    ]
  },
  grounding: {
    id: "grounding",
    code: "0005",
    title: lt("Grounding / ab-ground", "建基 / 离基深渊"),
    subtitle: lt("The ground is a fracture, not a floor.", "这里的地面是一道裂口，而不是地板。"),
    accent: "red",
    doctrine: [lt("fracture", "裂隙"), lt("three routes", "三条路径"), lt("ab-ground", "离基")],
    glyphs: ["if", "one", "there", "is", "all", "not", "ground"],
    visual: [
      "   _________/\\_________   ",
      "   \\\\_____/  \\_____////   ",
      "        /      \\          ",
      "       /  abyss  \\         ",
      "      /__________\\        "
    ],
    choices: (state) => [
      gatedChoice(
        {
          id: "grounding:seyn",
          label: lt("Take the narrow route toward Seyn", "沿狭路前往存有之门"),
          hint: lt("move toward the concealed gate", "走向那扇被遮蔽的门"),
          tone: "ritual"
        },
        hasSymbols(state, "ground", "there", "is", "not") &&
          state.resources.clarity >= 5 &&
          state.resources.strain <= 7,
        !hasSymbols(state, "ground", "there", "is", "not")
          ? lt(
              "The narrow route wants the carried signs ground / there / is / not.",
              "这条狭路要求你携带 ground / there / is / not 这些符号。"
            )
          : state.resources.clarity < 5
            ? lt(
                "You need clarity 5 to read the route through the fracture.",
                "你需要 5 点清明，才能读出裂隙中的这条路。"
              )
            : lt(
                "Your strain is too high to keep balance on the narrow route.",
                "你的压力太高，无法在这条狭路上保持平衡。"
              )
      ),
      {
        id: "grounding:fall",
        label: lt("Lose footing and fall back", "失足坠回"),
        hint: lt("death returns you to the start", "死亡会把你送回起点"),
        tone: "danger"
      }
    ]
  },
  seyn: {
    id: "seyn",
    code: "0006",
    title: lt("Seyn / hidden gate", "存有 / 隐门"),
    subtitle: lt(
      "The gate opens less like a door than a withholding.",
      "这扇门的开启更像一种保留，而不是一次敞开。"
    ),
    accent: "cyan",
    doctrine: [lt("withholding", "保留"), lt("poetic being", "诗性存在"), lt("inner gate", "内在之门")],
    glyphs: ["if", "one", "there", "is", "all", "not", "ground", "gate"],
    visual: [
      "        |\\        /|       ",
      "        | \\______/ |       ",
      "        |  /      \\ |       ",
      "        |_\/  SEYN  \_|      ",
      "                             "
    ],
    choices: () => [
      {
        id: "seyn:open",
        label: lt("Pass through the withholding gate", "穿过这扇保留之门"),
        hint: lt("become the one who comes", "向将-来者转变"),
        tone: "ritual"
      }
    ]
  },
  "ones-to-come": {
    id: "ones-to-come",
    code: "0007",
    title: lt("Ones to Come / subject drift", "将-来者 / 主体漂移"),
    subtitle: lt("The subject begins to move toward 4444.", "主体开始向 4444 漂移。"),
    accent: "green",
    doctrine: [lt("future subject", "未来主体"), lt("creative impossibility", "创造性的不可能"), lt("drift", "漂移")],
    glyphs: ["if", "one", "there", "is", "all", "not", "ground", "gate", "come"],
    visual: [
      "      [3][3]  =>  [4][4]    ",
      "      [2][2]  =>  [4][4]    ",
      "                             ",
      "        the container shifts  ",
      "                             "
    ],
    choices: (state) => [
      gatedChoice(
        {
          id: "come:accept",
          label: lt("Accept the mutation toward 4444", "接受向 4444 的变异"),
          hint: lt("let the subject split", "让主体发生分裂"),
          tone: "ritual"
        },
        (state.resources.clarity >= 5 && state.resources.strain <= 5) && state.resources.strain <= 7,
        state.resources.clarity < 5
          ? lt(
              "The container will not mutate cleanly before clarity reaches 5.",
              "在清明度达到 5 之前，容器无法稳定完成变异。"
            )
          : state.resources.strain > 5
            ? lt(
                "Your strain must drop to 5 or below for the mutation to hold.",
                "你的压力必须降到 5 以下，变异才能稳定。"
              )
            : lt(
                "Your strain is too high. The mutation would tear you apart.",
                "你的压力过高，这次变异会直接把你撕开。"
              )
      ),
      {
        id: "come:refuse",
        label: lt("Refuse and fall back to the crossing", "拒绝它，坠回开端"),
        hint: lt("retain the old coordinates", "保留旧坐标"),
        tone: "danger"
      }
    ]
  },
  "last-god": {
    id: "last-god",
    code: "0008",
    title: lt("Last God / passing-through", "最后之神 / 穿身而过"),
    subtitle: lt("A final passage turns force into return.", "最后一次穿越，会把力量折返为回归。"),
    accent: "yellow",
    doctrine: [lt("passing-through", "穿身而过"), lt("return", "回返"), lt("cycle reset", "轮回重置")],
    glyphs: ["if", "one", "there", "is", "all", "not", "ground", "gate", "come", "return"],
    visual: [
      "              /             ",
      "   ----------/--------      ",
      "            /               ",
      "      a force passes         ",
      "              back           "
    ],
    choices: () => [
      {
        id: "last:return",
        label: lt("Let the passage send you back", "让这次穿越把你送回去"),
        hint: lt("complete one cycle", "完成这一轮循环"),
        tone: "ritual"
      }
    ]
  }
};

export function getScene(state: WorldState) {
  return scenes[state.scene];
}

export function formatSceneName(state: WorldState) {
  return txt(state.locale, scenes[state.scene].title);
}
