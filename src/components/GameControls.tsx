/**
 * 游戏操作栏：撤销 / 重做 / 重置（求解操作在 SolverPanel 中）。
 */
interface GameControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
}

export default function GameControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
}: GameControlsProps) {
  return (
    <div className="game-controls" role="toolbar" aria-label="游戏操作">
      <button type="button" onClick={onUndo} disabled={!canUndo} aria-label="撤销">
        撤销
      </button>
      <button type="button" onClick={onRedo} disabled={!canRedo} aria-label="重做">
        重做
      </button>
      <button type="button" onClick={onReset} aria-label="重置">
        重置
      </button>
    </div>
  );
}
