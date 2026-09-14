/**
 * 棋子相关的纯几何工具。规则完全基于几何尺寸，不针对任何经典角色。
 */
import type { Cell, Piece, Rect } from '../types';

/** 棋子当前占据的全部格子 */
export function cellsOfPiece(piece: Piece): Cell[] {
  const cells: Cell[] = [];
  for (let dy = 0; dy < piece.height; dy++) {
    for (let dx = 0; dx < piece.width; dx++) {
      cells.push({ x: piece.x + dx, y: piece.y + dy });
    }
  }
  return cells;
}

/** 棋子的矩形表示 */
export function rectOfPiece(piece: Piece): Rect {
  return { x: piece.x, y: piece.y, width: piece.width, height: piece.height };
}

/** 两个矩形是否重叠 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** 矩形 inner 是否完整覆盖矩形 outer（inner ⊇ outer 的全部格子） */
export function rectCovers(inner: Rect, outer: Rect): boolean {
  return (
    inner.x <= outer.x &&
    inner.y <= outer.y &&
    inner.x + inner.width >= outer.x + outer.width &&
    inner.y + inner.height >= outer.y + outer.height
  );
}

/** 根据棋子宽高推断类型 */
export function inferPieceType(width: number, height: number): Piece['type'] {
  if (width === 1 && height === 1) return '1x1';
  if (width === 1 && height === 2) return '1x2';
  if (width === 2 && height === 1) return '2x1';
  if (width === 2 && height === 2) return '2x2';
  return 'custom';
}
