/**
 * 可视化服务
 * 提供关系可视化相关的数据处理和图表生成功能
 */

export interface CharacterRelation {
  source: string; // 角色ID
  target: string; // 角色ID
  type: 'family' | 'friend' | 'enemy' | 'colleague' | 'unknown'; // 关系类型
  strength: number; // 关系强度 1-10
  description: string; // 关系描述
}

export interface LocationRelation {
  source: string; // 地点ID
  target: string; // 地点ID
  distance: number; // 距离
  connectionType: 'road' | 'sea' | 'air' | 'unknown'; // 连接类型
}

export interface PlotThread {
  id: string;
  title: string;
  chapters: string[]; // 关联章节ID列表
  characters: string[]; // 涉及角色ID列表
  status: 'active' | 'resolved' | 'pending';
}

class VisualizationService {
  /**
   * 分析角色关系数据
   * @param characters 角色数据
   * @returns 角色关系数组
   */
  analyzeCharacterRelations(characters: any[]): CharacterRelation[] {
    const relations: CharacterRelation[] = [];
    
    // 如果角色数量少于2，无法形成关系
    if (characters.length < 2) {
      return relations;
    }
    
    // 为每对角色分析关系
    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        const sourceChar = characters[i];
        const targetChar = characters[j];
        
        // 智能分析角色关系
        const relation = this.analyzeCharacterRelation(sourceChar, targetChar);
        relations.push(relation);
      }
    }
    
    return relations;
  }
  
  /**
   * 智能分析两个角色之间的关系
   */
  private analyzeCharacterRelation(char1: any, char2: any): CharacterRelation {
    // 初始化关系属性
    let type: CharacterRelation['type'] = 'unknown';
    let strength = 5; // 默认中等强度
    let description = '';
    
    // 基于角色类型确定关系类型
    const roles = [char1.role, char2.role];
    if (roles.includes('protagonist') && roles.includes('antagonist')) {
      type = 'enemy';
      strength = 8;
      description = `${char1.name}和${char2.name}是宿敌关系`;
    } else if (roles.includes('protagonist') && roles.includes('loveInterest')) {
      type = 'friend';
      strength = 9;
      description = `${char1.name}和${char2.name}是恋人关系`;
    } else if (roles.includes('family')) {
      type = 'family';
      strength = 8;
      description = `${char1.name}和${char2.name}是亲属关系`;
    } else if (roles.includes('protagonist') && roles.includes('mentor')) {
      type = 'friend';
      strength = 7;
      description = `${char1.name}是${char2.name}的导师`;
    } else if (roles.includes('protagonist') && roles.includes('rival')) {
      type = 'enemy';
      strength = 7;
      description = `${char1.name}和${char2.name}是竞争对手`;
    }
    
    // 基于角色描述分析关系
    if (char1.description && char2.description) {
      // 检查描述中是否包含对方名字
      if (char1.description.includes(char2.name) || char2.description.includes(char1.name)) {
        if (type === 'unknown') {
          type = 'friend';
          strength = 6;
        }
        if (!description) {
          description = `${char1.name}和${char2.name}在描述中相互提及`;
        }
      }
      
      // 检查描述中的关键词
      const char1Desc = char1.description.toLowerCase();
      const char2Desc = char2.description.toLowerCase();
      
      // 检查敌对关系关键词
      const enemyKeywords = ['敌人', '仇人', '敌对', '仇恨', '对抗', '冲突'];
      if (enemyKeywords.some(keyword => char1Desc.includes(keyword) || char2Desc.includes(keyword))) {
        type = 'enemy';
        strength = Math.max(strength, 7);
        if (!description) {
          description = `${char1.name}和${char2.name}存在敌对关系`;
        }
      }
      
      // 检查友好关系关键词
      const friendKeywords = ['朋友', '伙伴', '同伴', '合作', '友谊', '信任', '帮助'];
      if (friendKeywords.some(keyword => char1Desc.includes(keyword) || char2Desc.includes(keyword))) {
        if (type !== 'enemy') {
          type = 'friend';
          strength = Math.max(strength, 6);
          if (!description) {
            description = `${char1.name}和${char2.name}是朋友关系`;
          }
        }
      }
      
      // 检查家庭关系关键词
      const familyKeywords = ['家人', '父亲', '母亲', '兄弟', '姐妹', '父子', '母子', '亲戚'];
      if (familyKeywords.some(keyword => char1Desc.includes(keyword) || char2Desc.includes(keyword))) {
        type = 'family';
        strength = Math.max(strength, 8);
        if (!description) {
          description = `${char1.name}和${char2.name}有家庭关系`;
        }
      }
    }
    
    // 基于人际关系字段分析
    if (char1.relationships && char2.relationships) {
      const rel1 = char1.relationships.toLowerCase();
      const rel2 = char2.relationships.toLowerCase();
      
      if (rel1.includes('敌') || rel2.includes('敌')) {
        type = 'enemy';
        strength = Math.max(strength, 7);
        if (!description) {
          description = `${char1.name}和${char2.name}在人际关系中被描述为敌对`;
        }
      }
      
      if (rel1.includes('友') || rel2.includes('友')) {
        if (type !== 'enemy') {
          type = 'friend';
          strength = Math.max(strength, 6);
          if (!description) {
            description = `${char1.name}和${char2.name}在人际关系中被描述为朋友`;
          }
        }
      }
    }
    
    // 如果仍然没有描述，生成默认描述
    if (!description) {
      const descriptions = [
        `${char1.name}和${char2.name}有复杂的关系`,
        `${char1.name}与${char2.name}相互关联`,
        `${char1.name}和${char2.name}在故事中有所交集`
      ];
      description = descriptions[Math.floor(Math.random() * descriptions.length)];
    }
    
    return {
      source: char1.id,
      target: char2.id,
      type,
      strength,
      description
    };
  }
  
  /**
   * 确定角色关系类型
   */
  private determineRelationType(char1: any, char2: any): CharacterRelation['type'] {
    // 简单的示例逻辑，实际应该基于角色描述分析
    const roles = [char1.role, char2.role];
    
    if (roles.includes('protagonist') && roles.includes('antagonist')) {
      return 'enemy';
    } else if (roles.includes('protagonist') && roles.includes('loveInterest')) {
      return 'friend';
    } else if (roles.includes('family')) {
      return 'family';
    } else {
      const types: CharacterRelation['type'][] = ['friend', 'colleague', 'unknown'];
      return types[Math.floor(Math.random() * types.length)];
    }
  }
  
  /**
   * 生成关系描述
   */
  private generateRelationDescription(char1: any, char2: any): string {
    const descriptions = [
      `${char1.name}和${char2.name}是朋友关系`,
      `${char1.name}与${char2.name}有工作上的联系`,
      `${char1.name}认识${char2.name}已有多年`,
      `${char1.name}和${char2.name}在某个事件中相遇`,
      `${char1.name}对${char2.name}有特殊的情感`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }
  
  /**
   * 分析地点关系数据
   * @param locations 地点数据
   * @returns 地点关系数组
   */
  analyzeLocationRelations(locations: any[]): LocationRelation[] {
    const relations: LocationRelation[] = [];
    
    // 如果地点数量少于2，无法形成关系
    if (locations.length < 2) {
      return relations;
    }
    
    // 为每对地点分析关系
    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        const sourceLoc = locations[i];
        const targetLoc = locations[j];
        
        // 智能分析地点关系
        const relation = this.analyzeLocationRelation(sourceLoc, targetLoc);
        relations.push(relation);
      }
    }
    
    return relations;
  }
  
  /**
   * 智能分析两个地点之间的关系
   */
  private analyzeLocationRelation(loc1: any, loc2: any): LocationRelation {
    // 初始化关系属性
    let distance = 500; // 默认中等距离
    let connectionType: LocationRelation['connectionType'] = 'unknown';
    
    // 基于地理位置信息分析
    if (loc1.geography && loc2.geography) {
      const geo1 = loc1.geography.toLowerCase();
      const geo2 = loc2.geography.toLowerCase();
      
      // 检查相邻关系
      const adjacentKeywords = ['相邻', '接壤', '毗邻', '靠近', '附近'];
      if (adjacentKeywords.some(keyword => geo1.includes(keyword) || geo2.includes(keyword))) {
        distance = Math.floor(Math.random() * 200) + 50; // 50-250公里
        connectionType = 'road';
      }
      
      // 检查同城市关系
      if (geo1.includes('城市') && geo2.includes('城市')) {
        if (geo1 === geo2) {
          distance = Math.floor(Math.random() * 100) + 10; // 10-110公里
          connectionType = 'road';
        }
      }
    }
    
    // 基于描述信息分析
    if (loc1.description && loc2.description) {
      const desc1 = loc1.description.toLowerCase();
      const desc2 = loc2.description.toLowerCase();
      
      // 检查交通连接
      const transportKeywords = ['道路', '公路', '铁路', '航线', '航线', '港口'];
      if (transportKeywords.some(keyword => desc1.includes(keyword) || desc2.includes(keyword))) {
        connectionType = 'road'; // 默认为道路连接
        if (desc1.includes('海') || desc2.includes('海')) {
          connectionType = 'sea';
        } else if (desc1.includes('机场') || desc2.includes('机场')) {
          connectionType = 'air';
        }
      }
    }
    
    // 如果仍然没有确定连接类型，随机选择
    if (connectionType === 'unknown') {
      const types: LocationRelation['connectionType'][] = ['road', 'sea', 'air', 'unknown'];
      connectionType = types[Math.floor(Math.random() * types.length)];
    }
    
    // 根据连接类型调整距离
    switch (connectionType) {
      case 'road':
        distance = Math.floor(Math.random() * 500) + 50; // 50-550公里
        break;
      case 'sea':
        distance = Math.floor(Math.random() * 2000) + 500; // 500-2500公里
        break;
      case 'air':
        distance = Math.floor(Math.random() * 5000) + 1000; // 1000-6000公里
        break;
    }
    
    return {
      source: loc1.id,
      target: loc2.id,
      distance,
      connectionType
    };
  }
  
  /**
   * 确定地点连接类型
   */
  private determineConnectionType(loc1: any, loc2: any): LocationRelation['connectionType'] {
    // 简单的示例逻辑
    const types: LocationRelation['connectionType'][] = ['road', 'sea', 'air', 'unknown'];
    return types[Math.floor(Math.random() * types.length)];
  }
  
  /**
   * 生成情节线索
   * @param chapters 章节数据
   * @param characters 角色数据
   * @returns 情节线索数组
   */
  generatePlotThreads(chapters: any[], characters: any[]): PlotThread[] {
    const threads: PlotThread[] = [];
    
    // 生成示例情节线索
    const threadTitles = [
      '主角的成长之路',
      '复仇计划',
      '爱情线索',
      '权力争夺',
      '秘密揭露'
    ];
    
    for (let i = 0; i < Math.min(threadTitles.length, 3); i++) {
      // 随机选择关联章节和角色
      const selectedChapters = chapters
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1)
        .map(chapter => chapter.id);
        
      const selectedCharacters = characters
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 1)
        .map(char => char.id);
      
      threads.push({
        id: `thread_${i + 1}`,
        title: threadTitles[i],
        chapters: selectedChapters,
        characters: selectedCharacters,
        status: ['active', 'resolved', 'pending'][Math.floor(Math.random() * 3)] as any
      });
    }
    
    return threads;
  }
  
  /**
   * 生成力导向图数据格式
   * @param nodes 节点数据
   * @param links 连接数据
   * @returns 图表数据
   */
  generateForceGraphData(nodes: any[], links: any[]) {
    return {
      nodes: nodes.map((node, index) => ({
        id: node.id,
        name: node.name,
        type: node.type || 'unknown',
        group: node.group || 1,
        index: index,
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: 0,
        vy: 0
      })),
      links: links.map(link => ({
        source: link.source,
        target: link.target,
        value: link.strength || link.distance || 1,
        type: link.type || 'unknown'
      }))
    };
  }
  
  /**
   * 根据设定类型过滤节点
   * @param nodes 节点数据
   * @param settingType 设定类型
   * @returns 过滤后的节点数据
   */
  filterNodesBySettingType(nodes: any[], settingType: string) {
    if (settingType === 'all') {
      return nodes;
    }
    return nodes.filter(node => node.type === settingType);
  }

  /**
   * 分析世界设定关系数据
   * @param locations 地点数据
   * @param cultures 文化数据
   * @param technologies 科技数据
   * @param magics 魔法数据
   * @param histories 历史数据
   * @param settingType 设定类型
   * @returns 节点和连接数据
   */
  analyzeWorldSettingRelations(
    locations: any[], 
    cultures: any[], 
    technologies: any[], 
    magics: any[], 
    histories: any[],
    settingType: string = 'all'
  ) {
    console.log('分析世界设定关系数据:', {
      locations: locations.length,
      cultures: cultures.length,
      technologies: technologies.length,
      magics: magics.length,
      histories: histories.length,
      settingType
    });
    
    // 生成节点数据
    let allNodes: any[] = [
      ...locations.map((item, index) => ({
        id: `location_${item.id}`,
        name: item.name,
        type: 'location',
        group: 1,
        description: item.description,
        data: item // 保存原始数据用于关系分析
      })),
      ...cultures.map((item, index) => ({
        id: `culture_${item.id}`,
        name: item.name,
        type: 'culture',
        group: 2,
        description: item.description,
        data: item // 保存原始数据用于关系分析
      })),
      ...technologies.map((item, index) => ({
        id: `technology_${item.id}`,
        name: item.name,
        type: 'technology',
        group: 3,
        description: item.description,
        data: item // 保存原始数据用于关系分析
      })),
      ...magics.map((item, index) => ({
        id: `magic_${item.id}`,
        name: item.name,
        type: 'magic',
        group: 4,
        description: item.description,
        data: item // 保存原始数据用于关系分析
      })),
      ...histories.map((item, index) => ({
        id: `history_${item.id}`,
        name: item.name,
        type: 'history',
        group: 5,
        description: item.description,
        data: item // 保存原始数据用于关系分析
      }))
    ];

    console.log('生成的节点数据:', allNodes.length);
    
    // 根据类型过滤节点
    let filteredNodes = allNodes;
    if (settingType !== 'all') {
      filteredNodes = allNodes.filter(node => node.type === settingType);
      console.log(`过滤后的${settingType}节点数据:`, filteredNodes.length);
    }

    // 生成连接数据
    const links: any[] = [];
    
    // 如果是特定类型，添加该类型内部的关系
    if (settingType !== 'all' && filteredNodes.length > 1) {
      console.log(`分析${settingType}类型内部关系`);
      // 为同类型节点添加关系
      for (let i = 0; i < filteredNodes.length; i++) {
        for (let j = i + 1; j < filteredNodes.length; j++) {
          const sourceNode = filteredNodes[i];
          const targetNode = filteredNodes[j];
          
          // 智能分析同类型节点间的关系
          const relation = this.analyzeSameTypeWorldSettingRelation(sourceNode, targetNode);
          if (relation) {
            links.push(relation);
          }
        }
      }
    } else if (settingType === 'all' && allNodes.length > 1) {
      console.log('分析全部类型跨类型关系');
      // 如果是全部类型，添加跨类型的关系
      // 分析所有节点之间的跨类型关系
      for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          const sourceNode = allNodes[i];
          const targetNode = allNodes[j];
          
          // 智能分析跨类型节点间的关系
          const relation = this.analyzeCrossTypeWorldSettingRelation(sourceNode, targetNode);
          if (relation) {
            links.push(relation);
          }
        }
      }
    }

    console.log('生成的连接数据:', links.length);
    return { nodes: filteredNodes, links };
  }

  /**
   * 分析同类型世界设定节点间的关系
   */
  private analyzeSameTypeWorldSettingRelation(node1: any, node2: any): any | null {
    // 基于描述内容分析关系
    if (node1.description && node2.description) {
      const desc1 = node1.description.toLowerCase();
      const desc2 = node2.description.toLowerCase();
      
      // 检查是否有相互提及
      if (desc1.includes(node2.name.toLowerCase()) || desc2.includes(node1.name.toLowerCase())) {
        return {
          source: node1.id,
          target: node2.id,
          value: 8, // 较强的关系
          type: 'relation',
          description: `${node1.name}与${node2.name}在描述中相互提及`
        };
      }
      
      // 检查相似关键词
      const commonKeywords = ['发展', '历史', '传统', '影响', '关联'];
      const hasCommonKeywords = commonKeywords.some(keyword => 
        desc1.includes(keyword) && desc2.includes(keyword));
      
      if (hasCommonKeywords) {
        return {
          source: node1.id,
          target: node2.id,
          value: 6, // 中等关系
          type: 'relation',
          description: `${node1.name}与${node2.name}有共同特征`
        };
      }
    }
    
    // 基于原始数据的字段分析关系
    const data1 = node1.data;
    const data2 = node2.data;
    
    // 对于不同类型的设定，检查特定字段
    if (node1.type === 'location' && data1.geography && data2.geography) {
      if (data1.geography.includes(data2.name) || data2.geography.includes(data1.name)) {
        return {
          source: node1.id,
          target: node2.id,
          value: 7,
          type: 'relation',
          description: `${node1.name}与${node2.name}地理位置相关`
        };
      }
    }
    
    // 有一定概率创建关系（避免所有节点都无连接）
    if (Math.random() > 0.7) {
      return {
        source: node1.id,
        target: node2.id,
        value: Math.floor(Math.random() * 5) + 3, // 3-7的随机值
        type: 'relation',
        description: this.generateWorldSettingRelationDescription(node1, node2)
      };
    }
    
    return null; // 不创建关系
  }

  /**
   * 分析跨类型世界设定节点间的关系
   */
  private analyzeCrossTypeWorldSettingRelation(node1: any, node2: any): any | null {
    // 使用预定义的关系映射
    const relationMap: Record<string, Record<string, { strength: number; description: string }>> = {
      'location': {
        'culture': { strength: 8, description: '地理位置影响文化发展' },
        'technology': { strength: 7, description: '地点资源促进科技发展' },
        'magic': { strength: 6, description: '特定地点适合魔法修炼' },
        'history': { strength: 8, description: '地点见证历史事件' }
      },
      'culture': {
        'technology': { strength: 7, description: '文化推动技术革新' },
        'magic': { strength: 8, description: '文化孕育魔法体系' },
        'history': { strength: 9, description: '文化传承历史记忆' }
      },
      'technology': {
        'magic': { strength: 6, description: '科技与魔法相互借鉴' },
        'history': { strength: 7, description: '技术进步改变历史进程' }
      },
      'magic': {
        'history': { strength: 8, description: '魔法力量影响历史走向' }
      }
    };
    
    // 获取正向关系
    const directRelation = relationMap[node1.type]?.[node2.type];
    if (directRelation) {
      return {
        source: node1.id,
        target: node2.id,
        value: directRelation.strength,
        type: 'relation',
        description: directRelation.description
      };
    }
    
    // 获取反向关系
    const reverseRelation = relationMap[node2.type]?.[node1.type];
    if (reverseRelation) {
      return {
        source: node1.id,
        target: node2.id,
        value: reverseRelation.strength,
        type: 'relation',
        description: reverseRelation.description
      };
    }
    
    // 基于描述内容分析跨类型关系
    if (node1.description && node2.description) {
      const desc1 = node1.description.toLowerCase();
      const desc2 = node2.description.toLowerCase();
      
      // 检查是否有相互提及
      if (desc1.includes(node2.name.toLowerCase()) || desc2.includes(node1.name.toLowerCase())) {
        return {
          source: node1.id,
          target: node2.id,
          value: 7,
          type: 'relation',
          description: `${node1.name}与${node2.name}在描述中相互关联`
        };
      }
    }
    
    // 基于原始数据的字段分析关系
    const data1 = node1.data;
    const data2 = node2.data;
    
    // 检查特定字段的关联
    if (data1.worldRelation && data1.worldRelation.includes(node2.name)) {
      return {
        source: node1.id,
        target: node2.id,
        value: 8,
        type: 'relation',
        description: `${node1.name}与${node2.name}有明确的世界观关联`
      };
    }
    
    if (data2.worldRelation && data2.worldRelation.includes(node1.name)) {
      return {
        source: node1.id,
        target: node2.id,
        value: 8,
        type: 'relation',
        description: `${node2.name}与${node1.name}有明确的世界观关联`
      };
    }
    
    // 有一定概率创建弱关系（避免所有节点都无连接）
    if (Math.random() > 0.8) {
      return {
        source: node1.id,
        target: node2.id,
        value: Math.floor(Math.random() * 4) + 2, // 2-5的随机值
        type: 'relation',
        description: this.generateCrossTypeRelationDescription(node1, node2)
      };
    }
    
    return null; // 不创建关系
  }

  /**
   * 生成世界设定关系描述
   */
  private generateWorldSettingRelationDescription(node1: any, node2: any): string {
    const descriptions = [
      `${node1.name}与${node2.name}存在关联`,
      `${node1.name}影响了${node2.name}的发展`,
      `${node1.name}和${node2.name}有历史联系`,
      `${node1.name}与${node2.name}相互依存`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  /**
   * 生成跨类型关系描述
   */
  private generateCrossTypeRelationDescription(node1: any, node2: any): string {
    const relationMap: Record<string, Record<string, string>> = {
      'location': {
        'culture': '地理位置影响文化发展',
        'technology': '地点资源促进科技发展',
        'magic': '特定地点适合魔法修炼',
        'history': '地点见证历史事件'
      },
      'culture': {
        'technology': '文化推动技术革新',
        'magic': '文化孕育魔法体系',
        'history': '文化传承历史记忆'
      },
      'technology': {
        'magic': '科技与魔法相互借鉴',
        'history': '技术进步改变历史进程'
      },
      'magic': {
        'history': '魔法力量影响历史走向'
      }
    };
    
    // 获取正向关系描述
    const directRelation = relationMap[node1.type]?.[node2.type];
    if (directRelation) {
      return directRelation;
    }
    
    // 获取反向关系描述
    const reverseRelation = relationMap[node2.type]?.[node1.type];
    if (reverseRelation) {
      return reverseRelation;
    }
    
    // 默认关系描述
    return `${node1.name}与${node2.name}存在复杂关联`;
  }
}

export default new VisualizationService();