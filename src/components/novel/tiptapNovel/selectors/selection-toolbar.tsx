import { Button } from "@/components/novel/tiptapNovel/ui/button";
import { EditorBubbleItem, useEditor } from "novel";
import { FilePlusIcon, SquareDashedIcon, BookPlusIcon } from "lucide-react";

const SelectionToolbar = () => {
  const editor = useEditor();

  return (
    <div className="flex gap-0.5 flex-wrap">
      <EditorBubbleItem
        className="flex"
        onSelect={(editor) => {
          editor.chain().focus().clearNodes().run();
        }}
      >
        <Button className="flex items-center gap-2" title="片段" size="sm" variant="default">
          <FilePlusIcon className="w-4 h-4" /><span className="text-sm/none">片段</span>
        </Button>
      </EditorBubbleItem>
      <EditorBubbleItem
        className="flex"
        onSelect={(editor) => {
          editor.chain().focus().clearNodes().run();
        }}
      >
        <Button className="flex items-center gap-2" title="条目" size="sm" variant="default">
          <BookPlusIcon className="w-4 h-4" /><span className="text-sm/none">条目</span>
        </Button>
      </EditorBubbleItem>
      <EditorBubbleItem
        className="flex"
        onSelect={(editor) => {
          editor.chain().focus().clearNodes().run();
        }}
      >
        <Button className="flex items-center gap-2" title="选中" size="sm" variant="default">
          <SquareDashedIcon className="w-4 h-4" /><span className="text-sm/none">选中</span>
        </Button>
      </EditorBubbleItem>
    </div>
  );
};

export default SelectionToolbar;