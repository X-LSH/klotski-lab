// @vitest-environment jsdom
// localStorage 持久化测试
import { beforeEach, describe, expect, it } from 'vitest';
import {
  loadMyPuzzles,
  saveMyPuzzles,
  loadProgress,
  saveProgress,
  clearProgress,
  loadCompletions,
  recordCompletion,
  loadDailyRecords,
  recordDailyResult,
  loadSettings,
  saveSettings,
} from '../../src/storage/local-storage';
import type { SavedPuzzle, SavedProgress } from '../../src/storage/local-storage';
import { CLASSIC_PUZZLE } from '../../src/core/presets';

beforeEach(() => {
  window.localStorage.clear();
});

describe('我的谜题存储', () => {
  it('save / load 往返一致', () => {
    const list: SavedPuzzle[] = [
      { id: 'a1', name: '测试谜题', savedAt: 1, puzzle: CLASSIC_PUZZLE },
    ];
    expect(saveMyPuzzles(list)).toBe(true);
    expect(loadMyPuzzles()).toEqual(list);
  });

  it('损坏数据回退为默认值', () => {
    window.localStorage.setItem('klotski-lab:v1:my-puzzles', '{ 损坏');
    expect(loadMyPuzzles()).toEqual([]);
  });
});

describe('游戏进度存储', () => {
  it('save / load / clear 往返一致', () => {
    const progress: SavedProgress = {
      puzzle: CLASSIC_PUZZLE,
      positions: { caocao: { x: 1, y: 2 } },
      history: [{ pieceId: 'bing1', direction: 'right', steps: 1 }],
      moveCount: 1,
      savedAt: 42,
    };
    expect(saveProgress(progress)).toBe(true);
    expect(loadProgress()).toEqual(progress);
    clearProgress();
    expect(loadProgress()).toBeNull();
  });
});

describe('完成记录与每日结果', () => {
  it('完成记录保留最佳步数与最佳用时', () => {
    recordCompletion({ levelId: 'classic', bestMoves: 130, bestTimeMs: 5000, completedAt: 1 });
    recordCompletion({ levelId: 'classic', bestMoves: 120, bestTimeMs: 9000, completedAt: 2 });
    const all = loadCompletions();
    expect(all['classic']).toMatchObject({ bestMoves: 120, bestTimeMs: 5000 });
  });

  it('每日结果跨次保存且取最优', () => {
    recordDailyResult({ date: '2026-09-14', completed: true, bestMoves: 80, bestTimeMs: 3000 });
    recordDailyResult({ date: '2026-09-14', completed: false, bestMoves: 76, bestTimeMs: 4000 });
    const all = loadDailyRecords();
    expect(all['2026-09-14']).toMatchObject({ completed: true, bestMoves: 76, bestTimeMs: 3000 });
  });
});

describe('用户设置', () => {
  it('save / load 往返一致', () => {
    expect(loadSettings()).toEqual({});
    saveSettings({ defaultAlgorithm: 'astar' });
    expect(loadSettings()).toEqual({ defaultAlgorithm: 'astar' });
  });
});
