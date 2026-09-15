/**
 * 求解服务：UI 与求解器之间的唯一入口。
 * 通过 SolverClient 在 Web Worker 中执行；Worker 不可用时自动降级主线程。
 *
 * ## 为什么必须在这里给默认超时
 *
 * 求解器内部的 `maxStates`（默认 200,000）对 BFS / A* 是有效守卫，但对 IDA* **无效**：
 * 它统计的是 `visitedKeys` —— 一个**跨轮次累积的规范化状态键集合**，
 * 其上界就是谜题的可达规范化状态空间（经典横刀立马实测 24,027 个），
 * 永远达不到 200,000。而 IDA* 真正无界增长的量是「展开次数」：
 * 实测经典横刀立马下 20 秒展开 1,426,944 次、仅推进到深度 41（目标 116 步），
 * 且每加深一轮搜索树都显著变大，因此它可以一直跑下去、永远不给结果。
 *
 * 结论：IDA* 在经典及更大型谜题上不可行，属弱启发式 + 迭代加深的算法特性，
 * 不是实现缺陷（README「已知限制」已如实说明）。但界面层不能因此无限等待，
 * 必须提供基于时间的兜底，让用户得到明确答复。
 *
 * 显式传入的 `timeoutMs` 优先于此处默认值（竞速与观测台有自己的时间预算）。
 */
import { createSolverClient } from './solver-client';
import type { SolveHandle } from './solver-client';
import type { AlgorithmName } from './registry';
import type { SolveOptions, SolveProblem, SolveResult } from './result';

const client = createSolverClient();

/**
 * 默认求解超时（毫秒）。
 * 取值依据：BFS / A* 在经典谜题上仅需数百毫秒，30 秒对本项目全部内置谜题都极为宽裕；
 * 对 IDA* 则是一个「足够久、但一定会结束」的上限。
 */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** 未显式指定超时时补上默认兜底（不修改传入对象）。导出以便单测直接看守该策略。 */
export function applyDefaultTimeout(options: SolveOptions): SolveOptions {
  if (options.timeoutMs !== undefined) return options;
  return { ...options, timeoutMs: DEFAULT_TIMEOUT_MS };
}

/** 异步求解（返回 Promise 的便捷形式） */
export function solvePuzzle(
  problem: SolveProblem,
  algorithm: AlgorithmName = 'bfs',
  options: SolveOptions = {},
): Promise<SolveResult> {
  return client.solve(problem, algorithm, applyDefaultTimeout(options)).promise;
}

/** 带取消句柄的求解（供“停止”按钮使用） */
export function solvePuzzleWithHandle(
  problem: SolveProblem,
  algorithm: AlgorithmName = 'bfs',
  options: SolveOptions = {},
): SolveHandle {
  return client.solve(problem, algorithm, applyDefaultTimeout(options));
}
