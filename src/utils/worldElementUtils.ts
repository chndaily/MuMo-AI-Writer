import { Novel, Character, Location } from '#/novel'
import { hybridStorageService } from '@/services/hybridStorageService'

/**
 * 获取已有元素信息，用于增强AI生成内容的关联性
 * @param novelId 小说ID
 * @returns 已有元素信息字符串
 */
export async function getExistingElementsInfo(novelId: string): Promise<string> {
  try {
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

    // 添加大纲信息
    if (outlines && outlines.length > 0) {
      elementsInfo += '【小说大纲信息】\n'
      // 按照层级结构组织大纲信息
      const mainOutlines = outlines.filter(outline => outline.type === 'main')
      const chapterOutlines = outlines.filter(outline => outline.type === 'chapter')
      
      mainOutlines.forEach(mainOutline => {
        elementsInfo += `卷：${mainOutline.title}\n`
        if (mainOutline.content) elementsInfo += `卷描述：${mainOutline.content}\n`
        
        // 添加该卷下的章节信息
        const chaptersInThisAct = chapterOutlines.filter(chapter => chapter.parentId === mainOutline.id)
        chaptersInThisAct.forEach(chapter => {
          elementsInfo += `  章节：${chapter.title}\n`
          if (chapter.content) elementsInfo += `  章节内容：${chapter.content}\n`
        })
        elementsInfo += '\n'
      })
      
      // 如果有未归属于任何卷的章节，单独列出
      const unassignedChapters = chapterOutlines.filter(chapter => !chapter.parentId || !mainOutlines.some(act => act.id === chapter.parentId))
      if (unassignedChapters.length > 0) {
        elementsInfo += '未归属于卷的章节：\n'
        unassignedChapters.forEach(chapter => {
          elementsInfo += `  章节：${chapter.title}\n`
          if (chapter.content) elementsInfo += `  章节内容：${chapter.content}\n`
        })
        elementsInfo += '\n'
      }
    }

    // 添加角色信息
    if (characters && characters.length > 0) {
      elementsInfo += '【已有角色信息】\n'
      characters.forEach((character: any) => {
        elementsInfo += `角色名称：${character.name}\n`
        if (character.description) elementsInfo += `角色描述：${character.description}\n`
        if (character.tags && character.tags.length > 0) elementsInfo += `标签：${character.tags.join('、')}\n`
        elementsInfo += '\n'
      })
    }

    // 添加地点信息
    if (locations && locations.length > 0) {
      elementsInfo += '【已有地点信息】\n'
      locations.forEach((location: any) => {
        elementsInfo += `地点名称：${location.name}\n`
        if (location.description) elementsInfo += `地点描述：${location.description}\n`
        if (location.tags && location.tags.length > 0) elementsInfo += `标签：${location.tags.join('、')}\n`
        elementsInfo += '\n'
      })
    }

    // 添加文化信息
    if (cultures && cultures.length > 0) {
      elementsInfo += '【已有文化信息】\n'
      cultures.forEach((culture: any) => {
        elementsInfo += `文化名称：${culture.name}\n`
        if (culture.description) elementsInfo += `文化描述：${culture.description}\n`
        if (culture.tags && culture.tags.length > 0) elementsInfo += `标签：${culture.tags.join('、')}\n`
        elementsInfo += '\n'
      })
    }

    // 添加科技信息
    if (technologies && technologies.length > 0) {
      elementsInfo += '【已有科技信息】\n'
      technologies.forEach((technology: any) => {
        elementsInfo += `科技名称：${technology.name}\n`
        if (technology.description) elementsInfo += `科技描述：${technology.description}\n`
        if (technology.tags && technology.tags.length > 0) elementsInfo += `标签：${technology.tags.join('、')}\n`
        elementsInfo += '\n'
      })
    }

    // 添加魔法信息
    if (magics && magics.length > 0) {
      elementsInfo += '【已有魔法信息】\n'
      magics.forEach((magic: any) => {
        elementsInfo += `魔法名称：${magic.name}\n`
        if (magic.description) elementsInfo += `魔法描述：${magic.description}\n`
        if (magic.tags && magic.tags.length > 0) elementsInfo += `标签：${magic.tags.join('、')}\n`
        elementsInfo += '\n'
      })
    }

    // 添加历史信息
    if (histories && histories.length > 0) {
      elementsInfo += '【已有历史信息】\n'
      histories.forEach((history: any) => {
        elementsInfo += `历史名称：${history.name}\n`
        if (history.description) elementsInfo += `历史描述：${history.description}\n`
        if (history.tags && history.tags.length > 0) elementsInfo += `标签：${history.tags.join('、')}\n`
        elementsInfo += '\n'
      })
    }

    return elementsInfo
  } catch (error) {
    console.error('获取已有元素信息失败:', error)
    return ''
  }
}

/**
 * 增强特定指导，添加引用已有元素的要求
 * @param type 生成类型
 * @param novelId 小说ID
 * @returns 增强后的特定指导
 */
