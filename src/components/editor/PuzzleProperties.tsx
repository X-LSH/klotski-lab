/**
 * 谜题属性面板：名称、棋盘尺寸、目标棋子、目标类型、出口 / 目标区域。
 */
import type { PuzzleDefinition } from '../../types';

interface PuzzlePropertiesProps {
  puzzle: PuzzleDefinition;
  selectedId: string | null;
  onChange: (puzzle: PuzzleDefinition) => void;
  onRemoveSelected: () => void;
}

export default function PuzzleProperties({
  puzzle,
  selectedId,
  onChange,
  onRemoveSelected,
}: PuzzlePropertiesProps) {
  const update = (patch: Partial<PuzzleDefinition>) => onChange({ ...puzzle, ...patch });
  const updateBoard = (patch: Partial<PuzzleDefinition['board']>) =>
    onChange({ ...puzzle, board: { ...puzzle.board, ...patch } });
  const updateGoal = (patch: Partial<PuzzleDefinition['goal']>) =>
    onChange({ ...puzzle, goal: { ...puzzle.goal, ...patch } });

  const numberInput = (
    label: string,
    value: number,
    onValue: (n: number) => void,
    min = 1,
    max = 12,
  ) => (
    <label className="puzzle-props__field" key={label}>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onValue(Number(e.target.value))}
      />
    </label>
  );

  const exit = puzzle.board.exit ?? { x: 0, y: 0, width: 2, height: 1 };
  const area = puzzle.goal.area ?? { x: 0, y: 0, width: 2, height: 2 };

  return (
    <div className="puzzle-props" aria-label="谜题属性">
      <label className="puzzle-props__field">
        <span>名称</span>
        <input
          type="text"
          value={puzzle.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </label>

      <div className="puzzle-props__group">
        <h4>棋盘</h4>
        {numberInput('宽', puzzle.board.width, (n) => updateBoard({ width: n }), 2)}
        {numberInput('高', puzzle.board.height, (n) => updateBoard({ height: n }), 2)}
      </div>

      <div className="puzzle-props__group">
        <h4>目标</h4>
        <label className="puzzle-props__field">
          <span>目标棋子</span>
          <select
            value={puzzle.goal.pieceId}
            onChange={(e) => updateGoal({ pieceId: e.target.value })}
          >
            <option value="">（未选择）</option>
            {puzzle.pieces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label ?? p.id}（{p.width}×{p.height}）
              </option>
            ))}
          </select>
        </label>
        <label className="puzzle-props__field">
          <span>目标类型</span>
          <select
            value={puzzle.goal.type}
            onChange={(e) => updateGoal({ type: e.target.value as 'reach-exit' | 'occupy-area' })}
          >
            <option value="reach-exit">到达出口</option>
            <option value="occupy-area">占据目标区域</option>
          </select>
        </label>
      </div>

      {puzzle.goal.type === 'reach-exit' && (
        <div className="puzzle-props__group">
          <h4>出口（也可用“设置出口”工具点击棋盘）</h4>
          {numberInput('出口 X', exit.x, (n) => updateBoard({ exit: { ...exit, x: n } }), 0)}
          {numberInput('出口 Y', exit.y, (n) => updateBoard({ exit: { ...exit, y: n } }), 0)}
          {numberInput('出口宽', exit.width, (n) => updateBoard({ exit: { ...exit, width: n } }))}
          {numberInput('出口高', exit.height, (n) =>
            updateBoard({ exit: { ...exit, height: n } }),
          )}
        </div>
      )}

      {puzzle.goal.type === 'occupy-area' && (
        <div className="puzzle-props__group">
          <h4>目标区域</h4>
          {numberInput('区域 X', area.x, (n) => updateGoal({ area: { ...area, x: n } }), 0)}
          {numberInput('区域 Y', area.y, (n) => updateGoal({ area: { ...area, y: n } }), 0)}
          {numberInput('区域宽', area.width, (n) => updateGoal({ area: { ...area, width: n } }))}
          {numberInput('区域高', area.height, (n) => updateGoal({ area: { ...area, height: n } }))}
        </div>
      )}

      {selectedId && (
        <button type="button" className="puzzle-props__remove" onClick={onRemoveSelected}>
          删除选中棋子（{selectedId}）
        </button>
      )}
    </div>
  );
}
