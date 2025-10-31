// AI大纲生成服务
import { aiService, AIGenerationMode } from '@/services/aiService';
import { OUTLINE_GENERATION_PROMPT } from '@/constants/aiPrompts';
import { isLargeOutline } from '@/utils/largeOutlineHandler';
import { isSuperLargeOutline } from '@/utils/superLargeOutlineHandler';

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
      // 根据内容长度决定是否使用长大纲模式
      const estimatedLength = (novelInfo.background?.length || 0) + (requirements?.length || 0);
      const isLarge = isLargeOutline(estimatedLength / 100); // 粗略估计大纲项数量
      
      // 检查是否为超长大纲
      const isSuperLarge = isSuperLargeOutline(estimatedLength);
      
      // 调用AI服务生成大纲，增加maxLength以支持更长的内容生成
      const response = await aiService.generateContent({
        mode: AIGenerationMode.PLOT,
        content: context,
        context: OUTLINE_GENERATION_PROMPT,
        temperature: 0.7,
        maxLength: isSuperLarge ? 512000 : isLarge ? 256000 : 128000  // 对于超长大纲、长大纲和普通大纲，使用不同的长度限制
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
    // 判断是否为长大纲
    const isLarge = isLargeOutline(existingOutline.split('\n').length);
    // 判断是否为超长大纲
    const isSuperLarge = isSuperLargeOutline(existingOutline.length);
    
    // 构建提示词上下文
    const context = `
现有大纲：
${existingOutline}

优化需求：
${optimizationRequirements}

注意事项：
1. 请保持大纲结构清晰，使用标准的Markdown格式
2. ${isSuperLarge ? '这是一个超长大纲（超过30000字），请重点关注结构优化、层级管理和关键内容提炼' : isLarge ? '这是一个较长的大纲，请重点关注结构优化和关键内容提炼' : '请确保内容完整性和逻辑性'}
3. 不要添加与优化需求无关的内容
`;

    // 对于超长大纲，调整优化策略
    const maxLength = isSuperLarge ? 512000 : isLarge ? 256000 : 128000;

    try {
      // 调用AI服务优化大纲，根据大纲长度调整maxLength
      const response = await aiService.generateContent({
        mode: AIGenerationMode.PLOT,
        content: context,
        context: OUTLINE_GENERATION_PROMPT,
        temperature: 0.7,
        maxLength: maxLength  // 使用计算好的maxLength
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
  
  /**
   * 生成大纲摘要
   * @param fullOutline 完整大纲
   * @returns 大纲摘要
   */
  async generateOutlineSummary(fullOutline: string): Promise<string> {
    // 检查是否为超长大纲
    const isSuperLarge = isSuperLargeOutline(fullOutline.length);
    
    // 对于超长大纲，增加更多内容用于摘要生成
    const contentForSummary = isSuperLarge ? 
      fullOutline.substring(0, 15000) + (fullOutline.length > 15000 ? '...' : '') :
      fullOutline.substring(0, 5000) + (fullOutline.length > 5000 ? '...' : '');
    
    const summaryPrompt = `
请为以下大纲生成一个摘要，包含主要的卷和章节结构：

大纲内容：
${contentForSummary}

请按照以下格式输出：
【大纲摘要】
1. 主要卷结构：
   - 第一卷：[卷名] - [简要描述]
   - 第二卷：[卷名] - [简要描述]
   ...
2. 关键章节：
   - [章节名] - [简要描述]
   ...
3. 核心主题：[主要主题]
`;

    try {
      const response = await aiService.generateContent({
        mode: AIGenerationMode.PLOT,
        content: summaryPrompt,
        temperature: 0.5,
        maxLength: isSuperLarge ? 8000 : 3000  // 对于超长大纲，增加摘要长度
      });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || '摘要生成失败');
      }
    } catch (error) {
      console.error('大纲摘要生成失败:', error);
      throw new Error(`大纲摘要生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// 创建AI大纲生成服务实例
export const aiOutlineService = new AIOutlineService();