// @vitest-environment jsdom
// useGame：Undo / Redo / Reset 行为测试
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useGame } from '../../src/hooks/useGame';
import { findPiece } from '../../src/core/state';
import { tinyPuzzle } from '../core/helpers';

describe('useGame（撤销 / 重做 / 重置）', () => {
  it('合法移动更新状态，非法移动返回 false 且状态不变', () => {
    const { result } = renderHook(() => useGame(tinyPuzzle()));
    act(() => {
      expect(result.current.doMove({ pieceId: 't', direction: 'down', steps: 1 })).toBe(true);
    });
    expect(findPiece(result.current.state, 't')).toMatchObject({ x: 0, y: 1 });
    act(() => {
      expect(result.current.doMove({ pieceId: 't', direction: 'up', steps: 5 })).toBe(false);
    });
    expect(findPiece(result.current.state, 't')).toMatchObject({ x: 0, y: 1 });
  });

  it('Undo 恢复上一步', () => {
    const { result } = renderHook(() => useGame(tinyPuzzle()));
    act(() => {
      result.current.doMove({ pieceId: 't', direction: 'down', steps: 1 });
    });
    expect(result.current.canUndo).toBe(true);
    act(() => result.current.undo());
    expect(findPiece(result.current.state, 't')).toMatchObject({ x: 0, y: 0 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('Redo 重新执行被撤销的移动', () => {
    const { result } = renderHook(() => useGame(tinyPuzzle()));
    act(() => {
      result.current.doMove({ pieceId: 't', direction: 'down', steps: 1 });
    });
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(findPiece(result.current.state, 't')).toMatchObject({ x: 0, y: 1 });
    expect(result.current.canRedo).toBe(false);
  });

  it('新移动执行后清空 Redo 栈', () => {
    const { result } = renderHook(() => useGame(tinyPuzzle()));
    act(() => {
      result.current.doMove({ pieceId: 't', direction: 'down', steps: 1 });
    });
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);
    act(() => {
      result.current.doMove({ pieceId: 'b', direction: 'down', steps: 1 });
    });
    expect(result.current.canRedo).toBe(false);
  });

  it('Reset 恢复初始状态并清空历史', () => {
    const { result } = renderHook(() => useGame(tinyPuzzle()));
    act(() => {
      result.current.doMove({ pieceId: 't', direction: 'down', steps: 1 });
      result.current.doMove({ pieceId: 'b', direction: 'right', steps: 1 });
    });
    expect(result.current.moveCount).toBe(2);
    act(() => result.current.reset());
    expect(result.current.moveCount).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(findPiece(result.current.state, 't')).toMatchObject({ x: 0, y: 0 });
    expect(findPiece(result.current.state, 'b')).toMatchObject({ x: 1, y: 0 });
  });

  it('走到目标后 solved 为 true', () => {
    const { result } = renderHook(() => useGame(tinyPuzzle()));
    act(() => {
      result.current.doMove({ pieceId: 't', direction: 'down', steps: 2 });
      result.current.doMove({ pieceId: 't', direction: 'right', steps: 2 });
    });
    expect(result.current.solved).toBe(true);
  });
});
