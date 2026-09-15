// @vitest-environment jsdom
// URL 分享编解码测试
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  encodePuzzle,
  decodePuzzle,
  buildShareUrl,
  readPuzzleFromLocation,
  copyToClipboard,
} from '../../src/storage/share';
import { CLASSIC_PUZZLE } from '../../src/core/presets';

describe('URL 分享', () => {
  it('编码 / 解码往返一致，且包含版本字段', () => {
    const encoded = encodePuzzle(CLASSIC_PUZZLE);
    expect(encoded.ok).toBe(true);
    if (encoded.ok) {
      expect(encoded.code.startsWith('v1.')).toBe(true);
      const decoded = decodePuzzle(encoded.code);
      expect(decoded.ok).toBe(true);
      if (decoded.ok) expect(decoded.puzzle).toEqual(CLASSIC_PUZZLE);
    }
  });

  it('非法分享码被拒绝（不进入应用状态）', () => {
    expect(decodePuzzle('v2.abc').ok).toBe(false);
    expect(decodePuzzle('v1.!!!不是base64').ok).toBe(false);
    expect(decodePuzzle('v1.' + btoa('{"foo":1}')).ok).toBe(false);
    expect(decodePuzzle('').ok).toBe(false);
  });

  it('分享码中的谜题若不合法则拒绝', () => {
    // btoa 不支持非 ASCII，这里用英文构造一个结构符合但内容非法的谜题
    const bad = JSON.stringify({
      version: 1,
      name: 'bad-puzzle',
      board: { width: 4, height: 5, exit: { x: 1, y: 4, width: 2, height: 1 } },
      pieces: [
        { id: 'a', x: 0, y: 0, width: 1, height: 1, type: '1x1' },
        { id: 'a', x: 0, y: 0, width: 1, height: 1, type: '1x1' }, // 重叠 + id 重复
      ],
      goal: { pieceId: 'a', type: 'reach-exit' },
    });
    expect(decodePuzzle(`v1.${btoa(bad)}`).ok).toBe(false);
    expect(encodePuzzle(CLASSIC_PUZZLE).ok).toBe(true);
  });

  it('buildShareUrl 生成带 hash 查询串的链接并可通过 readPuzzleFromLocation 还原', () => {
    const url = buildShareUrl(CLASSIC_PUZZLE);
    expect(url).toContain('#/play?p=v1.');
    const hash = url.slice(url.indexOf('#'));
    const restored = readPuzzleFromLocation(hash);
    expect(restored).toEqual(CLASSIC_PUZZLE);
  });

  it('无分享码时 readPuzzleFromLocation 返回 null', () => {
    expect(readPuzzleFromLocation('#/play')).toBeNull();
    expect(readPuzzleFromLocation('#/play?p=bad-code')).toBeNull();
  });
});

describe('剪贴板', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Clipboard API 可用时直接写入', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });
    await expect(copyToClipboard('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('Clipboard API 不可用时降级到 execCommand', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      configurable: true,
    });
    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand as unknown as typeof document.execCommand;
    await expect(copyToClipboard('hello')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });
});
