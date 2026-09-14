/**
 * 校验结果面板：显示 validatePuzzle 的结构化错误。
 */
import type { ValidationResult } from '../../core/validator';

interface ValidationPanelProps {
  result: ValidationResult | null;
}

export default function ValidationPanel({ result }: ValidationPanelProps) {
  if (!result) return null;
  if (result.valid) {
    return (
      <div className="validation-panel validation-panel--ok" role="status">
        谜题合法，可以游玩或导出。
      </div>
    );
  }
  return (
    <div className="validation-panel validation-panel--error" role="alert">
      <h4>发现 {result.errors.length} 个问题：</h4>
      <ul>
        {result.errors.map((error, i) => (
          <li key={i}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
