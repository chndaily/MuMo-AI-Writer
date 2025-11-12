import { Novel, Character, Location } from '#/novel'
import { hybridStorageService } from '@/services/hybridStorageService'
import { isSuperLargeOutline } from '@/utils/superLargeOutlineHandler'
import { getSuperLargeOutlineStructureSummary } from '@/utils/superLargeOutlineHandler'
import { extractCharactersFromOutline } from '@/utils/outlineCharacterExtractor'
import { useMembershipStore } from '@/stores/membershipStore'

/**
 * 获取增强版的已有元素信息，特别针对角色生成场景
 * @param novelId 小说ID
 * @param generationType 生成类型
 * @param selectedChapterId 选中的章节ID（可选）
 * @returns 增强版的已有元素信息字符串
 */
export async function getEnhancedExistingElementsInfo(novelId: string, generationType: string, selectedChapterId?: string): Promise<string> {
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
    // 对于内容生成类型，增加长度限制以保留更多关键信息
    // 根据项目规范，将内容生成类型的提示词长度限制增加到20000字符以缓解长度问题
    const maxLength = generationType === 'content' || generationType === 'plot' || generationType === 'optimize' ? 20000 : 8000;
    if (elementsInfo.length > maxLength) {
      elementsInfo = elementsInfo.substring(0, maxLength) + '\n...（信息已截断以控制提示词长度）\n'
    }

    // 如果是内容生成类型且提供了选中的章节ID，添加所有已完成章节的摘要信息
    if (generationType === 'content' && selectedChapterId) {
      try {
        // 按顺序排列章节
        const chapterOutlines = outlines.filter(outline => outline.type === 'chapter')
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // 找到选中章节的索引
        const selectedChapterIndex = chapterOutlines.findIndex(chapter => chapter.id === selectedChapterId);
        
        // 如果找到了选中章节且不是第一个章节，则添加所有已完成章节的摘要信息
        if (selectedChapterIndex > 0) {
          elementsInfo += '\n【已完成章节摘要信息】\n';
          let hasPreviousSummaries = false;
          
          // 只添加最近的章节摘要信息，避免提示词过长
          // 计算起始索引，只显示最近的10个章节摘要（如果有的话）
          const startIndex = Math.max(0, selectedChapterIndex - 10);
          for (let i = startIndex; i < selectedChapterIndex; i++) {
            const chapter = chapterOutlines[i];
            if (chapter.summary) {
              // 对较早章节的摘要进行压缩处理，以控制提示词长度
              const summaryText = i < selectedChapterIndex - 5 
                ? chapter.summary.substring(0, Math.min(120, chapter.summary.length)) + (chapter.summary.length > 120 ? '...' : '')
                : chapter.summary;
              elementsInfo += `章节《${chapter.title}》摘要：${summaryText}\n`;
              hasPreviousSummaries = true;
            }
          }
          
          // 如果没有已完成章节的摘要信息，则添加提示
          if (!hasPreviousSummaries) {
            elementsInfo += '暂无已完成章节的摘要信息\n';
          }
          
          // 添加与当前章节相关的关键故事线索
          // 查找与当前章节内容相关的线索
          const currentChapter = chapterOutlines[selectedChapterIndex];
          if (currentChapter) {
            const relatedStoryThreads: any[] = [];
            // 查找标题或内容中包含关键线索词的大纲项，并且与当前章节相关
            const keyWords = ['主线', '关键情节', '核心冲突', '主要线索', '重要转折'];
            // 同时考虑与当前章节标题相关的线索
            const currentChapterKeywords = currentChapter.title.split(/[\s\-_]+/).filter(word => word.length > 1);
            
            outlines.forEach(outline => {
              // 检查是否包含关键线索词
              const hasKeyWord = keyWords.some(keyword => 
                outline.title.includes(keyword) || 
                (outline.content && outline.content.includes(keyword))
              );
              
              // 检查是否与当前章节标题相关
              const isRelatedToCurrentChapter = currentChapterKeywords.some(keyword => 
                outline.title.includes(keyword) || 
                (outline.content && outline.content.includes(keyword))
              );
              
              if (hasKeyWord || isRelatedToCurrentChapter) {
                relatedStoryThreads.push(outline);
              }
            });
            
            // 限制显示数量，避免占用过多提示词长度
            if (relatedStoryThreads.length > 0) {
              elementsInfo += '\n【相关故事线索】\n';
              const maxThreadsToShow = Math.min(relatedStoryThreads.length, 3);
              relatedStoryThreads.slice(0, maxThreadsToShow).forEach((thread, index) => {
                elementsInfo += `${index + 1}. ${thread.title}\n`;
                if (thread.content) {
                  elementsInfo += `   内容：${thread.content.substring(0, 100)}${thread.content.length > 100 ? '...' : ''}\n`;
                }
              });
              if (relatedStoryThreads.length > maxThreadsToShow) {
                elementsInfo += `   ...还有${relatedStoryThreads.length - maxThreadsToShow}个相关线索\n`;
              }
              elementsInfo += '\n';
            }
          }
          
          // 添加故事连贯性要求
          elementsInfo += '\n【故事连贯性要求】\n';
          elementsInfo += '- 请严格遵循故事时间线发展，确保与已完成章节的时间关系一致\n';
          elementsInfo += '- 保持角色性格和行为的一致性，避免突兀变化\n';
          elementsInfo += '- 维持故事主线清晰，确保情节发展符合逻辑\n';
          elementsInfo += '- 与已完成章节情节无缝衔接，避免出现矛盾或断裂\n';
          elementsInfo += '\n';
        }
      } catch (error) {
        console.warn('获取已完成章节摘要信息失败:', error);
      }
    }

    console.log('增强版元素信息，生成类型:', generationType, '信息长度:', elementsInfo.length);
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