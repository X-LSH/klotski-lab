/**
 * 每日挑战：根据日期生成稳定种子，同一天所有用户得到同一个谜题。
 * 完全本地计算，不需要后端；计算方式必须确定性。
 */
import { generatePuzzle } from './generator';
import type { PuzzleDefinition } from '../types';

/** 日期（本地时区）→ 稳定种子：YYYYMMDD 数字 */
export function dailySeed(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}

/** 每日挑战的随机游走步数（中等深度，保证可解且不太难） */
export const DAILY_STEPS = 60;

/** 获取指定日期的每日挑战谜题 */
export function getDailyPuzzle(date: Date): PuzzleDefinition {
  const seed = dailySeed(date);
  const puzzle = generatePuzzle({ seed, steps: DAILY_STEPS });
  return {
    ...puzzle,
    name: `每日挑战 ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
  };
}
