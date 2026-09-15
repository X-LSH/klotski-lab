/**
 * 谜题生成器。
 *
 * 策略（保证可解）：
 *   从一个已知可解的目标状态开始（曹操已到达出口的合法布局）
 *   ↓ 用种子随机数执行 N 步随机合法移动
 *   ↓ 打乱后的状态作为谜题初始布局
 * 由于移动完全可逆，生成的谜题必然有解；
 * 绝不采用“随机摆一个布局再假设它有解”的做法。
 */
import type { PuzzleDefinition } from '../types';
import { createInitialState } from '../core/state';
import { createRng, randomWalk } from './shuffle';

/** 生成参数 */
export interface GenerateOptions {
  /** 随机种子：同一种子必须得到相同谜题 */
  seed: number;
  /** 随机游走步数（默认 60，上限 200，防止生成过深谜题） */
  steps?: number;
}

export const MAX_GENERATE_STEPS = 200;
export const DEFAULT_GENERATE_STEPS = 60;

/**
 * 已解布局模板：4×5 棋盘，曹操（2×2）已覆盖底部出口。
 * 其余棋子填满上方区域，全部位置合法无重叠。
 */
function solvedTemplate(): PuzzleDefinition {
  return {
    version: 1,
    name: '生成模板',
    board: { width: 4, height: 5, exit: { x: 1, y: 4, width: 2, height: 1 } },
    pieces: [
      { id: 'caocao', x: 1, y: 3, width: 2, height: 2, type: '2x2', label: '曹操' },
      { id: 'guanyu', x: 1, y: 2, width: 2, height: 1, type: '2x1', label: '关羽' },
      { id: 'zhangfei', x: 0, y: 0, width: 1, height: 2, type: '1x2', label: '张飞' },
      { id: 'zhaoyun', x: 3, y: 0, width: 1, height: 2, type: '1x2', label: '赵云' },
      { id: 'machao', x: 0, y: 2, width: 1, height: 2, type: '1x2', label: '马超' },
      { id: 'huangzhong', x: 3, y: 2, width: 1, height: 2, type: '1x2', label: '黄忠' },
      { id: 'bing1', x: 1, y: 0, width: 1, height: 1, type: '1x1', label: '兵' },
      { id: 'bing2', x: 2, y: 0, width: 1, height: 1, type: '1x1', label: '兵' },
      { id: 'bing3', x: 1, y: 1, width: 1, height: 1, type: '1x1', label: '兵' },
      { id: 'bing4', x: 2, y: 1, width: 1, height: 1, type: '1x1', label: '兵' },
    ],
    goal: { pieceId: 'caocao', type: 'reach-exit' },
  };
}

/** 生成谜题：同一种子必然得到相同结果 */
export function generatePuzzle(options: GenerateOptions): PuzzleDefinition {
  const steps = Math.min(Math.max(1, Math.floor(options.steps ?? DEFAULT_GENERATE_STEPS)), MAX_GENERATE_STEPS);
  const template = solvedTemplate();
  const rng = createRng(options.seed);
  const scrambled = randomWalk(template, createInitialState(template), steps, rng);
  return {
    ...template,
    name: `随机关卡 #${options.seed}`,
    pieces: scrambled.pieces.map((p) => ({ ...p })),
  };
}
