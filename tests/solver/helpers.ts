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

/**
 * 中等难度谜题：经典横刀立马的“半途”局面。
 * 保留完整棋子体系但曹操已推进一格，最优解约几十步，
 * 三种算法都能在合理时间内解出，用于跨算法一致性验证。
 */
export function mediumPuzzle(): PuzzleDefinition {
  return {
    version: 1,
    name: '半途（中等）',
    board: { width: 4, height: 5, exit: { x: 1, y: 4, width: 2, height: 1 } },
    pieces: [
      { id: 'caocao', x: 1, y: 1, width: 2, height: 2, type: '2x2', label: '曹操' },
      { id: 'guanyu', x: 1, y: 3, width: 2, height: 1, type: '2x1', label: '关羽' },
      { id: 'zhangfei', x: 0, y: 0, width: 1, height: 2, type: '1x2', label: '张飞' },
      { id: 'zhaoyun', x: 3, y: 0, width: 1, height: 2, type: '1x2', label: '赵云' },
      { id: 'machao', x: 0, y: 2, width: 1, height: 2, type: '1x2', label: '马超' },
      { id: 'huangzhong', x: 3, y: 2, width: 1, height: 2, type: '1x2', label: '黄忠' },
      { id: 'bing1', x: 1, y: 0, width: 1, height: 1, type: '1x1', label: '兵' },
      { id: 'bing2', x: 2, y: 0, width: 1, height: 1, type: '1x1', label: '兵' },
      { id: 'bing3', x: 0, y: 4, width: 1, height: 1, type: '1x1', label: '兵' },
      { id: 'bing4', x: 3, y: 4, width: 1, height: 1, type: '1x1', label: '兵' },
    ],
    goal: { pieceId: 'caocao', type: 'reach-exit' },
  };
}
