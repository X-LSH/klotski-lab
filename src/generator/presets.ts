/**
 * 内置关卡定义。所有关卡都通过通用 PuzzleDefinition 描述。
 */
import type { PuzzleDefinition } from '../types';
import { CLASSIC_PUZZLE } from '../core/presets';
import type { DifficultyTier } from './difficulty';

export interface LevelDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyTier;
  puzzle: PuzzleDefinition;
  tags: string[];
  /** 预先实测的最优步数（未知时留空，由 UI 异步计算） */
  optimalDepth?: number;
}

/** 半途局面：横刀立马的推进版（困难） */
const HALFWAY_PUZZLE: PuzzleDefinition = {
  version: 1,
  name: '兵临城下',
  board: { width: 4, height: 5, exit: { x: 1, y: 4, width: 2, height: 1 } },
  pieces: [
    { id: 'caocao', x: 1, y: 1, width: 2, height: 2, type: '2x2', label: '曹操' },
    { id: 'guanyu', x: 1, y: 3, width: 2, height: 1, type: '2x1', label: '关羽' },
    { id: 'zhangfei', x: 0, y: 0, width: 1, height: 2, type: '1x2', label: '张飞' },
    { id: 'zhaoyun', x: 3, y: 0, width: 1, height: 2, type: '1x2', label: '赵云' },
    { id: 'machao', x: 0, y: 2, width: 1, height: 2, type: '1x2', label: '马超' },
    { id: 'huangzhong', x: 3, y: 2, width: 1, height: 2, type: '1x2', label: '黄忠' },
    { id: 'bing1', x: 1, y: 0, width: 1, height: 1, type: '1x1', label: '兵' },
    { id: 'bing2', x: 2, y: 0, width: 1, height: 1, type: '1x1', label: '兵' },
    { id: 'bing3', x: 0, y: 4, width: 1, height: 1, type: '1x1', label: '兵' },
    { id: 'bing4', x: 3, y: 4, width: 1, height: 1, type: '1x1', label: '兵' },
  ],
  goal: { pieceId: 'caocao', type: 'reach-exit' },
};

export const LEVELS: LevelDefinition[] = [
  {
    id: 'rookie',
    name: '初出茅庐',
    description: '3×3 小棋盘，熟悉基本移动。',
    difficulty: 'easy',
    tags: ['入门', '小棋盘'],
    puzzle: {
      version: 1,
      name: '初出茅庐',
      board: { width: 3, height: 3, exit: { x: 2, y: 2, width: 1, height: 1 } },
      pieces: [
        { id: 't', x: 0, y: 0, width: 1, height: 1, type: '1x1', label: '主角' },
        { id: 'a', x: 1, y: 0, width: 2, height: 1, type: '2x1', label: '横木' },
        { id: 'b', x: 0, y: 1, width: 1, height: 2, type: '1x2', label: '竖木' },
        { id: 'c', x: 2, y: 1, width: 1, height: 1, type: '1x1', label: '石块' },
      ],
      goal: { pieceId: 't', type: 'reach-exit' },
    },
  },
  {
    id: 'warmup',
    name: '小试牛刀',
    description: '4×4 棋盘上的 2×2 主将突围。',
    difficulty: 'normal',
    tags: ['入门', '中棋盘'],
    puzzle: {
      version: 1,
      name: '小试牛刀',
      board: { width: 4, height: 4, exit: { x: 2, y: 2, width: 2, height: 2 } },
      pieces: [
        { id: 'big', x: 0, y: 0, width: 2, height: 2, type: '2x2', label: '主将' },
        { id: 's1', x: 3, y: 0, width: 1, height: 2, type: '1x2', label: '卫兵' },
        { id: 's2', x: 0, y: 3, width: 2, height: 1, type: '2x1', label: '路障' },
      ],
      goal: { pieceId: 'big', type: 'reach-exit' },
    },
  },
  {
    id: 'halfway',
    name: '兵临城下',
    description: '横刀立马的半途局面，曹操已推进一格。',
    difficulty: 'hard',
    tags: ['经典变体', '华容道'],
    puzzle: HALFWAY_PUZZLE,
  },
  {
    id: 'classic',
    name: '横刀立马',
    description: '最经典的华容道布局，最优解 116 步。',
    difficulty: 'expert',
    tags: ['经典', '华容道'],
    puzzle: CLASSIC_PUZZLE,
    optimalDepth: 116,
  },
];
