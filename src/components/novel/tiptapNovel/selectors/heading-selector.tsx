import {
  Check,
  ChevronDown,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  type LucideIcon,
} from "lucide-react";
import { EditorBubbleItem, useEditor } from "novel";

import { Button } from "@/components/novel/tiptapNovel/ui/button";
import { Popover } from "antd";
import { useState } from "react";

export type SelectorItem = {
  name: string;
  icon: LucideIcon;
  command: (editor: ReturnType<typeof useEditor>["editor"]) => void;
  isActive: (editor: ReturnType<typeof useEditor>["editor"]) => boolean;
};

const items: SelectorItem[] = [

  {
    name: "标题1",
    icon: Heading1,
    command: (editor) => editor!.chain().focus().clearNodes().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor!.isActive("heading", { level: 1 }),
  },
  {
    name: "标题2",
    icon: Heading2,
    command: (editor) => editor!.chain().focus().clearNodes().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor!.isActive("heading", { level: 2 }),
  },
  {
    name: "标题3",
    icon: Heading3,
    command: (editor) => editor!.chain().focus().clearNodes().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor!.isActive("heading", { level: 3 }),
  },
];


export const HeadingSelector = () => {
  const [open, setOpen] = useState(false);
  const { editor } = useEditor();
  if (!editor) return null;
  const activeItem = items.filter((item) => item.isActive(editor)).pop() ?? {
    icon: Heading,
    name: "Heading",
  };

  const isList = editor.isActive("bulletList") || editor.isActive("orderedList");

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom"
      trigger="click"
      styles={{
        body: {
          padding: "8px 0",
        },
      }}
      content={
        <>
          {items.map((item) => (
            <EditorBubbleItem
              key={item.name}
              onSelect={(editor) => {
                item.command(editor);
                setOpen(false);
              }}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm hover:bg-primary/10"
            >
              <span className={activeItem.name === item.name ? "text-primary" : ""}>{item.name}</span>
              {activeItem.name === item.name && <Check className="h-4 w-4 text-primary" />}
            </EditorBubbleItem>
          ))}
          <EditorBubbleItem
            onSelect={(editor) => {
              editor.chain().focus().clearNodes().run();
              setOpen(false);
            }}
            className="cursor-pointer px-3 py-2 text-sm hover:bg-primary/10 border-t"
          >
            <span>正文</span>
          </EditorBubbleItem>
        </>
      }
    >
      <Button disabled={isList} size="sm" className="gap-2">
        <activeItem.icon className="size-4"></activeItem.icon>
        <ChevronDown className="h-4 w-4" />
      </Button>
    </Popover>
  );
};
