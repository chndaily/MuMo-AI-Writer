import { Button } from "@/components/novel/tiptapNovel/ui/button";
import { Divider } from "antd";
import { RedoIcon, UndoIcon } from "lucide-react";
import { useEditor } from "novel";

export const FloatingStatusToolbar = () => {
  const { editor } = useEditor();

  if (!editor) return null;

  return (
    <div className="px-0.5 py-0.5 bg-primary rounded flex empty:hidden pointer-events-auto nc-editor-action-bubble">
      <div className="rounded bg-primary self-center px-3 py-1.5 text-xs text-white font-semibold whitespace-nowrap">
        <span className="whitespace-nowrap">16 Words</span>
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
