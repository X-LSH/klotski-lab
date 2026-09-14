/**
 * 测试共用的小型谜题构造工具。
 */
import type { PuzzleDefinition } from '../../src/types';

/** 3×3 简单谜题：目标 1×1 棋子从左上走到右下出口 */
export function tinyPuzzle(): PuzzleDefinition {
  return {
    version: 1,
    name: '测试小谜题',
    board: { width: 3, height: 3, exit: { x: 2, y: 2, width: 1, height: 1 } },
    pieces: [
      { id: 't', x: 0, y: 0, width: 1, height: 1, type: '1x1' },
      { id: 'b', x: 1, y: 0, width: 1, height: 1, type: '1x1' },
    ],
    goal: { pieceId: 't', type: 'reach-exit' },
  };
}

/** 含 2×2 棋子的 4×4 谜题：用于多格棋子碰撞测试 */
export function bigPiecePuzzle(): PuzzleDefinition {
  return {
    version: 1,
    name: '大棋子测试',
    board: { width: 4, height: 4, exit: { x: 2, y: 2, width: 2, height: 2 } },
    pieces: [
      { id: 'big', x: 0, y: 0, width: 2, height: 2, type: '2x2' },
      { id: 's', x: 3, y: 0, width: 1, height: 1, type: '1x1' },
    ],
    goal: { pieceId: 'big', type: 'reach-exit' },
  };
}

/** 带封锁格的谜题 */
export function blockedPuzzle(): PuzzleDefinition {
  return {
    version: 1,
    name: '封锁格测试',
    board: {
      width: 3,
      height: 3,
      exit: { x: 2, y: 0, width: 1, height: 1 },
      blocked: [{ x: 1, y: 0 }],
    },
    pieces: [{ id: 't', x: 0, y: 0, width: 1, height: 1, type: '1x1' }],
    goal: { pieceId: 't', type: 'reach-exit' },
  };
}
