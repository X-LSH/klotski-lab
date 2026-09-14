/**
 * 求解 Web Worker 入口。
 * 架构：React → SolverClient → Web Worker → Solver → Result。
 * 本文件运行在 Worker 全局作用域，不依赖 React / DOM。
 */
/// <reference lib="webworker" />
import { getSolver, type AlgorithmName } from './registry';
import type { SolveProblem, SolveProgress, SolveResult } from './result';

/** 主线程 → Worker 的求解请求 */
export interface SolveRequest {
  type: 'solve';
  id: number;
  algorithm: AlgorithmName;
  problem: SolveProblem;
  options: { maxStates?: number; timeoutMs?: number };
}

/** Worker → 主线程：进度消息（不等最终结果即可显示搜索进度） */
export interface WorkerProgressMessage {
  type: 'progress';
  id: number;
  progress: SolveProgress;
}

/** Worker → 主线程：最终结果 */
export interface WorkerResultMessage {
  type: 'result';
  id: number;
  result: SolveResult;
}

export type WorkerResponse = WorkerProgressMessage | WorkerResultMessage;

const scope = self as unknown as {
  postMessage(message: WorkerResponse): void;
  onmessage: ((event: MessageEvent<SolveRequest>) => void) | null;
};

scope.onmessage = (event) => {
  const request = event.data;
  if (request.type !== 'solve') return;
  const solver = getSolver(request.algorithm);
  const result = solver.solve(request.problem, {
    maxStates: request.options.maxStates,
    timeoutMs: request.options.timeoutMs,
    onProgress: (progress) => {
      scope.postMessage({ type: 'progress', id: request.id, progress });
    },
  });
  scope.postMessage({ type: 'result', id: request.id, result });
};
