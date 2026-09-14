# Klotski Lab · 华容道实验室

一个纯前端的华容道（Klotski）交互式实验室：游戏 + 求解器 + 算法可视化，而不是一个普通小游戏。

> 本 README 将随阶段推进持续完善（截图、在线演示、部署说明等在第 9 阶段补齐）。

## 功能概览

- 华容道游戏（鼠标 / 触摸拖动、撤销、重做、重置、提示）
- BFS / A* / IDA\* 求解算法（Web Worker 后台求解，支持进度与取消）
- 解法回放（播放 / 暂停 / 步进 / 倍速）
- 算法观测台（搜索树、实时统计、算法竞速对比）
- 自定义谜题编辑器（JSON 导入导出、URL 分享）
- 关卡系统 + 谜题自动生成 + 难度评估 + 每日挑战
- localStorage 持久化 + 移动端适配 + PWA
- GitHub Pages 自动部署

## 本地开发

```bash
npm install
npm run dev      # 本地开发
npm run lint     # 代码检查
npm run test     # 单元测试
npm run build    # 类型检查 + 构建
```

## 技术栈

TypeScript · React 18 · Vite 5 · 原生 CSS · Vitest · ESLint · Prettier

## 目录结构

```
src/
├── core/        # 核心规则引擎（不依赖 React）
├── solver/      # 求解算法与 Web Worker（不依赖 React / DOM）
├── generator/   # 谜题生成与难度评估
├── replay/      # 回放纯逻辑
├── storage/     # 持久化与分享
├── components/  # 通用组件
├── pages/       # 页面
├── hooks/       # hooks
├── utils/       # 工具
├── types/       # 类型
└── App.tsx
tests/           # 与 src 对应的单元测试
.github/workflows/  # GitHub Pages 自动部署
```

## 协作约束

所有协作者（含 AI）必须遵守根目录 [AGENTS.md](./AGENTS.md)。
