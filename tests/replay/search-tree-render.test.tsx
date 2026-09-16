// @vitest-environment jsdom
/**
 * 搜索树渲染：守护「原地更新 + 版本号驱动重算」这条约定。
 *
 * 曾经的缺陷：SearchTree 的布局 useMemo 只依赖 tree 对象引用，
 * 而树是原地更新的 Map（引用不变）⇒ 布局永不重算 ⇒
 * 搜索跑完统计显示 2.4 万个节点，画面上一个圆点都没有。
 */
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SearchTree from '../../src/components/observatory/SearchTree';
import { applySearchEvent, createSearchTree } from '../../src/observatory/tree';

const MOVE = { pieceId: 'bing1', direction: 'down' as const, steps: 1 };
const MAX_NODES = 800;

function renderTree(tree: ReturnType<typeof createSearchTree>, version: number) {
  return render(
    <SearchTree tree={tree} version={version} selectedKey={null} onSelect={vi.fn()} />,
  );
}

describe('SearchTree 渲染', () => {
  it('空树渲染引导文案与图例，不渲染圆点', () => {
    const tree = createSearchTree();
    const { container } = renderTree(tree, 0);
    expect(container.querySelectorAll('.search-tree__node').length).toBe(0);
    expect(container.textContent).toContain('点「开始搜索」后');
    expect(container.querySelector('.search-tree__legend')).toBeTruthy();
  });

  it('已有节点时渲染出对应数量的圆点', () => {
    const tree = createSearchTree();
    applySearchEvent(tree, { type: 'search_start', stateKey: 'ROOT', depth: 0 }, MAX_NODES);
    applySearchEvent(
      tree,
      { type: 'node_generate', stateKey: 'A', parentKey: 'ROOT', depth: 1, move: MOVE },
      MAX_NODES,
    );
    applySearchEvent(
      tree,
      { type: 'node_generate', stateKey: 'B', parentKey: 'ROOT', depth: 1, move: MOVE },
      MAX_NODES,
    );
    const { container } = renderTree(tree, 1);
    expect(container.querySelectorAll('.search-tree__node').length).toBe(3);
  });

  it('原地新增节点后，靠版本号变化就能画出新圆点（核心回归点）', () => {
    const tree = createSearchTree();
    applySearchEvent(tree, { type: 'search_start', stateKey: 'ROOT', depth: 0 }, MAX_NODES);
    const { container, rerender } = renderTree(tree, 1);
    expect(container.querySelectorAll('.search-tree__node').length).toBe(1);

    // 原地修改：tree 的引用不变，只有内容变了
    for (const key of ['A', 'B', 'C']) {
      applySearchEvent(
        tree,
        { type: 'node_generate', stateKey: key, parentKey: 'ROOT', depth: 1, move: MOVE },
        MAX_NODES,
      );
    }
    rerender(<SearchTree tree={tree} version={2} selectedKey={null} onSelect={vi.fn()} />);
    expect(container.querySelectorAll('.search-tree__node').length).toBe(4);
  });

  it('目标节点标记为 goal，解路径被高亮', () => {
    const tree = createSearchTree();
    applySearchEvent(tree, { type: 'search_start', stateKey: 'ROOT', depth: 0 }, MAX_NODES);
    applySearchEvent(
      tree,
      { type: 'node_generate', stateKey: 'GOAL', parentKey: 'ROOT', depth: 1, move: MOVE },
      MAX_NODES,
    );
    applySearchEvent(tree, { type: 'goal_found', stateKey: 'GOAL', depth: 1 }, MAX_NODES);
    const { container } = renderTree(tree, 1);
    expect(container.querySelectorAll('.search-tree__node--goal').length).toBe(1);
    expect(container.querySelectorAll('.search-tree__node--path').length).toBe(2);
  });
});