export async function enhanceTypeSpecificGuidance(type: string, novelId: string): Promise<string> {
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
                '- 强化角色与世界观及其他角色的动态关系\n\n' +
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
                '- 强化历史背景与当前状态的联系，展现地点的演变过程\n\n' +
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
                '- 增加日常习俗、象征意义、文化冲突与融合等内容\n\n' +
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
                '- 增加发展时间线、伦理考量、原创性考量等内容\n\n' +
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
                '- 增加平衡性原则、施法代价、风险设定、世界观关联等内容\n\n' +
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
                '施法代价：\n' +
                '风险设定：\n' +
                '【法术示例】\n' +
                '基础法术：\n' +
                '高级法术：\n' +
                '【魔法物品】\n' +
                '代表性物品：\n' +
                '制作方法：\n' +
                '【世界观关联】\n' +
                '与科技的关系：\n' +
                '与文化的关联：\n' +
                '【细节补充】\n' +
                '---\n' +
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
                '施法代价：\n' +
                '风险设定：\n' +
                '【法术示例】\n' +
                '基础法术：\n' +
                '高级法术：\n' +
                '【魔法物品】\n' +
                '代表性物品：\n' +
                '制作方法：\n' +
                '【世界观关联】\n' +
                '与科技的关系：\n' +
                '与文化的关联：\n' +
                '【细节补充】\n' +
                '---\n' +
                '生成的魔法设定数量应根据用户的具体需求和上下文来确定，可以是一个或多个，每个设定项之间使用三个短横线"---"分隔'
      break
    case 'history':
      guidance = '\n【生成要求】\n' +
                '- 结合小说的世界观创建历史设定\n' +
                '- 描述重要事件、历史时期、政治变迁\n' +
                '- 包括战争冲突、文化交融、重要人物\n' +
                '- 考虑历史对现在的影响和遗留\n' +
                '- 体现历史的复杂性和深度\n' +
                '- 与现有情节和角色相关联\n' +
                '- 需详细描述各时期的特点和转变\n' +
                '- 强化事件间的因果关系\n' +
                '- 确保人物行为合理且符合时代背景\n' +
                '- 详细说明历史对当前世界状态和情节发展的具体影响\n\n' +
                '请按照以下结构生成历史设定：\n' +
                '【历史设定1：名称】\n' +
                '---\n' +
                '【基本信息】\n' +
                '【名称】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：古代、战争、王朝等\n' +
                '【描述】：\n' +
                '【时间线】\n' +
                '重要时期：\n' +
                '时间节点：\n' +
                '【重要事件】\n' +
                '重大事件：\n' +
                '影响：\n' +
                '【历史人物】\n' +
                '关键人物：\n' +
                '贡献：\n' +
                '【历史后果】\n' +
                '对后世的影响：\n' +
                '【细节补充】\n' +
                '---\n' +
                '【历史设定2：名称】\n' +
                '---\n' +
                '【基本信息】\n' +
                '【名称】：\n' +
                '【标签】：使用中文顿号"、"分隔，如：古代、战争、王朝等\n' +
                '【描述】：\n' +
                '【时间线】\n' +
                '重要时期：\n' +
                '时间节点：\n' +
                '【重要事件】\n' +
                '重大事件：\n' +
                '影响：\n' +
                '【历史人物】\n' +
                '关键人物：\n' +
                '贡献：\n' +
                '【历史后果】\n' +
                '对后世的影响：\n' +
                '【细节补充】\n' +
                '---\n' +
                '生成的历史设定数量应根据用户的具体需求和上下文来确定，可以是一个或多个，每个设定项之间使用三个短横线"---"分隔'
      break
    case 'content':
      guidance = '\n【创作要求】\n' +
                '- 紧密结合已有情节和人物设定\n' +
                '- 保持叙事风格和语调一致\n' +
                '- 注重情节推进和情感渲染\n' +
                '- 保持与前文的一致性和连贯性\n' +
                '- 避免重复已有内容，推进故事发展\n\n' +
                '【质量标准】\n' +
                '- 语言生动，描写细腻\n' +
                '- 逻辑严密，结构完整\n' +
                '- 人物形象鲜明，对话自然\n' +
                '- 段落安排合理，节奏控制得当\n\n' +
                '【创新要求】\n' +
                '- 避免陈词滥调和套路化表达\n' +
                '- 增加独特的创意元素\n' +
                '- 保持读者的阅读兴趣\n\n' +
                '【结构要求】\n' +
                '- 使用清晰的段落划分\n' +
                '- 保持适当的章节长度（建议300-800字）\n' +
                '- 合理安排对话与叙述的比例\n\n' +
                '【内容深度】\n' +
                '- 深化人物性格展现，推动角色成长弧线\n' +
                '- 增加戏剧冲突和悬念，提升故事张力\n' +
                '- 注重细节描写和情感渲染，增强读者代入感\n' +
                '- 确保情节发展符合逻辑，避免突兀转折\n\n' +
                '【风格保持】\n' +
                '- 维持原有文风和语调\n' +
                '- 保留核心情节和人物特征\n' +
                '- 确保创作内容自然流畅\n\n' +
                '【输出格式】\n' +
                '- 使用纯文本格式，无需特殊标记\n' +
                '- 不要包含任何解释性文字\n' +
                '- 直接输出创作内容'
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

  // 获取已有元素信息并添加到指导中
  const existingElementsInfo = await getExistingElementsInfo(novelId)
  if (existingElementsInfo) {
    guidance += '\n\n【重要提醒】\n' +
                '请在生成内容时参考以下已有的元素信息，确保新生成的内容与已有元素保持一致性和关联性：\n' +
                existingElementsInfo
  }

  return guidance
}
