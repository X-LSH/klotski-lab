import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Play from './pages/Play';

// 使用 HashRouter：GitHub Pages 纯静态托管无需配置服务端回退路由。
export default function App() {
  return (
    <HashRouter>
      <header className="app-header">
        <NavLink to="/" className="app-header__brand">
          Klotski Lab
        </NavLink>
        <nav className="app-header__nav" aria-label="主导航">
          <NavLink to="/">首页</NavLink>
          <NavLink to="/play">游戏</NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
      </Routes>
    </HashRouter>
  );
}
