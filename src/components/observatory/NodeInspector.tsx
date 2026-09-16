/**
 * 局面详情：显示选中搜索树节点的信息。
 * 字段名尽量用人话而不是求解器术语（如「状态键」），并各带一句解释。
 */
import { DIRECTION_LABELS } from '../../core/move';
import type { SearchTreeNode } from '../../observatory/tree';

interface NodeInspectorProps {
  node: SearchTreeNode | null;
}

export default function NodeInspector({ node }: NodeInspectorProps) {
  if (!node) {
    return (
      <div className="node-inspector" aria-label="局面详情">
        <h3>局面详情</h3>
        <p className="node-inspector__empty">
          在左侧搜索树里点任意一个圆点，这里显示那个局面是怎么走到它的
          —— 距起点几步、上一步挪了哪个棋子、是不是目标局面。
        </p>
      </div>
    );
  }

  const kind = node.isGoal
    ? '目标局面（棋子已到出口）'
    : node.parentKey === null
      ? '起始局面'
      : '搜索中访问过的局面';

  return (
    <div className="node-inspector" aria-label="局面详情">
      <h3>局面详情</h3>
      <dl>
        <div>
          <dt>类型</dt>
          <dd>{kind}</dd>
        </div>
        <div>
          <dt title="从起始局面走到这里需要几步">距起点步数</dt>
          <dd>{node.depth}</dd>
        </div>
        <div>
          <dt title="上一步挪动了哪个棋子、往哪个方向">上一步</dt>
          <dd>
            {node.move
              ? `${node.move.pieceId} 向${DIRECTION_LABELS[node.move.direction]} ${node.move.steps} 格`
              : '（这是起始局面，没有上一步）'}
          </dd>
        </div>
        <div>
          <dt title="求解器判断「两个局面是否相同」用的指纹；形状相同的非目标棋子会被视为等价">
            局面指纹
          </dt>
          <dd className="node-inspector__key">{node.key}</dd>
        </div>
        <div>
          <dt title="来源局面的指纹，用来还原搜索树的分支">来源</dt>
          <dd className="node-inspector__key">{node.parentKey ?? '（起始局面）'}</dd>
        </div>
      </dl>
    </div>
  );
}
