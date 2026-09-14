/**
 * 移动（Move）相关工具：方向增量、反向、合法性前置检查。
 */
import type { Direction, Move } from '../types';

/** 四个方向的单位位移 */
export const DIRECTION_DELTAS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/** 全部方向（固定顺序，保证搜索 / 测试的确定性） */
export const ALL_DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];

/** 反方向 */
export function oppositeDirection(direction: Direction): Direction {
  switch (direction) {
    case 'up':
      return 'down';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

/** 方向的中文名称（用于界面展示） */
export const DIRECTION_LABELS: Record<Direction, string> = {
  up: '上',
  down: '下',
  left: '左',
  right: '右',
};

/** 把 Move 格式化为中文描述，例如 “向 下 移动 1 格” */
export function describeMove(move: Move): string {
  return `向${DIRECTION_LABELS[move.direction]}移动 ${move.steps} 格`;
}
