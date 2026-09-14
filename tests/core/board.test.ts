import { describe, expect, it } from 'vitest';
import { cellsOfRect, inBounds, isBlocked, rectInBounds } from '../../src/core/board';
import type { BoardDef } from '../../src/types';

const board: BoardDef = { width: 4, height: 5, blocked: [{ x: 0, y: 0 }] };

describe('棋盘基础判断', () => {
  it('inBounds 正确判断边界', () => {
    expect(inBounds(board, 0, 0)).toBe(true);
    expect(inBounds(board, 3, 4)).toBe(true);
    expect(inBounds(board, 4, 0)).toBe(false);
    expect(inBounds(board, 0, 5)).toBe(false);
    expect(inBounds(board, -1, 0)).toBe(false);
  });

  it('isBlocked 正确识别封锁格', () => {
    expect(isBlocked(board, 0, 0)).toBe(true);
    expect(isBlocked(board, 1, 0)).toBe(false);
  });

  it('cellsOfRect 展开矩形全部格子', () => {
    expect(cellsOfRect({ x: 1, y: 1, width: 2, height: 2 })).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
  });

  it('rectInBounds 判断矩形是否完整在棋盘内', () => {
    expect(rectInBounds(board, { x: 2, y: 3, width: 2, height: 2 })).toBe(true);
    expect(rectInBounds(board, { x: 3, y: 3, width: 2, height: 2 })).toBe(false);
    expect(rectInBounds(board, { x: 0, y: -1, width: 1, height: 1 })).toBe(false);
  });
});
