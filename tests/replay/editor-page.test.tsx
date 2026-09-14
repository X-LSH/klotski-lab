// @vitest-environment jsdom
// 编辑器页面基础渲染测试
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Editor from '../../src/pages/Editor';

describe('编辑器页面', () => {
  it('渲染棋盘、工具与属性面板', () => {
    render(
      <MemoryRouter>
        <Editor />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('editor-board')).toBeTruthy();
    expect(screen.getByRole('button', { name: '验证' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '加载经典谜题' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '清空' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '导出 JSON' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '导入 JSON' })).toBeTruthy();
    // 棋子面板包含四种尺寸与出口 / 删除工具
    expect(screen.getByRole('button', { name: '1 × 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '2 × 2' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '设置出口' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '删除' })).toBeTruthy();
  });

  it('默认加载经典谜题：渲染 10 个可编辑棋子', () => {
    render(
      <MemoryRouter>
        <Editor />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('编辑棋子 曹操')).toBeTruthy();
    expect(screen.getAllByLabelText('编辑棋子 兵')).toHaveLength(4);
  });
});
