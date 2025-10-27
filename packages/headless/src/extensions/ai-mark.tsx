import { Mark } from "@tiptap/core";


type AiTaskPhase = "idle" | "generating" | "generated" | "discarded"
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiMark: {
      /**
       * Set AI mark
       * @param options The AI mark attributes
       * @example editor.commands.setAiMark({ phase: "generating", taskId: "task-123", text: "Hello, world!" })
       */
      setAiMark: (options: { phase: AiTaskPhase, taskId: string, text: string }) => ReturnType;
      /**
       * Set AI mark phase
       * @param phase The AI phase: "generating" | "generated"
       * @example editor.commands.setAiPhase("generating")
       */
      setAiPhase: (phase: AiTaskPhase) => ReturnType;
      /**
       * Set AI mark phase with task ID
       * @param phase The AI phase: "generating" | "generated"
       * @param taskId The task ID to associate with this mark
       * @example editor.commands.setAiPhaseWithTaskId("generating", "task-123")
       */
      setAiPhaseWithTaskId: (phase: AiTaskPhase, taskId: string) => ReturnType;
      /**
       * Unset the AI mark
       * @example editor.commands.unsetAiMark()
       */
      unsetAiMark: () => ReturnType;
    };
  }
}

export const AiMark = Mark.create({
  name: "aiMark",

  addOptions() {
    return {
      HTMLAttributes: {},
    } as const;
  },

  addAttributes() {
    return {
      phase: {
        default: "generating",
        parseHTML: (element: HTMLElement) => {
          if (element.classList.contains("ai-generated")) return "generated";
          if (element.classList.contains("ai-generating")) return "generating";
          return "generating";
        },
        renderHTML: (attributes) => {
          const phase = attributes.phase || "generating";
          return {
            class: `ai-${phase}`,
            "data-ai-phase": phase,
          };
        },
      },
      taskId: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute("data-task-id") || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.taskId) {
            return {};
          }
          return {
            "data-task-id": attributes.taskId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: "span.ai-generating" },
      { tag: "span.ai-generated" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },

  addCommands() {
    return {
      setAiMark:
        (options: { phase: AiTaskPhase, taskId: string, text: string }) =>
          ({ commands }) => {
            return commands.insertContent({
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: options.text,
                  marks: [
                    {
                      type: this.name,
                      attrs: {
                        phase: options.phase,
                        taskId: options.taskId,
                      },
                    },
                  ],
                },
              ],
            })
          },
      setAiPhase:
        (phase: AiTaskPhase) =>
          ({ commands }) => {
            return commands.setMark("aiMark", { phase });
          },
      setAiPhaseWithTaskId:
        (phase: AiTaskPhase, taskId: string) =>
          ({ commands }) => {
            return commands.setMark("aiMark", { phase, taskId });
          },
      unsetAiMark:
        () =>
          ({ commands }) => {
            return commands.unsetMark("aiMark");
          },
    };
  },
});