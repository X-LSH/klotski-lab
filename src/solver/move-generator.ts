/**
 * 后继状态生成器：基于 core 规则枚举“状态 + 到达它的移动”。
 * 保持不可变语义：每个后继都是新状态。
 */
import type { GameState, Move, PuzzleDefinition } from '../types';
import { applyMove, getLegalMoves } from '../core/rules';

export interface Successor {
  move: Move;
  state: GameState;
}

/** 生成当前状态的全部合法后继 */
export function generateSuccessors(state: GameState, puzzle: PuzzleDefinition): Successor[] {
  return getLegalMoves(state, puzzle).map((move) => ({
    move,
    state: applyMove(state, puzzle, move),
  }));
}
