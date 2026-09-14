/**
 * 求解服务：UI 与求解器之间的唯一入口。
 * 当前在主线程执行（阶段 3），阶段 5 将无缝替换为 Web Worker 实现，
 * 调用方无需改动。
 */
import { bfsSolver } from './bfs';
import type { SolveOptions, SolveProblem, SolveResult } from './result';

export type AlgorithmName = 'bfs' | 'astar' | 'idastar';

/** 异步求解（暂时仅支持 BFS，主线程执行） */
export function solvePuzzle(
  problem: SolveProblem,
  algorithm: AlgorithmName = 'bfs',
  options: SolveOptions = {},
): Promise<SolveResult> {
  // 用 setTimeout 让出一帧，避免阻塞 UI 渲染“求解中”状态
  return new Promise((resolve) => {
    setTimeout(() => {
      // 阶段 3 只有 BFS；algorithm 参数为后续多算法预留
      void algorithm;
      resolve(bfsSolver.solve(problem, options));
    }, 0);
  });
}
