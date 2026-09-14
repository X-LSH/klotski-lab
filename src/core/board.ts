/**
 * 棋盘相关的基础判断。本模块不依赖 React / DOM。
 */
import type { BoardDef, Cell, Rect } from '../types';

/** 坐标是否在棋盘范围内 */
export function inBounds(board: BoardDef, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < board.width && y < board.height;
}

/** 指定格子是否被棋盘封锁 */
export function isBlocked(board: BoardDef, x: number, y: number): boolean {
  if (!board.blocked) return false;
  return board.blocked.some((c: Cell) => c.x === x && c.y === y);
}

/** 矩形占据的全部格子 */
export function cellsOfRect(rect: Rect): Cell[] {
  const cells: Cell[] = [];
  for (let dy = 0; dy < rect.height; dy++) {
    for (let dx = 0; dx < rect.width; dx++) {
      cells.push({ x: rect.x + dx, y: rect.y + dy });
    }
  }
  return cells;
}

/** 矩形是否完整位于棋盘内 */
export function rectInBounds(board: BoardDef, rect: Rect): boolean {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.width <= board.width &&
    rect.y + rect.height <= board.height
  );
}
