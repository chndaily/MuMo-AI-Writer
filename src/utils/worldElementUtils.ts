import { Novel, Character, Location } from '#/novel'
import { hybridStorageService } from '@/services/hybridStorageService'
import { isSuperLargeOutline } from '@/utils/superLargeOutlineHandler'
import { getSuperLargeOutlineStructureSummary } from '@/utils/superLargeOutlineHandler'
import { useMembershipStore } from '@/stores/membershipStore'

/**
 * 获取已有元素信息，用于增强AI生成内容的关联性
 * 优化策略：
 * 1. 大纲作为主要上下文信息
 * 2. 世界观设定仅提供关键信息（名称和标签）
 * 3. 控制整体提示词长度
 * @param novelId 小说ID
 * @returns 已有元素信息字符串
 */
export async function getExistingElementsInfo(novelId: string): Promise<string> {
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

    // 添加角色信息（仅名称和标签）- 增强格式以提高AI识别度
    if (characters && characters.length > 0) {
      elementsInfo += '【已有角色信息（请勿重复生成以下角色）】\n'
      characters.forEach((character: any, index) => {
        elementsInfo += `${index + 1}. 角色名称：${character.name}\n`
        if (character.tags && Array.isArray(character.tags) && character.tags.length > 0) {
          elementsInfo += `   角色标签：${character.tags.join('、')}\n`
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
 * 获取已有元素信息，用于防止重复生成
 * @param novelId 小说ID
 * @returns 已有元素信息字符串
 */

/**
 * 获取大纲摘要信息，用于处理长大纲的情况
 * @param novelId 小说ID
 * @returns 大纲摘要信息字符串
 */
export async function getOutlineSummaryInfo(novelId: string): Promise<string> {
  try {
    // 检查认证状态
    const { isAuthenticated, authToken } = useMembershipStore.getState();
    if (!isAuthenticated || !authToken) {
      console.warn('用户未认证，无法获取大纲摘要信息');
      return '';
    }
    
    // 获取大纲信息
    const outlines = await hybridStorageService.getOutlines(novelId)

    let summaryInfo = ''

    // 添加大纲摘要信息（针对长大纲优化）
    if (outlines && outlines.length > 0) {
      summaryInfo += '【小说大纲摘要】\n'
      // 按照层级结构组织大纲信息
      const mainOutlines = outlines.filter(outline => outline.type === 'main')
      const chapterOutlines = outlines.filter(outline => outline.type === 'chapter')
      
      // 统计信息
      summaryInfo += `总卷数：${mainOutlines.length}\n`
      summaryInfo += `总章节数：${chapterOutlines.length}\n\n`
      
      // 显示主要的卷结构（限制数量）
      const maxMainOutlines = Math.min(mainOutlines.length, 3); // 最多显示3个主卷
      for (let i = 0; i < maxMainOutlines; i++) {
        const mainOutline = mainOutlines[i];
        summaryInfo += `${i + 1}. ${mainOutline.title}\n`
        
        // 显示该卷下的关键章节（限制数量）
        const chaptersInThisAct = chapterOutlines.filter(chapter => chapter.parentId === mainOutline.id)
        const maxChaptersToShow = Math.min(chaptersInThisAct.length, 5); // 每卷最多显示5个章节
        if (maxChaptersToShow > 0) {
          summaryInfo += '   关键章节：'
          for (let j = 0; j < maxChaptersToShow; j++) {
            const chapter = chaptersInThisAct[j];
            summaryInfo += `${chapter.title}${j < maxChaptersToShow - 1 ? '、' : ''}`
          }
          summaryInfo += '\n'
        }
      }
      
      // 如果还有更多卷，显示省略信息
      if (mainOutlines.length > maxMainOutlines) {
        summaryInfo += `...还有${mainOutlines.length - maxMainOutlines}个卷未显示\n`
      }
      
      summaryInfo += '\n'
    }

    return summaryInfo
  } catch (error) {
    console.error('获取大纲摘要信息失败:', error)
    return ''
  }
}

/**
 * 获取精简的已有元素信息，用于处理信息过载的情况
 * @param novelId 小说ID
 * @returns 精简的已有元素信息字符串
 */
export async function getCondensedElementsInfo(novelId: string): Promise<string> {
  try {
    // 检查认证状态
    const { isAuthenticated, authToken } = useMembershipStore.getState();
    if (!isAuthenticated || !authToken) {
      console.warn('用户未认证，无法获取精简元素信息');
      return '';
    }
    
    // 获取已有的元素信息
    const characters = await hybridStorageService.getWorldElements('character', novelId)
    const locations = await hybridStorageService.getWorldElements('location', novelId)
    const cultures = await hybridStorageService.getWorldElements('culture', novelId)
    const technologies = await hybridStorageService.getWorldElements('technology', novelId)
    const magics = await hybridStorageService.getWorldElements('magic', novelId)
    const histories = await hybridStorageService.getWorldElements('history', novelId)

    let condensedInfo = ''

    // 添加精简的角色信息
    if (characters && characters.length > 0) {
      condensedInfo += '【角色概览】\n'
      const maxCharactersToShow = Math.min(characters.length, 10); // 最多显示10个角色
      for (let i = 0; i < maxCharactersToShow; i++) {
        const character = characters[i];
        condensedInfo += `${i + 1}. ${character.name}\n`
      }
      if (characters.length > maxCharactersToShow) {
        condensedInfo += `...还有${characters.length - maxCharactersToShow}个角色\n`
      }
      condensedInfo += '\n'
    }

    // 添加精简的地点信息
    if (locations && locations.length > 0) {
      condensedInfo += '【地点概览】\n'
      const maxLocationsToShow = Math.min(locations.length, 10); // 最多显示10个地点
      for (let i = 0; i < maxLocationsToShow; i++) {
        const location = locations[i];
        condensedInfo += `${i + 1}. ${location.name}\n`
      }
      if (locations.length > maxLocationsToShow) {
        condensedInfo += `...还有${locations.length - maxLocationsToShow}个地点\n`
      }
      condensedInfo += '\n'
    }

    // 添加精简的文化信息
    if (cultures && cultures.length > 0) {
      condensedInfo += '【文化概览】\n'
      const maxCulturesToShow = Math.min(cultures.length, 10); // 最多显示10个文化
      for (let i = 0; i < maxCulturesToShow; i++) {
        const culture = cultures[i];
        condensedInfo += `${i + 1}. ${culture.name}\n`
      }
      if (cultures.length > maxCulturesToShow) {
        condensedInfo += `...还有${cultures.length - maxCulturesToShow}个文化\n`
      }
      condensedInfo += '\n'
    }

    // 添加精简的科技信息
    if (technologies && technologies.length > 0) {
      condensedInfo += '【科技概览】\n'
      const maxTechnologiesToShow = Math.min(technologies.length, 10); // 最多显示10个科技
      for (let i = 0; i < maxTechnologiesToShow; i++) {
        const technology = technologies[i];
        condensedInfo += `${i + 1}. ${technology.name}\n`
      }
      if (technologies.length > maxTechnologiesToShow) {
        condensedInfo += `...还有${technologies.length - maxTechnologiesToShow}个科技\n`
      }
      condensedInfo += '\n'
    }

    // 添加精简的魔法信息
    if (magics && magics.length > 0) {
      condensedInfo += '【魔法概览】\n'
      const maxMagicsToShow = Math.min(magics.length, 10); // 最多显示10个魔法
      for (let i = 0; i < maxMagicsToShow; i++) {
        const magic = magics[i];
        condensedInfo += `${i + 1}. ${magic.name}\n`
      }
      if (magics.length > maxMagicsToShow) {
        condensedInfo += `...还有${magics.length - maxMagicsToShow}个魔法\n`
      }
      condensedInfo += '\n'
    }

    // 添加精简的历史信息
    if (histories && histories.length > 0) {
      condensedInfo += '【历史概览】\n'
      const maxHistoriesToShow = Math.min(histories.length, 10); // 最多显示10个历史
      for (let i = 0; i < maxHistoriesToShow; i++) {
        const history = histories[i];
        condensedInfo += `${i + 1}. ${history.name}\n`
      }
      if (histories.length > maxHistoriesToShow) {
        condensedInfo += `...还有${histories.length - maxHistoriesToShow}个历史\n`
      }
      condensedInfo += '\n'
    }

    return condensedInfo
  } catch (error) {
    console.error('获取精简元素信息失败:', error)
    return ''
  }
}

/**
 * 增强特定指导，添加引用已有元素的要求
 * @param type 生成类型
 * @param novelId 小说ID
 * @param selectedChapterId 选中的章节ID（可选）
 * @returns 增强后的特定指导
 */
export async function enhanceTypeSpecificGuidance(type: string, novelId: string, selectedChapterId?: string): Promise<string> {
  // 检查认证状态
  const { isAuthenticated, authToken } = useMembershipStore.getState();
  if (!isAuthenticated || !authToken) {
    console.warn('用户未认证，无法增强特定指导');
    return '';
  }
  
  let guidance = ''
  
  // 根据生成类型添加基础指导
  switch (type) {
    case 'plot':
      guidance = '\n【生成要求】\n' +
                '- 基于提供的上下文继续创作情节，保持故事连贯性\n' +
                '- 深化人物性格展现，推动角色成长弧线\n' +
                '- 增加戏剧冲突和悬念，提升故事张力\n' +
                '- 注重细节描写和情感渲染，增强读者代入感\n' +
                '- 确保情节发展符合逻辑，避免突兀转折\n' +
                '- 为后续发展预留合理空间和可能性\n\n' +
                '【连贯性要求】\n' +
                '- 与前文情节无缝衔接\n' +
                '- 保持角色性格和行为的一致性\n' +
                '- 维持原有文风和语调\n\n' +
                '【结构要求】\n' +
                '- 合理安排情节段落和章节\n' +
                '- 确保情节推进的逻辑性\n' +
                '- 保持适当的叙事节奏\n' +
                '- 平衡动作、对话和描述\n\n' +
                '【人物发展】\n' +
                '- 推动角色成长和变化\n' +
                '- 展现人物内心冲突\n' +
                '- 通过情节展现角色特质\n' +
                '- 合理安排人物关系变化\n\n' +
                '【世界观融合】\n' +
                '- 自然融入世界观设定\n' +
                '- 展现设定对情节的影响\n' +
                '- 通过情节丰富世界观\n\n' +
                '【质量要求】\n' +
                '- 保持读者的阅读兴趣\n' +
                '- 确保情节的原创性和吸引力\n\n' +
                '【输出要求】\n' +
                '- 使用纯文本格式，无需特殊标记\n' +
                '- 不要包含任何解释性文字\n' +
                '- 直接输出创作内容'
      break
    case 'character':
      guidance = '\n【生成要求】\n' +
                '- 结合小说的世界观和背景创建角色\n' +
                '- 确保角色设定与故事风格相符\n' +
                '- 提供详细的外貌、性格、背景描述\n' +
                '- 包含角色类型分类：主角、反派、配角等\n' +
                '- 描述角色在故事中的作用和影响\n' +
                '- 设定角色的成长弧线和潜在变化\n' +
                '- 生成多维度标签，包括职业标签、性格标签、功能标签\n' +
                '- 增加角色内在矛盾和动机合理性\n' +
                '- 强化角色与世界观及其他角色的动态关系\n' +
                '- 如果大纲中提及了相关人物，请确保角色设定与大纲描述保持一致\n' +
                '- 如果大纲中提及了相关人物，请确保角色设定与大纲描述保持一致\n' +
                '- 角色的行为和动机应符合大纲中的情节发展要求\n' +
                '- 角色的成长弧线应与大纲中的故事线索相呼应\n' +
                '- 请不要生成与【已有角色信息】中列出的角色重复的角色\n' +
                '- 请不要生成与大纲中已提及角色重复的角色\n\n' +
                '请按照以下结构生成角色信息：\n' +
                '【角色设定1：名称】\n' +
                '【基本信息】\n' +
                '【名称】：\n' +
                '【角色类型】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：剑士、勇敢、推动者\n' +
                '【描述】：\n' +
                '【外貌特征】\n' +
                '【性格特质】\n' +
                '【背景故事】\n' +
                '【能力设定】\n' +
                '【人际关系】\n' +
                '【角色发展弧光】\n' +
                '【细节补充】\n' +
                '【角色设定2：名称】\n' +
                '【基本信息】\n' +
                '【名称】：\n' +
                '【角色类型】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：法师、理智、信息提供者\n' +
                '【描述】：\n' +
                '【外貌特征】\n' +
                '【性格特质】\n' +
                '【背景故事】\n' +
                '【能力设定】\n' +
                '【人际关系】\n' +
                '【角色发展弧光】\n' +
                '【细节补充】'
      break
    case 'location':
      guidance = '\n【生成要求】\n' +
                '- 结合小说的世界观创建地点设定\n' +
                '- 描述地理位置、环境特征、气候条件\n' +
                '- 包括建筑风格、文化背景、历史意义\n' +
                '- 考虑与其他地点的关系和连接\n' +
                '- 使用丰富的感官细节增强真实感\n' +
                '- 突出地点在故事中的独特作用\n' +
                '- 注重感官细节描写，通过视觉、听觉、嗅觉、触觉等多维度展现地理环境\n' +
                '- 强化历史背景与当前状态的联系，展现地点的演变过程\n' +
                '- 请不要生成与【已有地点信息】中列出的地点重复的地点\n\n' +
                '请按照以下结构生成地点信息：\n' +
                '【地点设定1：名称】\n' +
                '---\n' +
                '【名称】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：城市、繁华、港口\n' +
                '【描述】：\n' +
                '【类型】：由AI生成具体的类型描述，而非从预设选项中选择\n' +
                '【重要性】：由AI生成具体的重要性描述，而非从预设选项中选择\n' +
                '【地理环境】\n' +
                '【文化背景】\n' +
                '【政治环境】\n' +
                '【经济状况】\n' +
                '【细节补充】\n' +
                '---\n' +
                '【地点设定2：名称】\n' +
                '---\n' +
                '【名称】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：城市、繁华、港口\n' +
                '【描述】：\n' +
                '【类型】：由AI生成具体的类型描述，而非从预设选项中选择\n' +
                '【重要性】：由AI生成具体的重要性描述，而非从预设选项中选择\n' +
                '【地理环境】\n' +
                '【文化背景】\n' +
                '【政治环境】\n' +
                '【经济状况】\n' +
                '【细节补充】\n' +
                '---\n' +
                '生成的地点设定数量应根据用户的具体需求和上下文来确定，可以是一个或多个，每个设定项之间使用三个短横线"---"分隔\n' +
                '- 突出地点对情节发展和角色行为的影响，增强地点在故事中的作用'
      break
    case 'culture':
      guidance = '\n【生成要求】\n' +
                '- 结合小说的世界观创建文化设定\n' +
                '- 描述社会结构、价值观念、传统习俗\n' +
                '- 包括语言文字、艺术形式、宗教信仰\n' +
                '- 考虑不同文化间的交流和冲突\n' +
                '- 体现文化的独特性和深度\n' +
                '- 与故事发展和人物塑造相关联\n' +
                '- 增加日常习俗、象征意义、文化冲突与融合等内容\n' +
                '- 请不要生成与【已有文化信息】中列出的文化重复的文化\n\n' +
                '请按照以下结构生成文化设定：\n' +
                '【文化设定1：名称】\n' +
                '---\n' +
                '【基本信息】\n' +
                '【名称】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：东方、西方、古代、现代等\n' +
                '【描述】：\n' +
                '【传统习俗】\n' +
                '主要节日：\n' +
                '礼仪规范：\n' +
                '日常习俗：\n' +
                '【价值观念】\n' +
                '核心价值：\n' +
                '道德标准：\n' +
                '【艺术表现】\n' +
                '文学形式：\n' +
                '音乐舞蹈：\n' +
                '视觉艺术：\n' +
                '象征意义：\n' +
                '【宗教信仰】\n' +
                '主要信仰：\n' +
                '宗教仪式：\n' +
                '神话传说：\n' +
                '【语言文字】\n' +
                '语言特点：\n' +
                '文字系统：\n' +
                '【文化互动】\n' +
                '文化冲突：\n' +
                '文化融合：\n' +
                '【细节补充】\n' +
                '---\n' +
                '【文化设定2：名称】\n' +
                '---\n' +
                '【基本信息】\n' +
                '【名称】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：东方、西方、古代、现代等\n' +
                '【描述】：\n' +
                '【传统习俗】\n' +
                '主要节日：\n' +
                '礼仪规范：\n' +
                '日常习俗：\n' +
                '【价值观念】\n' +
                '核心价值：\n' +
                '道德标准：\n' +
                '【艺术表现】\n' +
                '文学形式：\n' +
                '音乐舞蹈：\n' +
                '视觉艺术：\n' +
                '象征意义：\n' +
                '【宗教信仰】\n' +
                '主要信仰：\n' +
                '宗教仪式：\n' +
                '【语言文字】\n' +
                '语言特点：\n' +
                '文字系统：\n' +
                '【文化互动】\n' +
                '文化冲突：\n' +
                '文化融合：\n' +
                '【细节补充】\n' +
                '---\n' +
                '生成的文化设定数量应根据用户的具体需求和上下文来确定，可以是一个或多个，每个设定项之间使用三个短横线"---"分隔'
      break
    case 'technology':
      guidance = '\n【生成要求】\n' +
                '- 结合小说的世界观创建科技设定\n' +
                '- 描述科技水平、发展方向、核心技术\n' +
                '- 包括应用领域、对社会的影响、使用限制\n' +
                '- 考虑科技与魔法、文化的相互作用\n' +
                '- 体现技术的独特性和创新性\n' +
                '- 与故事情节发展相关联\n' +
                '- 增加发展时间线、伦理考量、原创性考量等内容\n' +
                '- 请不要生成与【已有科技信息】中列出的科技重复的科技\n\n' +
                '请按照以下结构生成科技设定：\n' +
                '【科技设定1：名称】\n' +
                '---\n' +
                '【基本信息】\n' +
                '【名称】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：能源、交通、医疗、通讯等\n' +
                '【描述】：\n' +
                '【科技水平】\n' +
                '发展阶段：\n' +
                '核心技术：\n' +
                '发展时间线：\n' +
                '【应用场景】\n' +
                '主要用途：\n' +
                '应用领域：\n' +
                '【使用限制】\n' +
                '能源需求：\n' +
                '副作用：\n' +
                '伦理考量：\n' +
                '【社会影响】\n' +
                '对社会的影响：\n' +
                '原创性考量：\n' +
                '【细节补充】\n' +
                '---\n' +
                '【科技设定2：名称】\n' +
                '---\n' +
                '【基本信息】\n' +
                '【名称】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：能源、交通、医疗、通讯等\n' +
                '【描述】：\n' +
                '【科技水平】\n' +
                '发展阶段：\n' +
                '核心技术：\n' +
                '发展时间线：\n' +
                '【应用场景】\n' +
                '主要用途：\n' +
                '应用领域：\n' +
                '【使用限制】\n' +
                '能源需求：\n' +
                '副作用：\n' +
                '伦理考量：\n' +
                '【社会影响】\n' +
                '对社会的影响：\n' +
                '原创性考量：\n' +
                '【细节补充】\n' +
                '---\n' +
                '生成的科技设定数量应根据用户的具体需求和上下文来确定，可以是一个或多个，每个设定项之间使用三个短横线"---"分隔'
      break
    case 'magic':
      guidance = '\n【生成要求】\n' +
                '- 结合小说的世界观创建魔法设定\n' +
                '- 描述魔法系统、能量源泉、施法方式\n' +
                '- 包括魔法物品、使用限制、副作用\n' +
                '- 考虑魔法与科技、文化的关系\n' +
                '- 体现体系的平衡性和独特性\n' +
                '- 与故事情节发展相关联\n' +
                '- 增加平衡性原则、施法代价、风险设定、世界观关联等内容\n' +
                '- 请不要生成与【已有魔法信息】中列出的魔法重复的魔法\n\n' +
                '请按照以下结构生成魔法设定：\n' +
                '【魔法设定1：名称】\n' +
                '---\n' +
                '【基本信息】\n' +
                '【名称】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：元素、召唤、治愈、诅咒等\n' +
                '【描述】：\n' +
                '【魔法系统】\n' +
                '体系特点：\n' +
                '修行方式：\n' +
                '平衡性原则：\n' +
                '【能量源泉】\n' +
                '来源：\n' +
                '获取方式：\n' +
                '【施法规则】\n' +
                '施法条件：\n' +
                '限制因素：\n' +
                '消耗机制：\n' +
                '【法术示例】\n' +
                '基础法术：\n' +
                '中级法术：\n' +
                '高级法术：\n' +
                '禁忌法术：\n' +
                '【魔法物品】\n' +
                '法器类型：\n' +
                '制作方法：\n' +
                '使用方式：\n' +
                '【世界观关联】\n' +
                '与科技的关系：\n' +
                '与文化的关系：\n' +
                '与历史的关系：\n' +
                '与其他元素的关系：\n' +
                '【细节补充】\n' +
                '【魔法设定2：名称】\n' +
                '---\n' +
                '【基本信息】\n' +
                '【名称】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：元素、召唤、治愈、诅咒等\n' +
                '【描述】：\n' +
                '【魔法系统】\n' +
                '体系特点：\n' +
                '修行方式：\n' +
                '平衡性原则：\n' +
                '【能量源泉】\n' +
                '来源：\n' +
                '获取方式：\n' +
                '【施法规则】\n' +
                '施法条件：\n' +
                '限制因素：\n' +
                '消耗机制：\n' +
                '【法术示例】\n' +
                '基础法术：\n' +
                '中级法术：\n' +
                '高级法术：\n' +
                '禁忌法术：\n' +
                '【魔法物品】\n' +
                '法器类型：\n' +
                '制作方法：\n' +
                '使用方式：\n' +
                '【世界观关联】\n' +
                '与科技的关系：\n' +
                '与文化的关系：\n' +
                '与历史的关系：\n' +
                '与其他元素的关系：\n' +
                '【细节补充】\n' +
                '---\n' +
                '生成的魔法设定数量应根据用户的具体需求和上下文来确定，可以是一个或多个，每个设定项之间使用三个短横线"---"分隔'
      break
    case 'history':
      guidance = '\n【生成要求】\n' +
                '- 结合小说的世界观创建历史设定\n' +
                '- 描述历史时期、重要事件、关键人物\n' +
                '- 包括时间线、因果关系、影响后果\n' +
                '- 考虑与其他历史事件的关联\n' +
                '- 体现历史的独特性和深度\n' +
                '- 与故事情节发展相关联\n' +
                '- 增加时代背景、文化影响、关键人物、贡献、对后世的影响等内容\n' +
                '- 请不要生成与【已有历史信息】中列出的历史重复的历史\n\n' +
                '请按照以下结构生成历史设定：\n' +
                '【历史设定1：名称】\n' +
                '---\n' +
                '【基本信息】\n' +
                '【名称】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：古代、战争、王朝、革命等\n' +
                '【描述】：\n' +
                '【时间线】\n' +
                '时间节点：\n' +
                '重要时期：\n' +
                '年代跨度：\n' +
                '【重要事件】\n' +
                '重大事件：\n' +
                '战争冲突：\n' +
                '政治变迁：\n' +
                '文化交融：\n' +
                '【历史人物】\n' +
                '关键人物：\n' +
                '英雄豪杰：\n' +
                '奸臣恶徒：\n' +
                '普通民众：\n' +
                '【历史后果】\n' +
                '对后世的影响：\n' +
                '遗产传承：\n' +
                '未解之谜：\n' +
                '【细节补充】\n' +
                '社会状况：\n' +
                '经济发展：\n' +
                '科技水平：\n' +
                '其他相关信息\n' +
                '---\n' +
                '【历史设定2：名称】\n' +
                '---\n' +
                '【基本信息】\n' +
                '【名称】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：古代、战争、王朝、革命等\n' +
                '【描述】：\n' +
                '【时间线】\n' +
                '时间节点：\n' +
                '重要时期：\n' +
                '年代跨度：\n' +
                '【重要事件】\n' +
                '重大事件：\n' +
                '战争冲突：\n' +
                '政治变迁：\n' +
                '文化交融：\n' +
                '【历史人物】\n' +
                '关键人物：\n' +
                '英雄豪杰：\n' +
                '奸臣恶徒：\n' +
                '普通民众：\n' +
                '【历史后果】\n' +
                '对后世的影响：\n' +
                '遗产传承：\n' +
                '未解之谜：\n' +
                '【细节补充】\n' +
                '社会状况：\n' +
                '经济发展：\n' +
                '科技水平：\n' +
                '其他相关信息\n' +
                '---\n' +
                '生成的历史设定数量应根据用户的具体需求和上下文来确定，可以是一个或多个，每个设定项之间使用三个短横线"---"分隔'
      break
    case 'content':
      guidance = '\n【创作要求】\n' +
                '- 紧密结合选中章节的情节和人物设定\n' +
                '- 保持叙事风格和语调一致\n' +
                '- 注重情节推进和情感渲染\n' +
                '- 保持与前文的一致性和连贯性\n' +
                '- 避免重复已有内容，推进故事发展\n\n' +
                '【质量标准】\n' +
                '- 语言生动，描写细腻\n' +
                '- 逻辑严密，结构完整\n' +
                '- 人物形象鲜明，对话自然\n' +
                '- 段落安排合理，节奏控制得当\n\n' +
                '【创作指导】\n' +
                '- 请仔细阅读【选中章节详细信息】中的章节标题和内容概述\n' +
                '- 确保生成的内容与大纲要求的情节发展一致\n' +
                '- 重点描写章节中提到的关键事件和人物情感变化\n' +
                '- 合理安排章节中的冲突、高潮和转折点\n' +
                '- 注意细节描写，增强读者代入感\n\n' +
                '【结构要求】\n' +
                '- 使用清晰的段落划分\n' +
                '- 保持适当的章节长度（建议300-800字）\n' +
                '- 合理安排对话与叙述的比例\n\n' +
                '【输出格式】\n' +
                '- 使用纯文本格式，无需特殊标记\n' +
                '- 不要包含任何解释性文字\n' +
                '- 直接输出创作内容\n' +
                '- 在内容末尾添加摘要，格式为：#SUMMARY#开头\n' +
                '- 摘要应简洁概括本章核心内容和关键情节\n\n'
      break
    case 'optimize':
      guidance = '\n【优化要求】\n' +
                '- 基于当前内容进行优化，保持核心情节不变\n' +
                '- 提升文字表达的生动性和感染力\n' +
                '- 改善句式结构和词汇选择\n' +
                '- 强化情感渲染和细节描写\n' +
                '- 修正可能的语法或逻辑问题\n' +
                '- 确保优化后的内容更加流畅自然\n\n' +
                '【语言优化】\n' +
                '- 消除冗余表达和重复内容\n' +
                '- 改善用词的精确性和丰富性\n' +
                '- 增强语言的表现力和感染力\n\n' +
                '【结构优化】\n' +
                '- 优化段落长度和分布\n' +
                '- 改善过渡句和连接词的使用\n' +
                '- 确保内容层次清晰、条理分明\n\n' +
                '【风格保持】\n' +
                '- 保持叙述视角的一致性\n' +
                '- 维持对话风格的统一性\n\n' +
                '【细节优化】\n' +
                '- 改善标点符号的使用\n' +
                '- 优化对话的自然性和真实感\n' +
                '- 增强场景描写的画面感\n\n' +
                '【质量提升】\n' +
                '- 确保内容连贯性和一致性\n' +
                '- 提升整体可读性和吸引力\n' +
                '- 避免突兀的表达和转折\n' +
                '- 保持读者的阅读兴趣和代入感\n\n' +
                '【输出要求】\n' +
                '- 保持原文的核心内容和情节不变\n' +
                '- 使用纯文本格式，无需特殊标记\n' +
                '- 不要包含任何解释性文字\n' +
                '- 直接输出优化后的内容'
      break
    default:
      guidance = ''
  }

  // 获取增强版的已有元素信息并添加到指导中
  const { getEnhancedExistingElementsInfo } = await import('@/utils/enhancedWorldElementUtils');
  const existingElementsInfo = await getEnhancedExistingElementsInfo(novelId, type, selectedChapterId)
  if (existingElementsInfo) {
    guidance += '\n\n【重要提醒】\n' +
                '请在生成内容时参考以下已有的元素信息，确保新生成的内容与已有元素保持一致性和关联性：\n' +
                existingElementsInfo
  }

  return guidance
}