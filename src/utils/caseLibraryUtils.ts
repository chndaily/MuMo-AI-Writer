import type { PromptCollection, AttachmentInfo } from '#/promptLibrary';
import { PromptType } from '#/promptLibrary';
import { generateUUID } from '@/utils'; // 导入generateUUID函数

/**
 * 从案例库类集合中提取附件内容
 * @param collection 案例库类集合
 * @returns 附件内容数组
 */
export const extractCaseLibraryAttachments = (collection: PromptCollection): string[] => {
  // 确保是案例库类集合
  if (collection.attributes.type !== PromptType.Other) {
    return [];
  }

  // 获取附件内容
  const attachments = collection.attributes.attachments || [];
  return attachments
    .filter(att => att.content) // 只返回有内容的附件
    .map(att => att.content || '') // 提取内容
    .filter(content => content.trim().length > 0); // 过滤空内容
};

/**
 * 格式化附件内容用于AI提示词
 * @param attachments 附件内容数组
 * @param collectionName 集合名称
 * @returns 格式化的提示词内容
 */
export const formatAttachmentsForPrompt = (attachments: string[], collectionName: string): string => {
  if (attachments.length === 0) {
    return '';
  }

  // 如果只有一个附件，直接返回内容
  if (attachments.length === 1) {
    return `以下是来自"${collectionName}"的参考内容:\n\n${attachments[0]}`;
  }

  // 如果有多个附件，分别标记
  return attachments.map((content, index) => 
    `以下是来自"${collectionName}"的参考内容 #${index + 1}:\n\n${content}`
  ).join('\n\n---\n\n');
};

/**
 * 获取案例库类集合的元信息
 * @param collection 案例库类集合
 * @returns 元信息字符串
 */
export const getCaseLibraryMetadata = (collection: PromptCollection): string => {
  const attachments = collection.attributes.attachments || [];
  
  if (attachments.length === 0) {
    return '';
  }

  const metadata = attachments.map(att => {
    return `文件名: ${att.name}\n文件大小: ${(att.size / 1024).toFixed(1)}KB\n上传时间: ${new Date(att.uploadedAt).toLocaleString()}`;
  }).join('\n\n');

  return `案例库元信息:\n${metadata}`;
};

/**
 * 检查集合是否为案例库类
 * @param collection 集合
 * @returns 是否为案例库类
 */
export const isCaseLibraryCollection = (collection: any): boolean => {
  return collection && 
         collection.type === 'prompts' && 
         collection.attributes && 
         collection.attributes.type === PromptType.Other;
};

/**
 * 从案例库集合中提取所有可用内容（包括消息内容和附件内容）
 * @param collection 案例库集合
 * @returns 所有内容的数组
 */
export const extractAllCaseLibraryContent = async (collection: PromptCollection): Promise<string[]> => {
  const content: string[] = [];
  
  // 提取消息内容
  if (collection.attributes.messages) {
    collection.attributes.messages.forEach(msg => {
      if (msg.text && msg.text.trim()) {
        content.push(msg.text);
      }
    });
  }
  
  // 提取附件内容
  const attachmentContents = await extractCaseLibraryAttachmentsWithContent(collection);
  content.push(...attachmentContents);
  
  return content;
};

/**
 * 提取案例库附件内容（直接从集合中获取内容，而不是从IndexedDB中获取）
 * @param collection 案例库集合
 * @returns 附件内容数组
 */
export const extractCaseLibraryAttachmentsWithContent = async (collection: PromptCollection): Promise<string[]> => {
  const attachments = collection.attributes.attachments || [];
  // 直接从附件对象中获取内容，而不是从IndexedDB中获取
  return attachments.map(att => att.content || '');
};

/**
 * 分块处理大文件内容
 * @param content 文件内容
 * @param chunkSize 每块大小（字符数）
 * @returns 分块后的内容数组
 */
export const chunkLargeContent = (content: string, chunkSize: number = 5000): string[] => {
  // 确保块大小不超过MongoDB单个文档限制(16MB)
  const maxChunkSize = 10 * 1024 * 1024; // 10MB作为更安全的边界
  if (chunkSize > maxChunkSize) {
    chunkSize = maxChunkSize;
  }
  
  const chunks: string[] = [];
  
  // 如果内容小于块大小，直接返回
  if (content.length <= chunkSize) {
    return [content];
  }
  
  // 按段落分割内容，避免在句子中间截断
  let currentChunk = '';
  const paragraphs = content.split('\n');
  
  for (const paragraph of paragraphs) {
    // 检查添加这个段落后是否会超过块大小
    const newChunkSize = new Blob([currentChunk + paragraph + '\n']).size;
    if (newChunkSize > chunkSize && currentChunk.length > 0) {
      // 如果超过块大小，保存当前块并开始新块
      chunks.push(currentChunk.trim());
      currentChunk = paragraph + '\n';
    } else {
      // 否则添加到当前块
      currentChunk += paragraph + '\n';
    }
    
    // 检查当前块是否已经接近限制，如果是则保存
    if (new Blob([currentChunk]).size > chunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
  }
  
  // 添加最后一个块
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
};

/**
 * 创建分块附件信息
 * @param file 原始文件
 * @param content 文件内容
 * @param chunkSize 每块大小
 * @returns 分块附件信息数组
 */
export const createChunkedAttachments = (
  file: File, 
  content: string, 
  chunkSize: number = 5000
): AttachmentInfo[] => {
  // 确保块大小不超过MongoDB单个文档限制(16MB)
  const maxChunkSize = 10 * 1024 * 1024; // 10MB作为更安全的边界
  if (chunkSize > maxChunkSize) {
    chunkSize = maxChunkSize;
  }
  
  const chunks = chunkLargeContent(content, chunkSize);
  
  return chunks.map((chunk, index) => ({
    id: generateUUID({ prefix: 'attachment_', length: 28 }), // 使用统一的UUID生成方式
    name: `${file.name} (第${index + 1}部分)`,
    type: file.type || 'text/plain',
    size: new Blob([chunk]).size,
    content: chunk,
    uploadedAt: new Date().toISOString()
  }));
};