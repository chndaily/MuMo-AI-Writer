import { Novel, NovelOutline } from '#/novel';
import { hybridStorageService } from './hybridStorageService';
import { eventBus } from '@/utils/eventBus';

/**
 * 内容同步服务
 * 专门处理AI生成内容同步到指定章节的功能
 */
class ContentSyncService {
  /**
   * 同步内容到指定章节
   * @param content 要同步的内容
   * @param novelId 小说ID
   * @param chapterId 章节ID
   * @returns 同步结果
   */
  async syncToChapter(content: string, novelId: string, chapterId: string): Promise<{ success: boolean; message: string }> {
    try {
      // 获取当前章节信息
      const outlines = await hybridStorageService.getOutlines(novelId);
      const currentOutline = outlines.find(outline => outline.id === chapterId);
      
      if (!currentOutline) {
        return { success: false, message: '未找到指定章节' };
      }

      // 检查内容是否包含摘要分隔符
      const summarySeparator = '#SUMMARY#';
      let contentToSync = content;
      let summary = undefined; // 默认为undefined而不是空字符串

      if (content.includes(summarySeparator)) {
        const parts = content.split(summarySeparator);
        if (parts.length === 2) {
          contentToSync = parts[0].trim();
          summary = parts[1].trim();
        }
      }

      // 如果没有解析出摘要，则保持摘要为undefined
      // 保留原有的摘要，除非新内容包含摘要
      if (!summary && currentOutline.summary) {
        summary = currentOutline.summary;
      }

      // 检查是否需要替换原有内容
      const willReplaceContent = currentOutline.content && currentOutline.content.length > 0;
      
      // 更新章节内容和摘要
      const updatedOutline: NovelOutline = {
        ...currentOutline,
        content: contentToSync,
        summary: summary, // 同步更新摘要
        lastModified: new Date().toISOString()
      };

      // 保存更新后的章节
      await hybridStorageService.updateOutline(updatedOutline);

      // 触发章节内容同步事件
      eventBus.emit('chapterContentSynced', {
        novelId,
        chapterId,
        content: contentToSync,
        willReplaceContent // 传递替换标记
      });

      return { 
        success: true, 
        message: willReplaceContent ? '内容已成功替换到章节' : '内容已成功同步到章节' 
      };
    } catch (error) {
      console.error('同步内容到章节失败:', error);
      return { success: false, message: '同步失败: ' + (error instanceof Error ? error.message : '未知错误') };
    }
  }

