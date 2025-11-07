import { Button } from "@/components/novel/tiptapNovel/ui/button";
import { Divider } from "antd";
import { RedoIcon, UndoIcon } from "lucide-react";
import { useEditor } from "novel";
import { useMemo } from "react";

export const FloatingStatusToolbar = () => {
  const { editor } = useEditor();

  if (!editor) return null;

  // 计算选中文本的字数
  const selectedWordCount = useMemo(() => {
    if (!editor) return 0;
    
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    // 简单的字数统计，按空格分割单词
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [editor]);

  return (
    <div className="px-0.5 py-0.5 bg-primary rounded flex empty:hidden pointer-events-auto nc-editor-action-bubble">
      <div className="rounded bg-primary self-center px-3 py-1.5 text-xs text-white font-semibold whitespace-nowrap">
        <span className="whitespace-nowrap">{selectedWordCount} Words</span>
      </div>
      <Divider type="vertical" className="mx-0.5 h-full bg-white opacity-50 top-0" />
      <div className="flex gap-0.5 empty:hidden">
        <Button size="sm">
          <UndoIcon className="size-4" strokeWidth={2.3} />
        </Button>
        <Button size="sm">
          <RedoIcon className="size-4" strokeWidth={2.3} />
        </Button>
      </div>
    </div>
  );
};