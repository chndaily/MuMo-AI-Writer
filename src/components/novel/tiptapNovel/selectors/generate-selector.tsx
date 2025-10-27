import { Button } from "@/components/novel/tiptapNovel/ui/button";
import { EditorBubbleItem, useEditor } from "novel";
import { FilePlusIcon, FoldVerticalIcon, CirclePlayIcon, UnfoldVerticalIcon, RefreshCcwIcon } from "lucide-react";
import { usePromptCollections } from "@/stores/promptLibraryStore";
import { PromptType, PromptCollection } from "#/promptLibrary";

const GenerateSelector = () => {
  const prompts = usePromptCollections(PromptType.ManuscriptReplacement);
  console.log('prompts', prompts);

  return <div className="flex gap-0.5 empty:hidden"> {
    prompts.map(prompt =>
      <EditorBubbleItem
        key={prompt.id}
        className="flex px-0.5 py-0.5 bg-primary rounded pointer-events-auto"
        onSelect={(editor) => {
          editor.chain().focus().clearNodes().run();
        }}
      >
        <Button className="flex items-center gap-2" title="片段" size="sm" variant="default">
          <GenerateIcon prompt={prompt} /><span className="text-sm/none">{prompt.attributes.name}</span>
        </Button>
      </EditorBubbleItem>
    )}</div>
};

const GenerateIcon = ({ prompt }: { prompt: PromptCollection }) => {
  if (prompt.attributes.name === '扩写') {
    return <UnfoldVerticalIcon className="w-4 h-4" />;
  }
  if (prompt.attributes.name === '改写') {
    return <RefreshCcwIcon className="w-4 h-4" />;
  }
  if (prompt.attributes.name === '缩写') {
    return <FoldVerticalIcon className="w-4 h-4" />;
  }
  return <CirclePlayIcon className="w-4 h-4" />;
}

export default GenerateSelector;