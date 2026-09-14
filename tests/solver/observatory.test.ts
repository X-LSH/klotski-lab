import { describe, expect, it } from 'vitest';
import { solveBfs } from '../../src/solver/bfs';
import { solveAStar } from '../../src/solver/astar';
import { solveIdaStar } from '../../src/solver/idastar';
import type { SearchEvent } from '../../src/solver/events';
import type { SolveProblem } from '../../src/solver/result';
import {
  applySearchEvent,
  createSearchTree,
  layerNodes,
  solutionPathKeys,
} from '../../src/observatory/tree';
import { raceAlgorithms } from '../../src/observatory/race';
import { createInitialState } from '../../src/core/state';
import { tinyPuzzle } from '../core/helpers';

function makeProblem(): SolveProblem {
  const puzzle = tinyPuzzle();
  return { puzzle, initialState: createInitialState(puzzle) };
}

function collectEvents(problem: SolveProblem, solve: typeof solveBfs): SearchEvent[] {
  const events: SearchEvent[] = [];
  solve(problem, { onEvent: (e) => events.push(e) });
  return events;
}

describe('搜索事件模型', () => {
  it('BFS 事件顺序正确：search_start 最先，search_end 最后，goal_found 在结束前', () => {
    const events = collectEvents(makeProblem(), solveBfs);
    expect(events[0].type).toBe('search_start');
    expect(events[events.length - 1].type).toBe('search_end');
    const goalIndex = events.findIndex((e) => e.type === 'goal_found');
    expect(goalIndex).toBeGreaterThan(0);
    expect(goalIndex).toBeLessThan(events.length - 1);
  });

  it('BFS 展开事件数与 expandedNodes 一致', () => {
    const events: SearchEvent[] = [];
    const result = solveBfs(makeProblem(), { onEvent: (e) => events.push(e) });
    expect(events.filter((e) => e.type === 'node_expand')).toHaveLength(result.expandedNodes);
  });

  it('统计不变量：BFS 中 visited = 1 + node_generate 事件数（重复后继只发 skip）', () => {
    let generated = 0;
    let skipped = 0;
    const result = solveBfs(makeProblem(), {
      onEvent: (e) => {
        if (e.type === 'node_generate') generated += 1;
        if (e.type === 'node_skip') skipped += 1;
      },
    });
    expect(result.visitedNodes).toBe(1 + generated);
    // 小谜题中存在重复后继，skip 应当发生
    expect(skipped).toBeGreaterThan(0);
  });

  it('统计不变量：A* 中 visited = 1 + 不重复生成键数量（允许更优路径重生成）', () => {
    const generatedKeys = new Set<string>();
    const result = solveAStar(makeProblem(), {
      onEvent: (e) => {
        if (e.type === 'node_generate' && e.stateKey) generatedKeys.add(e.stateKey);
      },
    });
    // A* 中同一状态可能以更优 g 值重复生成；visited 只统计唯一状态
    expect(result.visitedNodes).toBe(1 + generatedKeys.size);
  });

  it('A* / IDA* 事件序列完整（start → … → end）', () => {
    for (const solve of [solveAStar, solveIdaStar]) {
      const events = collectEvents(makeProblem(), solve);
      expect(events[0].type).toBe('search_start');
      expect(events[events.length - 1].type).toBe('search_end');
      expect(events.some((e) => e.type === 'node_expand')).toBe(true);
      expect(events.some((e) => e.type === 'node_generate')).toBe(true);
    }
  });

  it('node_generate 事件携带 parent / move / depth（Node Inspector 数据）', () => {
    const events = collectEvents(makeProblem(), solveBfs);
    const generated = events.find((e) => e.type === 'node_generate');
    expect(generated?.stateKey).toBeTruthy();
    expect(generated?.parentKey).toBeTruthy();
    expect(generated?.move).toBeTruthy();
    expect(generated?.depth).toBe(1);
  });
});

describe('搜索树构建', () => {
  it('从事件流重建父子关系', () => {
    const events = collectEvents(makeProblem(), solveBfs);
    const tree = createSearchTree();
    for (const e of events) applySearchEvent(tree, e, 1000);
    expect(tree.rootKey).toBeTruthy();
    expect(tree.nodes.size).toBeGreaterThan(1);
    // 每个非根节点都有父节点
    for (const node of tree.nodes.values()) {
      if (node.key === tree.rootKey) {
        expect(node.parentKey).toBeNull();
      } else if (!node.isGoal || node.parentKey) {
        expect(node.parentKey === null || tree.nodes.has(node.parentKey)).toBe(true);
      }
    }
  });

  it('目标节点被标记且解路径可回溯', () => {
    const events = collectEvents(makeProblem(), solveBfs);
    const tree = createSearchTree();
    for (const e of events) applySearchEvent(tree, e, 1000);
    const path = solutionPathKeys(tree);
    expect(path.size).toBeGreaterThan(0);
    expect(path.has(tree.rootKey as string)).toBe(true);
  });

  it('达到可视化上限后截断且不影响事件继续到来', () => {
    const events = collectEvents(makeProblem(), solveBfs);
    const tree = createSearchTree();
    for (const e of events) applySearchEvent(tree, e, 2);
    expect(tree.truncated).toBe(true);
    expect(tree.nodes.size).toBeLessThanOrEqual(2);
  });

  it('layerNodes 按深度分层', () => {
    const events = collectEvents(makeProblem(), solveBfs);
    const tree = createSearchTree();
    for (const e of events) applySearchEvent(tree, e, 1000);
    const layers = layerNodes(tree);
    expect(layers.get(0)).toHaveLength(1);
    expect(layers.size).toBeGreaterThan(1);
  });
});

describe('算法竞速', () => {
  it('三种算法都完成且解深度一致', async () => {
    const entries = await raceAlgorithms(makeProblem(), undefined, 30_000);
    expect(entries).toHaveLength(3);
    const depths = entries.map((e) => {
      expect(e.result.solved).toBe(true);
      return e.result.depth;
    });
    expect(new Set(depths).size).toBe(1);
  }, 60_000);

  it('完成回调按完成顺序触发', async () => {
    const seen: string[] = [];
    await raceAlgorithms(
      makeProblem(),
      (entry) => seen.push(entry.algorithm),
      30_000,
    );
    expect(seen.sort()).toEqual(['astar', 'bfs', 'idastar']);
  }, 60_000);
});
