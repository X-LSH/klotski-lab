/**
 * 搜索树可视化（SVG，无第三方图表依赖）。
 * 布局：按深度分层，同层节点横向排列；规模受 maxVisualizationNodes 限制。
 */
import { useMemo } from 'react';
import { layerNodes, solutionPathKeys, type SearchTree as SearchTreeData } from '../../observatory/tree';

interface SearchTreeProps {
  tree: SearchTreeData;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

const NODE_R = 7;
const LAYER_H = 44;
const COL_W = 20;

export default function SearchTree({ tree, selectedKey, onSelect }: SearchTreeProps) {
  const { positions, edges, width, height, pathKeys } = useMemo(() => {
    const layers = layerNodes(tree);
    const positions = new Map<string, { x: number; y: number }>();
    const edges: { from: string; to: string }[] = [];
    let maxCols = 1;
    const sortedDepths = [...layers.keys()].sort((a, b) => a - b);
    sortedDepths.forEach((depth, row) => {
      const layer = layers.get(depth) ?? [];
      maxCols = Math.max(maxCols, layer.length);
      layer.forEach((node, col) => {
        positions.set(node.key, { x: (col + 1) * COL_W, y: (row + 1) * LAYER_H });
        if (node.parentKey && positions.has(node.parentKey)) {
          edges.push({ from: node.parentKey, to: node.key });
        }
      });
    });
    return {
      positions,
      edges,
      width: (maxCols + 1) * COL_W,
      height: (sortedDepths.length + 1) * LAYER_H,
      pathKeys: solutionPathKeys(tree),
    };
  }, [tree]);

  if (tree.nodes.size === 0) {
    return (
      <div className="search-tree" aria-label="搜索树">
        <p className="search-tree__empty">开始求解后，这里会显示搜索树（START → … → GOAL）。</p>
      </div>
    );
  }

  return (
    <div className="search-tree" aria-label="搜索树">
      {tree.truncated && (
        <p className="search-tree__note">节点数量达到可视化上限，仅展示前一部分；求解仍在后台继续。</p>
      )}
      <div className="search-tree__viewport">
        <svg width={width} height={height} role="img" aria-label="搜索树图">
          {edges.map(({ from, to }) => {
            const a = positions.get(from);
            const b = positions.get(to);
            if (!a || !b) return null;
            const onPath = pathKeys.has(from) && pathKeys.has(to);
            return (
              <line
                key={`${from}->${to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={onPath ? 'search-tree__edge search-tree__edge--path' : 'search-tree__edge'}
              />
            );
          })}
          {tree.rootKey &&
            (() => {
              const rootPos = positions.get(tree.rootKey as string);
              if (!rootPos) return null;
              return (
                <text
                  x={rootPos.x}
                  y={rootPos.y - NODE_R - 4}
                  className="search-tree__tag"
                  textAnchor="middle"
                >
                  START
                </text>
              );
            })()}
          {[...tree.nodes.values()].map((node) => {
            const pos = positions.get(node.key);
            if (!pos) return null;
            const classes = [
              'search-tree__node',
              node.isGoal ? 'search-tree__node--goal' : '',
              pathKeys.has(node.key) ? 'search-tree__node--path' : '',
              selectedKey === node.key ? 'search-tree__node--selected' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <g key={node.key} onClick={() => onSelect(node.key)} style={{ cursor: 'pointer' }}>
                <circle cx={pos.x} cy={pos.y} r={NODE_R} className={classes}>
                  <title>深度 {node.depth}</title>
                </circle>
                {node.isGoal && (
                  <text x={pos.x} y={pos.y + NODE_R + 12} className="search-tree__tag" textAnchor="middle">
                    GOAL
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
