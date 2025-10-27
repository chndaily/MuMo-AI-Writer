"use client";
import { defaultEditorContent } from "@/constants/editorContent";
import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorCommandGroup,
  EditorContent,
  type EditorInstance,
  EditorRoot,
  ImageResizer,
  type JSONContent,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
} from "novel";
import { useEffect, useRef, useState, useContext, forwardRef } from "react";
import { defaultExtensions } from "./extensions";
import { ColorSelector } from "./selectors/color-selector";
import { FloatingStatusToolbar } from "./selectors/floating-status-toolbar";

import GenerativeMenuSwitch from "./generative/generative-menu-switch";
import { uploadFn } from "./image-upload";
import { TextButtons } from "./selectors/text-buttons";
import { slashCommand, suggestionOptions } from "./slash-command";
import { useDebounce } from "@/hooks";
import { Divider } from "antd";
import { QuoteButtons } from "./selectors/quote-buttons";
import { HeadingSelector } from "./selectors/heading-selector";
import { NodeListSelector } from "./selectors/node-list-selector";
import { createStyles } from "antd-style";
import { cn } from "@/utils";
import SelectionToolbar from "./selectors/selection-toolbar";
import GenerateSelector from "./selectors/generate-selector";
import TiptapProvider, { TiptapContext, useTiptapContext } from "./tiptap-provider";
import TaskFloatingMenu from "./ui/TaskFloatingMenu";
// const hljs = require("highlight.js");

const extensions = [...defaultExtensions, slashCommand];


const TaskList = () => {
  const { tasks } = useTiptapContext(state => state)
  return (
    <>
      {tasks.map((task) => (
        <TaskFloatingMenu key={task.id} task={task} />
      ))}
    </>
  )
}

