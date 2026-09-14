/**
 * 求解器状态去重的唯一入口。
 *
 * 基于 core 的确定性 stateKey 思路扩展：形状相同且都不是目标棋子的棋子
 * 在物理上完全等价（例如四个“兵”互换位置不改变谜题本质），
 * 因此在去重时将同尺寸的非目标棋子坐标排序归一，
 * 避免等价排列把搜索空间放大数百倍。
 *
 * 正确性说明：等价状态的未来演化完全同构，BFS / A* 按等价类去重
 * 不会影响最优解深度；存储的状态本体仍是真实状态，回溯出的路径真实合法。
 */
import type { GameState, PuzzleDefinition } from '../types';

export { stateKey } from '../core/state';

/** 求解器专用的规范化状态键（目标棋子单独标识，其余按尺寸分组排序） */
export function canonicalStateKey(state: GameState, puzzle: PuzzleDefinition): string {
  const goalId = puzzle.goal.pieceId;
  const goal = state.pieces.find((p) => p.id === goalId);
  const groups = new Map<string, string[]>();
  for (const piece of state.pieces) {
    if (piece.id === goalId) continue;
    const groupKey = `${piece.width}x${piece.height}`;
    const coords = groups.get(groupKey);
    const coord = `${piece.x},${piece.y}`;
    if (coords) {
      coords.push(coord);
    } else {
      groups.set(groupKey, [coord]);
    }
  }
  const groupPart = [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([groupKey, coords]) => `${groupKey}[${coords.sort().join(';')}]`)
    .join('|');
  return `G:${goal ? `${goal.x},${goal.y}` : '无'}|${groupPart}`;
}