  /**
   * 追加内容到指定章节
   * @param content 要追加的内容
   * @param novelId 小说ID
   * @param chapterId 章节ID
   * @returns 同步结果
   */
  async appendToChapter(content: string, novelId: string, chapterId: string): Promise<{ success: boolean; message: string }> {
    try {
      // 获取当前章节信息
      const outlines = await hybridStorageService.getOutlines(novelId);
      const currentOutline = outlines.find(outline => outline.id === chapterId);
      
      if (!currentOutline) {
        return { success: false, message: '未找到指定章节' };
      }

      // 检查内容是否包含摘要分隔符
      const summarySeparator = '#SUMMARY#';
      let contentToAppend = content;
      let summary = undefined; // 默认为undefined而不是空字符串

      if (content.includes(summarySeparator)) {
        const parts = content.split(summarySeparator);
        if (parts.length === 2) {
          contentToAppend = parts[0].trim();
          summary = parts[1].trim();
        }
      }

      // 检查是否内容已经存在，避免重复追加相同内容
      let newContent = currentOutline.content || '';
      const trimmedContentToAppend = contentToAppend.trim();
      
      // 使用更精确的算法来检测内容是否已经存在
      // 1. 检查完全匹配（忽略前后空白）
      const isExactMatch = newContent.trim() === trimmedContentToAppend;
      
      // 2. 检查是否是结尾部分的重复（常见于二次同步）
      const isNewContentAtEnd = newContent.trim().endsWith(trimmedContentToAppend);
      
      // 3. 检查是否已包含该内容（通过段落对比）
      // 将内容按段落分割并标准化
      const existingParagraphs = newContent.split('\n\n')
        .map(p => p.trim().replace(/\s+/g, ' '))
        .filter(p => p.length > 0);
      const newParagraphs = trimmedContentToAppend.split('\n\n')
        .map(p => p.trim().replace(/\s+/g, ' '))
        .filter(p => p.length > 0);
      
      // 检查新段落是否已经全部存在于现有段落中
      let allNewParagraphsExist = false;
      if (newParagraphs.length > 0 && existingParagraphs.length > 0) {
        allNewParagraphsExist = newParagraphs.every(newPara => 
          existingParagraphs.some(existingPara => 
            existingPara === newPara
          )
        );
      }
      
      // 特殊处理：检查是否是部分段落重复（可能由于添加了"增加的内容"）
      let isPartialContent = false;
      if (newParagraphs.length > 0 && existingParagraphs.length > 0) {
        // 检查现有内容是否以新内容的段落开头
        const firstNewParagraph = newParagraphs[0];
        isPartialContent = existingParagraphs.some(existingPara => 
          existingPara.startsWith(firstNewParagraph) && existingPara.length > firstNewParagraph.length
        );
      }
      
      // 检查是否是前缀匹配（新内容是现有内容的前缀）
      const isPrefixMatch = newContent.trim().startsWith(trimmedContentToAppend);
      
      // 添加一个简单的包含检查
      const isSimpleContains = newContent.includes(trimmedContentToAppend) && trimmedContentToAppend.length > 50; // 只有当内容较长时才检查
      
      // 特殊处理：检查是否是"增加的内容"模式
      const isIncrementalContent = trimmedContentToAppend.includes('增加的内容：') || trimmedContentToAppend.includes('增加的内容:') || trimmedContentToAppend.includes('新增内容：') || trimmedContentToAppend.includes('新增内容:');
      
      // 如果内容完全匹配、在结尾重复、所有段落都已存在、部分段落重复、前缀匹配或简单包含，则不追加
      // 但如果是增量内容，则应该追加
      if (!isIncrementalContent && (isExactMatch || isNewContentAtEnd || allNewParagraphsExist || isPartialContent || isPrefixMatch || isSimpleContains)) {
        console.log('内容已存在或部分存在，跳过追加');
        // 即使跳过追加，也要确保摘要被更新（如果提供了新的摘要）
        if (summary !== undefined && summary !== currentOutline.summary) {
          const updatedOutline: NovelOutline = {
            ...currentOutline,
            summary: summary,
            lastModified: new Date().toISOString()
          };
          
          // 保存更新后的章节（仅更新摘要）
          await hybridStorageService.updateOutline(updatedOutline);
          
          // 触发内容同步完成事件，用于通知相关组件刷新
          eventBus.emit('contentSyncComplete', { novelId, chapterId, content: newContent });
        }
        
        return { success: true, message: '内容已存在，跳过追加' };
      } else {
        // 否则追加内容
        newContent = newContent ? newContent + '\n\n' + contentToAppend : contentToAppend;
      }

      // 如果没有解析出摘要，则保持摘要为undefined
      // 保留原有的摘要，除非新内容包含摘要
      if (!summary && currentOutline.summary) {
        summary = currentOutline.summary;
      }

      // 更新章节内容和摘要
      const updatedOutline: NovelOutline = {
        ...currentOutline,
        content: newContent,
        summary: summary, // 同步更新摘要
        lastModified: new Date().toISOString()
      };

      // 保存更新后的章节
      await hybridStorageService.updateOutline(updatedOutline);

      // 触发章节内容同步事件
      eventBus.emit('chapterContentSynced', {
        novelId,
        chapterId,
        content: newContent
      });

      // 触发内容同步完成事件，用于通知相关组件刷新
      eventBus.emit('contentSyncComplete', { novelId, chapterId, content: newContent });

      return { success: true, message: '内容已成功追加到章节' };
    } catch (error) {
      console.error('追加内容到章节失败:', error);
      return { success: false, message: '追加失败: ' + (error instanceof Error ? error.message : '未知错误') };
    }
  }
}

export const contentSyncService = new ContentSyncService();