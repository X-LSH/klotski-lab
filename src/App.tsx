import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Play from './pages/Play';
import Levels from './pages/Levels';
import Editor from './pages/Editor';
import Observatory from './pages/Observatory';

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
          <NavLink to="/levels">关卡</NavLink>
          <NavLink to="/editor">编辑器</NavLink>
          <NavLink to="/observatory">观测台</NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
        <Route path="/levels" element={<Levels />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/observatory" element={<Observatory />} />
      </Routes>
    </HashRouter>
  );
}
