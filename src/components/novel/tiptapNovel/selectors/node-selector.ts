// Node selector types
export interface SelectorItem {
  name: string;
  icon: any;
  command: (editor: any) => void;
  isActive: (editor: any) => boolean;
}