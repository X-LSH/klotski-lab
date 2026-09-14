import { describe, expect, it } from 'vitest';
import { validatePuzzle } from '../../src/core/validator';
import { clonePuzzle } from '../../src/core/puzzle';
import { CLASSIC_PUZZLE } from '../../src/core/presets';
import { tinyPuzzle } from './helpers';

describe('谜题校验器', () => {
  it('合法谜题通过校验', () => {
    const result = validatePuzzle(CLASSIC_PUZZLE);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('棋盘尺寸非法被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.board.width = 0;
    expect(validatePuzzle(p).valid).toBe(false);
    const p2 = clonePuzzle(tinyPuzzle());
    p2.board.height = 1;
    const r2 = validatePuzzle(p2);
    expect(r2.valid).toBe(false);
    expect(r2.errors.some((e) => e.includes('棋盘'))).toBe(true);
  });

  it('棋子越界被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.pieces[0].x = 5;
    const r = validatePuzzle(p);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('超出棋盘边界'))).toBe(true);
  });

  it('棋子重叠被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.pieces[1].x = 0;
    p.pieces[1].y = 0;
    const r = validatePuzzle(p);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('重叠'))).toBe(true);
  });

  it('棋子 id 重复被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.pieces[1].id = 't';
    const r = validatePuzzle(p);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('id 重复'))).toBe(true);
  });

  it('棋子宽高非法被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.pieces[0].width = 0;
    expect(validatePuzzle(p).valid).toBe(false);
  });

  it('出口非法被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.board.exit = { x: 2, y: 2, width: 5, height: 1 };
    const r = validatePuzzle(p);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('出口'))).toBe(true);
  });

  it('缺少目标棋子被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.goal.pieceId = 'nobody';
    const r = validatePuzzle(p);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('目标棋子不存在'))).toBe(true);
  });

  it('reach-exit 缺少出口 / occupy-area 缺少区域被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    delete p.board.exit;
    expect(validatePuzzle(p).valid).toBe(false);

    const p2 = clonePuzzle(tinyPuzzle());
    p2.goal = { pieceId: 't', type: 'occupy-area' };
    const r2 = validatePuzzle(p2);
    expect(r2.valid).toBe(false);
    expect(r2.errors.some((e) => e.includes('目标区域'))).toBe(true);
  });

  it('occupy-area 目标区域越界被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.goal = { pieceId: 't', type: 'occupy-area', area: { x: 2, y: 2, width: 3, height: 1 } };
    expect(validatePuzzle(p).valid).toBe(false);
  });
});