const TailwindAdvancedEditor = forwardRef<{ commands?: any; editor?: any; getContent?: () => string; getMarkdown?: () => string }, { content: string | JSONContent; onContentChange?: (content: string) => void } & any>(({ content: propContent, onContentChange, ...props }, ref) => {
  const { styles } = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialContent, setInitialContent] = useState<null | JSONContent>(null);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [charsCount, setCharsCount] = useState(0);
  
  // 用于引用编辑器实例的ref
  const tiptapEditorRef = useRef<any>(null);

  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  //Apply Codeblock Highlighting on the HTML from editor.getHTML()
  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, "text/html");
    doc.querySelectorAll("pre code").forEach((el) => {
      // @ts-ignore
      // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
      // hljs.highlightElement(el);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  const debouncedUpdates = useDebounce(async (editor: EditorInstance) => {
    const json = editor.getJSON();
    setCharsCount(editor.storage.characterCount.words());
    window.localStorage.setItem("html-content", highlightCodeblocks(editor.getHTML()));
    window.localStorage.setItem("novel-content", JSON.stringify(json));
    window.localStorage.setItem("markdown", editor.storage.markdown.getMarkdown());
    setSaveStatus("Saved");
  }, 500);

  const [editorKey, setEditorKey] = useState(0);

  // 当propContent变化时，更新编辑器内容
  useEffect(() => {
    console.log('编辑器接收到新内容:', propContent);
    if (propContent !== undefined && tiptapEditorRef.current) {
      try {
        console.log('强制更新编辑器内容:', propContent);
        
        // 尝试将字符串内容解析为JSON格式
        let contentJson;
        if (typeof propContent === 'string') {
          // 将markdown格式转换为JSONContent
          contentJson = parseMarkdownToJSON(propContent);
        } else {
          contentJson = propContent || defaultEditorContent;
        }
        
        console.log('解析后的内容:', contentJson);
        
        // 强制更新编辑器内容，但不触发onUpdate事件以避免循环更新
        if (tiptapEditorRef.current.commands) {
          tiptapEditorRef.current.commands.setContent(contentJson, false);
        }
      } catch (e) {
        console.error("更新编辑器内容失败:", e);
      }
    } else if (propContent !== undefined && !tiptapEditorRef.current) {
      // 如果编辑器还没有初始化，更新initialContent状态
      try {
        let contentJson;
        if (typeof propContent === 'string') {
          contentJson = parseMarkdownToJSON(propContent);
        } else {
          contentJson = propContent || defaultEditorContent;
        }
        console.log('设置初始内容:', contentJson);
        setInitialContent(contentJson);
      } catch (e) {
        console.error("解析外部content失败:", e);
        setInitialContent(defaultEditorContent);
      }
    }
  }, [propContent]);
  
  // 改进ref传递逻辑，提供命令接口给父组件
  useEffect(() => {
    if (ref) {
      // 等待编辑器完全初始化后再设置ref
      const timer = setTimeout(() => {
        // 直接使用tiptapEditorRef获取编辑器实例
        const editorInstance = tiptapEditorRef.current;
        
        if (editorInstance) {
          // 提供更完整的接口给父组件
          if (typeof ref === 'function') {
            ref({
              commands: editorInstance.commands,
              editor: editorInstance,
              getContent: () => editorInstance.getHTML(),
              getMarkdown: () => editorInstance.storage.markdown.getMarkdown()
            });
          } else if (ref && 'current' in ref) {
            ref.current = {
              commands: editorInstance.commands,
              editor: editorInstance,
              getContent: () => editorInstance.getHTML(),
              getMarkdown: () => editorInstance.storage.markdown.getMarkdown()
            };
          }
        }
      }, 100); // 短暂延迟确保编辑器已初始化
      
      // 清理定时器
      return () => clearTimeout(timer);
    }
  }, [ref]);

  // 简单的markdown解析函数
  const parseMarkdownToJSON = (markdown: string): JSONContent => {
    try {
      // 如果内容已经是HTML格式，我们先将其转换为纯文本
      let cleanMarkdown = markdown;
      if (/<[a-z][\s\S]*>/i.test(markdown)) {
        // 简单的HTML到文本转换
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = markdown;
        cleanMarkdown = tempDiv.textContent || tempDiv.innerText || '';
      }
      
      // 不再进行反斜杠清理，让正常的Markdown解析处理内容
      // 只保留原始的Markdown内容进行解析
      
      const lines = cleanMarkdown.split('\n');
      const content: any[] = [];
      let currentParagraph: any = null;
      let currentText: any[] = [];

      lines.forEach(line => {
        if (line.trim() === '') {
          // 处理空行，结束当前段落
          if (currentParagraph) {
            currentParagraph.content = currentText;
            content.push(currentParagraph);
            currentParagraph = null;
            currentText = [];
          }
          return;
        }

        // 处理标题
        if (line.startsWith('# ')) {
          if (currentParagraph) {
            currentParagraph.content = currentText;
            content.push(currentParagraph);
            currentParagraph = null;
            currentText = [];
          }
          content.push({
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: line.substring(2).trim() }]
          });
          return;
        }
        if (line.startsWith('## ')) {
          if (currentParagraph) {
            currentParagraph.content = currentText;
            content.push(currentParagraph);
            currentParagraph = null;
            currentText = [];
          }
          content.push({
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: line.substring(3).trim() }]
          });
          return;
        }
        if (line.startsWith('### ')) {
          if (currentParagraph) {
            currentParagraph.content = currentText;
            content.push(currentParagraph);
            currentParagraph = null;
            currentText = [];
          }
          content.push({
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: line.substring(4).trim() }]
          });
          return;
        }

        // 默认处理为段落
        if (!currentParagraph) {
          currentParagraph = { type: 'paragraph' };
        }
        if (currentText.length > 0) {
          currentText.push({ type: 'text', text: '\n' + line });
        } else {
          currentText.push({ type: 'text', text: line });
        }
      });

      // 添加最后一个段落（如果有）
      if (currentParagraph) {
        currentParagraph.content = currentText;
        content.push(currentParagraph);
      }

      return {
        type: 'doc',
        content: content.length > 0 ? content : [{
          type: 'paragraph',
          content: [{ type: 'text', text: '开始你的创作之旅...' }]
        }]
      };
    } catch (e) {
      console.error('解析markdown失败:', e);
      return defaultEditorContent;
    }
  };

  if (!initialContent) {
    // 如果没有初始内容，尝试使用propContent
    if (propContent !== undefined) {
      try {
        let contentJson;
        if (typeof propContent === 'string') {
          contentJson = parseMarkdownToJSON(propContent);
        } else {
          contentJson = propContent || defaultEditorContent;
        }
        console.log('使用propContent作为初始内容:', contentJson);
        setInitialContent(contentJson);
        return (
          <div className="flex items-center justify-center h-full">
            <div>编辑器加载中...</div>
          </div>
        );
      } catch (e) {
        console.error("解析初始内容失败:", e);
      }
    }
    
    // 默认使用defaultEditorContent
    console.log('使用默认内容作为初始内容');
    setInitialContent(defaultEditorContent);
    return (
      <div className="flex items-center justify-center h-full">
        <div>编辑器加载中...</div>
      </div>
    );
  }

  console.log("渲染编辑器，初始内容:", initialContent);

  return (
    <TiptapProvider tasks={[]}>
      <div className={cn(styles, "relative w-full tt-editor h-full")}>
        <div className="flex absolute right-5 top-2 z-10 mb-5 gap-2">
          <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">{saveStatus}</div>
        </div>
        <EditorRoot>
          <EditorContent
            key={editorKey}
            initialContent={initialContent}
            extensions={extensions}
            className="tt-editor__manuscript p-4 pr-32 pt-10 relative min-h-[500px] w-full border-muted bg-background sm:mb-[calc(20vh)] sm:rounded-lg sm:border sm:shadow-lg h-full flex-1 flex flex-col overflow-auto"
            editorProps={{
              handleDOMEvents: {
                keydown: (_view, event) => handleCommandNavigation(event),
              },
              handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
              handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
              attributes: {
                class:
                  "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full flex-1 h-full",
              },
            }}
            onUpdate={({ editor }) => {
              debouncedUpdates(editor);
              setSaveStatus("Unsaved");
              // 如果提供了onContentChange回调，则通知父组件内容已更新
              if (onContentChange) {
                // 使用防抖机制避免过于频繁的更新
                const updateContent = () => {
                  // 获取编辑器内容的markdown格式
                  const markdown = editor.storage.markdown.getMarkdown();
                  onContentChange(markdown);
                };
                
                // 使用setTimeout进行简单的防抖
                clearTimeout((editor as any)._updateTimeout);
                (editor as any)._updateTimeout = setTimeout(updateContent, 100);
              }
            }}
            slotAfter={<ImageResizer />}
          >
            <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border bg-background px-1 py-2 shadow-md transition-all">
              <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
              {
                suggestionOptions.map((item) => (
                  <EditorCommandGroup className="pb-1 border-b last:border-b-0" key={item.title} heading={
                    <div className="block text-sm text-secondary tracking-wide font-bold px-3 pt-2">
                      {item.title}
                    </div>
                  }>
                    <EditorCommandList>
                      {item.children.map((child) => (
                        <EditorCommandItem
                          value={child.title}
                          onCommand={(val) => child.command?.(val)}
                          className="flex w-full items-center space-x-2 rounded-md px-2 py-3 text-left text-sm hover:bg-primary/10 aria-selected:bg-primary/10 cursor-pointer"
                          key={child.title}
                        >
                          <div className="text-main flex-shrink-0 flex size-12 items-center justify-center rounded-md border border-muted bg-background">
                            {child.icon}
                          </div>
                          <div>
                            <p className="font-medium text-main">{child.title}</p>
                            <p className="mt-1 text-xs text-secondary">{child.description}</p>
                          </div>
                        </EditorCommandItem>
                      ))}
                    </EditorCommandList>
                  </EditorCommandGroup>
                ))
              }
            </EditorCommand>

            <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI}>
              <div className="flex gap-0.5 flex-wrap">
                <FloatingStatusToolbar />
              </div>
              <div className="flex gap-0.5 flex-wrap divide-x">
                <div className="px-0.5 py-0.5 bg-primary rounded flex items-center empty:hidden pointer-events-auto nc-editor-action-bubble">
                  <TextButtons />
                  <ColorSelector open={openColor} onOpenChange={setOpenColor} />
                  <Divider type="vertical" className="h-full mx-0.5 bg-white opacity-50  top-0" />
                  <QuoteButtons />
                  <HeadingSelector />
                  <NodeListSelector />
                </div>
                <div className="px-0.5 py-0.5 bg-primary rounded flex items-center empty:hidden pointer-events-auto nc-editor-action-bubble">
                  <SelectionToolbar />
                </div>
              </div>
              <GenerateSelector />
            </GenerativeMenuSwitch>
            <TaskList />
          </EditorContent>
        </EditorRoot>
      </div>
    </TiptapProvider>
  );
});

