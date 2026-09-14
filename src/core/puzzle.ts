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

/** 宽松的结构检查：确保 JSON 解析结果具备 PuzzleDefinition 的必要字段 */
function isPuzzleLike(value: unknown): value is PuzzleDefinition {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  const board = p.board as Record<string, unknown> | undefined;
  const goal = p.goal as Record<string, unknown> | undefined;
  return (
    typeof p.name === 'string' &&
    typeof board?.width === 'number' &&
    typeof board?.height === 'number' &&
    Array.isArray(p.pieces) &&
    p.pieces.every(
      (piece) =>
        typeof piece === 'object' &&
        piece !== null &&
        typeof (piece as Record<string, unknown>).id === 'string' &&
        typeof (piece as Record<string, unknown>).x === 'number' &&
        typeof (piece as Record<string, unknown>).y === 'number' &&
        typeof (piece as Record<string, unknown>).width === 'number' &&
        typeof (piece as Record<string, unknown>).height === 'number',
    ) &&
    typeof goal?.pieceId === 'string' &&
    (goal?.type === 'reach-exit' || goal?.type === 'occupy-area')
  );
}

export type ParsePuzzleResult =
  | { ok: true; puzzle: PuzzleDefinition }
  | { ok: false; error: string };

/**
 * 解析 JSON 文本为谜题定义。
 * 非法 JSON / 结构不符时返回错误，绝不把不可信数据直接写入应用状态。
 */
export function parsePuzzle(json: string): ParsePuzzleResult {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return { ok: false, error: 'JSON 格式错误，无法解析' };
  }
  if (!isPuzzleLike(value)) {
    return { ok: false, error: 'JSON 结构不符合谜题定义（缺少必要字段）' };
  }
  // 规范化：补齐缺失的可选字段
  const puzzle: PuzzleDefinition = {
    version: 1,
    name: value.name,
    board: {
      width: value.board.width,
      height: value.board.height,
      exit: value.board.exit ? { ...value.board.exit } : undefined,
      blocked: value.board.blocked?.map((c) => ({ ...c })),
    },
    pieces: value.pieces.map((p) => ({
      ...p,
      type: p.type ?? 'custom',
    })),
    goal: {
      pieceId: value.goal.pieceId,
      type: value.goal.type,
      area: value.goal.area ? { ...value.goal.area } : undefined,
    },
  };
  return { ok: true, puzzle };
}
