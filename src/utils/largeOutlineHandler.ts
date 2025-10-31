/**
 * 长大纲处理工具
 * 专门用于处理超过一定长度的大纲信息，避免信息过载
 */

import { hybridStorageService } from '@/services/hybridStorageService';

/**
 * 检查是否为长大纲
 * @param outlineCount 大纲项数量
 * @returns 是否为长大纲
 */
export function isLargeOutline(outlineCount: number): boolean {
  return outlineCount > 50; // 超过50个大纲项认为是长大纲
}

/**
 * 获取大纲结构摘要
 * @param novelId 小说ID
 * @returns 大纲结构摘要
 */
export async function getOutlineStructureSummary(novelId: string): Promise<string> {
  try {
    const outlines = await hybridStorageService.getOutlines(novelId);
    
    if (!outlines || outlines.length === 0) {
      return '暂无大纲信息';
    }
    
    const mainOutlines = outlines.filter(outline => outline.type === 'main');
    const chapterOutlines = outlines.filter(outline => outline.type === 'chapter');
    
    let summary = `大纲结构摘要：\n`;
    summary += `总项数：${outlines.length}（卷：${mainOutlines.length}，章节：${chapterOutlines.length}）\n\n`;
    
    // 显示主要结构
    const maxMainToShow = Math.min(mainOutlines.length, 5);
    for (let i = 0; i < maxMainToShow; i++) {
      const main = mainOutlines[i];
      summary += `${i + 1}. ${main.title}\n`;
      
      // 显示该卷下的章节数量
      const chaptersInAct = chapterOutlines.filter(ch => ch.parentId === main.id);
      if (chaptersInAct.length > 0) {
        summary += `   章节数量：${chaptersInAct.length}\n`;
        
        // 显示前几个章节标题
        const maxChaptersToShow = Math.min(chaptersInAct.length, 3);
        for (let j = 0; j < maxChaptersToShow; j++) {
          summary += `   - ${chaptersInAct[j].title}\n`;
        }
        if (chaptersInAct.length > maxChaptersToShow) {
          summary += `   ...还有${chaptersInAct.length - maxChaptersToShow}个章节\n`;
        }
      }
      summary += '\n';
    }
    
    if (mainOutlines.length > maxMainToShow) {
      summary += `...还有${mainOutlines.length - maxMainToShow}个卷未显示\n`;
    }
    
    return summary;
  } catch (error) {
    console.error('获取大纲结构摘要失败:', error);
    return '获取大纲结构摘要失败';
  }
}

/**
 * 获取指定卷的详细信息
 * @param novelId 小说ID
 * @param actId 卷ID
 * @returns 卷的详细信息
 */
export async function getActDetails(novelId: string, actId: string): Promise<string> {
  try {
    const outlines = await hybridStorageService.getOutlines(novelId);
    
    if (!outlines || outlines.length === 0) {
      return '暂无大纲信息';
    }
    
    const mainOutline = outlines.find(outline => outline.type === 'main' && outline.id === actId);
    if (!mainOutline) {
      return '未找到指定的卷';
    }
    
    let details = `卷详细信息：\n`;
    details += `标题：${mainOutline.title}\n`;
    if (mainOutline.content) {
      details += `描述：${mainOutline.content.substring(0, 500)}${mainOutline.content.length > 500 ? '...' : ''}\n`;
    }
    
    const chapterOutlines = outlines.filter(outline => outline.type === 'chapter' && outline.parentId === actId);
    if (chapterOutlines.length > 0) {
      details += `\n章节列表：\n`;
      chapterOutlines.forEach((chapter, index) => {
        details += `${index + 1}. ${chapter.title}\n`;
        if (chapter.content) {
          details += `   摘要：${chapter.content.substring(0, 100)}${chapter.content.length > 100 ? '...' : ''}\n`;
        }
      });
    }
    
    return details;
  } catch (error) {
    console.error('获取卷详细信息失败:', error);
    return '获取卷详细信息失败';
  }
}

/**
 * 获取指定章节的详细信息
 * @param novelId 小说ID
 * @param chapterId 章节ID
 * @returns 章节的详细信息
 */
export async function getChapterDetails(novelId: string, chapterId: string): Promise<string> {
  try {
    const outlines = await hybridStorageService.getOutlines(novelId);
    
    if (!outlines || outlines.length === 0) {
      return '暂无大纲信息';
    }
    
    const chapterOutline = outlines.find(outline => outline.type === 'chapter' && outline.id === chapterId);
    if (!chapterOutline) {
      return '未找到指定的章节';
    }
    
    let details = `章节详细信息：\n`;
    details += `标题：${chapterOutline.title}\n`;
    
    if (chapterOutline.content) {
      details += `内容：${chapterOutline.content}\n`;
    }
    
    if (chapterOutline.summary) {
      details += `摘要：${chapterOutline.summary}\n`;
    }
    
    return details;
  } catch (error) {
    console.error('获取章节详细信息失败:', error);
    return '获取章节详细信息失败';
  }
}

/**
 * 分页获取大纲内容
 * @param novelId 小说ID
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @returns 分页的大纲内容
 */
export async function getOutlineByPage(novelId: string, page: number, pageSize: number = 20): Promise<{
  content: string;
  totalPages: number;
  currentPage: number;
  totalItems: number;
}> {
  try {
    const outlines = await hybridStorageService.getOutlines(novelId);
    
    if (!outlines || outlines.length === 0) {
      return {
        content: '暂无大纲信息',
        totalPages: 0,
        currentPage: 1,
        totalItems: 0
      };
    }
    
    const totalItems = outlines.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pageOutlines = outlines.slice(startIndex, endIndex);
    
    let content = `大纲内容（第${currentPage}/${totalPages}页）：\n\n`;
    
    pageOutlines.forEach((outline, index) => {
      const globalIndex = startIndex + index + 1;
      content += `${globalIndex}. [${outline.type === 'main' ? '卷' : '章节'}] ${outline.title}\n`;
      if (outline.content) {
        content += `   内容：${outline.content.substring(0, 200)}${outline.content.length > 200 ? '...' : ''}\n`;
      }
      if (outline.summary) {
        content += `   摘要：${outline.summary}\n`;
      }
      content += '\n';
    });
    
    return {
      content,
      totalPages,
      currentPage,
      totalItems
    };
  } catch (error) {
    console.error('分页获取大纲内容失败:', error);
    return {
      content: '获取大纲内容失败',
      totalPages: 0,
      currentPage: 1,
      totalItems: 0
    };
  }
}

export default {
  isLargeOutline,
  getOutlineStructureSummary,
  getActDetails,
  getChapterDetails,
  getOutlineByPage
};