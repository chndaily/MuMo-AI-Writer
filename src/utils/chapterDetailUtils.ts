import { hybridStorageService } from '@/services/hybridStorageService';
import { useMembershipStore } from '@/stores/membershipStore';

/**
 * 获取章节详细信息，包括内容概述、情节节点、剧情关键节点提示等
 * @param novelId 小说ID
 * @param chapterId 章节ID
 * @returns 章节详细信息字符串
 */
export async function getChapterDetails(novelId: string, chapterId: string): Promise<string> {
  try {
    console.log('开始获取章节详细信息，小说ID:', novelId, '章节ID:', chapterId);
    
    // 检查认证状态
    const { isAuthenticated, authToken } = useMembershipStore.getState();
    if (!isAuthenticated || !authToken) {
      console.warn('用户未认证，无法获取章节详细信息');
      return '';
    }
    
    // 获取大纲信息
    const outlines = await hybridStorageService.getOutlines(novelId);
    console.log('获取到的大纲信息数量:', outlines?.length);
    
    if (!outlines || outlines.length === 0) {
      console.log('暂无大纲信息');
      return '暂无大纲信息';
    }
    
    // 查找指定章节
    const chapterOutline = outlines.find(outline => outline.type === 'chapter' && outline.id === chapterId);
    console.log('查找到的章节大纲:', chapterOutline);
    
    if (!chapterOutline) {
      console.log('未找到指定章节，章节ID:', chapterId);
      return '未找到指定章节';
    }
    
    // 构建章节详细信息（简化版本，直接使用章节内容）
    let chapterDetails = `【章节标题】${chapterOutline.title}\n`;
    
    if (chapterOutline.content) {
      chapterDetails += `\n【章节内容概述】\n${chapterOutline.content}\n`;
    }
    
    if (chapterOutline.summary) {
      chapterDetails += `\n【章节摘要】\n${chapterOutline.summary}\n`;
    }
    
    console.log('最终生成的章节详细信息:', chapterDetails);
    return chapterDetails;
  } catch (error) {
    console.error('获取章节详细信息失败:', error);
    return '获取章节详细信息失败';
  }
}

export default {
  getChapterDetails
};