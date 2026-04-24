# Aporia v5 runtime

- `state.json` — 当前会话状态；只保留壳层状态，不含硬编码世界裁定
- `ledger.jsonl` — append-only 回合账本；记录每回合原话与 LLM 裁定结果
- `turn.schema.json` — 单回合裁定的结构化输出约束，包含锚点诊断与历史语境判读
- `library.seed.json` — 初始图书馆骨架
- `library.json` — 当前图书馆；允许被 `/rewrite` 实际改写
- `player_profile.json` — 跨局玩家画像；M3 会周期性蒸馏更新
- `rewrites.jsonl` — rewrite 结局生成的物理改写记录
- `cells/X-X-X-X/sediment.jsonl` — 每个格的原话沉积，append-only
- `trajectories/run-NNNN.jsonl` — 每局坐标/路向轨迹，append-only
- `crystallized/X-X-X-X.md` — 某格近期历史蒸馏出的局部 essence overlay
- `../traces/` — 退出与回返留下的痕迹

当前 `tools/play_v5_mvp.py` 只做三件事：

1. 读写状态与世界文件
2. 把玩家一句话交给 `codex exec` 做单回合裁定
3. 把裁定结果落盘并渲染出来

关键词分类、陷阱逃脱表、phase 阈值等固定规则已移除。

当前 M1 记忆层已落地：

- 每 turn 后会把原话沉积到当前 cell 的 `sediment.jsonl`
- 每 turn 后会把本回合的落点与路向追加到本局 `trajectory` 文件
- `/quit`、`/return`、中断退出会给当前 `trajectory` 写入 `seal`

当前 M3 画像层已落地：

- 会初始化 `player_profile.json`，并持续累计 `total_turns` / `total_reincarnations`
- 开启 `APORIA_ENABLE_PROFILE_DISTILL=1` 后，从 `turn >= 15` 开始每 5 turn 尝试蒸馏一次画像
- `/inspect` 会显示当前跨局画像、来源 turns、近局弧线
- `/reset` 不会清掉 `player_profile.json`

当前 M2 检索层已落地：

- 开启 `APORIA_ENABLE_LIBRARY_RETRIEVAL=1` 后，prompt 的 `LIBRARY MATERIAL` 会走 retrieval 接口
- 当前默认 starter library 已扩到 `38` 格，所以打开 flag 后会直接进入真正的 `retrieved` 模式
- 若未来有人把库缩回少于 `32` 格，仍会走全量注入，并记录 `retrieval_meta.mode=full_library_small`
- retrieval 会综合：
  - 常驻结构格
  - 当前格 + 4D 邻格
  - 最近访问轨迹
  - 上回合竞争锚点
  - 当前 `route_id` 的默认格
- 注入材料始终是 `base cell + crystallized overlay`，不是 overlay-only
- retrieval 或 overlay 读取失败时会 fail-open，回退到全量 library，不打断主回合

当前 M4 cell crystallization 已落地：

- 开启 `APORIA_ENABLE_CELL_CRYSTALLIZATION=1` 后，真实 cell 在第 `5 / 10 / 20 / 40` 次访问时只会进入 `pending`
- 真正的 cell 蒸馏只在停顿点执行：
  - `/quit`
  - `/return`
  - chapter change
  - phase boundary
- 产物写入 `crystallized/X-X-X-X.md`
- ghost cell 仍会忠实记入 `sediment` / `trajectory`，但不会生成正式 crystallized 文件
- cell distill 失败时保留旧文件，并记录 warning；主回合继续

当前默认库是一个 `38` 格的 starter library，不再只有最早那 `9` 个锚点。它现在覆盖：

- provenance / naming / authorization：如 `3-4-1-2 命名政体`、`3-4-2-1 授权回路`、`3-4-2-2 来源法庭`
- material / distribution：如 `2-3-2-2 利害账簿`、`1-3-1-3 物流现实`、`1-2-2-3 绩效剧场`
- refusal / rewrite / aporia：如 `3-3-2-3 语法罢工`、`4-4-2-1 配合撤回`、`4-4-3-4 分叉工坊`、`4-3-4-3 不可化约`

可观测性：

- 主界面锚点下会显示简版诊断：`剖面 / 玩家位 / 语境 / 竞争`
- 用 `/inspect` 可查看完整诊断：
  - 主锚点与竞争锚点
  - 本回合标签
  - 历史拖拽标签
  - 命中依据
  - 玩家当前姿态与历史位置
  - 路向摘要 / 防塌缩说明 / 竞争路向
  - 本回合 retrieval 模式、命中格、每个命中格的来源
  - 当前格是否已有 crystallized overlay，以及 `visit_count / last_distilled_turn / source_sample_size / confidence`
  - 当前 pending crystallization 列表与访问计数
  - 最近 memory warnings / fallback

回归试玩：

- `APORIA_LLM_MODEL=gpt-5.4-mini python3 tools/play_v5_mvp.py`
- `APORIA_ENABLE_PROFILE_DISTILL=1 APORIA_LLM_MODEL=gpt-5.4-mini python3 tools/play_v5_mvp.py`
- `APORIA_ENABLE_LIBRARY_RETRIEVAL=1 APORIA_LLM_MODEL=gpt-5.4-mini python3 tools/play_v5_mvp.py`
- `APORIA_ENABLE_CELL_CRYSTALLIZATION=1 APORIA_LLM_MODEL=gpt-5.4-mini python3 tools/play_v5_mvp.py`
- `APORIA_ENABLE_LIBRARY_RETRIEVAL=1 APORIA_ENABLE_PROFILE_DISTILL=1 APORIA_ENABLE_CELL_CRYSTALLIZATION=1 APORIA_LLM_MODEL=gpt-5.4-mini python3 tools/play_v5_mvp.py`
- `python3 tools/smoke_v5_routes.py --model gpt-5.4-mini`
