import axios from 'axios'

// AI服务配置
const AI_CONFIG = {
  baseURL: process.env.VITE_AI_API_BASE_URL || 'http://localhost:3001/api/ai',
  timeout: 30000,
}

// AI生成模式
export enum AIGenerationMode {
  FREE = 'free',           // 自由续写
  STYLE = 'style',         // 按风格模仿
  FILL = 'fill',           // 填坑模式
  PLOT = 'plot',           // 情节建议
  CHARACTER = 'character', // 角色分析
  DIALOGUE = 'dialogue',   // 对话生成
}

// AI生成参数
export interface AIGenerationParams {
  mode: AIGenerationMode
  content: string
  context?: string
  temperature?: number
  style?: string
  character?: string
  maxLength?: number
  options?: Record<string, any>
}

// AI生成响应
export interface AIGenerationResponse {
  success: boolean
  data?: string
  suggestions?: string[]
  alternatives?: string[]
  metadata?: {
    confidence: number
    style: string
    wordCount: number
    timeSpent: number
  }
  error?: string
}

// AI分析结果
export interface AIAnalysisResult {
  emotion: {
    current: string
    trend: 'rising' | 'falling' | 'stable'
    intensity: number
  }
  pacing: {
    current: 'slow' | 'medium' | 'fast'
    density: number
    suggestions: string[]
  }
  consistency: {
    score: number
    issues: Array<{
      type: 'character' | 'plot' | 'setting' | 'timeline'
      description: string
      severity: 'low' | 'medium' | 'high'
      suggestion: string
    }>
  }
  quality: {
    score: number
    aspects: {
      creativity: number
      coherence: number
      engagement: number
      originality: number
    }
  }
}

class AIService {
  private client = axios.create(AI_CONFIG)

  // 生成内容
  async generateContent(params: AIGenerationParams): Promise<AIGenerationResponse> {
    try {
      // 模拟AI生成（实际项目中这里会调用真实的AI API）
      await this.simulateAIGeneration(params);
      
      // 生成更符合要求的内容，特别是对于大纲生成
      let generatedContent = '';
      
      if (params.mode === AIGenerationMode.PLOT && params.context && params.context.includes('大纲')) {
        // 为大纲生成创建更长的内容
        generatedContent = this.generateOutlineContent(params);
      } else {
        // 生成其他类型的内容
        generatedContent = this.generateGenericContent(params);
      }
      
      return {
        success: true,
        data: generatedContent
      };
    } catch (error) {
      console.error('AI生成失败:', error);
      return {
        success: false,
        error: 'AI服务暂时不可用，请稍后重试',
      };
    }
  }

