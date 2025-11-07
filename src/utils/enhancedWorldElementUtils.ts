import { Novel, Character, Location } from '#/novel'
import { hybridStorageService } from '@/services/hybridStorageService'
import { isSuperLargeOutline } from '@/utils/superLargeOutlineHandler'
import { getSuperLargeOutlineStructureSummary } from '@/utils/superLargeOutlineHandler'
import { extractCharactersFromOutline } from '@/utils/outlineCharacterExtractor'
import { useMembershipStore } from '@/stores/membershipStore'

/**
 * 获取增强版的已有元素信息，特别针对角色生成场景
 * @param novelId 小说ID
 * @returns 增强版的已有元素信息字符串
 */
export async function getEnhancedExistingElementsInfo(novelId: string, generationType: string): Promise<string> {
  try {
    // 检查认证状态
    const { isAuthenticated, authToken } = useMembershipStore.getState();
    if (!isAuthenticated || !authToken) {
      console.warn('用户未认证，无法获取元素信息');
      return '';
    }
    
    // 获取已有的角色信息
    const characters = await hybridStorageService.getWorldElements('character', novelId)
    // 获取已有的地点信息
    const locations = await hybridStorageService.getWorldElements('location', novelId)
    // 获取已有的文化信息
    const cultures = await hybridStorageService.getWorldElements('culture', novelId)
    // 获取已有的科技信息
    const technologies = await hybridStorageService.getWorldElements('technology', novelId)
    // 获取已有的魔法信息
    const magics = await hybridStorageService.getWorldElements('magic', novelId)
    // 获取已有的历史信息
    const histories = await hybridStorageService.getWorldElements('history', novelId)
    // 获取大纲信息
    const outlines = await hybridStorageService.getOutlines(novelId)

    let elementsInfo = ''

    // 添加大纲信息（作为主要上下文）- 优化处理长大纲
    if (outlines && outlines.length > 0) {
      // 计算大纲总字数
      const totalWordCount = outlines.reduce((sum, outline) => sum + (outline.content?.length || 0), 0);
      
      // 检查是否为超长大纲
      if (isSuperLargeOutline(totalWordCount)) {
        // 对于超长大纲，使用结构摘要而不是详细内容
        elementsInfo += '【小说大纲信息 - 超长大纲模式】\n'
        elementsInfo += '注意：检测到大纲超长（超过18000字），以下为大纲结构摘要\n\n'
        
        // 获取超长大纲结构摘要
        try {
          const superLargeSummary = await getSuperLargeOutlineStructureSummary(novelId);
          elementsInfo += superLargeSummary + '\n';
        } catch (error) {
          console.error('获取超长大纲摘要失败:', error);
          elementsInfo += '获取超长大纲摘要失败\n\n';
        }
      } else {
        // 对于普通大纲，使用原有处理方式
        elementsInfo += '【小说大纲信息】\n'
        // 按照层级结构组织大纲信息
        const mainOutlines = outlines.filter(outline => outline.type === 'main')
        const chapterOutlines = outlines.filter(outline => outline.type === 'chapter')
        
        // 限制主卷数量和内容长度，避免信息过载
        const maxMainOutlines = Math.min(mainOutlines.length, 5); // 最多显示5个主卷
        for (let i = 0; i < maxMainOutlines; i++) {
          const mainOutline = mainOutlines[i];
          elementsInfo += `卷：${mainOutline.title}\n`
          // 只添加关键的大纲信息，避免过长
          if (mainOutline.content) {
            // 如果内容过长，只显示前200个字符并添加省略号
            const displayContent = mainOutline.content.length <= 200 
              ? mainOutline.content 
              : mainOutline.content.substring(0, 197) + '...'
            elementsInfo += `卷描述：${displayContent}\n`
          }
          
          // 添加该卷下的章节信息（仅标题和关键摘要）
          const chaptersInThisAct = chapterOutlines.filter(chapter => chapter.parentId === mainOutline.id)
          // 限制每卷显示的章节数量
          const maxChaptersToShow = Math.min(chaptersInThisAct.length, 10); // 每卷最多显示10个章节
          if (maxChaptersToShow > 0) {
            elementsInfo += '  章节：'
            for (let j = 0; j < maxChaptersToShow; j++) {
              const chapter = chaptersInThisAct[j];
              elementsInfo += `${chapter.title}${j < maxChaptersToShow - 1 ? '、' : ''}`
            }
            elementsInfo += '\n'
          }
        }
        
        // 如果有未归属于任何卷的章节，单独列出（限制数量）
        const unassignedChapters = chapterOutlines.filter(chapter => !chapter.parentId || !mainOutlines.some(act => act.id === chapter.parentId))
        const maxUnassignedToShow = Math.min(unassignedChapters.length, 15); // 最多显示15个未分配章节
        if (maxUnassignedToShow > 0) {
          elementsInfo += '未归属于卷的章节：'
          for (let i = 0; i < maxUnassignedToShow; i++) {
            const chapter = unassignedChapters[i];
            elementsInfo += `${chapter.title}${i < maxUnassignedToShow - 1 ? '、' : ''}`
          }
          elementsInfo += '\n'
        }
        elementsInfo += '\n'
      }
    }

    // 特别处理角色生成场景
    if (generationType === 'character') {
      // 提取大纲中提及但未详细设定的角色
      try {
        const mentionedCharacters = await extractCharactersFromOutline(outlines);
        const existingCharacterNames = characters.map((char: any) => char.name);
        const undetailedCharacters = mentionedCharacters.filter(
          name => !existingCharacterNames.includes(name)
        );
        
        if (undetailedCharacters.length > 0) {
          elementsInfo += '【大纲中提及但未详细设定的角色】\n'
          elementsInfo += '请优先为以下角色生成详细设定：\n'
          undetailedCharacters.forEach((name, index) => {
            elementsInfo += `${index + 1}. ${name}\n`
          });
          elementsInfo += '\n'
        }
      } catch (error) {
        console.warn('提取未详细设定角色失败:', error);
      }
    }

    // 添加角色信息（仅名称和标签）- 增强格式以提高AI识别度
    if (characters && characters.length > 0) {
      elementsInfo += '【已有角色信息（请勿重复生成以下角色）】\n'
      characters.forEach((character: any, index) => {
        elementsInfo += `${index + 1}. 角色名称：${character.name}\n`
        if (character.tags && Array.isArray(character.tags) && character.tags.length > 0) {
          elementsInfo += `   角色标签：${character.tags.join('、')}\n`
        }
        // 如果是大纲中提及的角色，添加标识
        if (character.isFromOutline) {
          elementsInfo += `   来源：大纲中提及的角色\n`
        }
        elementsInfo += '\n'
      })
    }

    // 添加地点信息（仅名称和标签）- 增强格式以提高AI识别度
    if (locations && locations.length > 0) {
      elementsInfo += '【已有地点信息（请勿重复生成以下地点）】\n'
      locations.forEach((location: any, index) => {
        elementsInfo += `${index + 1}. 地点名称：${location.name}\n`
        if (location.tags && Array.isArray(location.tags) && location.tags.length > 0) {
          elementsInfo += `   地点标签：${location.tags.join('、')}\n`
        }
        elementsInfo += '\n'
      })
    }

    // 添加文化信息（仅名称和标签）- 增强格式以提高AI识别度
    if (cultures && cultures.length > 0) {
      elementsInfo += '【已有文化信息（请勿重复生成以下文化）】\n'
      cultures.forEach((culture: any, index) => {
        elementsInfo += `${index + 1}. 文化名称：${culture.name}\n`
        if (culture.tags && Array.isArray(culture.tags) && culture.tags.length > 0) {
          elementsInfo += `   文化标签：${culture.tags.join('、')}\n`
        }
        elementsInfo += '\n'
      })
    }

    // 添加科技信息（仅名称和标签）- 增强格式以提高AI识别度
    if (technologies && technologies.length > 0) {
      elementsInfo += '【已有科技信息（请勿重复生成以下科技）】\n'
      technologies.forEach((technology: any, index) => {
        elementsInfo += `${index + 1}. 科技名称：${technology.name}\n`
        if (technology.tags && Array.isArray(technology.tags) && technology.tags.length > 0) {
          elementsInfo += `   科技标签：${technology.tags.join('、')}\n`
        }
        elementsInfo += '\n'
      })
    }

    // 添加魔法信息（仅名称和标签）- 增强格式以提高AI识别度
    if (magics && magics.length > 0) {
      elementsInfo += '【已有魔法信息（请勿重复生成以下魔法）】\n'
      magics.forEach((magic: any, index) => {
        elementsInfo += `${index + 1}. 魔法名称：${magic.name}\n`
        if (magic.tags && Array.isArray(magic.tags) && magic.tags.length > 0) {
          elementsInfo += `   魔法标签：${magic.tags.join('、')}\n`
        }
        elementsInfo += '\n'
      })
    }

    // 添加历史信息（仅名称和标签）- 增强格式以提高AI识别度
    if (histories && histories.length > 0) {
      elementsInfo += '【已有历史信息（请勿重复生成以下历史）】\n'
      histories.forEach((history: any, index) => {
        elementsInfo += `${index + 1}. 历史名称：${history.name}\n`
        if (history.tags && Array.isArray(history.tags) && history.tags.length > 0) {
          elementsInfo += `   历史标签：${history.tags.join('、')}\n`
        }
        elementsInfo += '\n'
      })
    }

    // 限制总长度以避免提示词过长，但确保关键信息不被截断
    if (elementsInfo.length > 8000) {  // 增加长度限制以保留更多关键信息
      elementsInfo = elementsInfo.substring(0, 8000) + '\n...（信息已截断以控制提示词长度）\n'
    }

    return elementsInfo
  } catch (error) {
    console.error('获取已有元素信息失败:', error)
    return ''
  }
}

