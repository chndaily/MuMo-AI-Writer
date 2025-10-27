import { Node, mergeAttributes, nodePasteRule, type NodeViewProps } from "@tiptap/core";
import { EditorContent, NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewRendererOptions, type ReactNodeViewProps } from "@tiptap/react";
import { useCallback, useState } from "react";
import { useEditor, type EditorInstance } from "../components";
import GripVertical from "../icons/grip-vertical";
import ArrowDownFromLine from "../icons/arrow-down-from-line";
import Trash2 from "../icons/trash-2";
import CirclePlay from "../icons/circle-play";
import ChevronDown from "../icons/chevron-down";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { type Node as TiptapNode } from "@tiptap/pm/model";


const AiGenerationComponent = ({ node, getPos, config, deleteNode }: NodeViewProps & { config: AiGenerationOptions }) => {
  const [isDragging, setIsDragging] = useState(false)

  const {
    AiGenerationNode,
  } = config


  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    // 问题: 在拖拽完成时，不会触发mouseup事件
    document.addEventListener('mouseup', () => {
      setIsDragging(false)
    }, { once: true })
  }, [])

  const getNode = useCallback(() => {
    return node
  }, [node])


  return (
    <NodeViewWrapper
      data-ai-generation
      draggable={isDragging}
      onDragEnd={() => setIsDragging(false)}
      className={'tiptap-ai-generation-node'}
    >
      {/* <div className="node-view-content mx-2 mb-2">
          <NodeViewContent />
        </div> */}
      {/* 节点底部 */}
      <AiGenerationNode
        handleDragStart={handleDragStart}
        deleteNode={deleteNode}
        clearDownNode={() => { }}
        getPos={getPos}
        getNode={getNode}
      >
        <NodeViewContent />
      </AiGenerationNode>
    </NodeViewWrapper>
  );
};

export interface AiGenerationOptions {
  AiGenerationNode: React.ComponentType<{
    handleDragStart: () => void;
    deleteNode: () => void;
    clearDownNode: () => void;
    getPos: () => number;
    getNode: () => TiptapNode;
    children: React.ReactNode,
  }>,
  dragClass: string,
}

/**
 * The options for setting a tweet.
 */
type SetAiGenerationOptions = { src: string };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiGeneration: {
      /**
       * Insert a tweet
       * @param options The tweet attributes
       * @example editor.commands.setTweet({ src: 'https://x.com/seanpk/status/1800145949580517852' })
       */
      setAiGeneration: (options: SetAiGenerationOptions) => ReturnType;
    };
  }
}

/**
 * This extension adds support for tweets.
 */
export const AiGeneration = Node.create<AiGenerationOptions>({
  name: "aiGeneration",
  group: "block",
  content: "paragraph+",
  defining: true,

  addOptions() {
    return {
      AiGenerationNode: () => null,
      dragClass: "ai-generation-drag-handle",
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => {
      return <AiGenerationComponent {...props} config={this.options} />
    });
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-ai-generation]",
      },
    ];
  },

  addCommands() {
    return {
      setAiGeneration:
        (options: SetAiGenerationOptions) =>
          ({ commands }) => {
            return commands.insertContent({
              type: this.name,
              attrs: options,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'fasd',
                    },
                  ],
                },
              ],
            });
          },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-ai-generation": "" }, HTMLAttributes)];
  },

  addKeyboardShortcuts() {
    return {
      Backspace: handleDeletion('backspace', this.name),
      a: ({ editor }) => {
        const { $from } = editor.state.selection;

        // 查找当前是否在 aiGeneration 节点内
        let aiGenerationNode = null;
        let aiGenerationDepth = -1;

        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === "aiGeneration") {
            aiGenerationNode = $from.node(d);
            aiGenerationDepth = d;
            break;
          }
        }

        // 如果不在 aiGeneration 节点内，允许正常删除
        if (!aiGenerationNode) return false;

        // 检查 aiGeneration 节点内的内容
        const childCount = aiGenerationNode.childCount;

        // 如果只有一个子节点，且是段落，且段落为空或光标在段落开头
        if (childCount === 1) {
          const firstChild = aiGenerationNode.firstChild;
          if (firstChild && firstChild.type.name === "paragraph") {
            const paragraphContent = firstChild.content.size;
            const isAtStart = $from.pos === $from.start(aiGenerationDepth + 1);

            // 如果段落为空或在开头，阻止删除
            if (paragraphContent === 0 || isAtStart) {
              return true;
            }
          }
        }

        // 其他情况允许正常删除
        return false;
      },
      Delete: handleDeletion('delete', this.name),
      b: ({ editor }) => {
        const { $from, $to } = editor.state.selection;

        // 查找当前是否在 aiGeneration 节点内
        let aiGenerationNode = null;
        let aiGenerationDepth = -1;

        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === "aiGeneration") {
            aiGenerationNode = $from.node(d);
            aiGenerationDepth = d;
            break;
          }
        }

        // 如果不在 aiGeneration 节点内，允许正常删除
        if (!aiGenerationNode) return false;

        // 检查是否已经选中了整个 aiGeneration 节点
        const isNodeSelected = $from.pos === $from.start(aiGenerationDepth) &&
          $to.pos === $from.end(aiGenerationDepth);

        // 如果已经选中了整个节点，允许删除
        if (isNodeSelected) {
          return false; // 允许默认的删除行为
        }

        // 检查 aiGeneration 节点内的内容
        const childCount = aiGenerationNode.childCount;

        // 如果只有一个子节点，且是段落，且段落为空或光标在段落结尾
        if (childCount === 1) {
          const firstChild = aiGenerationNode.firstChild;
          if (firstChild && firstChild.type.name === "paragraph") {
            const paragraphContent = firstChild.content.size;
            const isAtEnd = $from.pos === $from.end(aiGenerationDepth + 1);

            // 如果段落为空或在结尾，选中整个节点而不是删除
            if (paragraphContent === 0 || isAtEnd) {
              editor.commands.setTextSelection({
                from: $from.start(aiGenerationDepth),
                to: $from.end(aiGenerationDepth)
              });
              return true; // 阻止默认删除行为
            }
          }
        }

        // 其他情况允许正常删除
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('draggableNodePlugin'),
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              // 检查是否点击了自定义拖动手柄
              const target = event.target as HTMLElement
              if (target.closest(`.${this.options.dragClass}`) || target.classList.contains(this.options.dragClass)) {
                const nodeEl = target.closest('.tiptap-ai-generation-node') as HTMLElement | null
                if (!nodeEl) return false

                // 获取节点位置
                const pos = view.posAtDOM(nodeEl, 0)
                const tr = view.state.tr
                // 设置节点选区
                tr.setSelection(NodeSelection.create(tr.doc, pos - 1))
                // 开始拖动
                const slice = tr.selection.content()
                nodeEl.addEventListener('dragstart', (e: DragEvent) => {
                  e.dataTransfer?.setData('application/x-prosemirror-drag', JSON.stringify({
                    sourceNodePos: pos - 1,
                    nodeSize: slice.size
                  }))
                })
                view.dragging = { slice, move: true }
                return true
              }
              return false
            }
          },
          handleDrop(view, event, slice, moved) {
            try {
              if (!moved) return false
              const data = event.dataTransfer?.getData('application/x-prosemirror-drag')
              if (!data) return false


              const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY })
              const { sourceNodePos, nodeSize }: { sourceNodePos: number, nodeSize: number } = JSON.parse(data)
              if (dropPos && dropPos.pos !== sourceNodePos && (dropPos.pos - nodeSize > sourceNodePos)) {
                const tr = view.state.tr
                // 删除原节点
                tr.delete(sourceNodePos, sourceNodePos + nodeSize)
                console.log(111, dropPos, sourceNodePos, nodeSize)

                // 计算新的插入位置
                let insertPos = dropPos.pos
                if (dropPos.pos > sourceNodePos) {
                  insertPos = dropPos.pos - nodeSize
                }

                tr.replaceRange(insertPos, insertPos, slice)

                // 选中新插入的节点
                tr.setSelection(NodeSelection.create(tr.doc, insertPos))

                view.dispatch(tr)
                return true
              }
              return false
            } catch (error) {
              console.error('拖拽处理错误:', error)
              return false
            }
          }
        },


      })
    ]
  }
});


