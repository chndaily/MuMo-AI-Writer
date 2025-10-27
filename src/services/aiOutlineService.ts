// AI大纲生成服务
import { aiService, AIGenerationMode } from '@/services/aiService';
import { OUTLINE_GENERATION_PROMPT } from '@/constants/aiPrompts';

/**
 * AI大纲生成服务
 * 负责生成符合规范的小说大纲
 */
export class AIOutlineService {
  /**
   * 生成小说大纲
   * @param novelInfo 小说信息
   * @param requirements 用户需求
   * @returns 生成的大纲内容
   */
  async generateOutline(novelInfo: {
    title: string;
    genre: string;
    theme: string;
    background: string;
  }, requirements: string): Promise<string> {
    // 构建提示词上下文
    const context = `
小说标题：${novelInfo.title}
小说类型：${novelInfo.genre}
主题思想：${novelInfo.theme}
背景设定：${novelInfo.background}
用户需求：${requirements}
`;

    try {
      // 调用AI服务生成大纲
      const response = await aiService.generateContent({
        mode: AIGenerationMode.PLOT,
        content: context,
        context: OUTLINE_GENERATION_PROMPT,
        temperature: 0.7,
        maxLength: 3000
      });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'AI生成失败');
      }
    } catch (error) {
      console.error('AI大纲生成失败:', error);
      throw new Error(`大纲生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 优化现有大纲
   * @param existingOutline 现有大纲
   * @param optimizationRequirements 优化需求
   * @returns 优化后的大纲
   */
  async optimizeOutline(existingOutline: string, optimizationRequirements: string): Promise<string> {
    // 构建提示词上下文
    const context = `
现有大纲：
${existingOutline}

优化需求：
${optimizationRequirements}
`;

    try {
      // 调用AI服务优化大纲
      const response = await aiService.generateContent({
        mode: AIGenerationMode.PLOT,
        content: context,
        context: OUTLINE_GENERATION_PROMPT,
        temperature: 0.7,
        maxLength: 3000
      });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'AI优化失败');
      }
    } catch (error) {
      console.error('AI大纲优化失败:', error);
      throw new Error(`大纲优化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// 创建AI大纲生成服务实例
export const aiOutlineService = new AIOutlineService();