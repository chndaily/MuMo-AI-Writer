import { Fragment, type Node } from "@tiptap/pm/model";
import type { EditorInstance } from "../components";

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (_e) {
    return false;
  }
}

export function getUrlFromString(str: string) {
  if (isValidUrl(str)) return str;
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString();
    }
  } catch (_e) {
    return null;
  }
}

// Get the text before a given position in markdown format
export const getPrevText = (editor: EditorInstance, position: number) => {
  const nodes: Node[] = [];
  editor.state.doc.forEach((node, pos) => {
    if (pos >= position) return false;
    nodes.push(node);
    return true;
  });
  const fragment = Fragment.fromArray(nodes);
  const doc = editor.state.doc.copy(fragment);

  return editor.storage.markdown.serializer.serialize(doc) as string;
};

// Get all content from the editor in markdown format
export const getAllContent = (editor: EditorInstance) => {
  const fragment = editor.state.doc.content;
  const doc = editor.state.doc.copy(fragment);

  return editor.storage.markdown.serializer.serialize(doc) as string;
};

// 获取指定位置的节点深度
export function getNodeDepth(editor: EditorInstance, pos: number): number {
  const resolvedPos = editor.state.doc.resolve(pos);
  return resolvedPos.depth;
}

// 查找指定taskId的AI标记范围
export function findAiTaskRanges(editor: EditorInstance, taskId: string) {
  const nodes: Array<{ pos: number; node: Node }> = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.marks.length > 0) {
      const aiMark = node.marks.find(mark => mark.type.name === 'aiMark');
      if (aiMark && aiMark.attrs.taskId === taskId) {
        nodes.push({ pos, node });
      }
    }
  });
  if (nodes.length === 0) return null;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (!first || !last) return null;
  return {
    from: first.pos,
    to: last.pos + last.node.nodeSize - 1, // end of last node content
    nodes,
  };
}

// 查找指定taskId的AI标记的结束位置
export function lastPosOfAiTask(editor: EditorInstance, taskId: string) {
  const r = findAiTaskRanges(editor, taskId);
  if (!r) return null;
  return r.to;
}

// 查找指定taskId的AI标记的开始位置
export function firstPosOfAiTask(editor: EditorInstance, taskId: string) {
  const r = findAiTaskRanges(editor, taskId);
  if (!r) return null;
  return r.from;
}

