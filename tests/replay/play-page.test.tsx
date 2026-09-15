// @vitest-environment jsdom
// Play 页面基础渲染测试
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Play from '../../src/pages/Play';
import App from '../../src/App';

describe('Play 页面', () => {
  it('渲染棋盘与操作按钮', () => {
    render(
      <MemoryRouter>
        <Play />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('board')).toBeTruthy();
    expect(screen.getByRole('button', { name: '撤销' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '重做' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '重置' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '求解' })).toBeTruthy();
    // 初始未执行移动，撤销 / 重做不可用
    expect(
      (screen.getByRole('button', { name: '撤销' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: '重做' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('渲染全部 10 个棋子与出口', () => {
    render(
      <MemoryRouter>
        <Play />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('棋子 曹操')).toBeTruthy();
    expect(screen.getByLabelText('棋子 关羽')).toBeTruthy();
    expect(screen.getAllByLabelText('棋子 兵')).toHaveLength(4);
    expect(screen.getByLabelText('出口')).toBeTruthy();
  });
});

describe('App 路由', () => {
  it('默认渲染首页（App 自带路由，不能再包一层 Router）', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Klotski Lab' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '每日挑战' })).toBeTruthy();
  });
});
