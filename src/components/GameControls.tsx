/**
 * 游戏操作栏：撤销 / 重做 / 重置 / 求解。
 */
interface GameControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  solving: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSolve: () => void;
}

export default function GameControls({
  canUndo,
  canRedo,
  solving,
  onUndo,
  onRedo,
  onReset,
  onSolve,
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
      <button
        type="button"
        className="game-controls__solve"
        onClick={onSolve}
        disabled={solving}
        aria-label="求解"
      >
        {solving ? '求解中…' : '求解'}
      </button>
    </div>
  );
}