// 删除处理逻辑
const handleDeletion = (type: 'backspace' | 'delete', name: string) => {
  return ({ editor }: { editor: EditorInstance }) => {
    // 如果已经选中内容，允许删除
    if (!editor.state.selection.empty) return false;
    const { $from, $to } = editor.state.selection;

    // 查找当前是否在 aiGeneration 节点内
    let aiGenerationNode = null;
    let aiGenerationDepth = -1;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type.name === "aiGeneration") {
        aiGenerationNode = $from.node(d);
        aiGenerationDepth = d;
        break;
      }
    }

    // 检测是否在节点边界
    if (editor.state.selection.empty) {
      const resolvePos = type === 'backspace'
        ? editor.state.doc.resolve($from.pos - 1)
        : editor.state.doc.resolve($to.pos + 1);
      const isAtEdge = type === 'backspace' ? resolvePos.nodeBefore?.type.name === name : resolvePos.nodeAfter?.type.name === name;
      console.log(isAtEdge, resolvePos)
      if (isAtEdge) {
        editor.commands.setTextSelection({
          from: type === 'backspace' ? $from.pos - 1 - resolvePos?.nodeBefore?.nodeSize! : $from.pos,
          to: type === 'backspace' ? $to.pos : $to.pos + 1 + resolvePos?.nodeAfter?.nodeSize!
        })
        return true
      };
    }


    // 检查 aiGeneration 节点内的内容
    const childCount = aiGenerationNode?.childCount;
    // 如果只有一个子节点，且是段落，且段落为空或光标在段落开头
    if (childCount === 1) {
      const firstChild = aiGenerationNode?.firstChild;
      if (firstChild && firstChild.type.name === "paragraph") {
        const paragraphContent = firstChild.content.size;
        const isAtStart = $from.pos === $from.start(aiGenerationDepth + 1);

        // 如果段落为空或在开头，阻止删除
        if (paragraphContent === 0 || isAtStart) {
          return true;
        }
      }
    }

    // 其他情况允许正常删除
    return false;
  };
}
// 检查是否在节点起始位置
const isAtNodeStart = (editor: EditorInstance, name: string) => {
  if (editor.state.selection.empty) {
    const resolvePos = editor.state.doc.resolve(editor.state.selection.to + 1)
    return resolvePos.nodeAfter?.type.name === name;
  }
}
// 检查是否在节点结束位置
const isAtNodeEnd = (editor: EditorInstance, name: string) => {
  if (editor.state.selection.empty) {
    const resolvePos = editor.state.doc.resolve(editor.state.selection.from - 1)
    return resolvePos.nodeBefore?.type.name === name;
  }
}

// 检查是否已经选中了整个 节点
const isNodeSelected = (editor: EditorInstance, name: string) => {
  const { selection } = editor.state;
  return (
    selection.$from.parent.type.name === name &&
    selection.$to.parent.type.name === name &&
    selection.$from.pos === selection.$from.start() &&
    selection.$to.pos === selection.$to.end()
  );
}


