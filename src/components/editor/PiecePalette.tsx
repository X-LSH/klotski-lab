/**
 * 棋子面板：选择要放置的棋子尺寸或编辑工具。
 */
import type { EditorTool } from './EditorBoard';

interface PiecePaletteProps {
  tool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
}

const TOOLS: { tool: EditorTool; label: string }[] = [
  { tool: 'select', label: '选择 / 移动' },
  { tool: 'add-1x1', label: '1 × 1' },
  { tool: 'add-1x2', label: '1 × 2' },
  { tool: 'add-2x1', label: '2 × 1' },
  { tool: 'add-2x2', label: '2 × 2' },
  { tool: 'exit', label: '设置出口' },
  { tool: 'erase', label: '删除' },
];

export default function PiecePalette({ tool, onToolChange }: PiecePaletteProps) {
  return (
    <div className="piece-palette" role="toolbar" aria-label="棋子面板">
      {TOOLS.map(({ tool: t, label }) => (
        <button
          key={t}
          type="button"
          className={tool === t ? 'piece-palette__item piece-palette__item--active' : 'piece-palette__item'}
          aria-pressed={tool === t}
          onClick={() => onToolChange(t)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
