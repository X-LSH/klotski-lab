/**
 * 关卡页：全部关卡、难度 / 标签过滤、每日挑战、随机关卡生成。
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PuzzleDefinition } from '../types';
import { LEVELS, type LevelDefinition } from '../generator/presets';
import { TIER_LABELS, type DifficultyTier } from '../generator/difficulty';
import { getDailyPuzzle } from '../generator/daily';
import { generatePuzzle, MAX_GENERATE_STEPS } from '../generator/generator';
import { solvePuzzle } from '../solver/solver-service';

export default function Levels() {
  const navigate = useNavigate();
  const [tierFilter, setTierFilter] = useState<DifficultyTier | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [depths, setDepths] = useState<Record<string, number>>({});
  const [seedInput, setSeedInput] = useState('2026');
  const [stepsInput, setStepsInput] = useState(60);

  const dailyPuzzle = useMemo(() => getDailyPuzzle(new Date()), []);

  const allTags = useMemo(
    () => [...new Set(LEVELS.flatMap((level) => level.tags))],
    [],
  );

  // 异步计算各关卡最优步数（只算一次，结果缓存到本地状态）
  useEffect(() => {
    let cancelled = false;
    const compute = async () => {
      for (const level of LEVELS) {
        if (level.optimalDepth !== undefined || cancelled) continue;
        const result = await solvePuzzle({ puzzle: level.puzzle, initialState: { pieces: level.puzzle.pieces.map((p) => ({ ...p })) } }, 'bfs');
        if (cancelled) return;
        if (result.solved) {
          setDepths((prev) => ({ ...prev, [level.id]: result.depth }));
        }
      }
    };
    compute();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = LEVELS.filter(
    (level) =>
      (tierFilter === 'all' || level.difficulty === tierFilter) &&
      (tagFilter === 'all' || level.tags.includes(tagFilter)),
  );

  const playPuzzle = (puzzle: PuzzleDefinition) => {
    navigate('/play', { state: { puzzle } });
  };

  const handleGenerate = () => {
    const seed = Number(seedInput);
    if (!Number.isFinite(seed)) return;
    playPuzzle(generatePuzzle({ seed, steps: stepsInput }));
  };

  const levelDepth = (level: LevelDefinition) =>
    level.optimalDepth ?? depths[level.id] ?? null;

  return (
    <main className="levels">
      <h2 className="levels__title">关卡</h2>

      {/* 每日挑战 */}
      <section className="levels__daily" aria-label="每日挑战">
        <div>
          <h3>每日挑战</h3>
          <p>{dailyPuzzle.name}：同一天所有玩家面对同一个谜题。</p>
        </div>
        <button type="button" onClick={() => playPuzzle(dailyPuzzle)}>
          开始挑战
        </button>
      </section>

      {/* 随机关卡生成 */}
      <section className="levels__generator" aria-label="随机关卡">
        <h3>随机关卡</h3>
        <div className="levels__generator-form">
          <label>
            种子
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              aria-label="随机种子"
            />
          </label>
          <label>
            打乱步数
            <input
              type="number"
              min={1}
              max={MAX_GENERATE_STEPS}
              value={stepsInput}
              onChange={(e) =>
                setStepsInput(
                  Math.min(Math.max(1, Number(e.target.value) || 1), MAX_GENERATE_STEPS),
                )
              }
              aria-label="打乱步数"
            />
          </label>
          <button type="button" onClick={handleGenerate}>
            生成并游玩
          </button>
        </div>
        <p className="levels__hint">同一种子生成的谜题完全相同，可以与朋友比拼同一局。</p>
      </section>

      {/* 过滤器 */}
      <div className="levels__filters">
        <label>
          难度
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as DifficultyTier | 'all')}
            aria-label="按难度过滤"
          >
            <option value="all">全部</option>
            {(['easy', 'normal', 'hard', 'expert'] as const).map((tier) => (
              <option key={tier} value={tier}>
                {TIER_LABELS[tier]}
              </option>
            ))}
          </select>
        </label>
        <label>
          标签
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            aria-label="按标签过滤"
          >
            <option value="all">全部</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 关卡卡片 */}
      <div className="levels__grid">
        {filtered.map((level) => (
          <button
            key={level.id}
            type="button"
            className="level-card"
            onClick={() => playPuzzle(level.puzzle)}
            aria-label={`游玩 ${level.name}`}
          >
            <div className="level-card__header">
              <span className="level-card__name">{level.name}</span>
              <span className={`level-card__tier level-card__tier--${level.difficulty}`}>
                {TIER_LABELS[level.difficulty]}
              </span>
            </div>
            <p className="level-card__desc">{level.description}</p>
            <div className="level-card__meta">
              <span>最优：{levelDepth(level) ?? '计算中…'}</span>
              <span className="level-card__tags">
                {level.tags.map((tag) => (
                  <span key={tag} className="level-card__tag">
                    {tag}
                  </span>
                ))}
              </span>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
