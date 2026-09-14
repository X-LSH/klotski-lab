/**
 * 解法回放的纯逻辑（不依赖 React / DOM）。
 * 给定初始状态与移动序列，预计算完整状态序列，支持步进与倍速控制。
 */
import type { GameState, Move, PuzzleDefinition } from '../types';
import { applyMove } from '../core/rules';

/** 回放会话：states[0] 为初始状态，states[i+1] = 应用 moves[i] 后的状态 */
export interface ReplaySession {
  moves: Move[];
  states: GameState[];
}

/** 构建回放会话（状态序列与移动序列一一对应） */
export function buildReplaySession(
  puzzle: PuzzleDefinition,
  initialState: GameState,
  moves: Move[],
): ReplaySession {
  const states: GameState[] = [initialState];
  let current = initialState;
  for (const move of moves) {
    current = applyMove(current, puzzle, move);
    states.push(current);
  }
  return { moves, states };
}

/** 把回放游标限制在合法范围 [0, total] */
export function clampIndex(index: number, total: number): number {
  if (index < 0) return 0;
  if (index > total) return total;
  return index;
}

/** 支持的回放倍速 */
export const REPLAY_SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

/** 基准步进间隔（1x 时每步毫秒数） */
export const BASE_STEP_INTERVAL_MS = 600;

/** 按倍速计算实际步进间隔 */
export function intervalForSpeed(speed: number): number {
  return BASE_STEP_INTERVAL_MS / speed;
}