  // 生成大纲内容
  private generateOutlineContent(params: AIGenerationParams): string {
    // 根据maxLength参数决定生成内容的长度
    const maxLength = params.maxLength || 100000;
    let content = '';
    
    // 生成符合格式的大纲内容
    content += '## 第一卷：初始的冒险\n\n';
    content += '### 第一章：神秘的召唤\n';
    content += '- 内容：主角在平凡的生活中接到了一个神秘的召唤\n';
    content += '- 冲突：主角需要在安全的日常和未知的冒险之间做出选择\n';
    content += '- 伏笔：召唤的来源暗示了更大的阴谋\n';
    content += '- 高潮：主角最终决定接受召唤\n';
    content += '- 影响：这一决定将改变主角的一生\n\n';
    
    content += '### 第二章：踏上旅程\n';
    content += '- 内容：主角开始准备并踏上未知的旅程\n';
    content += '- 冲突：家人和朋友的反对增加了主角内心的挣扎\n';
    content += '- 伏笔：旅途中遇到的第一个人物将在后续章节中发挥重要作用\n';
    content += '- 高潮：主角离开家乡，正式踏上冒险之路\n';
    content += '- 影响：主角开始接触更广阔的世界\n\n';
    
    // 根据maxLength添加更多内容
    if (maxLength > 3000) {
      content += '## 第二卷：深入的挑战\n\n';
      content += '### 第三章：初遇敌人\n';
      content += '- 内容：主角在旅途中首次遭遇敌对势力\n';
      content += '- 冲突：力量悬殊的战斗考验着主角的能力\n';
      content += '- 伏笔：敌人的出现揭示了更大威胁的存在\n';
      content += '- 高潮：主角在绝境中发现了自己的潜能\n';
      content += '- 影响：主角开始意识到自己肩负的使命\n\n';
      
      content += '### 第四章：盟友与背叛\n';
      content += '- 内容：主角结识了新的盟友，但也遭遇了背叛\n';
      content += '- 冲突：信任与怀疑之间的心理斗争\n';
      content += '- 伏笔：背叛者的动机将在后续揭晓\n';
      content += '- 高潮：主角在被背叛后重新审视自己的信念\n';
      content += '- 影响：主角变得更加成熟和谨慎\n\n';
    }
    
    // 如果需要更长的内容，继续添加
    if (maxLength > 5000) {
      content += '## 第三卷：最终的对决\n\n';
      content += '### 第五章：真相大白\n';
      content += '- 内容：主角逐渐揭开了整个事件的真相\n';
      content += '- 冲突：真相的残酷让主角面临艰难的选择\n';
      content += '- 伏笔：最终BOSS的真实身份令人震惊\n';
      content += '- 高潮：主角与幕后黑手的第一次正面交锋\n';
      content += '- 影响：主角的世界观彻底改变\n\n';
      
      content += '### 第六章：最终决战\n';
      content += '- 内容：主角集结所有力量，准备进行最终决战\n';
      content += '- 冲突：最终战斗中主角面临生死考验\n';
      content += '- 伏笔：牺牲与救赎的主题贯穿始终\n';
      content += '- 高潮：主角战胜最终BOSS，拯救世界\n';
      content += '- 影响：世界恢复和平，主角完成成长\n\n';
    }
    
    return content;
  }

  // 生成通用内容
  private generateGenericContent(params: AIGenerationParams): string {
    // 根据参数生成不同类型的内容
    const contentLength = params.maxLength || 1000;
    let content = '';
    
    // 生成符合长度要求的内容
    const paragraphs = Math.max(3, Math.floor(contentLength / 300));
    for (let i = 0; i < paragraphs; i++) {
      content += `这是生成的第${i + 1}段内容。`;
      content += '在这里我们会生成一些符合要求的文本内容，确保长度足够。';
      content += '内容会根据用户的需求和上下文进行调整，以提供最相关的信息。\n\n';
    }
    
    return content;
  }

