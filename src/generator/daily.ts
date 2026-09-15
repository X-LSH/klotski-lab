/**
 * 每日挑战：根据日期生成稳定种子，同一天所有用户得到同一个谜题。
 * 完全本地计算，不需要后端；计算方式必须确定性。
 *
 * 生成方式（逆向 BFS 深度法，见 generatePuzzleAtDepth）：
 * - 最优解深度精确等于 DAILY_DEPTH，难度可控且每天都有保证；
 * - 必然未解（不会再出现「打开即已解开」）；
 * - 必然可解；同一天全网同一题。
 *
 * 历史教训：旧版用 60 步随机游走打乱，实测 97% 的种子打乱后目标棋子
 * 仍覆盖出口 —— 打开即弹胜利结算，且重置也无法脱离。
 */
import { generatePuzzleAtDepth } from './generator';
import type { PuzzleDefinition } from '../types';

/** 日期（本地时区）→ 稳定种子：YYYYMMDD 数字 */
export function dailySeed(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const day = date.getDate();
  return y * 10000 + m * 100 + day;
}

/**
 * 每日挑战的目标最优解深度。
 * 经典横刀立马是 116 步（对每日挑战太重），36 步约几分钟到十几分钟可完成。
 */
export const DAILY_DEPTH = 36;

/** 获取指定日期的每日挑战谜题 */
export function getDailyPuzzle(date: Date): PuzzleDefinition {
  const seed = dailySeed(date);
  const puzzle = generatePuzzleAtDepth({ seed, depth: DAILY_DEPTH });
  return {
    ...puzzle,
    name: `每日挑战 ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
  };
}
