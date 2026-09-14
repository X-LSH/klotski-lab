// @vitest-environment jsdom
// 冒烟测试：首页能渲染出产品名、副标题与开始按钮
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Home from '../src/pages/Home';

describe('首页', () => {
  it('渲染产品名、副标题与开始按钮', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByText('Klotski Lab')).toBeTruthy();
    expect(screen.getByText('可视化华容道求解器与算法实验室')).toBeTruthy();
    expect(screen.getByRole('button', { name: '开始' })).toBeTruthy();
  });
});
