import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PuzzleDefinition } from '../types';
import { getDailyPuzzle } from '../generator/daily';
import { LEVELS } from '../generator/presets';
import { DIFFICULTY_LABELS } from '../components/copy';

// 首页：产品定位（游玩 / 求解 / 创建 / 分析）+ 三个快捷入口。
export default function Home() {
  const navigate = useNavigate();
  // 每日挑战的生成要遍历整个状态空间（约 0.7s），异步预生成避免点击时卡顿
  const [daily, setDaily] = useState<PuzzleDefinition | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDaily(getDailyPuzzle(new Date())), 0);
    return () => clearTimeout(timer);
  }, []);

  const playPuzzle = (puzzle: PuzzleDefinition) => {
    navigate('/play', { state: { puzzle } });
  };

  return (
    <main className="home">
      <h1 className="home__title">Klotski Lab</h1>
      <p className="home__subtitle">可视化华容道求解器与算法实验室</p>

      <div className="home__features">
        <div className="home__feature">
          <h3>游玩</h3>
          <p>拖动棋子，撤销 / 重做，手机同样流畅。</p>
        </div>
        <div className="home__feature">
          <h3>求解</h3>
          <p>BFS / A* / IDA* 后台求解，最优解可回放。</p>
        </div>
        <div className="home__feature">
          <h3>创建</h3>
          <p>编辑器自定义谜题，JSON 与链接一键分享。</p>
        </div>
        <div className="home__feature">
          <h3>分析</h3>
          <p>观测台可视化搜索过程，三种算法同台竞速。</p>
        </div>
      </div>

      <div className="home__entries">
        <Link to="/play" className="home__entry home__entry--primary" role="button" aria-label="开始游戏">
          开始游戏
        </Link>
        <button
          type="button"
          className="home__entry"
          onClick={() => daily && playPuzzle(daily)}
          disabled={!daily}
          aria-label="每日挑战"
        >
          {daily ? '每日挑战' : '每日挑战 · 生成中…'}
        </button>
        <Link to="/editor" className="home__entry" role="button" aria-label="自定义谜题">
          自定义谜题
        </Link>
      </div>

      {/* 关卡一览：一行一关，点行即开局 —— 把「选谜题」从导航里挪回首页，
          也让首屏具备工具站该有的信息密度。 */}
      <section>
        <h2 className="home__section-title">内置关卡</h2>
        <div className="home__levels" role="list">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              role="listitem"
              className="home__level"
              aria-label={`开始 ${level.name}`}
              onClick={() => playPuzzle(level.puzzle)}
            >
              <span className="home__level-name">{level.name}</span>
              <span className="home__level-desc">{level.description}</span>
              <span className="home__level-meta">
                <span className="home__level-tier">{DIFFICULTY_LABELS[level.difficulty]}</span>
                {level.optimalDepth !== undefined && (
                  <span className="home__level-optimal">最优 {level.optimalDepth} 步</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
