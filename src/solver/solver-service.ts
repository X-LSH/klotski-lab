/**
 * 求解服务：UI 与求解器之间的唯一入口。
 * 通过 SolverClient 在 Web Worker 中执行；Worker 不可用时自动降级主线程。
 */
import { createSolverClient } from './solver-client';
import type { SolveHandle } from './solver-client';
import type { AlgorithmName } from './registry';
import type { SolveOptions, SolveProblem, SolveResult } from './result';

const client = createSolverClient();

/** 异步求解（返回 Promise 的便捷形式） */
export function solvePuzzle(
  problem: SolveProblem,
  algorithm: AlgorithmName = 'bfs',
  options: SolveOptions = {},
): Promise<SolveResult> {
  return client.solve(problem, algorithm, options).promise;
}

/** 带取消句柄的求解（供“停止”按钮使用） */
export function solvePuzzleWithHandle(
  problem: SolveProblem,
  algorithm: AlgorithmName = 'bfs',
  options: SolveOptions = {},
): SolveHandle {
  return client.solve(problem, algorithm, options);
}
