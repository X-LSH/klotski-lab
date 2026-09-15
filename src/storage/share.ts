/**
 * URL 分享：PuzzleDefinition → serialize → encode → URL 参数（无后端）。
 * - 带 version 字段（v1 前缀），未来格式变更可向后兼容；
 * - 解码必须通过结构检查与 validatePuzzle，非法参数不进入应用状态。
 */
import type { PuzzleDefinition } from '../types';
import { parsePuzzle, serializePuzzle } from '../core/puzzle';
import { validatePuzzle } from '../core/validator';

const SHARE_PARAM = 'p';
const SHARE_VERSION = 'v1';

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export type ShareEncodeResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

/** 编码谜题为分享码（v1.base64url(JSON)） */
export function encodePuzzle(puzzle: PuzzleDefinition): ShareEncodeResult {
  if (!validatePuzzle(puzzle).valid) {
    return { ok: false, error: '谜题不合法，无法分享' };
  }
  try {
    return { ok: true, code: `${SHARE_VERSION}.${toBase64Url(serializePuzzle(puzzle))}` };
  } catch {
    return { ok: false, error: '编码失败' };
  }
}

export type ShareDecodeResult =
  | { ok: true; puzzle: PuzzleDefinition }
  | { ok: false; error: string };

/** 解码分享码；非法输入一律拒绝 */
export function decodePuzzle(code: string): ShareDecodeResult {
  if (typeof code !== 'string' || !code.startsWith(`${SHARE_VERSION}.`)) {
    return { ok: false, error: '分享码版本不兼容或格式错误' };
  }
  try {
    const parsed = parsePuzzle(fromBase64Url(code.slice(SHARE_VERSION.length + 1)));
    if (!parsed.ok) return { ok: false, error: parsed.error };
    const check = validatePuzzle(parsed.puzzle);
    if (!check.valid) return { ok: false, error: `分享的谜题不合法：${check.errors[0]}` };
    return { ok: true, puzzle: parsed.puzzle };
  } catch {
    return { ok: false, error: '分享码无法解码' };
  }
}

/** 构造分享链接（HashRouter：参数放在 hash 内的查询串中） */
export function buildShareUrl(puzzle: PuzzleDefinition): string {
  const encoded = encodePuzzle(puzzle);
  if (!encoded.ok) throw new Error(encoded.error);
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/play?${SHARE_PARAM}=${encoded.code}`;
}

/** 从当前地址的 hash 查询串中解析分享谜题（无分享码时返回 null） */
export function readPuzzleFromLocation(hash: string): PuzzleDefinition | null {
  const match = new RegExp(`[?&]${SHARE_PARAM}=([^&]+)`).exec(hash);
  if (!match) return null;
  const decoded = decodePuzzle(match[1]);
  return decoded.ok ? decoded.puzzle : null;
}

/** 复制文本到剪贴板；Clipboard API 不可用时降级到 execCommand */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 落入降级方案 */
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
