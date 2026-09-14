import { Link } from 'react-router-dom';

// 首页：产品名、副标题与开始入口。
export default function Home() {
  return (
    <main className="home">
      <h1 className="home__title">Klotski Lab</h1>
      <p className="home__subtitle">可视化华容道求解器与算法实验室</p>
      <Link to="/play" className="home__start" role="button" aria-label="开始">
        开始
      </Link>
    </main>
  );
}
