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

      // 追加内容到现有内容
      const newContent = currentOutline.content ? currentOutline.content + '\n\n' + contentToAppend : contentToAppend;

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