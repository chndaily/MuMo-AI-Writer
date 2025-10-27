import { useEditor } from "novel";
import { generateUUID } from "@/utils";
import { useTiptapContext } from "../tiptap-provider";
import { findAiTaskRanges, lastPosOfAiTask, EditorNode } from "novel";
import { ChevronDownIcon, CirclePlayIcon, GripVerticalIcon, Trash2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import { useAIServiceStore } from "@/stores/aiServiceStore";

type AiGenerationNodeProps = {
  handleDragStart: () => void;
  deleteNode: () => void;
  clearDownNode: () => void;
  getPos: () => number;
  children: React.ReactNode;
  getNode: () => EditorNode;
}

const aiMessage = () => {
  return [{
    role: 'system',
    content: `你是一位小说专家。
始终牢记以下规则：
-请用中文语境和表达习惯来创作，但保持英文的语法结构。
-写入主动语态
-始终遵循“秀，不说”的原则。
-避免副词和陈词滥调以及过度使用/常用的短语。以新鲜和原创的描述为目标。
-通过对话传达事件和故事。
-将短而有力的句子与长而描述性的句子混合在一起。删除填充词以添加多样性。
-跳过“他/她说”的对话标签，通过演讲传达人们的动作或面部表情
-避免冗长的对话和描述，让对话始终延续动作，永远不要拖延或添加不必要的绒毛。改变描述以避免重复。
-把对话放在自己的段落里，把场景和动作分开。
-减少不确定性指标，如“尝试”或“可能”
编写文本时：
-切勿独自结束场景，请严格遵循节拍指示。
-永远不要以伏笔结束。
-不要写得比我提示的更远。
-避免想象可能的结局，切勿偏离说明。
-如果继续包含指令中所需的内容，请提前停止。您不需要填写尽可能多的单词。`,
  },
  {
    role: 'user',
    content: `按照以下说明，写出200个单词来继续这个故事：
<说明>
<pointOfView type=“第三人”/>
继续这个故事。
</说明>`,
  }]
}

const AiGenerationNode = ({ handleDragStart, deleteNode, getPos, children, getNode }: AiGenerationNodeProps) => {
  const [isFold, setIsFold] = useState(false)
  const { editor } = useEditor()
  const { tasks, addAiTask, updateAiTaskStatus } = useTiptapContext(state => state)
  const { getAllModels } = useAIServiceStore()
  const models = getAllModels()

  // 获取生成提供者的函数
  const getGenerateProvider = useCallback((model: any) => {
    const { connections } = useAIServiceStore.getState()
    const connection = connections.find(c => c.id === model.connectionId)
    if (!connection) return undefined
    
    // 这里需要实现具体的提供者创建逻辑
    // 由于这个组件比较复杂，我们暂时返回undefined
    return undefined
  }, [])

  const foldNode = () => {
    setIsFold(!isFold)
  }

  const ensureTaskParagraph = useCallback((taskId: string) => {
    if (!editor) return;
    // If task has no paragraph yet, insert one at selection end
    const ranges = findAiTaskRanges(editor, taskId);
    if (!ranges) {
      editor.chain().focus().insertContent({ type: "paragraph", attrs: { aiTaskId: taskId }, content: [] }).run();
    }
  }, [editor]);

  const appendChunkToTask = useCallback((taskId: string, chunk: string) => {
    if (!editor) return;
    ensureTaskParagraph(taskId);

    const parts = chunk.split(/\n+/);
    parts.forEach((part, idx) => {
      // Move selection to end of task
      const end = lastPosOfAiTask(editor, taskId);
      if (end == null) return;

      editor.chain().focus().setTextSelection(end).setAiPhase("generating").insertContent(part).run();

      if (idx < parts.length - 1) {
        // New paragraph for same task
        editor.chain().focus().insertContent({ type: "paragraph", attrs: { aiTaskId: taskId } }).run();
      }
    });
  }, [editor, ensureTaskParagraph]);

  const finalizeTask = useCallback((taskId: string) => {
    if (!editor) return;
    // Turn generating -> generated within ranges
    const ranges = findAiTaskRanges(editor, taskId);
    if (!ranges) return;

    editor.chain().focus().setTextSelection({ from: ranges.from, to: ranges.to }).setAiPhase("generated").run();

    updateAiTaskStatus(taskId, "generated")
  }, [editor]);


  const startAiTask = useCallback(() => {
    const model = models[0]
    const provider = getGenerateProvider(model)
    if (!provider) return
    const id = generateUUID();

    // 插入内容并应用AI标记
    editor?.chain()
      .focus(getPos() + getNode().nodeSize)
      .setAiMark({ phase: "idle", taskId: id, text: " " })
      .run();
    addAiTask({
      id,
      status: 'idle',
      wordCount: 0,
    })
    provider.sendStreamingRequest({
      model: model.name,
      messages: aiMessage() as any
    }, (chunk) => {
      appendChunkToTask(id, chunk.text)
    }, id)





    // setTimeout(() => {
    //   updateAiMarkStatus(id, 'generated');
    // }, 1000)

  }, [editor, addAiTask, getPos, getNode, appendChunkToTask, finalizeTask])

  // 更新AI标记状态的函数
  const updateAiMarkStatus = useCallback((taskId: string, phase: 'generating' | 'generated') => {
    if (!editor) return;

    // 查找包含指定taskId的AI标记
    editor.state.doc.descendants((node, pos) => {
      console.log('node', node, pos)
      // 遍历节点中的所有标记
      if (node.isText && node.marks.length > 0) {
        const aiMark = node.marks.find(mark => mark.type.name === 'aiMark');
        if (aiMark && aiMark.attrs.taskId === taskId) {
          // 找到匹配的AI标记，更新其状态
          const from = pos;
          const to = pos + node.nodeSize;

          console.log('找到匹配的AI标记', { from, to, phase, taskId, currentPhase: aiMark.attrs.phase })

          // 移除旧的AI标记
          // editor.chain()
          //   .focus()
          //   .setTextSelection({ from, to })
          //   .unsetMark('aiMark')
          //   .run();

          console.log('应用新的AI标记', { from, to, phase })
          // 应用新的AI标记
          editor.chain()
            .focus()
            .setTextSelection({ from, to })
            .setMark('aiMark', { phase })
            .run();

          // return false; // 停止遍历
        }
      }
    });
  }, [editor]);
  return (
    <div className="tt-nc-block-element my-4 border-2 border-slate-300 rounded-lg bg-slate-300/20">
      {/* 头部标题栏 */}
      <div contentEditable={false} className={`bg-slate-300/50 select-none flex justify-between items-center rounded-t-lg py-2 px-2`}>
        <div className="flex items-center gap-2">
          <span className="ai-generation-drag-handle" onMouseDown={handleDragStart}>
            <GripVerticalIcon />
          </span>
          <span className="font-bold">场景设计{tasks.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="scene-beat-clear-beat"
            onClick={() => {/* 清除 beat 逻辑 */ }}
          >
            🗑️ Clear Beat
          </button>
          <div className="border-l-2 border-slate-300 h-4" />
          <button
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={foldNode}
          >
            折叠
          </button>
          <div className="border-l-2 border-slate-300 h-4" />
          <button
            className="text-gray-500 hover:text-gray-700 cursor-pointer p-1"
            onClick={deleteNode}
          >
            <Trash2Icon />
          </button>
        </div>
      </div>

      {/* 内容 */}
      <div className="node-view-content mx-2 mb-2">
        {children}
      </div>

      <div contentEditable={false} className="node-view-footer flex items-center flex-wrap bg-slate-300/20 border-slate-300 border-t-1 p-2">
        <div className="generate-wrapper  flex">
          <div onClick={startAiTask} className="generate-start transition-all border-2 border-gray-400/50 border-r-0 rounded-l-md cursor-pointer flex items-center gap-2 px-2 py-1 hover:border-gray-400/100 hover:bg-slate-300/10">
            <CirclePlayIcon className="size-5" />
            <div>
              <div className="text-xs font-bold text-gray-600">开始生成</div>
              <div className="text-xs text-gray-500">Deepseek R1 Pro</div>
            </div>
          </div>
          <div className="generate-prompts border-2 border-gray-400/50 rounded-r-md flex items-center px-1 text-gray-500 hover:border-gray-400/100">
            <ChevronDownIcon className="size-5" />
          </div>
        </div>
        <div className="context-item"></div>
        <div className="context-add"></div>
      </div>
    </div>
  )
}

export default AiGenerationNode;