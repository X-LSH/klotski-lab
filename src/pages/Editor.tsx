/**
 * 谜题编辑器页。
 * 编辑器操作的唯一数据源是 PuzzleDefinition（core），不复制独立数据结构。
 */
import { useCallback, useRef, useState } from 'react';
import type { PuzzleDefinition } from '../types';
import { CLASSIC_PUZZLE } from '../core/presets';
import { clonePuzzle, parsePuzzle, serializePuzzle } from '../core/puzzle';
import { validatePuzzle, type ValidationResult } from '../core/validator';
import { inferPieceType } from '../core/piece';
import EditorBoard, { type EditorTool } from '../components/editor/EditorBoard';
import PiecePalette from '../components/editor/PiecePalette';
import EditorToolbar from '../components/editor/EditorToolbar';
import PuzzleProperties from '../components/editor/PuzzleProperties';
import ValidationPanel from '../components/editor/ValidationPanel';

/** 空谜题模板 */
function emptyPuzzle(): PuzzleDefinition {
  return {
    version: 1,
    name: '未命名谜题',
    board: { width: 4, height: 5, exit: { x: 1, y: 4, width: 2, height: 1 } },
    pieces: [],
    goal: { pieceId: '', type: 'reach-exit' },
  };
}

export default function Editor() {
  const [puzzle, setPuzzle] = useState<PuzzleDefinition>(() => clonePuzzle(CLASSIC_PUZZLE));
  const [tool, setTool] = useState<EditorTool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [dialog, setDialog] = useState<{ mode: 'export' | 'import'; text: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const idCounterRef = useRef(1);

  const changePuzzle = useCallback((next: PuzzleDefinition) => {
    setPuzzle(next);
    setValidation(null); // 内容变化后旧校验结果失效
  }, []);

  const handleAddPiece = useCallback(
    (width: number, height: number, x: number, y: number) => {
      const id = `p${idCounterRef.current++}`;
      const piece = {
        id,
        x: Math.min(x, puzzle.board.width - width),
        y: Math.min(y, puzzle.board.height - height),
        width,
        height,
        type: inferPieceType(width, height),
      };
      changePuzzle({ ...puzzle, pieces: [...puzzle.pieces, piece] });
      setSelectedId(id);
    },
    [puzzle, changePuzzle],
  );

  const handleMovePiece = useCallback(
    (pieceId: string, x: number, y: number) => {
      changePuzzle({
        ...puzzle,
        pieces: puzzle.pieces.map((p) => (p.id === pieceId ? { ...p, x, y } : p)),
      });
    },
    [puzzle, changePuzzle],
  );

  const handleRemovePiece = useCallback(
    (pieceId: string) => {
      const pieces = puzzle.pieces.filter((p) => p.id !== pieceId);
      const goal =
        puzzle.goal.pieceId === pieceId ? { ...puzzle.goal, pieceId: '' } : puzzle.goal;
      changePuzzle({ ...puzzle, pieces, goal });
      setSelectedId((current) => (current === pieceId ? null : current));
    },
    [puzzle, changePuzzle],
  );

  const handleSetExit = useCallback(
    (x: number, y: number) => {
      const exit = puzzle.board.exit ?? { x: 0, y: 0, width: 2, height: 1 };
      changePuzzle({ ...puzzle, board: { ...puzzle.board, exit: { ...exit, x, y } } });
    },
    [puzzle, changePuzzle],
  );

  const handleImport = useCallback(() => {
    if (!dialog || dialog.mode !== 'import') return;
    const result = parsePuzzle(dialog.text);
    if (!result.ok) {
      setMessage(`导入失败：${result.error}`);
      return;
    }
    const check = validatePuzzle(result.puzzle);
    if (!check.valid) {
      setValidation(check);
      setMessage('导入失败：谜题不合法，详见校验结果');
      return;
    }
    changePuzzle(result.puzzle);
    setDialog(null);
    setMessage('导入成功');
  }, [dialog, changePuzzle]);

  return (
    <main className="editor">
      <h2 className="editor__title">谜题编辑器</h2>
      <EditorToolbar
        onValidate={() => setValidation(validatePuzzle(puzzle))}
        onClear={() => {
          changePuzzle(emptyPuzzle());
          setSelectedId(null);
        }}
        onLoadClassic={() => {
          changePuzzle(clonePuzzle(CLASSIC_PUZZLE));
          setSelectedId(null);
        }}
        onExport={() => setDialog({ mode: 'export', text: serializePuzzle(puzzle) })}
        onImport={() => {
          setDialog({ mode: 'import', text: '' });
          setMessage(null);
        }}
      />
      <div className="editor__body">
        <section className="editor__board-area">
          <PiecePalette tool={tool} onToolChange={setTool} />
          <EditorBoard
            puzzle={puzzle}
            tool={tool}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddPiece={handleAddPiece}
            onMovePiece={handleMovePiece}
            onRemovePiece={handleRemovePiece}
            onSetExit={handleSetExit}
          />
          <ValidationPanel result={validation} />
          {message && (
            <p className="editor__message" role="status">
              {message}
            </p>
          )}
        </section>
        <aside className="editor__side">
          <PuzzleProperties
            puzzle={puzzle}
            selectedId={selectedId}
            onChange={changePuzzle}
            onRemoveSelected={() => selectedId && handleRemovePiece(selectedId)}
          />
        </aside>
      </div>

      {dialog && (
        <div className="editor__dialog" role="dialog" aria-label="导入导出">
          <h3>{dialog.mode === 'export' ? '导出 JSON' : '导入 JSON'}</h3>
          <textarea
            value={dialog.text}
            readOnly={dialog.mode === 'export'}
            placeholder={dialog.mode === 'import' ? '粘贴谜题 JSON…' : undefined}
            aria-label="谜题 JSON"
            onChange={(e) => setDialog({ ...dialog, text: e.target.value })}
          />
          <div className="editor__dialog-actions">
            {dialog.mode === 'import' && (
              <button type="button" onClick={handleImport}>
                确认导入
              </button>
            )}
            <button type="button" onClick={() => setDialog(null)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
