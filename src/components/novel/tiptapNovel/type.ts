export type AiTaskStatus = "idle" | "generating" | "generated" | "discarded"
export interface AiTaskInfo {
  id: string;
  status: AiTaskStatus;
  // eta: number; // seconds countdown
  // prompt: string;
  // generatedContent: string;
  // model: string;
  // context: string;
  wordCount: number;
}