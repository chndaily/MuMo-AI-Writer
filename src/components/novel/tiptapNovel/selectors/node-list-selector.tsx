import {
  Check,
  ChevronDown,
  ListOrdered,
  List,
  ListX,
  ListPlus,
  type LucideIcon,
} from "lucide-react";
import { EditorBubbleItem, useEditor } from "novel";

import { Button } from "@/components/novel/tiptapNovel/ui/button";
import { Popover } from "antd";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/utils";


// 获取当前列表项的索引
const getCurrentListItemIndex = (editor: ReturnType<typeof useEditor>["editor"], level = 0) => {
  if (!editor) return -1;

  const { from } = editor.view.state.selection;
  const resolvedFrom = editor.view.state.doc.resolve(from);

  let foundLists = 0;

  // 查找指定层级的列表项
  for (let i = resolvedFrom.depth; i >= 0; i--) {
    if (resolvedFrom.node(i).type.name === 'listItem') {
      const parentDepth = i - 1;
      if (parentDepth >= 0) {
        const parentType = resolvedFrom.node(parentDepth).type.name;
        if (parentType === 'bulletList' || parentType === 'orderedList') {
          if (foundLists === level) {
            return resolvedFrom.index(parentDepth);
          }
          foundLists++;
        }
      }
    }
  }

  return -1;
};

const selectCurrentList = (editor: ReturnType<typeof useEditor>["editor"]) => {
  const { from, to } = editor!.view.state.selection;
  const resolvedFrom = editor!.view.state.doc.resolve(from);
  const resolvedTo = editor!.view.state.doc.resolve(to);
  // 向上查找列表节点
  let listDepth = -1;
  for (let i = resolvedFrom.depth; i >= 0; i--) {
    const node = resolvedFrom.node(i);
    if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
      listDepth = i;
      break;
    }
  }
  if (listDepth >= 0) {
    const listStart = resolvedFrom.start(listDepth);
    const listEnd = resolvedFrom.end(listDepth);
    // 选中整个列表
    editor!.chain()
      .focus()
      .setTextSelection({ from: listStart, to: listEnd })
      .run();
  }
}

// 切换列表类型时全部转换
const switchListType = (editor: ReturnType<typeof useEditor>["editor"], type: "bulletList" | "orderedList") => {
  if (!editor) return;
  if (editor.isActive(type)) return;

  // 检查当前是否在列表中
  const currentListType = editor.isActive('bulletList') ? 'bulletList' :
    editor.isActive('orderedList') ? 'orderedList' : null;

  if (!currentListType) {
    // 不在列表中，直接创建
    editor.chain().focus()[type === 'bulletList' ? 'toggleBulletList' : 'toggleOrderedList']().run();
    return;
  }

  selectCurrentList(editor);

  // 根据当前列表类型进行转换
  if (type === 'orderedList') {
    editor.chain().focus().toggleOrderedList().run();
  } else if (type === 'bulletList') {
    editor.chain().focus().toggleBulletList().run();
  }
};

// 减少层级
const handleDecreaseLevel = (editor: ReturnType<typeof useEditor>["editor"]) => {
  selectCurrentList(editor);
  // 检查当前是否在列表中且有缩进
  if (editor!.isActive("bulletList") || editor!.isActive("orderedList")) {
    // 在列表中时，减少缩进层级
    editor!.chain().focus().liftListItem("listItem").run();
  }
};

// 增加层级
const handleIncreaseLevel = (editor: ReturnType<typeof useEditor>["editor"]) => {
  // if (allowIncreaseLevel) return;
  // 检查当前是否在列表中
  if (editor!.isActive("bulletList") || editor!.isActive("orderedList")) {
    // 在列表中时，增加缩进层级
    editor!.chain().focus().sinkListItem("listItem").run();
  } else {
    // 不在列表中时，创建新的列表项
    editor!.chain().focus().clearNodes().toggleBulletList().run();
  }
};

export type SelectorItem = {
  name: string;
  icon: LucideIcon;
  command: (editor: ReturnType<typeof useEditor>["editor"]) => void;
  isActive: (editor: ReturnType<typeof useEditor>["editor"]) => boolean;
};

const items: SelectorItem[] = [
  {
    name: "Bullet List",
    icon: List,
    command: (editor) => switchListType(editor, "bulletList"),
    isActive: (editor) => editor!.isActive("bulletList"),
  },
  {
    name: "Numbered List",
    icon: ListOrdered,
    command: (editor) => switchListType(editor, "orderedList"),
    isActive: (editor) => editor!.isActive("orderedList"),
  },
];

export const NodeListSelector = () => {
  const [open, setOpen] = useState(false);
  const { editor } = useEditor();
  const [allowIncreaseLevel, setAllowIncreaseLevel] = useState(false);
  if (!editor) return null;
  const activeItem = items.filter((item) => item.isActive(editor)).pop()
  // 在列表中,且列表项序号不是1
  useEffect(() => {
    const isList = editor.isActive("bulletList") || editor.isActive("orderedList");
    const currentListItemIndex = getCurrentListItemIndex(editor, 0);
    const isFirstItem = currentListItemIndex === 0;
    setAllowIncreaseLevel(isList && !isFirstItem);
  });

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
              className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-primary/10"
            >
              <div className="flex items-center space-x-2">
                <item.icon className={activeItem?.name === item.name ? "text-primary size-5" : "size-5"} />
                <span className={activeItem?.name === item.name ? "text-primary" : ""}>{item.name}</span>
              </div>
              {activeItem?.name === item.name && <Check className="h-4 w-4 text-primary" />}
            </EditorBubbleItem>
          ))}
          <EditorBubbleItem
            onSelect={handleIncreaseLevel}
            className={cn("space-x-2 flex items-center cursor-pointer px-2 py-1 text-sm hover:bg-primary/10 border-t", {
              "opacity-50 cursor-not-allowed": !allowIncreaseLevel,
            })}
          >
            <ListPlus className="size-5" />
            <span>增加层级</span>
          </EditorBubbleItem>
          <EditorBubbleItem
            onSelect={handleDecreaseLevel}
            className="space-x-2 flex items-center cursor-pointer px-2 py-1 text-sm hover:bg-primary/10 border-t"
          >
            <ListX className="size-5" />
            <span>清除列表</span>
          </EditorBubbleItem>
        </>
      }
    >
      <Button size="sm" variant={activeItem ? "light" : "default"} className="gap-2">
        {activeItem ? (
          <activeItem.icon className="size-4"></activeItem.icon>
        ) : (
          <List className="size-4"></List>
        )}
        <ChevronDown className="h-4 w-4" />
      </Button>
    </Popover>
  );
};
