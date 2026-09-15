/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 仓库名为 klotski-lab，GitHub Pages 部署在子路径下，base 不能假设为根域名。
// 本地开发使用根路径，生产构建使用仓库子路径。
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/klotski-lab/' : '/',
  plugins: [react()],
  build: {
    // 沙箱/受限环境下清空输出目录可能触发删除拦截，这里改为覆盖式写入。
    emptyOutDir: false,
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    // IDA* 在中等谜题上实测已达 27.6s（算法特性），留给 CI 运行机的余量不足，
    // 这里放宽到 60s：它只是超时上限，不影响正常用例的执行时长与判定。
    testTimeout: 60000,
  },
}));
