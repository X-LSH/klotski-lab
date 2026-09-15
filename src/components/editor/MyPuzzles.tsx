/**
 * 我的谜题：保存 / 加载 / 重命名 / 删除自定义谜题（localStorage）。
 */
import { useCallback, useEffect, useState } from 'react';
import {
  loadMyPuzzles,
  saveMyPuzzles,
  type SavedPuzzle,
} from '../../storage/local-storage';
import type { PuzzleDefinition } from '../../types';

interface MyPuzzlesProps {
  puzzle: PuzzleDefinition;
  onLoad: (puzzle: PuzzleDefinition) => void;
}

export default function MyPuzzles({ puzzle, onLoad }: MyPuzzlesProps) {
  const [list, setList] = useState<SavedPuzzle[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  useEffect(() => {
    setList(loadMyPuzzles());
  }, []);

  const persist = useCallback((next: SavedPuzzle[]) => {
    saveMyPuzzles(next);
    setList(next);
  }, []);

  const handleSave = () => {
    const item: SavedPuzzle = {
      id: `sp${Date.now()}`,
      name: puzzle.name || '未命名谜题',
      savedAt: Date.now(),
      puzzle,
    };
    persist([...list, item]);
  };

  const handleRename = (id: string) => {
    persist(list.map((item) => (item.id === id ? { ...item, name: renameText || item.name } : item)));
    setRenamingId(null);
  };

  const handleDelete = (id: string) => {
    persist(list.filter((item) => item.id !== id));
  };

  return (
    <div className="my-puzzles" aria-label="我的谜题">
      <div className="my-puzzles__header">
        <h4>我的谜题（{list.length}）</h4>
        <button type="button" onClick={handleSave} aria-label="保存当前谜题">
          保存当前谜题
        </button>
      </div>
      {list.length === 0 && (
        <p className="my-puzzles__empty">还没有保存的谜题。编辑完成后点击“保存当前谜题”。</p>
      )}
      <ul className="my-puzzles__list">
        {list.map((item) => (
          <li key={item.id} className="my-puzzles__item">
            {renamingId === item.id ? (
              <span className="my-puzzles__rename">
                <input
                  value={renameText}
                  aria-label="新名称"
                  onChange={(e) => setRenameText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(item.id)}
                />
                <button type="button" onClick={() => handleRename(item.id)}>
                  确定
                </button>
              </span>
            ) : (
              <>
                <button
                  type="button"
                  className="my-puzzles__load"
                  onClick={() => onLoad(item.puzzle)}
                  aria-label={`加载 ${item.name}`}
                >
                  {item.name}
                </button>
                <span className="my-puzzles__actions">
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(item.id);
                      setRenameText(item.name);
                    }}
                    aria-label={`重命名 ${item.name}`}
                  >
                    重命名
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    aria-label={`删除 ${item.name}`}
                  >
                    删除
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
