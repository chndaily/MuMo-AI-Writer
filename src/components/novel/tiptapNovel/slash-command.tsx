import {
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  MessageSquarePlus,
  Text,
  TextQuote,
} from "lucide-react";
import { Command, SuggestionItem, renderItems } from "novel";
import { uploadFn } from "./image-upload";
import { Children } from "react";
import { title } from "process";


interface suggestionOptions {
  title: string;
  children: SuggestionItem[]
}

export const suggestionOptions: suggestionOptions[] = [
  {
    title: "AI",
    children: [
      {
        title: "场景节拍",
        description: "一个关键时刻，重要的事情发生了变化，推动了叙事向前发展。",
        icon: <MessageSquarePlus size={18} />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setAiGeneration({ src: "https://x.com/seanpk/status/1800145949580517852" }).run();
        },
      },
      {
        title: "继续写作",
        description: "创建新的场景节拍以继续写作。",
        searchTerms: ["p", "paragraph"],
        icon: <Text size={18} />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setAiGeneration({ src: "https://x.com/seanpk/status/1800145949580517852" }).run();
        },
      },

    ]
  },
  {
    title: "世界观",
    children: [
      {
        title: "世界观扩展",
        description: "添加关于世界、角色或事件的额外信息，以跟踪您的故事弧线。",
        searchTerms: ["todo", "task", "list", "check", "checkbox"],
        icon: <CheckSquare size={18} />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
      },
    ]
  },
  {
    title: "格式化",
    children: [
      {
        title: "水平分割线",
        description: "创建一条水平线/横线来分隔内容。",
        searchTerms: ["p", "paragraph"],
        icon: <Text size={18} />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
        },
      },
      {
        title: "章节",
        description: "创建一个新的章节来容纳内容。",
        searchTerms: ["title", "big", "large"],
        icon: <Text size={18} />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
        },
      },
    ]
  },
  {
    title: "其它",
    children: [
      {
        title: "笔记",
        description: "创建一个类似笔记功能的区域。",
        searchTerms: ["note", "notes", "memo", "memos"],
        icon: <Text size={18} />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
        },
      },
    ]
  },
];

export const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionOptions,
    render: renderItems,
  },
});
