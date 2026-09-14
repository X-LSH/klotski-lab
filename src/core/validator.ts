/**
 * 谜题合法性校验：返回结构化结果 { valid, errors }。
 * 编辑器、JSON 导入、URL 分享加载都必须经过这里。
 */
import type { PuzzleDefinition } from '../types';
import { rectInBounds } from './board';
import { rectOfPiece, rectsOverlap } from './piece';

/** 校验结果 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isPositiveInt(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

function isNonNegativeInt(n: number): boolean {
  return Number.isInteger(n) && n >= 0;
}

/** 校验谜题定义是否合法 */
export function validatePuzzle(puzzle: PuzzleDefinition): ValidationResult {
  const errors: string[] = [];
  const { board, pieces, goal } = puzzle;

  // 1. 棋盘尺寸是否合法
  if (!isPositiveInt(board.width) || !isPositiveInt(board.height)) {
    errors.push('棋盘宽高必须是正整数');
  } else if (board.width < 2 || board.height < 2) {
    errors.push('棋盘宽高都不能小于 2');
  }

  // 2. 棋子基础属性
  const seenIds = new Set<string>();
  for (const piece of pieces) {
    if (!piece.id || piece.id.trim() === '') {
      errors.push('存在 id 为空的棋子');
    } else if (seenIds.has(piece.id)) {
      errors.push(`棋子 id 重复：${piece.id}`);
    } else {
      seenIds.add(piece.id);
    }
    // width / height 是否合法
    if (!isPositiveInt(piece.width) || !isPositiveInt(piece.height)) {
      errors.push(`棋子 ${piece.id} 的宽高必须是正整数`);
    }
    if (!isNonNegativeInt(piece.x) || !isNonNegativeInt(piece.y)) {
      errors.push(`棋子 ${piece.id} 的坐标必须是非负整数`);
    }
    // 棋子是否越界
    if (isPositiveInt(board.width) && isPositiveInt(board.height)) {
      if (!rectInBounds(board, rectOfPiece(piece))) {
        errors.push(`棋子 ${piece.id} 超出棋盘边界`);
      }
    }
  }

  // 3. 棋子是否重叠
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      if (rectsOverlap(rectOfPiece(pieces[i]), rectOfPiece(pieces[j]))) {
        errors.push(`棋子 ${pieces[i].id} 与 ${pieces[j].id} 重叠`);
      }
    }
  }

  // 4. 封锁格是否合法
  if (board.blocked) {
    for (const cell of board.blocked) {
      if (!isNonNegativeInt(cell.x) || !isNonNegativeInt(cell.y)) {
        errors.push('封锁格坐标必须是非负整数');
      } else if (cell.x >= board.width || cell.y >= board.height) {
        errors.push(`封锁格 (${cell.x},${cell.y}) 超出棋盘边界`);
      }
    }
  }

  // 5. exit 是否位于合法位置
  if (board.exit) {
    if (!isPositiveInt(board.exit.width) || !isPositiveInt(board.exit.height)) {
      errors.push('出口宽高必须是正整数');
    } else if (!rectInBounds(board, board.exit)) {
      errors.push('出口超出棋盘边界');
    }
  }

  // 6. goal 定义是否有效
  if (!goal || !goal.pieceId) {
    errors.push('未定义目标棋子');
  } else if (!pieces.some((p) => p.id === goal.pieceId)) {
    errors.push(`目标棋子不存在：${goal.pieceId}`);
  }
  if (goal) {
    if (goal.type === 'reach-exit' && !board.exit) {
      errors.push('目标类型为“到达出口”，但棋盘未定义出口');
    }
    if (goal.type === 'occupy-area') {
      if (!goal.area) {
        errors.push('目标类型为“占据目标区域”，但未定义目标区域');
      } else if (!rectInBounds(board, goal.area)) {
        errors.push('目标区域超出棋盘边界');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
