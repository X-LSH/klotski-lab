/**
 * 全局错误边界：捕获渲染异常，显示用户友好的错误提示，
 * 绝不把 stack trace 作为主要 UI。
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 控制台保留完整信息便于排查，但不作为界面主要展示
    console.error('Klotski Lab 发生未捕获异常:', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, message: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="error-boundary" role="alert">
        <h1>页面出了点问题</h1>
        <p>应用遇到一个意外错误。你可以尝试重置界面；如果反复出现，请刷新页面或清除浏览器存储。</p>
        {this.state.message && <code className="error-boundary__message">{this.state.message}</code>}
        <button type="button" onClick={this.handleReset}>
          重试
        </button>
      </main>
    );
  }
}
