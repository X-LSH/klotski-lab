/**
 * 谜题切换器：在游戏页内直接更换谜题，不必跳回关卡页。
 * 数据源：内置关卡 + 今日挑战 + 我的谜题。
 *
 * 每日挑战的生成需要遍历整个状态空间（约 0.7s），因此在组件挂载后异步生成，
 * 未就绪前禁用该选项，避免阻塞首屏与切换操作。
 */
import { useEffect, useMemo, useState } from 'react';
import type { PuzzleDefinition } from '../types';
import { LEVELS } from '../generator/presets';
import { getDailyPuzzle, DAILY_DEPTH } from '../generator/daily';
import { loadMyPuzzles } from '../storage/local-storage';
import type { DifficultyTier } from '../generator/difficulty';

const DIFFICULTY_LABELS: Record<DifficultyTier, string> = {
  easy: '入门',
  normal: '进阶',
  hard: '困难',
  expert: '专家',
};

interface PuzzleSwitcherProps {
  /** 当前谜题名（用于在列表中回显正在玩的谜题） */
  currentName: string;
  onSelect: (puzzle: PuzzleDefinition) => void;
}

export default function PuzzleSwitcher({ currentName, onSelect }: PuzzleSwitcherProps) {
  const [daily, setDaily] = useState<PuzzleDefinition | null>(null);
  const [value, setValue] = useState('');

  // 每日挑战异步生成：避免在渲染路径上同步遍历状态空间
  useEffect(() => {
    const timer = setTimeout(() => setDaily(getDailyPuzzle(new Date())), 0);
    return () => clearTimeout(timer);
  }, []);

  const groups = useMemo(() => {
    const mine = loadMyPuzzles();
    return [
      {
        label: '内置关卡',
        options: LEVELS.map((level) => ({
          key: `level:${level.id}`,
          label: `${level.name} · ${DIFFICULTY_LABELS[level.difficulty]}`,
          puzzle: level.puzzle,
        })),
      },
      {
        label: '每日挑战',
        options: daily
          ? [{ key: 'daily', label: `今日挑战 · 最优 ${DAILY_DEPTH} 步`, puzzle: daily }]
          : [],
      },
      {
        label: '我的谜题',
        options: mine.map((saved, index) => ({
          key: `mine:${index}`,
          label: saved.name,
          puzzle: saved.puzzle,
        })),
      },
    ];
  }, [daily]);

  const dailyPending = daily === null;

  return (
    <label className="puzzle-switcher" aria-label="切换谜题">
      <span className="puzzle-switcher__label">切换谜题</span>
      <select
        value={value}
        disabled={dailyPending}
        onChange={(e) => {
          const key = e.target.value;
          setValue(key);
          for (const group of groups) {
            const hit = group.options.find((o) => o.key === key);
            if (hit) onSelect(hit.puzzle);
          }
        }}
      >
        <option value="">{dailyPending ? '今日挑战生成中…' : `当前：${currentName}`}</option>
        {groups.map(
          (group) =>
            group.options.length > 0 && (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ),
        )}
      </select>
    </label>
  );
}
