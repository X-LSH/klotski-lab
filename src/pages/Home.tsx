import { Link, useNavigate } from 'react-router-dom';
import type { PuzzleDefinition } from '../types';
import { getDailyPuzzle } from '../generator/daily';

// 首页：产品定位（游玩 / 求解 / 创建 / 分析）+ 三个快捷入口。
export default function Home() {
  const navigate = useNavigate();

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
        <Link to="/play" className="home__entry home__entry--primary" role="button" aria-label="开始">
          开始（经典）
        </Link>
        <button
          type="button"
          className="home__entry"
          onClick={() => playPuzzle(getDailyPuzzle(new Date()))}
          aria-label="每日挑战"
        >
          每日挑战
        </button>
        <Link to="/editor" className="home__entry" role="button" aria-label="自定义谜题">
          自定义谜题
        </Link>
      </div>
    </main>
  );
}
