/**
 * 可重复随机与洗牌工具。
 * 使用 mulberry32：同一种子必然产生同一序列，保证生成结果可复现。
 */
import type { GameState, Move, PuzzleDefinition } from '../types';
import { applyLegalMove, getLegalMoves } from '../core/rules';
import { oppositeDirection } from '../core/move';

/** mulberry32 伪随机数发生器（确定性） */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 从给定状态出发随机执行 N 步合法逆向移动（随机游走打乱）。
 * 规则：
 * - 每步从合法移动中均匀随机选择；
 * - 跳过“上一步的反向移动”（避免原地来回抖动，提升打乱质量）；
 * - 随机数全部来自种子 RNG，同一种子结果完全一致。
 */
export function randomWalk(
  puzzle: PuzzleDefinition,
  start: GameState,
  steps: number,
  rng: () => number,
): GameState {
  let state = start;
  let lastMove: Move | null = null;
  for (let i = 0; i < steps; i++) {
    let moves = getLegalMoves(state, puzzle);
    if (lastMove) {
      const inverse = oppositeDirection(lastMove.direction);
      const filtered = moves.filter(
        (m) => !(m.pieceId === lastMove?.pieceId && m.direction === inverse),
      );
      if (filtered.length > 0) moves = filtered;
    }
    if (moves.length === 0) break;
    const move = moves[Math.floor(rng() * moves.length)];
    state = applyLegalMove(state, move);
    lastMove = move;
  }
  return state;
}
