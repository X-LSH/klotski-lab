// @vitest-environment jsdom
/**
 * 算法观测台：可理解性守护。
 *
 * 这一页曾被反馈「打开不知道是干什么的、按钮也不了解」——
 * 根因是零说明（连「观察对象是固定的经典谜题」都没写）+ 按钮语义模糊。
 * 这组测试盯住「讲清楚」这件事，防止回归。
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Observatory from '../../src/pages/Observatory';
import { ALGORITHM_HINTS, TREE_LEGEND } from '../../src/components/observatory/labels';
import { LEVELS } from '../../src/generator/presets';

function renderPage() {
  return render(
    <MemoryRouter>
      <Observatory />
    </MemoryRouter>,
  );
}

describe('算法观测台', () => {
  it('开场说明讲清「在看什么」', () => {
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('每个圆点是一个局面');
    expect(text).toContain('连线是走一步');
  });

  it('观察对象可选，默认是可完整观察的中等谜题', () => {
    const { container } = renderPage();
    const select = container.querySelector('.observatory__subject-picker select') as HTMLSelectElement;
    expect(select).toBeTruthy();
    // 选项覆盖全部内置关卡
    expect(select.querySelectorAll('option').length).toBe(LEVELS.length);
    expect(select.value).toBe('warmup');
  });

  it('如实说明可视化上限：小题能画完，大题的深层看不到', () => {
    const { container } = renderPage();
    // 默认是中等谜题：说明它通常能完整画出来
    expect(container.textContent ?? '').toContain('通常能完整画出来');
  });

  it('切换到经典谜题后，提示随之更新为「看不完整」', () => {
    const { container } = renderPage();
    fireEvent.change(container.querySelector('.observatory__subject-picker select') as Element, {
      target: { value: 'classic' },
    });
    const text = container.textContent ?? '';
    expect(text).toContain('横刀立马');
    expect(text).toContain('116 步');
    expect(text).toContain('换一道较小的谜题');
  });

  it('按钮文案自解释（不再用「开始 / 竞速全部算法」这类模糊说法）', () => {
    renderPage();
    expect(screen.getByRole('button', { name: '开始搜索' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '重置' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '三算法竞速对比' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '开始' })).toBeNull();
    expect(screen.queryByRole('button', { name: '竞速全部算法' })).toBeNull();
  });

  it('算法选择旁给出当前算法的特点说明，并随选择切换', () => {
    const { container } = renderPage();
    expect(container.textContent).toContain(ALGORITHM_HINTS.bfs);
    fireEvent.click(screen.getByRole('radio', { name: 'A*' }));
    expect(container.textContent).toContain(ALGORITHM_HINTS.astar);
  });

  it('空态告诉用户「下一步点哪里、会出现什么」', () => {
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('点「开始搜索」后');
    expect(text).toContain('点「三算法竞速对比」');
    expect(text).toContain('在左侧搜索树里点任意一个圆点');
  });

  it('搜索树给出圆点图例', () => {
    renderPage();
    const legend = screen.getByLabelText('图例');
    for (const item of TREE_LEGEND) {
      expect(legend.textContent).toContain(item.text);
    }
  });

  it('实时统计的每个指标都带解释（title）', () => {
    const { container } = renderPage();
    const items = container.querySelectorAll('.search-stats__item');
    expect(items.length).toBeGreaterThan(0);
    items.forEach((item) => {
      expect((item as HTMLElement).title.length).toBeGreaterThan(0);
    });
  });
});
