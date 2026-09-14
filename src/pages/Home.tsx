// 首页（阶段 0 最小版本）：只展示产品名、副标题与开始按钮。
export default function Home() {
  return (
    <main className="home">
      <h1 className="home__title">Klotski Lab</h1>
      <p className="home__subtitle">可视化华容道求解器与算法实验室</p>
      <button type="button" className="home__start">
        开始
      </button>
    </main>
  );
}
