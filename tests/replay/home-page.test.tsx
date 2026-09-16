// @vitest-environment jsdom
// 首页：内置关卡一览（把「选谜题」放回首页的主入口）
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Home from '../../src/pages/Home';
import { LEVELS } from '../../src/generator/presets';

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<div data-testid="play-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('首页', () => {
  it('渲染出全部内置关卡，每行可点开局', () => {
    renderHome();
    const rows = screen.getAllByLabelText(/^开始 /);
    expect(rows).toHaveLength(LEVELS.length);
    for (const level of LEVELS) {
      expect(screen.getByLabelText(`开始 ${level.name}`)).toBeTruthy();
    }
  });

  it('点击关卡行进入游戏页', () => {
    renderHome();
    // 用 aria-label 精确定位：按文本匹配会命中描述里含「横刀立马」的「兵临城下」行
    fireEvent.click(screen.getByLabelText('开始 横刀立马'));
    expect(screen.getByTestId('play-page')).toBeTruthy();
  });

  it('保留三个快捷入口', () => {
    renderHome();
    expect(screen.getByLabelText('开始游戏')).toBeTruthy();
    expect(screen.getByLabelText('每日挑战')).toBeTruthy();
    expect(screen.getByLabelText('自定义谜题')).toBeTruthy();
  });
});
