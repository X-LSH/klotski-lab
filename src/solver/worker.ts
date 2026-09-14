/**
 * 求解 Web Worker 入口。
 * 架构：React → SolverClient → Web Worker → Solver → Result。
 * 本文件运行在 Worker 全局作用域，不依赖 React / DOM。
 *
 * 事件转发策略（观测层保护）：
 * - search_start / goal_found / search_end 总是转发（量小）；
 * - node_expand / node_generate 最多转发 maxTreeEvents 条（默认 2000），
 *   避免搜索量大时消息洪流冲击主线程，且不影响求解正确性；
 * - node_skip 不逐条转发（量最大），其计数由进度消息携带。
 */
/// <reference lib="webworker" />
import { getSolver, type AlgorithmName } from './registry';
import type { SearchEvent } from './events';
import type { SolveProblem, SolveProgress, SolveResult } from './result';

/** 主线程 → Worker 的求解请求 */
export interface SolveRequest {
  type: 'solve';
  id: number;
  algorithm: AlgorithmName;
  problem: SolveProblem;
  options: {
    maxStates?: number;
    timeoutMs?: number;
    /** 是否转发搜索事件（观测模式） */
    visualize?: boolean;
    /** 可视化事件转发上限 */
    maxTreeEvents?: number;
  };
}

/** Worker → 主线程：进度消息（不等最终结果即可显示搜索进度） */
export interface WorkerProgressMessage {
  type: 'progress';
  id: number;
  progress: SolveProgress;
}

/** Worker → 主线程：搜索事件（已按策略节流） */
export interface WorkerEventMessage {
  type: 'event';
  id: number;
  event: SearchEvent;
}

/** Worker → 主线程：最终结果 */
export interface WorkerResultMessage {
  type: 'result';
  id: number;
  result: SolveResult;
}

export type WorkerResponse = WorkerProgressMessage | WorkerEventMessage | WorkerResultMessage;

const DEFAULT_MAX_TREE_EVENTS = 2000;

const scope = self as unknown as {
  postMessage(message: WorkerResponse): void;
  onmessage: ((event: MessageEvent<SolveRequest>) => void) | null;
};

scope.onmessage = (event) => {
  const request = event.data;
  if (request.type !== 'solve') return;
  const solver = getSolver(request.algorithm);
  const maxTreeEvents = request.options.maxTreeEvents ?? DEFAULT_MAX_TREE_EVENTS;
  let treeEventsSent = 0;

  const forwardEvent = (searchEvent: SearchEvent) => {
    if (!request.options.visualize) return;
    if (searchEvent.type === 'node_skip') return; // 量大，仅计数
    if (searchEvent.type === 'node_expand' || searchEvent.type === 'node_generate') {
      if (treeEventsSent >= maxTreeEvents) return;
      treeEventsSent += 1;
    }
    scope.postMessage({ type: 'event', id: request.id, event: searchEvent });
  };

  const result = solver.solve(request.problem, {
    maxStates: request.options.maxStates,
    timeoutMs: request.options.timeoutMs,
    onProgress: (progress) => {
      scope.postMessage({ type: 'progress', id: request.id, progress });
    },
    onEvent: forwardEvent,
  });
  scope.postMessage({ type: 'result', id: request.id, result });
};
