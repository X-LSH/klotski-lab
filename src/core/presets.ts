/**
 * 内置预设谜题。只依赖 core 数据类型，不依赖 UI。
 */
import type { PuzzleDefinition } from '../types';

/**
 * 经典华容道「横刀立马」：4 × 5 棋盘。
 * 布局（x 向右，y 向下）：
 *   y0: 张飞 曹操 曹操 赵云
 *   y1: 张飞 曹操 曹操 赵云
 *   y2: 马超 关羽 关羽 黄忠
 *   y3: 马超 兵   兵   黄忠
 *   y4: 兵  [出口]  兵
 * 目标：曹操（2×2）完整抵达底部出口。
 */
export const CLASSIC_PUZZLE: PuzzleDefinition = {
  version: 1,
  name: '横刀立马（经典）',
  board: {
    width: 4,
    height: 5,
    exit: { x: 1, y: 4, width: 2, height: 1 },
  },
  pieces: [
    { id: 'caocao', x: 1, y: 0, width: 2, height: 2, type: '2x2', label: '曹操' },
    { id: 'guanyu', x: 1, y: 2, width: 2, height: 1, type: '2x1', label: '关羽' },
    { id: 'zhangfei', x: 0, y: 0, width: 1, height: 2, type: '1x2', label: '张飞' },
    { id: 'zhaoyun', x: 3, y: 0, width: 1, height: 2, type: '1x2', label: '赵云' },
    { id: 'machao', x: 0, y: 2, width: 1, height: 2, type: '1x2', label: '马超' },
    { id: 'huangzhong', x: 3, y: 2, width: 1, height: 2, type: '1x2', label: '黄忠' },
    { id: 'bing1', x: 1, y: 3, width: 1, height: 1, type: '1x1', label: '兵' },
    { id: 'bing2', x: 2, y: 3, width: 1, height: 1, type: '1x1', label: '兵' },
    { id: 'bing3', x: 0, y: 4, width: 1, height: 1, type: '1x1', label: '兵' },
    { id: 'bing4', x: 3, y: 4, width: 1, height: 1, type: '1x1', label: '兵' },
  ],
  goal: { pieceId: 'caocao', type: 'reach-exit' },
};

/** 全部内置预设（后续关卡系统会在此基础上扩展） */
export const PRESET_PUZZLES: readonly PuzzleDefinition[] = [CLASSIC_PUZZLE];
