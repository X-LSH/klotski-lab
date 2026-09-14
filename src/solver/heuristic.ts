/**
 * 启发式函数（heuristic）：目标棋子的“矩形间距”估计。
 *
 * 定义：目标棋子矩形 P 与目标区域（出口或指定区域）E 在两个坐标轴上的
 * 区间间隙之和：
 *   dx = 两矩形在 x 轴上还需靠近的最小格数（已重叠则为 0）
 *   dy = 同理
 *   h  = dx + dy
 *
 * 为什么不高估（admissible）：
 * - 每次合法移动只能让棋子在某一个轴上移动 1 格；
 * - 要达成目标，x 轴间隙至少要缩小 dx 次、y 轴间隙至少要缩小 dy 次，
 *   且这两类移动无法合并到同一步中；
 * - 其他棋子的阻挡、棋盘边界只会增加实际步数，不会减少。
 * 因此 h 永远不会超过真实剩余步数。
 *
 * 一致性（consistent）：任意一步移动最多让某个轴的间隙缩小 1，
 * 所以 h(n) ≤ 1 + h(n') 恒成立，满足一致性，A* 无需重复展开。
 */
import type { GameState, PuzzleDefinition, Rect } from '../types';
import { rectOfPiece } from '../core/piece';
import { findPiece } from '../core/state';

/** 一维区间 [a1,a2] 与 [b1,b2] 的间隙（重叠时为 0） */
function intervalGap(a1: number, a2: number, b1: number, b2: number): number {
  if (a2 < b1) return b1 - a2;
  if (b2 < a1) return a1 - b2;
  return 0;
}

/** 矩形间距（两个轴的区间间隙之和） */
export function rectGap(a: Rect, b: Rect): number {
  const dx = intervalGap(a.x, a.x + a.width - 1, b.x, b.x + b.width - 1);
  const dy = intervalGap(a.y, a.y + a.height - 1, b.y, b.y + b.height - 1);
  return dx + dy;
}

/** 计算状态在指定谜题下的启发值；目标棋子缺失时返回 0（退化为 Dijkstra） */
export function heuristic(state: GameState, puzzle: PuzzleDefinition): number {
  const piece = findPiece(state, puzzle.goal.pieceId);
  if (!piece) return 0;
  const target = puzzle.goal.type === 'reach-exit' ? puzzle.board.exit : puzzle.goal.area;
  if (!target) return 0;
  return rectGap(rectOfPiece(piece), target);
}
