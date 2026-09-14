/**
 * 求解结果与求解问题的统一类型。
 * 所有算法（BFS / A* / IDA*）都必须返回同一结构，UI 不感知算法内部实现。
 */
import type { GameState, Move, PuzzleDefinition } from '../types';

/** 求解问题：谜题定义 + 初始状态 */
export interface SolveProblem {
  puzzle: PuzzleDefinition;
  initialState: GameState;
}

/** 求解结束原因 */
export type SolveEndReason =
  | 'solved' // 找到解
  | 'already-solved' // 初始状态已完成
  | 'unsolvable' // 搜索空间耗尽，无解
  | 'state-limit' // 达到状态数上限
  | 'timeout' // 超时
  | 'cancelled'; // 用户取消

/** 统一求解结果 */
export interface SolveResult {
  solved: boolean;
  /** 最短合法移动序列（未解出时为空数组） */
  moves: Move[];
  /** 解的深度（移动步数） */
  depth: number;
  /** 访问过的不同状态数 */
  visitedNodes: number;
  /** 实际展开过的节点数 */
  expandedNodes: number;
  /** 耗时（毫秒） */
  elapsedMs: number;
  reason: SolveEndReason;
}

/** 求解进度回调参数 */
export interface SolveProgress {
  visitedNodes: number;
  expandedNodes: number;
  depth: number;
  queueSize: number;
  /** 累计生成的后继节点数（含重复） */
  generatedNodes: number;
  /** 累计被去重 / 剪枝跳过的节点数 */
  skippedNodes: number;
}

/** 求解可选配置 */
export interface SolveOptions {
  /** 访问状态数上限（默认 200000），防止死循环或内存耗尽 */
  maxStates?: number;
  /** 超时时间（毫秒），不设置则不限制 */
  timeoutMs?: number;
  /** 进度回调（求解器按内部节流频率调用） */
  onProgress?: (progress: SolveProgress) => void;
  /** 取消检查：返回 true 时求解器尽快终止 */
  shouldCancel?: () => boolean;
  /** 搜索事件回调（观测层；轻量事件，量大时由调用方节流） */
  onEvent?: (event: import('./events').SearchEvent) => void;
  /** 可视化树事件转发上限（Worker 模式，默认 2000） */
  maxTreeEvents?: number;
}

export const DEFAULT_MAX_STATES = 200_000;
