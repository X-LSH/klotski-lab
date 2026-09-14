import { describe, expect, it } from 'vitest';
import { validatePuzzle } from '../../src/core/validator';
import { clonePuzzle, parsePuzzle, serializePuzzle } from '../../src/core/puzzle';
import { CLASSIC_PUZZLE } from '../../src/core/presets';
import { tinyPuzzle } from './helpers';

describe('编辑器谜题校验', () => {
  it('合法谜题通过校验', () => {
    expect(validatePuzzle(clonePuzzle(CLASSIC_PUZZLE)).valid).toBe(true);
  });

  it('重叠被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.pieces.push({ id: 'c', x: 0, y: 0, width: 1, height: 1, type: '1x1' });
    const r = validatePuzzle(p);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('重叠'))).toBe(true);
  });

  it('越界被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.pieces[0] = { ...p.pieces[0], x: 3 };
    expect(validatePuzzle(p).valid).toBe(false);
  });

  it('重复 id 被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.pieces.push({ ...p.pieces[1], id: 't' });
    const r = validatePuzzle(p);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('id 重复'))).toBe(true);
  });

  it('无目标被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.goal.pieceId = '';
    expect(validatePuzzle(p).valid).toBe(false);
  });

  it('非法出口被检出', () => {
    const p = clonePuzzle(tinyPuzzle());
    p.board.exit = { x: 0, y: 0, width: 0, height: 1 };
    expect(validatePuzzle(p).valid).toBe(false);
  });

  it('导出后重新导入保持一致（round-trip）', () => {
    const json = serializePuzzle(CLASSIC_PUZZLE);
    const result = parsePuzzle(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.puzzle).toEqual(CLASSIC_PUZZLE);
      expect(validatePuzzle(result.puzzle).valid).toBe(true);
    }
  });

  it('非法 JSON 文本被拒绝', () => {
    const result = parsePuzzle('{ 这不是 JSON');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('JSON');
  });

  it('结构不符的 JSON 被拒绝', () => {
    expect(parsePuzzle('{"foo": 1}').ok).toBe(false);
    expect(parsePuzzle('[]').ok).toBe(false);
    expect(parsePuzzle('null').ok).toBe(false);
  });
});
