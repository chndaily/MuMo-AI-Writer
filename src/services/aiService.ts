import axios from 'axios'
import { isSuperLargeOutline } from '@/utils/superLargeOutlineHandler';

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
    const maxLength = params.maxLength || 128000;
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
    
    // 根据maxLength添加更多内容，但对于长大纲生成，我们需要更智能的处理
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
    
    // 如果需要更长的内容，继续添加，但要注意结构清晰
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
    
    // 对于超长大纲生成，添加结构化提示
    if (maxLength > 10000) {
      content += '## 注意事项\n\n';
      content += '对于包含大量卷和章节的复杂故事结构，请注意：\n';
      content += '1. 保持每卷有明确的主题和目标\n';
      content += '2. 确保章节间逻辑关系清晰\n';
      content += '3. 合理安排关键转折点\n';
      content += '4. 控制每个章节的内容复杂度\n';
      content += '5. 保持角色发展的一致性\n\n';
    }
    
    // 对于超长大纲（18000字以上），添加特殊处理提示
    if (maxLength > 18000) {
      content += '## 超长大纲处理建议\n\n';
      content += '对于超过18000字的超长大纲，请注意以下要点：\n';
      content += '1. 采用分卷分章节的层级结构管理\n';
      content += '2. 每卷控制在5-8个章节以内\n';
      content += '3. 使用摘要方式管理各章节内容\n';
      content += '4. 保持核心主线清晰，支线适度展开\n';
      content += '5. 定期回顾和调整大纲结构\n\n';
    }
    
    return content;
  }

  // 生成通用内容
  private generateGenericContent(params: AIGenerationParams): string {
    // 根据参数生成不同类型的内容
    const contentLength = params.maxLength || 128000;
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
    // 模拟内容分析（实际项目中这里会调用真实的AI分析API）
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 返回模拟的分析结果
    return {
      emotion: {
        current: 'neutral',
        trend: 'stable',
        intensity: 0.5
      },
      pacing: {
        current: 'medium',
        density: 0.7,
        suggestions: ['可以适当增加情节起伏', '注意段落间的过渡']
      },
      consistency: {
        score: 85,
        issues: [
          {
            type: 'character',
            description: '角色行为在某些场景中略显不一致',
            severity: 'medium',
            suggestion: '建议回顾角色设定，确保行为符合角色性格'
          }
        ]
      },
      quality: {
        score: 88,
        aspects: {
          creativity: 90,
          coherence: 85,
          engagement: 87,
          originality: 82
        }
      }
    };
  }

  // 模拟AI生成过程
  private async simulateAIGeneration(params: AIGenerationParams): Promise<void> {
    // 模拟AI生成的延迟，根据内容长度调整延迟时间
    const baseDelay = 1000; // 基础延迟1秒
    const lengthFactor = Math.min(params.maxLength || 1000, 10000) / 1000; // 长度因子
    const totalDelay = baseDelay * lengthFactor;
    
    return new Promise(resolve => setTimeout(resolve, totalDelay));
  }
}

// 创建AI服务实例
export const aiService = new AIService();
export default aiService 