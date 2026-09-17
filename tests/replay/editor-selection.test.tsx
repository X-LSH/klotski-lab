// @vitest-environment jsdom
/**
 * 编辑器：选中态的可辨识度守护。
 *
 * 用户反馈「选中某个棋子时，没有已经选中的感觉」——
 * 根因是选中态只有一个 1px 的 outline，在深色棋盘上几乎看不见。
 * 现在选中由四个信号共同表达，这组测试盯住「信号确实挂上了」，
 * 并盯住「面板与棋盘同步」这条呼应关系。
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Editor from '../../src/pages/Editor';

function renderEditor() {
  return render(
    <MemoryRouter>
      <Editor />
    </MemoryRouter>,
  );
}

/** 编辑器的棋子在 pointerdown 时选中（与拖动共用同一次按下）。
 *  同名棋子可能不止一个（经典谜题里有 4 个「兵」），按下标取。 */
function selectPiece(label: string, index = 0) {
  const all = screen.getAllByLabelText(`编辑棋子 ${label}`);
  const piece = all[Math.min(index, all.length - 1)];
  fireEvent.pointerDown(piece, { clientX: 10, clientY: 10, button: 0 });
  return piece;
}

describe('编辑器选中态', () => {
  it('所有编辑器棋子都带可编辑标记（悬停提示的前提）', () => {
    const { container } = renderEditor();
    const pieces = container.querySelectorAll('.piece--editable');
    expect(pieces.length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.piece').length).toBe(pieces.length);
  });

  it('初始没有选中任何棋子', () => {
    const { container } = renderEditor();
    expect(container.querySelectorAll('.piece--selected').length).toBe(0);
    expect(container.textContent).not.toContain('已选中');
  });

  it('点击棋子后它成为唯一被选中的对象，并把状态告诉辅助技术', () => {
    const { container } = renderEditor();
    selectPiece('曹操');
    const selected = container.querySelectorAll('.piece--selected');
    expect(selected.length).toBe(1);
    expect(selected[0].getAttribute('aria-label')).toBe('编辑棋子 曹操');
    expect(selected[0].getAttribute('aria-pressed')).toBe('true');
    // 其余棋子必须明确为「未选中」，否则读屏用户无法区分
    const others = Array.from(container.querySelectorAll('.piece--editable')).filter(
      (el) => !el.classList.contains('piece--selected'),
    );
    expect(others.length).toBeGreaterThan(0);
    for (const el of others) {
      expect(el.getAttribute('aria-pressed')).toBe('false');
    }
  });

  it('切换选中：新棋子接替，旧棋子回到未选中', () => {
    const { container } = renderEditor();
    selectPiece('曹操');
    selectPiece('兵', 0);
    const selected = container.querySelectorAll('.piece--selected');
    expect(selected.length).toBe(1);
    expect(selected[0].getAttribute('aria-label')).toBe('编辑棋子 兵');
  });

  it('属性面板同步标出「已选中」并指出它所在的格位', () => {
    const { container } = renderEditor();
    selectPiece('曹操');
    expect(container.textContent).toContain('已选中');
    expect(container.querySelector('.puzzle-props__group--selected')).toBeTruthy();
    // 曹操在经典谜题里位于第一行第二列（x=1, y=0）→ 展示为「第 2 列、第 1 行」
    expect(container.textContent).toContain('第 2 列、第 1 行');
  });

  it('点击棋盘空白处取消选中，面板标记同步消失', () => {
    const { container } = renderEditor();
    selectPiece('曹操');
    expect(container.querySelectorAll('.piece--selected').length).toBe(1);

    // 「选择 / 移动」工具下点空白 → onSelect(null)
    const board = screen.getByTestId('editor-board');
    fireEvent.pointerDown(board, { clientX: 0, clientY: 0, button: 0 });

    expect(container.querySelectorAll('.piece--selected').length).toBe(0);
    expect(container.textContent).not.toContain('已选中');
  });
});