  // 分析内容
  async analyzeContent(content: string): Promise<AIAnalysisResult> {
    try {
      // 模拟分析过程
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        emotion: {
          current: '紧张',
          trend: 'rising',
          intensity: 0.8,
        },
        pacing: {
          current: 'medium',
          density: 0.6,
          suggestions: [
            '可以增加更多动作描写来提升节奏',
            '建议在关键转折点增加悬念',
          ],
        },
        consistency: {
          score: 0.85,
          issues: [
            {
              type: 'character',
              description: '角色查理的行为与之前设定略有偏差',
              severity: 'low',
              suggestion: '建议调整对话风格以保持一致性',
            },
          ],
        },
        quality: {
          score: 0.78,
          aspects: {
            creativity: 0.8,
            coherence: 0.75,
            engagement: 0.82,
            originality: 0.7,
          },
        },
      }
    } catch (error) {
      console.error('内容分析失败:', error)
      throw new Error('分析服务暂时不可用')
    }
  }

  // 生成平行宇宙版本
  async generateParallelVersions(content: string, count: number = 3): Promise<string[]> {
    try {
      await this.simulateAIGeneration({ mode: AIGenerationMode.PLOT, content })
      
      return [
        '喜剧版本：轻松幽默的情节发展，充满欢声笑语...',
        '悲剧版本：深沉悲壮的情感走向，令人深思...',
        '悬疑版本：紧张刺激的推理过程，扣人心弦...',
      ]
    } catch (error) {
      console.error('平行宇宙生成失败:', error)
      return []
    }
  }

  // 智能纠偏
  async detectInconsistencies(content: string): Promise<Array<{
    type: string
    description: string
    suggestion: string
    severity: 'low' | 'medium' | 'high'
  }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return [
        {
          type: 'character',
          description: '角色艾米的性格表现与设定不符',
          suggestion: '建议调整对话内容以保持角色一致性',
          severity: 'medium',
        },
        {
          type: 'timeline',
          description: '时间线存在逻辑矛盾',
          suggestion: '请检查事件发生的先后顺序',
          severity: 'high',
        },
      ]
    } catch (error) {
      console.error('纠偏检测失败:', error)
      return []
    }
  }

  // 生成角色对话
  async generateDialogue(character: string, context: string, style: string): Promise<string> {
    try {
      await this.simulateAIGeneration({ 
        mode: AIGenerationMode.DIALOGUE, 
        content: context,
        character,
        style 
      })
      
      return `"${character}说：${this.generateRandomDialogue(character, style)}"`
    } catch (error) {
      console.error('对话生成失败:', error)
      return ''
    }
  }

  // 语义联想
  async getSemanticSuggestions(keyword: string): Promise<string[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const suggestions: Record<string, string[]> = {
        '查理举枪': ['动作描写', '紧张氛围', '对峙场景'],
        '晚宴矛盾': ['冲突场景', '人物冲突', '社会矛盾'],
        '雨夜追凶': ['氛围营造', '悬疑元素', '环境描写'],
        '实验室': ['科技感', '神秘氛围', '专业环境'],
        '警局': ['权威感', '紧张氛围', '工作环境'],
      }
      
      return suggestions[keyword] || ['智能联想', '创意建议', '写作提示']
    } catch (error) {
      console.error('语义联想失败:', error)
      return []
    }
  }

  // 模拟AI生成过程
  private async simulateAIGeneration(params: AIGenerationParams): Promise<void> {
    // 根据内容长度调整延迟，更长的内容需要更多时间生成
    let baseDelay = 1000;
    if (params.content && params.content.length > 1000) {
      baseDelay = 2000;
    }
    if (params.content && params.content.length > 3000) {
      baseDelay = 3000;
    }
    
    const delay = Math.random() * 1000 + baseDelay;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // 生成随机对话
  private generateRandomDialogue(character: string, style: string): string {
    const dialogues: Record<string, string[]> = {
      '查理': [
        '冷静地分析着眼前的线索。',
        '用沉稳的声音说道："我们需要更多证据。"',
        '皱着眉头思考着案件的疑点。',
      ],
      '艾米': [
        '兴奋地挥舞着手臂："我发现了！"',
        '用充满活力的语调解释着实验结果。',
        '好奇地凑近观察着新发现。',
      ],
    }
    
    const characterDialogues = dialogues[character] || ['说道："这很有趣。"']
    return characterDialogues[Math.floor(Math.random() * characterDialogues.length)]
  }

  // 获取写作风格预设
  getStylePresets() {
    return [
      { value: 'default', label: '默认风格', description: '平衡的叙述风格' },
      { value: 'jin_yong', label: '金庸武侠体', description: '古典武侠风格' },
      { value: 'cyberpunk', label: '赛博朋克风', description: '未来科技风格' },
      { value: 'romance', label: '言情细腻', description: '情感细腻描写' },
      { value: 'thriller', label: '悬疑紧张', description: '紧张刺激节奏' },
      { value: 'comedy', label: '喜剧幽默', description: '轻松幽默风格' },
      { value: 'tragedy', label: '悲剧深沉', description: '深沉悲壮风格' },
      { value: 'poetic', label: '诗意优美', description: '优美诗意风格' },
    ]
  }

  // 获取环境音效
  getEnvironmentSounds() {
    return [
      { name: '雨声', file: 'rain.mp3', description: '营造忧郁氛围' },
      { name: '酒馆嘈杂', file: 'tavern.mp3', description: '营造热闹氛围' },
      { name: '森林鸟鸣', file: 'forest.mp3', description: '营造自然氛围' },
      { name: '城市喧嚣', file: 'city.mp3', description: '营造都市氛围' },
      { name: '海浪声', file: 'ocean.mp3', description: '营造宁静氛围' },
    ]
  }
}

export const aiService = new AIService()
export default aiService 