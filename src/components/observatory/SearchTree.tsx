/**
 * 搜索树可视化（SVG，无第三方图表依赖）。
 * 布局：按深度分层，同层节点横向排列；规模受 maxVisualizationNodes 限制。
 */
import { useMemo } from 'react';
import { layerNodes, solutionPathKeys, type SearchTree as SearchTreeData } from '../../observatory/tree';
import { TREE_LEGEND } from './labels';

interface SearchTreeProps {
  tree: SearchTreeData;
  /**
   * 树的版本号。
   *
   * **必须传**：树是原地更新的（`tree.nodes` 是 Map，只增内容、不改引用），
   * 因此布局计算的 useMemo 若只依赖 `tree` 就永远不会重算 ——
   * 结果是「节点已经写进树里、但一个圆点都画不出来」（曾经的真实缺陷：
   * 搜索跑完显示 24027 个节点，画面上却空空如也）。
   */
  version: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

const NODE_R = 7;
const LAYER_H = 44;
const COL_W = 20;

export default function SearchTree({ tree, version, selectedKey, onSelect }: SearchTreeProps) {
  const { positions, edges, width, height, pathKeys } = useMemo(() => {
    // 显式读取 version：树的更新是原地的（引用不变），布局必须靠它重算。
    // 不加这一行，ESLint 会把 version 判成「多余依赖」并建议删掉 —— 删了就退回
    // 「节点写进了树、画面却画不出圆点」的老缺陷。
    void version;
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
  }, [tree, version]);

  // 图例在任何状态都显示：用户打开页面时就想知道「待会儿出现的圆点都是什么」，
  // 等到有树了才给图例，等于把解释放在最不需要的时候。
  const head = (
    <div className="search-tree__head">
      <h3>搜索树</h3>
      <p className="search-tree__legend" aria-label="图例">
        {TREE_LEGEND.map(({ kind, text }) => (
          <span key={kind} className="search-tree__legend-item">
            <span className={`search-tree__legend-dot search-tree__legend-dot--${kind}`} />
            {text}
          </span>
        ))}
      </p>
    </div>
  );

  if (tree.nodes.size === 0) {
    return (
      <div className="search-tree" aria-label="搜索树">
        {head}
        <p className="search-tree__empty">
          点「开始搜索」后，算法每访问一个局面，这里就多一个圆点；
          连线表示「走一步」。可以点任意圆点查看它的详情。
        </p>
      </div>
    );
  }

  return (
    <div className="search-tree" aria-label="搜索树">
      {head}
      {tree.truncated && (
        <p className="search-tree__note">
          节点数量达到可视化上限（{tree.nodes.size} 个），只展示前一部分；求解仍在后台继续。
        </p>
      )}
      <p className="search-tree__hint">点击任意圆点可在右侧查看该局面的详情。</p>
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