const useStyles = createStyles(({ css, token }) => (
  css`
    color: ${token.colorText};
    --nc-manuscript-text-indent: 2ch;
    --nc-manuscript-paragraph-spacing: 0.50em;
    --nc-manuscript-text-size: 1.20rem;
    --nc-manuscript-line-height: 1.70;
    .tt-nc-block-element{
      --nc-manuscript-text-indent: 0em;
      --nc-manuscript-paragraph-indentation: 0em;
      --nc-manuscript-paragraph-spacing: 0.375em;
      line-height: 1.5;
      font-size: 16px;
    }
    .tt-editor__manuscript{
      font-size: var(--nc-manuscript-text-size);
      line-height: var(--nc-manuscript-line-height);
      font-family: "BespokeSerif-Variable",BespokeSerif,ui-serif,Georgia,Cambria,"Times New Roman",Times,serif;
      ul, ol {
        margin-top: 1em;
        margin-bottom: 1em;
        padding-left: calc(2em + 2ch);
        line-height: inherit;
      }
      li > p:first-of-type {
        text-indent: 0px;
      }
      li + li {
        margin-top: var(--nc-manuscript-paragraph-spacing);
      }
      p+p, ol+p, ul+p {
        text-indent: var(--nc-manuscript-text-indent);
        margin-top: var(--nc-manuscript-paragraph-spacing);
      }
    }

    .ai-generating { color: #1d4ed8; }
    .ai-generated { color: #1e3a8a; }

    .node-aiGeneration.ProseMirror-selectednode{
      box-shadow: 0 0 0 1px #0284c7, 0 0 0 calc(4px + 1px) #0ea5e94d, 0 0 #0000;
      border-radius: 8px;
    }
    .scene-beat-node {
      border: 1px solid #e1e5e9;
      border-radius: 8px;
      margin: 16px 0;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .scene-beat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e1e5e9;
      border-radius: 8px 8px 0 0;
    }

    .scene-beat-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 14px;
    }

    .scene-beat-toolbar {
      padding: 12px 16px;
      border-bottom: 1px solid #e1e5e9;
    }

    .scene-beat-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }

    .scene-beat-btn {
      padding: 4px 8px;
      border: 1px solid #d0d7de;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 12px;
    }

    .scene-beat-content {
      min-height: 100px;
      padding: 16px;
    }

    .scene-beat-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #1976d2;
      color: white;
      font-size: 12px;
    }

    .scene-beat-status.generating {
      background: #ff9800;
    }

    .scene-beat-generation {
      padding: 16px;
      border-top: 1px solid #e1e5e9;
    }

    .scene-beat-prompt {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .scene-beat-prompt-input {
      flex: 1;
      padding: 8px;
      border: 1px solid #d0d7de;
      border-radius: 4px;
    }

    .scene-beat-generate-btn {
      padding: 8px 16px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .scene-beat-generating-status {
      margin-top: 8px;
      padding: 8px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
      color: #856404;
    }
  `
));

export default TailwindAdvancedEditor;
