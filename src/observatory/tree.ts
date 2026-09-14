/**
 * 搜索树构建（观测层纯逻辑，不依赖 React / DOM，也不影响求解正确性）。
 * 从节流后的搜索事件流重建“START → Node → … → GOAL”的父子关系。
 */
import type { Move } from '../types';
import type { SearchEvent } from '../solver/events';

export interface SearchTreeNode {
  key: string;
  parentKey: string | null;
  move: Move | null;
  depth: number;
  /** 是否为目标节点 */
  isGoal: boolean;
}

export interface SearchTree {
  rootKey: string | null;
  nodes: Map<string, SearchTreeNode>;
  /** 达到可视化节点上限后为 true（求解仍在继续，只是不再画新节点） */
  truncated: boolean;
}

export function createSearchTree(): SearchTree {
  return { rootKey: null, nodes: new Map(), truncated: false };
}

/**
 * 把一个搜索事件应用到树上。
 * @returns 树是否发生变化
 */
export function applySearchEvent(tree: SearchTree, event: SearchEvent, maxNodes: number): boolean {
  switch (event.type) {
    case 'search_start': {
      if (!event.stateKey) return false;
      tree.rootKey = event.stateKey;
      tree.nodes.set(event.stateKey, {
        key: event.stateKey,
        parentKey: null,
        move: null,
        depth: event.depth ?? 0,
        isGoal: false,
      });
      return true;
    }
    case 'node_generate': {
      if (!event.stateKey || tree.nodes.has(event.stateKey)) return false;
      if (tree.nodes.size >= maxNodes) {
        tree.truncated = true;
        return false;
      }
      tree.nodes.set(event.stateKey, {
        key: event.stateKey,
        parentKey: event.parentKey ?? null,
        move: event.move ?? null,
        depth: event.depth ?? 0,
        isGoal: false,
      });
      return true;
    }
    case 'goal_found': {
      if (!event.stateKey) return false;
      const node = tree.nodes.get(event.stateKey);
      if (node) {
        node.isGoal = true;
      } else if (tree.nodes.size < maxNodes) {
        // 目标节点可能在节流后才首次出现：补挂到树上
        tree.nodes.set(event.stateKey, {
          key: event.stateKey,
          parentKey: null,
          move: null,
          depth: event.depth ?? 0,
          isGoal: true,
        });
      }
      return true;
    }
    default:
      return false;
  }
}

/** 按深度分层（用于渲染布局）：返回 depth -> 该层节点数组 */
export function layerNodes(tree: SearchTree): Map<number, SearchTreeNode[]> {
  const layers = new Map<number, SearchTreeNode[]>();
  for (const node of tree.nodes.values()) {
    const layer = layers.get(node.depth);
    if (layer) {
      layer.push(node);
    } else {
      layers.set(node.depth, [node]);
    }
  }
  return layers;
}

/** 从目标节点沿父链回溯，得到解路径上的节点 key（用于高亮） */
export function solutionPathKeys(tree: SearchTree): Set<string> {
  const path = new Set<string>();
  let current: SearchTreeNode | undefined;
  for (const node of tree.nodes.values()) {
    if (node.isGoal) {
      current = node;
      break;
    }
  }
  while (current) {
    path.add(current.key);
    current = current.parentKey ? tree.nodes.get(current.parentKey) : undefined;
  }
  return path;
}
