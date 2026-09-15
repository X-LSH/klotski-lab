# Klotski Lab · 华容道实验室

一个纯前端的华容道（Klotski）交互式实验室：**谜题 + 求解器 + 算法可视化**，而不是一个普通小游戏。

普通小游戏的目标是“玩”；Klotski Lab 的目标是让你**看见求解器如何思考**——
任意局面可以一键求出最优解并回放，三种经典搜索算法同台竞速，
搜索树的每一步扩张、每一次剪枝都实时可见。

## 截图

> 截图存放于 `docs/screenshots/`（部署后可补充：首页 / 游戏页 / 观测台 / 编辑器）。

## 在线演示

https://x-lsh.github.io/klotski-lab/

推送到 `main` 后由 GitHub Actions 自动构建并发布。

## 功能列表

- **华容道游戏**：鼠标 / 触摸拖动、非法回弹、撤销、重做、重置、胜利结算（效率 = 最优步数 / 玩家步数）
- **三种求解算法**：BFS（保证最短）、A*（可采纳启发式）、IDA*（迭代加深），全部运行在 Web Worker，支持进度、停止与超时保护
- **解法回放**：播放 / 暂停 / 上一步 / 下一步 / 首步 / 末步 / 0.25x–4x 倍速
- **算法观测台**：搜索事件模型（expand / generate / skip / goal）、搜索树可视化、节点检查器、实时统计、时间线、算法竞速（Race All）+ SVG 对比图
- **谜题编辑器**：放置 / 拖动 / 删除 / 改尺寸、设置目标棋子（到达出口 / 占据区域）、设置出口、实时校验、JSON 导入导出、我的谜题（保存 / 加载 / 重命名 / 删除）
- **关卡系统**：入门 → 专家四档内置关卡、难度 / 标签过滤
- **谜题生成器**：种子可重复（同种子同谜题）、从可解目标状态逆向打乱保证有解
- **每日挑战**：日期 → 确定性种子，同一天全网同一题，无需后端
- **持久化**：游戏进度续玩、完成记录与最佳成绩、每日挑战结果、用户设置（localStorage）
- **分享**：URL 链接（带版本字段）、剪贴板降级方案、JSON 导入导出（导入必须通过校验）
- **PWA**：manifest + 图标 + 离线壳（Service Worker），可安装
- **移动端适配**：上下布局、横向滚动工具栏、375px–1440px 无横向滚动
- **GitHub Pages 自动部署**：push 到 main 即执行 lint → test → build → deploy

## 架构

```
React UI（pages / components / hooks）
    ↓ 只能调用
Solver 层（bfs / astar / idastar / worker，纯算法）
    ↓ 只能调用
Core 层（board / piece / state / rules / validator，纯规则引擎）
```

- `core` 不依赖 React；`solver` 不依赖 React、不碰 DOM；
- 所有移动合法性经由 `canMove / getLegalMoves / applyMove` 判断，UI 不复制规则；
- 求解器状态不可变，去重使用规范化状态键（形状相同的非目标棋子视为等价，避免搜索空间爆炸）；
- 观测台是纯观察层：求解正确性不依赖任何可视化。

## 求解算法

| 算法  | 策略                 | 最优性 | 备注                                        |
| ----- | -------------------- | ------ | ------------------------------------------- |
| BFS   | 逐层扩展 + 状态去重  | 保证   | 经典横刀立马 24,027 状态 / 116 步最优解     |
| A*    | f = g + h（矩形间距）| 保证   | 启发式 admissible 且 consistent             |
| IDA\* | 迭代加深 + 阈值剪枝  | 保证   | 大谜题上耗时显著增加（算法特性，如实提示） |

启发式说明：h = 目标棋子矩形与目标区域的二维区间间隙之和。每次移动只能缩小某个轴的间隙 1 格，
因此 h 永不高估；且任意一步后 h 的下降不超过 1，满足一致性。详见 `src/solver/heuristic.ts` 注释。

## 技术栈

TypeScript（strict）· React 18 · Vite 5 · 原生 CSS · Vitest + Testing Library · ESLint 9（flat）· Prettier

## 本地开发

```bash
npm install
npm run dev          # 开发服务器（根路径）
npm run lint         # 代码检查
npm run test         # 全量单元测试（144 项）
npm run test:watch   # 监听模式
npm run build        # 类型检查 + 生产构建（base=/klotski-lab/）
npm run preview      # 预览生产构建
```

## GitHub Pages 部署

1. 推送到 GitHub 仓库 `klotski-lab`（Settings → Pages → Source 选 GitHub Actions）；
2. `.github/workflows/deploy.yml` 会在每次 push 到 main 时执行：
   `npm ci → lint → test → build → deploy`；
3. Vite base 已按仓库名设为 `/klotski-lab/`（生产构建），本地开发为 `/`。

## 项目结构

```
src/
├── core/        # 核心规则引擎（不依赖 React）
├── solver/      # BFS / A* / IDA* / 优先队列 / 启发式 / Worker / 客户端
├── generator/   # 谜题生成 / 随机打乱 / 难度评估 / 关卡与每日挑战
├── replay/      # 回放纯逻辑
├── storage/     # localStorage 持久化 + URL 分享编解码
├── observatory/ # 搜索树构建 / 竞速（观测层纯逻辑）
├── components/  # 通用组件（board / editor / observatory / 面板）
├── pages/       # Home / Play / Levels / Editor / Observatory / About
├── hooks/       # useGame（useReducer 桥接 core）
├── types/       # 共享类型
└── App.tsx
tests/           # 与 src 对应的单元测试（core/solver/generator/replay/storage）
.github/workflows/  # GitHub Pages 自动部署
public/          # PWA：manifest / 图标 / Service Worker
```

## 测试

`npm run test` 共 144 项，覆盖：

- core：移动规则、碰撞、越界、封锁格、状态键稳定性、校验器、预设谜题
- solver：BFS / A* / IDA\* 最优性交叉验证、五种终止条件、启发式可采纳性与一致性、优先队列、Worker 协议（FakeWorker）、进度与取消
- observatory：事件顺序、统计不变量、搜索树重建与截断、算法竞速
- generator：种子可重复、可解性、难度稳定、每日种子稳定
- storage / share：存档往返、损坏数据降级、非法 JSON 拒绝、URL 编解码、剪贴板降级
- UI：Play / Editor / Home 渲染、useGame 撤销重做语义

## 已知限制（如实说明）

1. **IDA\* 在完整横刀立马（116 步）上耗时极长**——已实测 180 秒仅推进到深度 79，这是 IDA\* 在弱启发式下的算法特性而非实现缺陷；跨算法一致性验证使用中等谜题，界面上对 IDA\* 提供超时保护并如实显示“超时”。
2. **观测台不支持暂停**：Web Worker 无法可靠暂停，按规范不假装支持（开始 / 停止 / 重置可用）。
3. **算法竞速的“内存”指标未展示**：浏览器无法准确测量 Worker 内存，不伪造数据。
4. **PWA 离线壳为精简实现**：缓存优先策略未做版本化精细管理，重建部署后首次访问可能需要强刷。

## 未来路线图（不承诺）

- 更强的可采纳启发式（线性冲突 / 预计算距离场），改善 IDA\* 表现
- 搜索路径动画重放（含“当前节点高亮”的树回放）
- 关卡包导入（zip / 目录）、本地排行榜
- E2E 测试（Playwright）

## 协作约束

所有协作者（含 AI）必须遵守根目录 [AGENTS.md](./AGENTS.md)。
