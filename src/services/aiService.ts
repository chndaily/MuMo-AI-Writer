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
      await this.simulateAIGeneration(params)
      
      const response = await this.client.post('/generate', params)
      return response.data
    } catch (error) {
      console.error('AI生成失败:', error)
      return {
        success: false,
        error: 'AI服务暂时不可用，请稍后重试',
      }
    }
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
    const delay = Math.random() * 2000 + 1000 // 1-3秒随机延迟
    await new Promise(resolve => setTimeout(resolve, delay))
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