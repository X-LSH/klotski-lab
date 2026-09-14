/**
 * 节点检查器：显示选中搜索树节点的详情。
 */
import { DIRECTION_LABELS } from '../../core/move';
import type { SearchTreeNode } from '../../observatory/tree';

interface NodeInspectorProps {
  node: SearchTreeNode | null;
}

export default function NodeInspector({ node }: NodeInspectorProps) {
  if (!node) {
    return (
      <div className="node-inspector" aria-label="节点检查器">
        <h3>节点检查器</h3>
        <p className="node-inspector__empty">点击搜索树中的节点查看详情。</p>
      </div>
    );
  }
  return (
    <div className="node-inspector" aria-label="节点检查器">
      <h3>节点检查器</h3>
      <dl>
        <div>
          <dt>深度</dt>
          <dd>{node.depth}</dd>
        </div>
        <div>
          <dt>状态键</dt>
          <dd className="node-inspector__key">{node.key}</dd>
        </div>
        <div>
          <dt>父节点</dt>
          <dd className="node-inspector__key">{node.parentKey ?? '（根节点）'}</dd>
        </div>
        <div>
          <dt>移动</dt>
          <dd>
            {node.move
              ? `${node.move.pieceId} 向${DIRECTION_LABELS[node.move.direction]} ${node.move.steps} 格`
              : '（初始状态）'}
          </dd>
        </div>
        <div>
          <dt>类型</dt>
          <dd>{node.isGoal ? '目标节点' : node.parentKey === null ? '起始节点' : '普通节点'}</dd>
        </div>
      </dl>
    </div>
  );
}
