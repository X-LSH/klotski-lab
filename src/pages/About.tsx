/**
 * 关于页：项目定位、功能总览与协作约束说明。
 */
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <main className="about">
      <h2>关于 Klotski Lab</h2>
      <p>
        Klotski Lab（华容道实验室）是一个纯前端项目：它把华容道从一个“小游戏”
        扩展成 <strong>谜题 + 求解器 + 算法可视化</strong> 的实验平台。
      </p>

      <section>
        <h3>它和普通小游戏的区别</h3>
        <ul>
          <li>
            <strong>求解即验证</strong>：任意局面可一键求出最优解（BFS / A* / IDA\*），解法可直接回放；
          </li>
          <li>
            <strong>算法看得见</strong>：观测台实时展示搜索树的扩张过程、节点统计与多算法竞速对比；
          </li>
          <li>
            <strong>完全可定制</strong>：编辑器 + JSON 导入导出 + URL 分享，谜题即数据；
          </li>
          <li>
            <strong>可复现</strong>：随机谜题由种子决定，每日挑战同一天全网同一题。
          </li>
        </ul>
      </section>

      <section>
        <h3>技术架构</h3>
        <p>
          TypeScript + React 18 + Vite；核心规则引擎与求解算法完全独立于 UI，
          求解运行在 Web Worker 中（支持进度与取消）；数据持久化仅使用 localStorage；
          部署目标为 GitHub Pages 静态托管。
        </p>
      </section>

      <section>
        <h3>难度评估说明</h3>
        <p>
          难度评分是基于搜索空间的工程化指标（最优深度 + 可达状态规模 + 平均分支因子），
          不是“绝对科学”的难度度量，仅供关卡分档参考。
        </p>
      </section>

      <section>
        <h3>开发约束</h3>
        <p>
          本项目的全部协作者（含 AI）必须遵守根目录的 AGENTS.md：
          核心引擎不依赖 React、求解器不碰 DOM、UI 不复制规则逻辑。
        </p>
      </section>

      <p className="about__back">
        <Link to="/">返回首页</Link>
      </p>
    </main>
  );
}
