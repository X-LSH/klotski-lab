/**
 * 谜题定义相关的纯工具。
 */
import type { PuzzleDefinition } from '../types';

/** 深拷贝谜题定义 */
export function clonePuzzle(puzzle: PuzzleDefinition): PuzzleDefinition {
  return {
    version: puzzle.version,
    name: puzzle.name,
    board: {
      width: puzzle.board.width,
      height: puzzle.board.height,
      exit: puzzle.board.exit ? { ...puzzle.board.exit } : undefined,
      blocked: puzzle.board.blocked?.map((c) => ({ ...c })),
    },
    pieces: puzzle.pieces.map((p) => ({ ...p })),
    goal: {
      pieceId: puzzle.goal.pieceId,
      type: puzzle.goal.type,
      area: puzzle.goal.area ? { ...puzzle.goal.area } : undefined,
    },
  };
}

/** 序列化为 JSON 字符串（导入导出 / 分享的统一入口） */
export function serializePuzzle(puzzle: PuzzleDefinition): string {
  return JSON.stringify(puzzle);
}
