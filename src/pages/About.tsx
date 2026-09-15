/**
 * 关于页：面向访客的简介。不包含技术架构、开发约束等内部实现细节 ——
 * 这是一个演示网站，访客关心的是「这是什么、能做什么」。
 */
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <main className="about">
      <h2>关于 Klotski Lab</h2>
      <p>
        Klotski Lab（华容道实验室）把华容道从一个「小游戏」
        扩展成 <strong>谜题 + 求解器 + 算法可视化</strong> 的实验平台。
      </p>

      <section>
        <h3>它能做什么</h3>
        <ul>
          <li>
            <strong>游玩</strong>：拖动棋子解谜，支持撤销 / 重做 / 进度保存；
          </li>
          <li>
            <strong>求解</strong>：任意局面一键求出最优解，解法可直接回放；
          </li>
          <li>
            <strong>创建</strong>：用编辑器设计你自己的谜题 —— 棋盘大小、棋子形状与名称、
            目标规则都由你决定，然后通过链接分享给别人；
          </li>
          <li>
            <strong>分析</strong>：观测台把求解器的每一步搜索都画出来，三种算法同台竞速。
          </li>
        </ul>
      </section>

      <section>
        <h3>每日挑战</h3>
        <p>
          每天一道新谜题，同一天所有人拿到的是同一道。最优解固定为 36 步，
          大约几分钟到十几分钟可以完成。
        </p>
      </section>

      <p className="about__back">
        <Link to="/">返回首页</Link>
      </p>
    </main>
  );
}
