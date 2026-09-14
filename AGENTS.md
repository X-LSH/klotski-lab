# AGENTS.md —— Klotski Lab 项目开发约束

本文件是 AI 与人工协作者在本仓库中必须遵守的开发合同。任何阶段的工作都不得违反以下约束。

## 一、项目架构说明

Klotski Lab 是一个纯前端、可部署到 GitHub Pages 的华容道（Klotski）交互式实验室。
整体分层为：

```
React UI（pages / components / hooks）
    ↓ 只能调用
Solver 层（solver / generator，纯算法，可运行在 Web Worker）
    ↓ 只能调用
Core 层（core，纯规则引擎与数据结构）
```

数据流为单向：UI 不反向被 core / solver 依赖。

## 二、当前技术栈

- TypeScript（strict 模式）
- React 18
- Vite 5
- 原生 CSS（不引入大型 UI 框架）
- Vitest + Testing Library
- ESLint 9（flat config）+ Prettier

## 三、核心目录职责

| 目录             | 职责                                                     |
| ---------------- | -------------------------------------------------------- |
| `src/core`       | 棋盘、棋子、状态、移动规则、谜题校验、预设谜题           |
| `src/solver`     | BFS / A* / IDA* 求解器、启发式、优先队列、Web Worker     |
| `src/generator`  | 谜题自动生成、随机打乱、难度评估、关卡预设               |
| `src/replay`     | 解法回放的纯逻辑（步进、进度、倍速计算）                 |
| `src/storage`    | localStorage 持久化、JSON 序列化、URL 分享编解码         |
| `src/components` | 通用 React 组件（不允许包含游戏规则）                    |
| `src/pages`      | 页面级组件（Home / Play / Levels / Editor / Observatory / About） |
| `src/hooks`      | React hooks（只做状态桥接，不实现规则）                  |
| `src/utils`      | 与业务无关的通用工具                                     |
| `src/types`      | 全局共享类型定义                                         |
| `tests/`         | 与 src 对应的单元测试                                    |

## 四、核心原则（不可违反）

1. `core` 不依赖 React。
2. `solver` 不依赖 React。
3. `solver` 不允许直接访问 DOM。
4. UI 不允许自己实现游戏规则；所有移动合法性必须经由 `core` 的 `canMove / getLegalMoves / applyMove` 判断。
5. 所有状态转换必须经过 `core`。
6. 不允许在组件里复制一份规则逻辑。
7. `solver` 的正确结果不能依赖任何可视化层；观测台只是观察层。
8. 状态必须保持不可变语义：求解器不得直接修改传入的 GameState。

## 五、流程纪律

1. 每个阶段只修改当前阶段需要的内容。
2. 不允许为了“未来可能需要”而提前加入复杂功能。
3. 每次功能完成必须执行测试。
4. 不允许删除已有测试来规避失败。
5. 不允许通过 `any` 绕过 TypeScript 类型问题（ESLint 已设为 error）。
6. 发现架构问题时优先做最小范围修复，而不是继续叠加代码或借机重设计整个项目。
7. 如果某项功能无法可靠实现，不要伪装成已完成，必须在报告中明确：未完成什么、为什么、当前影响、建议下一步。
8. 每完成一个阶段必须依次通过：`npm run lint`、`npm run test`、`npm run build`。

## 六、界面与文案

- 界面文案统一使用简体中文；产品名保留为 “Klotski Lab”。
- 视觉方向：深色、技术感、极简、现代、轻玻璃拟态；不做儿童益智游戏风格。
