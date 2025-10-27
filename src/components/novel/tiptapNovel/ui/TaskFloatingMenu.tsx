import { useCallback, useEffect, useState } from "react";
import { EditorInstance, firstPosOfAiTask, lastPosOfAiTask, useEditor } from "novel";
import { AiTaskStatus, AiTaskInfo } from "../type";
import { DotsLoading } from "@/components/loading";
import { Button } from "./button";
import { CheckIcon, RefreshCcwIcon, TrashIcon, XIcon } from "lucide-react";




type TaskFloatingMenuProps = {
  task: AiTaskInfo;
  onApply?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  onDiscard?: (id: string) => void;
}



const TaskFloatingMenu = ({ task, onApply, onRegenerate, onDiscard }: TaskFloatingMenuProps) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const { editor } = useEditor();

  const calcPos = useCallback(() => {
    if (!editor?.view) return;
    // data-task-id="47a6a9ac9717a6c1186b4804f76734ab"
    const container = document.querySelector(`.tt-editor__manuscript`)
    if (!container) return setPos(null);
    const from = firstPosOfAiTask(editor, task.id);
    if (from == null) return setPos(null);
    const nodeDOM = editor.view.nodeDOM(from - 1) as HTMLElement | null;
    if (!nodeDOM) return setPos(null);

    const containerRect = container.getBoundingClientRect();
    const rect = nodeDOM.getBoundingClientRect();
    const top = rect.top - containerRect.top - 46; // little offset above
    const left = rect.left - containerRect.left;  // align to left edge
    setPos({ top, left });
  }, [editor, task.id]);

  useEffect(() => {
    calcPos();
    const onScroll = () => calcPos();
    const onResize = () => calcPos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    const unSub = editor?.on?.("transaction", calcPos);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      unSub && editor?.off("transaction", calcPos);
    };
  }, [calcPos, editor]);

  if (task.status === "discarded" || task.status === "generated") {
    // still show menu after generated? Requirement says close when user action. Keep visible until user acts.
  }

  if (!pos) return null;
  return (
    <div
      className="absolute z-50 px-0.5 py-0.5 bg-primary rounded flex items-center gap-0.5 pointer-events-auto text-sm"
      style={{ top: pos.top, left: pos.left }}
    >
      <Button size="sm" className="gap-2">
        <CheckIcon className="size-4" />
        <span>应用</span>
      </Button>
      <Button size="sm" className="gap-2">
        <RefreshCcwIcon className="size-4" />
        <span>重新生成</span>
      </Button>
      <Button size="sm" className="gap-2">
        <XIcon className="size-4" />
        <span>弃用</span>
      </Button>
      <div className="w-px h-7 bg-white opacity-50"></div>
      <DotsLoading color="#fff" className="mx-2" />
      <span className="text-white mx-2">{task.wordCount} 字，DeepSeek</span>
    </div>
  );
}
export default TaskFloatingMenu;