/**
 * 求解服务默认超时策略。
 *
 * 背景（见 src/solver/solver-service.ts 顶部注释）：
 * 求解器的 maxStates 上限对 IDA* 无效（它统计的 visitedKeys 上界就是谜题状态空间），
 * 因此时间兜底是防止 UI 无限等待的唯一有效手段。这里看守该策略不被误删或改坏。
 */
import { describe, it, expect } from 'vitest';
import { applyDefaultTimeout, DEFAULT_TIMEOUT_MS } from '../../src/solver/solver-service';

describe('求解服务：默认超时策略', () => {
  it('默认超时是有限正数（不能退化为无限制）', () => {
    expect(Number.isFinite(DEFAULT_TIMEOUT_MS)).toBe(true);
    expect(DEFAULT_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it('未指定 timeoutMs 时补上默认值', () => {
    expect(applyDefaultTimeout({}).timeoutMs).toBe(DEFAULT_TIMEOUT_MS);
    expect(applyDefaultTimeout({ maxStates: 1000 }).timeoutMs).toBe(DEFAULT_TIMEOUT_MS);
  });

  it('显式指定的 timeoutMs 优先于默认值', () => {
    expect(applyDefaultTimeout({ timeoutMs: 120_000 }).timeoutMs).toBe(120_000);
    expect(applyDefaultTimeout({ timeoutMs: 0 }).timeoutMs).toBe(0);
  });

  it('不修改传入的 options 对象（保持不可变语义）', () => {
    const input = { maxStates: 500 };
    const output = applyDefaultTimeout(input);
    expect(input).not.toHaveProperty('timeoutMs');
    expect(output).not.toBe(input);
    expect(output.maxStates).toBe(500);
  });

  it('保留其余回调与配置项', () => {
    const onProgress = () => {};
    const output = applyDefaultTimeout({ onProgress, maxTreeEvents: 50 });
    expect(output.onProgress).toBe(onProgress);
    expect(output.maxTreeEvents).toBe(50);
    expect(output.timeoutMs).toBe(DEFAULT_TIMEOUT_MS);
  });
});
