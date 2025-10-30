import { databaseManager } from '@/services'
import { hybridStorageService } from '@/services/hybridStorageService'
import { Novel, NovelOutline } from '#/novel'
import { SyncResult } from '@/types/ai-generation'
import { eventBus } from '@/utils/eventBus'

// 扩展 NovelOutline 类型以支持临时属性
interface ExtendedNovelOutline {
  id?: string
  novelId?: string
  title?: string
  content?: string
  type?: 'main' | 'chapter' | 'character' | 'world' | 'scene'
  order?: number
  parentId?: string
  createdAt?: string
  lastModified?: string
  tempId?: string // 用于临时存储，确保正确建立父子关系
  parentTempId?: string // 存储父节点的临时ID，用于后续建立父子关系
}

/**
 * 大纲同步服务
 * 专门负责大纲内容的同步处理
 */
export class OutlineSyncService {
  /**
   * 同步大纲内容
   */
  async syncOutline(content: string, novelId: string, options?: any): Promise<SyncResult> {
    try {
      console.log('开始同步大纲内容', { novelId, contentLength: content.length });
      
      // 检查参数
      if (!content || content.trim().length === 0) {
        return {
          success: false,
          message: '大纲内容不能为空',
          syncedItems: 0
        };
      }
      
      if (!novelId) {
        return {
          success: false,
          message: '小说ID不能为空',
          syncedItems: 0
        };
      }
      
      // 先清空现有的大纲项目
      const existingOutlines = await databaseManager.outlines.getOutlinesByNovelId(novelId)
      console.log('现有大纲项目数量:', existingOutlines.length);
      for (const outline of existingOutlines) {
        await databaseManager.outlines.deleteOutline(outline.id)
        console.log('删除大纲项目:', outline.id);
      }
      
      // 预处理内容，修复AI生成的非法格式
      const processedContent = this.preprocessContent(content);
      console.log('预处理后的内容长度:', processedContent.length);
      
      // 解析内容并保存
      const parsedItems = this.parseOutlineContent(processedContent);
      console.log('解析出的大纲项目数量:', parsedItems.length);
      
      // 如果没有解析出任何项目，返回错误
      if (parsedItems.length === 0) {
        return {
          success: false,
          message: '未能解析出有效的大纲内容',
          syncedItems: 0
        };
      }
      
      // 创建映射表，使用临时ID作为键，确保可以正确建立父子关系
      const tempIdToRealIdMap = new Map<string, string>();
      
      // 先保存所有大纲项目（暂不设置parentId）
      const savedOutlines: NovelOutline[] = [];
      let order = 1;
      
      // 首先保存所有的卷和章节，但不设置parentId
      for (const item of parsedItems) {
        const outline: any = {
          novelId,
          title: item.title,
          content: item.content || '', // 确保内容被正确保存
          type: item.type,
          order: order++,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
        
        // 保存大纲并获取生成的ID
        const savedOutline = await databaseManager.outlines.addOutline(outline);
        savedOutlines.push(savedOutline);
        
        // 保存临时索引到真实ID的映射
        tempIdToRealIdMap.set(item.tempId || `temp-${item.type}-${parsedItems.indexOf(item)}`, savedOutline.id);
        
        // 添加日志以确认内容被保存
        console.log(`保存大纲项目 - 类型: ${item.type}, 标题: ${item.title}, 内容长度: ${item.content ? item.content.length : 0}`);
      }
      
      // 然后批量更新所有大纲项目的parentId
      const updates: { id: string; parentId: string }[] = [];
      for (const item of parsedItems) {
        const currentOutlineId = tempIdToRealIdMap.get(item.tempId || `temp-${item.type}-${parsedItems.indexOf(item)}`);
        
        if (currentOutlineId && item.type === 'chapter' && item.parentTempId) {
          // 使用parentTempId查找对应的卷的真实ID
          const parentOutlineId = tempIdToRealIdMap.get(item.parentTempId);
          
          if (parentOutlineId) {
            updates.push({
              id: currentOutlineId,
              parentId: parentOutlineId
            });
          }
        }
      }
      
      // 使用混合存储服务的批量更新方法
      if (updates.length > 0) {
        console.log('需要更新parentId的项目数量:', updates.length);
        await hybridStorageService.batchUpdateOutlinesParentId(updates);
      } else {
        console.log('没有需要更新parentId的项目');
      }

      // 触发大纲同步完成事件，用于通知相关组件刷新
      eventBus.emit('outlineSyncComplete', { novelId, content });

      return {
        success: true,
        message: '大纲同步成功',
        syncedItems: order - 1
      }
    } catch (error) {
      console.error('大纲同步失败:', error)
      return {
        success: false,
        message: '大纲同步失败: ' + (error instanceof Error ? error.message : String(error)),
        syncedItems: 0
      }
    }
  }
  
  /**
   * 预处理内容，修复AI生成的非法格式
   */
  private preprocessContent(content: string): string {
    let processed = content;
    
    console.log('开始预处理内容，原始长度:', content.length);
    
    // 最终优化的预处理逻辑，确保能处理所有已知的非法格式
    
    // 1. 首先处理最复杂的三颗星包裹格式
    // 修复三颗星包裹的卷标题格式：***第X卷：标题*** -> ## 第X卷：标题
    processed = processed.replace(/\*\*\*第(\S+?)卷[:：]\s*(.+?)\*\*\*/g, '## 第$1卷：$2');
    
    // 修复三颗星包裹的章节标题格式：***第X章：标题*** -> ### 第X章：标题
    processed = processed.replace(/\*\*\*第(\S+?)章[:：]\s*(.+?)\*\*\*/g, '### 第$1章：$2');
    
    // 2. 处理双星号包裹格式
    // 修复双星号包裹的卷标题格式：**第X卷：标题** -> ## 第X卷：标题
    processed = processed.replace(/\*\*第(\S+?)卷[:：]\s*(.+?)\*\*/g, '## 第$1卷：$2');
    
    // 修复双星号包裹的章节标题格式：**第X章：标题** -> ### 第X章：标题
    processed = processed.replace(/\*\*第(\S+?)章[:：]\s*(.+?)\*\*/g, '### 第$1章：$2');
    
    // 3. 处理单星号包裹格式
    // 修复单星号包裹的卷标题格式：*第X卷：标题* -> ## 第X卷：标题
    processed = processed.replace(/\*第(\S+?)卷[:：]\s*(.+?)\*/g, '## 第$1卷：$2');
    
    // 修复单星号包裹的章节标题格式：*第X章：标题* -> ### 第X章：标题
    processed = processed.replace(/\*第(\S+?)章[:：]\s*(.+?)\*/g, '### 第$1章：$2');
    
    // 4. 处理混合格式（如 ### *第三章：标题* 或 ### **第六章：标题**）
    // 修复混合格式的章节标题：### *第X章：标题* -> ### 第X章：标题
    processed = processed.replace(/###\s*\*第(\S+?)章[:：]\s*(.+?)\*/g, '### 第$1章：$2');
    
    // 修复混合格式的章节标题：### **第X章：标题** -> ### 第X章：标题
    processed = processed.replace(/###\s*\*\*第(\S+?)章[:：]\s*(.+?)\*\*/g, '### 第$1章：$2');
    
    // 5. 处理单星号开头格式
    // 修复单星号开头的卷标题格式：* 第X卷：标题 -> ## 第X卷：标题
    processed = processed.replace(/^\s*\*\s*第(\S+?)卷[:：]\s*(.+)$/gm, '## 第$1卷：$2');
    
    // 修复单星号开头的章节标题格式：* 第X章：标题 -> ### 第X章：标题
    processed = processed.replace(/^\s*\*\s*第(\S+?)章[:：]\s*(.+)$/gm, '### 第$1章：$2');
    
    // 6. 处理井号直接连接格式
    // 修复井号直接连接的卷标题格式：#第X卷：标题 -> ## 第X卷：标题
    processed = processed.replace(/^\s*#第(\S+?)卷[:：]\s*(.+)$/gm, '## 第$1卷：$2');
    
    // 修复井号直接连接的章节标题格式：#第X章：标题 -> ### 第X章：标题
    processed = processed.replace(/^\s*#第(\S+?)章[:：]\s*(.+)$/gm, '### 第$1章：$2');
    
    // 7. 处理缺少空格格式
    // 修复缺少空格的卷标题格式：##第X卷：标题 -> ## 第X卷：标题
    processed = processed.replace(/^\s*##第(\S+?)卷[:：]\s*(.+)$/gm, '## 第$1卷：$2');
    
    // 修复缺少空格的章节标题格式：##第X章：标题 -> ### 第X章：标题
    processed = processed.replace(/^\s*##第(\S+?)章[:：]\s*(.+)$/gm, '### 第$1章：$2');
    
    // 修复缺少空格的卷标题格式：###第X卷：标题 -> ## 第X卷：$2
    processed = processed.replace(/^\s*###第(\S+?)卷[:：]\s*(.+)$/gm, '## 第$1卷：$2');
    
    // 修复缺少空格的章节标题格式：###第X章：标题 -> ### 第X章：标题
    processed = processed.replace(/^\s*###第(\S+?)章[:：]\s*(.+)$/gm, '### 第$1章：$2');
    
    // 8. 处理有空格但格式错误的标题
    // 修复有空格但位置错误的卷标题格式：## 第X卷：标题 -> ## 第X卷：标题（已经是正确格式，但需要确保）
    // 修复有空格但位置错误的章节标题格式：## 第X章：标题 -> ### 第X章：标题
    processed = processed.replace(/^##\s+第(\S+?)章[:：]\s*(.+)$/gm, '### 第$1章：$2');
    
    // 修复有空格但位置错误的卷标题格式：### 第X卷：标题 -> ## 第X卷：标题
    processed = processed.replace(/^###\s+第(\S+?)卷[:：]\s*(.+)$/gm, '## 第$1卷：$2');
    
    // 9. 处理多重格式错误（如 ### ### 第X章：标题）
    // 修复多重井号格式的章节标题：### ### 第X章：标题 -> ### 第X章：标题
    processed = processed.replace(/^###\s+###\s+第(\S+?)章[:：]\s*(.+)$/gm, '### 第$1章：$2');
    
    // 修复多重井号格式的卷标题：## ### 第X卷：标题 -> ## 第X卷：标题
    processed = processed.replace(/^##\s+###\s+第(\S+?)卷[:：]\s*(.+)$/gm, '## 第$1卷：$2');
    
    // 10. 最后处理无标记格式（最通用的规则，需要放在最后避免误匹配）
    // 修复无标记的卷标题格式：第X卷：标题 -> ## 第X卷：标题
    processed = processed.replace(/^\s*第(\S+?)卷[:：]\s*(.+)$/gm, '## 第$1卷：$2');
    
    // 修复无标记的章节标题格式：第X章：标题 -> ### 第X章：标题
    processed = processed.replace(/^\s*第(\S+?)章[:：]\s*(.+)$/gm, '### 第$1章：$2');
    
    // 11. 添加额外的容错处理规则
    // 处理可能残留的双星号（更严格的匹配，作为兜底）
    processed = processed.replace(/^\s*\*\*第(\S+?)章[:：]\s*(.+?)\*\*$/gm, '### 第$1章：$2');
    processed = processed.replace(/^\s*\*\*第(\S+?)卷[:：]\s*(.+?)\*\*$/gm, '## 第$1卷：$2');
    
    console.log('预处理完成，处理后长度:', processed.length);
    return processed;
  }
  
  /**
   * 解析大纲内容
   */
  private parseOutlineContent(content: string): ExtendedNovelOutline[] {
    const outlines: ExtendedNovelOutline[] = [];
    const lines = content.split('\n');
    let currentAct: ExtendedNovelOutline | null = null;
    let currentChapter: ExtendedNovelOutline | null = null;
    let inContentSection = false;
    let currentContent = '';
    
    console.log('开始解析大纲内容，行数:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // 跳过空行和无关行
      if (!trimmedLine) continue;
      
      console.log(`处理第${i}行: "${trimmedLine}"`);
      
      // 检查是否是卷标题 (## 格式)
      const actMatch = trimmedLine.match(/^##\s+(.+)$/);
      if (actMatch) {
        console.log('匹配到卷标题:', actMatch[1]);
        // 保存之前的内容
        if (currentChapter && currentContent) {
          currentChapter.content = currentContent.trim();
          console.log('保存章节内容:', currentContent.trim());
        } else if (currentAct && currentContent) {
          currentAct.content = currentContent.trim();
          console.log('保存卷内容:', currentContent.trim());
        }
        
        // 添加新的卷
        const act: ExtendedNovelOutline = {
          title: actMatch[1],
          type: 'main',
          tempId: `temp-act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        outlines.push(act);
        currentAct = act;
        currentChapter = null;
        currentContent = '';
        inContentSection = false;
        continue;
      }
      
      // 检查是否是章节标题 (### 格式)
      const chapterMatch = trimmedLine.match(/^###\s+(.+)$/);
      if (chapterMatch) {
        console.log('匹配到章节标题:', chapterMatch[1]);
        // 保存之前的内容
        if (currentChapter && currentContent) {
          currentChapter.content = currentContent.trim();
          console.log('保存章节内容:', currentContent.trim());
        } else if (currentAct && currentContent) {
          currentAct.content = currentContent.trim();
          console.log('保存卷内容:', currentContent.trim());
        }
        
        // 添加新的章节
        if (currentAct) {
          const chapter: ExtendedNovelOutline = {
            title: chapterMatch[1],
            type: 'chapter',
            parentTempId: currentAct.tempId,
            tempId: `temp-chapter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          outlines.push(chapter);
          currentChapter = chapter;
        } else {
          // 如果没有当前卷，创建一个默认卷
          console.log('没有当前卷，创建默认卷');
          const defaultAct: ExtendedNovelOutline = {
            title: '默认卷',
            type: 'main',
            tempId: `temp-act-default-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          outlines.push(defaultAct);
          currentAct = defaultAct;
          
          // 然后添加章节
          const chapter: ExtendedNovelOutline = {
            title: chapterMatch[1],
            type: 'chapter',
            parentTempId: currentAct.tempId,
            tempId: `temp-chapter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          outlines.push(chapter);
          currentChapter = chapter;
        }
        currentContent = '';
        inContentSection = false;
        continue;
      }
      
      // 检查是否是内容要点 (* 或 - 格式)
      if ((trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) && (currentChapter || currentAct)) {
        inContentSection = true;
        if (currentContent) {
          currentContent += '\n' + trimmedLine; // 保留 '* ' 或 '- ' 前缀，因为它可能是格式的一部分
        } else {
          currentContent = trimmedLine; // 保留 '* ' 或 '- ' 前缀
        }
        console.log('添加内容要点:', trimmedLine);
      } else if (inContentSection && (currentChapter || currentAct)) {
        // 继续添加内容到当前章节或卷
        currentContent += '\n' + trimmedLine;
        console.log('继续添加内容到章节或卷:', trimmedLine);
      } else if (currentChapter) {
        // 如果有章节但不在内容要点部分，将内容添加到章节中
        if (currentContent) {
          currentContent += '\n' + trimmedLine;
        } else {
          currentContent = trimmedLine;
        }
        console.log('添加内容到章节:', trimmedLine);
        inContentSection = true; // 一旦开始添加内容，就认为进入了内容部分
      } else if (currentAct && !currentChapter) {
        // 如果有卷但没有章节，将内容添加到卷中
        if (currentContent) {
          currentContent += '\n' + trimmedLine;
        } else {
          currentContent = trimmedLine;
        }
        console.log('添加内容到卷:', trimmedLine);
      } else if (!currentAct && !currentChapter) {
        // 如果既没有卷也没有章节，跳过这些内容
        console.log('跳过内容（无父级）:', trimmedLine);
      }
    }
    
    // 保存最后的内容
    if (currentChapter && currentContent) {
      currentChapter.content = currentContent.trim();
      console.log('保存最后的章节内容:', currentContent.trim());
    } else if (currentAct && currentContent) {
      currentAct.content = currentContent.trim();
      console.log('保存最后的卷内容:', currentContent.trim());
    }
    
    // 如果没有解析出任何卷结构，创建一个默认卷
    if (!outlines.some(outline => outline.type === 'main')) {
      console.log('没有解析出卷结构，创建默认卷');
      // 创建默认卷
      const defaultAct: ExtendedNovelOutline = {
        title: '默认卷',
        type: 'main',
        tempId: `temp-act-default-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      outlines.unshift(defaultAct);
      currentAct = defaultAct;
      
      // 将所有章节的parentTempId设置为默认卷的tempId
      outlines.forEach(outline => {
        if (outline.type === 'chapter') {
          outline.parentTempId = defaultAct.tempId;
        }
      });
    }
    
    console.log('解析完成，大纲项目:', outlines);
    return outlines;
  }
}

// 创建大纲同步服务实例
export const outlineSyncService = new OutlineSyncService();