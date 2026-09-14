/**
 * 编辑器工具栏：验证 / 清空 / 加载经典 / 导出 / 导入。
 */
interface EditorToolbarProps {
  onValidate: () => void;
  onClear: () => void;
  onLoadClassic: () => void;
  onExport: () => void;
  onImport: () => void;
}

export default function EditorToolbar({
  onValidate,
  onClear,
  onLoadClassic,
  onExport,
  onImport,
}: EditorToolbarProps) {
  return (
    <div className="editor-toolbar" role="toolbar" aria-label="编辑器工具栏">
      <button type="button" onClick={onValidate}>
        验证
      </button>
      <button type="button" onClick={onLoadClassic}>
        加载经典谜题
      </button>
      <button type="button" onClick={onClear}>
        清空
      </button>
      <button type="button" onClick={onExport}>
        导出 JSON
      </button>
      <button type="button" onClick={onImport}>
        导入 JSON
      </button>
    </div>
  );
}
