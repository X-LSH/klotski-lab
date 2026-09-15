/**
 * 谜题生成器。
 *
 * 保证可解的基本策略（逆向打乱）：
 *   从一个已知可解的状态出发，沿可逆的合法移动离开它 ⇒ 结果必然有解。
 *   绝不采用「随机摆一个布局再假设它有解」的做法。
 *
 * 提供两种生成方式：
 * 1. generatePuzzle        —— 随机游走打乱（速度快，用于关卡页的随机关卡）
 * 2. generatePuzzleAtDepth —— 逆向 BFS 深度法（最优解深度精确可控，用于每日挑战）
 *
 * 两者的共同硬性约束：**生成出的初始状态绝不能已经是目标状态**。
 * 已解模板上 2×2 目标棋子四周全满、自身无法移动，随机游走的大部分步数
 * 都消耗在其他棋子的腾挪上 —— 实测 97% 的种子游走 60 步后目标棋子仍覆盖出口，
 * 生成出「打开即已解开」的退化谜题（胜利弹窗直接弹出、重置也无法脱离）。
 */
import type { GameState, PuzzleDefinition } from '../types';
import { createInitialState } from '../core/state';
import { isSolved, getLegalMoves, applyLegalMove } from '../core/rules';
import { createRng, randomWalk } from './shuffle';
import { canonicalStateKey } from '../solver/state-key';

/** 生成参数 */
export interface GenerateOptions {
  /** 随机种子：同一种子必须得到相同谜题 */
  seed: number;
  /** 随机游走步数（默认 60，上限 200，防止生成过深谜题） */
  steps?: number;
}

/** 深度生成参数 */
export interface DepthGenerateOptions {
  /** 随机种子：同一种子必须得到相同谜题 */
  seed: number;
  /** 目标最优解深度（步数）。实际深度可能因状态空间过小而略低 */
  depth: number;
}

export const MAX_GENERATE_STEPS = 200;
export const DEFAULT_GENERATE_STEPS = 60;

/** 「打乱后仍未解」时的最大重试次数（随机游走遍历整个连通空间，实际远达不到） */
export const MAX_UNSCRAMBLE_ATTEMPTS = 200;

/**
 * 已解布局模板：4×5 棋盘，曹操（2×2）已覆盖底部出口。
 * 其余棋子填满上方区域，全部位置合法无重叠。
 */
export function solvedTemplate(): PuzzleDefinition {
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

/**
 * 派生种子：同一种子的不同尝试得到互相独立的序列。
 * mulberry32 对低位差异不敏感，先混入 attempt 再做两轮位扩散。
 */
function derivedSeed(seed: number, attempt: number): number {
  let x = (seed ^ Math.imul(attempt + 1, 0x9e3779b9)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return (x ^ (x >>> 16)) >>> 0;
}

/** 生成谜题：同一种子必然得到相同结果，且初始状态必然未解 */
export function generatePuzzle(options: GenerateOptions): PuzzleDefinition {
  const baseSteps = Math.min(
    Math.max(1, Math.floor(options.steps ?? DEFAULT_GENERATE_STEPS)),
    MAX_GENERATE_STEPS,
  );
  const template = solvedTemplate();

  for (let attempt = 0; ; attempt++) {
    // 前几次失败后逐步加大游走步数：离模板越远越容易脱离已解状态
    const steps = Math.min(baseSteps + attempt * 20, MAX_GENERATE_STEPS);
    const rng = createRng(derivedSeed(options.seed, attempt));
    const scrambled = randomWalk(template, createInitialState(template), steps, rng);
    if (!isSolved(scrambled, template) || attempt >= MAX_UNSCRAMBLE_ATTEMPTS) {
      return {
        ...template,
        name: `随机关卡 #${options.seed}`,
        pieces: scrambled.pieces.map((p) => ({ ...p })),
      };
    }
  }
}

/**
 * 逆向多源 BFS 深度法。
 *
 * 关键：**已解状态不唯一** —— 目标棋子覆盖出口后，其余棋子仍可任意排列，
 * 它们全部都是「已解」。而且这个集合无法用「固定目标棋子」的方式枚举完备：
 * 目标棋子暂时移开再回来，能让其余棋子 rearrange 到固定时到不了的位置。
 * （实测：固定法只枚举到 1637 个已解等价类，导致层号 20 的谜题真实最优解只有 7 步。）
 *
 * 因此分两步：
 * 1. 从已解模板遍历**整个**可达状态空间（规范化去重，约 2.4 万状态）；
 * 2. 把其中全部满足 isSolved 的等价类作为深度 0 的源做多源 BFS ——
 *    第 depth 层的状态到最近已解状态恰好 depth 步，即最优解深度精确等于 depth。
 *
 * 性质：必然未解（depth ≥ 1）、必然可解、最优解深度可控、全程确定性。
 */
export function generatePuzzleAtDepth(options: DepthGenerateOptions): PuzzleDefinition {
  const template = solvedTemplate();
  const depth = Math.max(1, Math.floor(options.depth));

  // ── 第 1 步：遍历整个可达状态空间 ──
  const states = new Map<string, GameState>();
  {
    const start = createInitialState(template);
    const startKey = canonicalStateKey(start, template);
    states.set(startKey, start);
    let frontier = [startKey];
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const key of frontier) {
        const state = states.get(key) as GameState;
        for (const move of getLegalMoves(state, template)) {
          const nextState = applyLegalMove(state, move);
          const nextKey = canonicalStateKey(nextState, template);
          if (states.has(nextKey)) continue;
          states.set(nextKey, nextState);
          next.push(nextKey);
        }
      }
      frontier = next;
    }
  }

  // ── 第 2 步：全部已解等价类作为多源，向外计算到最近已解状态的距离 ──
  const solvedKeys = [...states.entries()]
    .filter(([, state]) => isSolved(state, template))
    .map(([key]) => key);
  const depthOf = new Map<string, number>(solvedKeys.map((k) => [k, 0]));
  let frontier = solvedKeys;
  let pool: string[] | null = null;
  for (let d = 1; d <= depth; d++) {
    const next: string[] = [];
    for (const key of frontier) {
      const state = states.get(key) as GameState;
      for (const move of getLegalMoves(state, template)) {
        const nextKey = canonicalStateKey(applyLegalMove(state, move), template);
        if (depthOf.has(nextKey)) continue;
        depthOf.set(nextKey, d);
        next.push(nextKey);
      }
    }
    if (next.length === 0) break; // depth 超过状态空间直径
    frontier = next;
    if (d === depth) pool = next;
  }

  // 深度层为空时退回最深的可达层（棋盘很小或 depth 过大时才可能发生）
  const candidates = pool ?? frontier;
  const sorted = [...candidates].sort();
  const rng = createRng(options.seed);
  const chosenKey = sorted[Math.floor(rng() * sorted.length)];
  const chosen = states.get(chosenKey) as GameState;
  return {
    ...template,
    name: `随机关卡 #${options.seed}`,
    pieces: chosen.pieces.map((p) => ({ ...p })),
  };
}
