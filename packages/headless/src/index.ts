// Components
export {
  EditorRoot,
  EditorContent,
  type EditorContentProps,
  EditorBubble,
  EditorBubbleItem,
  EditorCommand,
  EditorCommandList,
  EditorCommandGroup,
  EditorCommandItem,
  EditorCommandEmpty,
  useEditor,
  type EditorInstance,
  type EditorNode,
  type JSONContent,
} from "./components";

// Extensions
export {
  AIHighlight,
  removeAIHighlight,
  addAIHighlight,
  CodeBlockLowlight,
  HorizontalRule,
  ImageResizer,
  InputRule,
  Placeholder,
  StarterKit,
  TaskItem,
  TaskList,
  TiptapImage,
  TiptapUnderline,
  MarkdownExtension,
  TextStyle,
  Color,
  HighlightExtension,
  CustomKeymap,
  TiptapLink,
  UpdatedImage,
  AiGeneration,
  AiMark,
  Mathematics,
  CharacterCount,
  GlobalDragHandle,
  Command,
  renderItems,
  createSuggestionItems,
  handleCommandNavigation,
  type SuggestionItem,
} from "./extensions";

// Plugins
export {
  UploadImagesPlugin,
  type UploadFn,
  type ImageUploadOptions,
  createImageUpload,
  handleImageDrop,
  handleImagePaste,
} from "./plugins";

// Utils
export {
  isValidUrl,
  getUrlFromString,
  getPrevText,
  getAllContent,
  lastPosOfAiTask,
  firstPosOfAiTask,
  findAiTaskRanges,
} from "./utils";

// Store and Atoms
export { queryAtom, rangeAtom } from "./utils/atoms";
