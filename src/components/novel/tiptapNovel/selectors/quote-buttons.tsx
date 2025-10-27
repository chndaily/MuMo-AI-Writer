import { Button } from "@/components/novel/tiptapNovel/ui/button";
import { TextQuoteIcon } from "lucide-react";
import { EditorBubbleItem, useEditor } from "novel";

export const QuoteButtons = () => {
  const { editor } = useEditor();
  if (!editor) return null;
  const isList = editor.isActive("bulletList") || editor.isActive("orderedList");

  return (
    <EditorBubbleItem
      className="flex"
      onSelect={(editor) => {
        if (editor.isActive("blockquote")) {
          editor.chain().focus().clearNodes().run();
        } else {
          editor.chain().focus().clearNodes().toggleBlockquote().run();
        }
      }}
    >
      <Button disabled={isList} title="引用" size="sm" variant={editor.isActive("blockquote") ? "light" : "default"}>
        <TextQuoteIcon className="w-4 h-4" />
      </Button>
    </EditorBubbleItem>
  );
};
