import { Novel } from '#/novel';
import { hybridStorageService } from '@/services/hybridStorageService';
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
      const currentOutline = await hybridStorageService.getOutline(chapterId);
      
      if (!currentOutline) {
        return { success: false, message: '未找到指定章节' };
      }

      // 更新章节内容
      const updatedOutline = {
        ...currentOutline,
        content: content,
        lastModified: new Date().toISOString()
      };

      // 保存更新后的章节
      await hybridStorageService.updateOutline(updatedOutline);

      // 触发章节内容同步事件
      eventBus.emit('chapterContentSynced', {
        novelId,
        chapterId,
        content
      });

      return { success: true, message: '内容已成功同步到章节' };
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
      const currentOutline = await hybridStorageService.getOutline(chapterId);
      
      if (!currentOutline) {
        return { success: false, message: '未找到指定章节' };
      }

      // 追加内容到现有内容
      const newContent = currentOutline.content ? currentOutline.content + '\n\n' + content : content;

      // 更新章节内容
      const updatedOutline = {
        ...currentOutline,
        content: newContent,
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

      return { success: true, message: '内容已成功追加到章节' };
    } catch (error) {
      console.error('追加内容到章节失败:', error);
      return { success: false, message: '追加失败: ' + (error instanceof Error ? error.message : '未知错误') };
    }
  }
}

export const contentSyncService = new ContentSyncService();