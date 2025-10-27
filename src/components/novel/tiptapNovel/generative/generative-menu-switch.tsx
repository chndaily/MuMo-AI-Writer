import { EditorBubble, removeAIHighlight, useEditor } from "novel";
import { type ReactNode, useEffect } from "react";

interface GenerativeMenuSwitchProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const GenerativeMenuSwitch = ({ children, open, onOpenChange }: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor();

  useEffect(() => {
    if (!open) removeAIHighlight(editor!);
  }, [open]);
  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? "bottom-start" : "top-start",
        onHidden: () => {
          onOpenChange(false);
          editor!.chain().unsetHighlight().run();
        },
        zIndex: 1000,
        maxWidth: "none",
      }}
      className="flex flex-col items-start dark gap-0.5 [[data-placement^='bottom']_&]:flex-col-reverse group ui-disable-on-press"
    >
      {children}
      {/* <Fragment>
          <Button
            className="gap-1 rounded-none text-purple-500"
            variant="ghost"
            onClick={() => onOpenChange(true)}
            size="sm"
          >
            <Magic className="h-5 w-5" />
            Ask AI
          </Button>
          {children}
        </Fragment> */}
    </EditorBubble>
  );
};

export default GenerativeMenuSwitch;
