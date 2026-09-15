/**
 * 求解结束原因文案。
 *
 * 看守要点：**超时 ≠ 无解**。早期版本把 timeout 与 state-limit 一并显示为
 * 「当前局面无解或达到搜索上限」，对用户构成误导，这里防止回退。
 */
import { describe, it, expect } from 'vitest';
import { END_REASON_LABELS, UNRESOLVED_HINTS, unresolvedHint } from '../../src/components/observatory/labels';

describe('求解结束原因文案', () => {
  it('六种结束原因都有短标签', () => {
    expect(Object.keys(END_REASON_LABELS)).toHaveLength(6);
    expect(END_REASON_LABELS.timeout).toBe('超时');
    expect(END_REASON_LABELS.unsolvable).toBe('无解');
  });

  it('超时与无解的解释文案必须不同', () => {
    expect(UNRESOLVED_HINTS.timeout).not.toBe(UNRESOLVED_HINTS.unsolvable);
    expect(UNRESOLVED_HINTS.timeout).toContain('超时');
    expect(UNRESOLVED_HINTS.unsolvable).toContain('无解');
  });

  it('超时文案不得断言谜题无解', () => {
    expect(UNRESOLVED_HINTS.timeout).not.toContain('无解');
    expect(UNRESOLVED_HINTS['state-limit']).not.toContain('无解');
  });

  it('已解出的原因不产生未解出说明', () => {
    expect(unresolvedHint('solved')).toBe('');
    expect(unresolvedHint('already-solved')).toBe('');
  });

  it('未解出的原因都给出非空说明', () => {
    for (const reason of ['unsolvable', 'state-limit', 'timeout', 'cancelled'] as const) {
      expect(unresolvedHint(reason).length).toBeGreaterThan(0);
    }
  });
});