/**
 * 获取大纲中未详细设定的角色列表
 * @param novelId 小说ID
 * @returns 未详细设定的角色名称数组
 */
export async function getUndetailedCharactersFromOutline(novelId: string): Promise<string[]> {
  try {
    // 检查认证状态
    const { isAuthenticated, authToken } = useMembershipStore.getState();
    if (!isAuthenticated || !authToken) {
      console.warn('用户未认证，无法获取未详细设定角色信息');
      return [];
    }
    
    // 获取大纲信息
    const outlines = await hybridStorageService.getOutlines(novelId);
    
    if (!outlines || outlines.length === 0) {
      return [];
    }
    
    // 提取大纲中提及的角色
    const mentionedCharacters = await extractCharactersFromOutline(outlines);
    
    // 获取已存在的角色
    const existingCharacters = await hybridStorageService.getWorldElements('character', novelId);
    const existingCharacterNames = existingCharacters.map((char: any) => char.name);
    
    // 过滤出未详细设定的角色
    const undetailedCharacters = mentionedCharacters.filter(
      name => !existingCharacterNames.includes(name)
    );
    
    return undetailedCharacters;
  } catch (error) {
    console.error('获取未详细设定角色失败:', error);
    return [];
  }
}

export default {
  getEnhancedExistingElementsInfo,
  getUndetailedCharactersFromOutline
};