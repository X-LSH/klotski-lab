/**
 * 难度评估（工程化评分，非“绝对科学”指标）。
 *
 * 评分维度：
 * - 最优解深度（BFS 实测）
 * - 搜索空间规模（BFS 访问状态数，作为可达状态规模的近似）
 * - 平均分支因子（生成后继数 / 展开节点数）
 *
 * score 越高越难；tier 仅作关卡分档参考。
 */
import { solveBfs } from '../solver/bfs';
import type { PuzzleDefinition } from '../types';

export type DifficultyTier = 'easy' | 'normal' | 'hard' | 'expert';

export interface DifficultyResult {
  score: number;
  tier: DifficultyTier;
  /** 最优解深度（未解出时为 null） */
  optimalDepth: number | null;
  /** 搜索中访问的状态数（可达空间规模近似） */
  stateCount: number;
  /** 平均分支因子 */
  branchingFactor: number;
  solvable: boolean;
}

export const TIER_LABELS: Record<DifficultyTier, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
  expert: '专家',
};

/** 难度评估的状态数上限（防止超深谜题拖垮评估） */
const DIFFICULTY_MAX_STATES = 300_000;

export function calculateDifficulty(puzzle: PuzzleDefinition): DifficultyResult {
  const result = solveBfs(
    { puzzle, initialState: { pieces: puzzle.pieces.map((p) => ({ ...p })) } },
    { maxStates: DIFFICULTY_MAX_STATES },
  );

  if (!result.solved) {
    return {
      score: 9999,
      tier: 'expert',
      optimalDepth: null,
      stateCount: result.visitedNodes,
      branchingFactor:
        result.expandedNodes > 0 ? result.visitedNodes / result.expandedNodes : 0,
      solvable: false,
    };
  }

  const branching = result.expandedNodes > 0 ? result.visitedNodes / result.expandedNodes : 0;
  // 工程化加权：深度为主，搜索规模与分支因子为辅
  const score =
    result.depth * 1.5 + Math.log10(result.visitedNodes + 1) * 12 + Math.max(branching - 1, 0) * 8;

  let tier: DifficultyTier = 'expert';
  if (score < 60) tier = 'easy';
  else if (score < 120) tier = 'normal';
  else if (score < 180) tier = 'hard';

  return {
    score: Math.round(score * 10) / 10,
    tier,
    optimalDepth: result.depth,
    stateCount: result.visitedNodes,
    branchingFactor: Math.round(branching * 100) / 100,
    solvable: true,
  };
}
