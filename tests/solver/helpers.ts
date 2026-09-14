/**
 * 求解器测试共用工具。
 */
import type { GameState, Move, PuzzleDefinition } from '../../src/types';
import { applyMove } from '../../src/core/rules';

/** 依次执行全部移动，返回最终状态（核心验证工具） */
export function applySolution(
  puzzle: PuzzleDefinition,
  initialState: GameState,
  moves: Move[],
): GameState {
  return moves.reduce((state, move) => applyMove(state, puzzle, move), initialState);
}

/** 构造“一步即可完成”的谜题：目标棋子紧邻出口 */
export function oneStepPuzzle(): PuzzleDefinition {
  return {
    version: 1,
    name: '一步完成',
    board: { width: 3, height: 2, exit: { x: 2, y: 0, width: 1, height: 1 } },
    pieces: [
      { id: 't', x: 1, y: 0, width: 1, height: 1, type: '1x1' },
      { id: 'b', x: 0, y: 1, width: 1, height: 1, type: '1x1' },
    ],
    goal: { pieceId: 't', type: 'reach-exit' },
  };
}

/** 构造“无解”的谜题：目标棋子被完全围死，无法到达出口 */
export function unsolvablePuzzle(): PuzzleDefinition {
  // 3×2 棋盘：t 在 (0,0)，出口在 (2,1)，但 (1,0)(0,1) 被两个 1×1 堵死且它们也无处可去
  return {
    version: 1,
    name: '无解谜题',
    board: { width: 3, height: 2, exit: { x: 2, y: 1, width: 1, height: 1 } },
    pieces: [
      { id: 't', x: 0, y: 0, width: 1, height: 1, type: '1x1' },
      { id: 'a', x: 1, y: 0, width: 2, height: 1, type: '2x1' },
      { id: 'b', x: 0, y: 1, width: 2, height: 1, type: '2x1' },
    ],
    goal: { pieceId: 't', type: 'reach-exit' },
  };
}
