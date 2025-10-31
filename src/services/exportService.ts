import { Novel, NovelOutline, Character, Location } from '#/novel';
import { hybridStorageService } from '@/services/hybridStorageService';
import { isLargeOutline } from '@/utils/largeOutlineHandler';
import { isSuperLargeOutline } from '@/utils/superLargeOutlineHandler';

/**
 * 导出服务
 * 负责将小说数据导出为不同格式
 */
export class ExportService {
  /**
   * 导出小说为Markdown格式
   * @param novel 小说对象
   * @returns Markdown格式的字符串
   */
  async exportToMarkdown(novel: Novel): Promise<string> {
    let content = `# ${novel.title}\n\n`;
    content += `**类型**: ${novel.genre}\n\n`;
    content += `**描述**: ${novel.description || '暂无描述'}\n\n`;
    content += `**字数**: ${novel.wordCount?.toLocaleString() || 0}\n\n`;
    
    if (novel.content) {
      content += `## 正文

${novel.content}

`;
    }
    
    // 导出大纲
    try {
      const outlines = await hybridStorageService.getOutlines(novel.id);
      if (outlines && outlines.length > 0) {
        // 检查是否为长大纲或超长大纲
        const outlineWordCount = outlines.reduce((sum, outline) => sum + (outline.content?.length || 0), 0);
        const isLarge = isLargeOutline(outlines.length);
        const isSuperLarge = isSuperLargeOutline(outlineWordCount);
        
        if (isSuperLarge) {
          content += `## 大纲 (超长大纲模式)\n\n`;
          content += `> 注意：检测到大纲超长（${outlines.length}项，约${outlineWordCount.toLocaleString()}字），以下为大纲结构摘要\n\n`;
          
          // 按类型分组
          const mainOutlines = outlines.filter(o => o.type === 'main');
          const chapterOutlines = outlines.filter(o => o.type === 'chapter');
          
          content += `### 卷结构 (${mainOutlines.length}卷)\n\n`;
          mainOutlines.forEach((outline, index) => {
            content += `${index + 1}. ${outline.title}\n`;
            if (outline.content) {
              content += `   > ${outline.content.substring(0, 150)}${outline.content.length > 150 ? '...' : ''}\n`;
            }
          });
          
          content += `\n### 章节统计 (${chapterOutlines.length}章节)\n\n`;
          // 按父卷分组显示章节
          mainOutlines.forEach(main => {
            const chapters = chapterOutlines.filter(ch => ch.parentId === main.id);
            if (chapters.length > 0) {
              content += `**${main.title}** 下的章节:\n`;
              // 显示前10个章节
              const displayChapters = chapters.slice(0, 10);
              displayChapters.forEach((chapter, index) => {
                content += `- ${chapter.title}\n`;
              });
              if (chapters.length > 10) {
                content += `- ...还有${chapters.length - 10}个章节\n`;
              }
              content += '\n';
            }
          });
          
          // 未分配章节
          const unassignedChapters = chapterOutlines.filter(ch => !ch.parentId || !mainOutlines.some(main => main.id === ch.parentId));
          if (unassignedChapters.length > 0) {
            content += `### 未分配章节 (${unassignedChapters.length}章节)\n\n`;
            // 显示前10个未分配章节
            const displayUnassigned = unassignedChapters.slice(0, 10);
            displayUnassigned.forEach((chapter, index) => {
              content += `${index + 1}. ${chapter.title}\n`;
            });
            if (unassignedChapters.length > 10) {
              content += `${11}. ...还有${unassignedChapters.length - 10}个章节\n`;
            }
            content += '\n';
          }
        } else if (isLarge) {
          content += `## 大纲 (长大纲模式)\n\n`;
          content += `> 注意：检测到大纲较长（${outlines.length}项），以下为大纲结构摘要\n\n`;
          
          // 按类型分组
          const mainOutlines = outlines.filter(o => o.type === 'main');
          const chapterOutlines = outlines.filter(o => o.type === 'chapter');
          
          content += `### 卷结构 (${mainOutlines.length}卷)\n\n`;
          mainOutlines.forEach((outline, index) => {
            content += `${index + 1}. ${outline.title}\n`;
            if (outline.content) {
              content += `   > ${outline.content.substring(0, 100)}${outline.content.length > 100 ? '...' : ''}\n`;
            }
          });
          
          content += `\n### 章节统计 (${chapterOutlines.length}章节)\n\n`;
          // 按父卷分组显示章节
          mainOutlines.forEach(main => {
            const chapters = chapterOutlines.filter(ch => ch.parentId === main.id);
            if (chapters.length > 0) {
              content += `**${main.title}** 下的章节:\n`;
              chapters.forEach((chapter, index) => {
                content += `- ${chapter.title}\n`;
              });
              content += '\n';
            }
          });
          
          // 未分配章节
          const unassignedChapters = chapterOutlines.filter(ch => !ch.parentId || !mainOutlines.some(main => main.id === ch.parentId));
          if (unassignedChapters.length > 0) {
            content += `### 未分配章节 (${unassignedChapters.length}章节)\n\n`;
            unassignedChapters.forEach((chapter, index) => {
              content += `${index + 1}. ${chapter.title}\n`;
            });
            content += '\n';
          }
        } else {
          // 普通大纲导出
          content += `## 大纲\n\n`;
          
          // 按层级结构组织
          const mainOutlines = outlines.filter(o => o.type === 'main');
          const chapterOutlines = outlines.filter(o => o.type === 'chapter');
          
          mainOutlines.forEach(main => {
            content += `## ${main.title}\n\n`;
            if (main.content) {
              content += `${main.content}\n\n`;
            }
            
            const chapters = chapterOutlines.filter(ch => ch.parentId === main.id);
            chapters.forEach(chapter => {
              content += `### ${chapter.title}\n\n`;
              if (chapter.content) {
                content += `${chapter.content}\n\n`;
              }
              if (chapter.summary) {
                content += `**摘要**: ${chapter.summary}\n\n`;
              }
            });
          });
          
          // 未分配的章节
          const unassignedChapters = chapterOutlines.filter(ch => !ch.parentId || !mainOutlines.some(main => main.id === ch.parentId));
          if (unassignedChapters.length > 0) {
            content += `## 未分配章节\n\n`;
            unassignedChapters.forEach(chapter => {
              content += `### ${chapter.title}\n\n`;
              if (chapter.content) {
                content += `${chapter.content}\n\n`;
              }
              if (chapter.summary) {
                content += `**摘要**: ${chapter.summary}\n\n`;
              }
            });
          }
        }
      }
    } catch (error) {
      console.warn('导出大纲时出错:', error);
      content += `<!-- 大纲导出失败: ${error instanceof Error ? error.message : '未知错误'} -->\n\n`;
    }
    
    // 导出角色
    try {
      const characters = await hybridStorageService.getWorldElements('character', novel.id);
      if (characters && characters.length > 0) {
        content += `## 角色设定\n\n`;
        characters.forEach((character: any) => {
          content += `### ${character.name}\n\n`;
          if (character.role) content += `**角色类型**: ${character.role}\n\n`;
          if (character.description) content += `**描述**: ${character.description}\n\n`;
          if (character.appearance) content += `**外貌**: ${character.appearance}\n\n`;
          if (character.personality) content += `**性格**: ${character.personality}\n\n`;
          if (character.background) content += `**背景**: ${character.background}\n\n`;
          if (character.abilities) content += `**能力**: ${character.abilities}\n\n`;
          if (character.relationships) content += `**人际关系**: ${character.relationships}\n\n`;
          if (character.characterArc) content += `**角色弧光**: ${character.characterArc}\n\n`;
          content += '\n';
        });
      }
    } catch (error) {
      console.warn('导出角色时出错:', error);
      content += `<!-- 角色导出失败: ${error instanceof Error ? error.message : '未知错误'} -->\n\n`;
    }
    
    // 导出地点
    try {
      const locations = await hybridStorageService.getWorldElements('location', novel.id);
      if (locations && locations.length > 0) {
        content += `## 地点设定\n\n`;
        locations.forEach((location: any) => {
          content += `### ${location.name}\n\n`;
          if (location.description) content += `**描述**: ${location.description}\n\n`;
          if (location.locationType) content += `**类型**: ${location.locationType}\n\n`;
          if (location.geography) content += `**地理**: ${location.geography}\n\n`;
          if (location.culture) content += `**文化**: ${location.culture}\n\n`;
          if (location.politics) content += `**政治**: ${location.politics}\n\n`;
          if (location.economy) content += `**经济**: ${location.economy}\n\n`;
          content += '\n';
        });
      }
    } catch (error) {
      console.warn('导出地点时出错:', error);
      content += `<!-- 地点导出失败: ${error instanceof Error ? error.message : '未知错误'} -->\n\n`;
    }
    
    return content;
  }
  
  /**
   * 导出小说为纯文本格式
   * @param novel 小说对象
   * @returns 纯文本格式的字符串
   */
  async exportToText(novel: Novel): Promise<string> {
    let content = `${novel.title}\n`;
    content += `类型: ${novel.genre}\n`;
    content += `描述: ${novel.description || '暂无描述'}\n`;
    content += `字数: ${novel.wordCount?.toLocaleString() || 0}\n\n`;
    
    if (novel.content) {
      content += `正文:\n${novel.content}\n\n`;
    }
    
    // 导出大纲
    try {
      const outlines = await hybridStorageService.getOutlines(novel.id);
      if (outlines && outlines.length > 0) {
        // 检查是否为长大纲或超长大纲
        const outlineWordCount = outlines.reduce((sum, outline) => sum + (outline.content?.length || 0), 0);
        const isLarge = isLargeOutline(outlines.length);
        const isSuperLarge = isSuperLargeOutline(outlineWordCount);
        
        if (isSuperLarge) {
          content += `大纲 (超长大纲模式):\n`;
          content += `注意: 检测到大纲超长(${outlines.length}项，约${outlineWordCount.toLocaleString()}字)，以下为大纲结构摘要\n\n`;
          
          const mainOutlines = outlines.filter(o => o.type === 'main');
          const chapterOutlines = outlines.filter(o => o.type === 'chapter');
          
          content += `卷结构 (${mainOutlines.length}卷):\n`;
          mainOutlines.forEach((outline, index) => {
            content += `${index + 1}. ${outline.title}\n`;
            if (outline.content) {
              content += `   ${outline.content.substring(0, 150)}${outline.content.length > 150 ? '...' : ''}\n`;
            }
          });
          
          content += `\n章节统计 (${chapterOutlines.length}章节):\n`;
          mainOutlines.forEach(main => {
            const chapters = chapterOutlines.filter(ch => ch.parentId === main.id);
            if (chapters.length > 0) {
              content += `${main.title} 下的章节:\n`;
              // 显示前10个章节
              const displayChapters = chapters.slice(0, 10);
              displayChapters.forEach((chapter, index) => {
                content += `- ${chapter.title}\n`;
              });
              if (chapters.length > 10) {
                content += `- ...还有${chapters.length - 10}个章节\n`;
              }
              content += '\n';
            }
          });
          
          // 未分配章节
          const unassignedChapters = chapterOutlines.filter(ch => !ch.parentId || !mainOutlines.some(main => main.id === ch.parentId));
          if (unassignedChapters.length > 0) {
            content += `\n未分配章节 (${unassignedChapters.length}章节):\n`;
            // 显示前10个未分配章节
            const displayUnassigned = unassignedChapters.slice(0, 10);
            displayUnassigned.forEach((chapter, index) => {
              content += `- ${chapter.title}\n`;
            });
            if (unassignedChapters.length > 10) {
              content += `- ...还有${unassignedChapters.length - 10}个章节\n`;
            }
          }
        } else if (isLarge) {
          content += `大纲 (长大纲模式):\n`;
          content += `注意: 检测到大纲较长(${outlines.length}项)，以下为大纲结构摘要\n\n`;
          
          const mainOutlines = outlines.filter(o => o.type === 'main');
          const chapterOutlines = outlines.filter(o => o.type === 'chapter');
          
          content += `卷结构 (${mainOutlines.length}卷):\n`;
          mainOutlines.forEach((outline, index) => {
            content += `${index + 1}. ${outline.title}\n`;
            if (outline.content) {
              content += `   ${outline.content.substring(0, 100)}${outline.content.length > 100 ? '...' : ''}\n`;
            }
          });
          
          content += `\n章节统计 (${chapterOutlines.length}章节):\n`;
          mainOutlines.forEach(main => {
            const chapters = chapterOutlines.filter(ch => ch.parentId === main.id);
            if (chapters.length > 0) {
              content += `${main.title} 下的章节:\n`;
              chapters.forEach((chapter, index) => {
                content += `- ${chapter.title}\n`;
              });
              content += '\n';
            }
          });
        } else {
          content += `大纲:\n`;
          const mainOutlines = outlines.filter(o => o.type === 'main');
          const chapterOutlines = outlines.filter(o => o.type === 'chapter');
          
          mainOutlines.forEach(main => {
            content += `\n${main.title}\n`;
            if (main.content) {
              content += `${main.content}\n`;
            }
            
            const chapters = chapterOutlines.filter(ch => ch.parentId === main.id);
            chapters.forEach(chapter => {
              content += `\n  ${chapter.title}\n`;
              if (chapter.content) {
                content += `  ${chapter.content}\n`;
              }
              if (chapter.summary) {
                content += `  摘要: ${chapter.summary}\n`;
              }
            });
          });
        }
      }
    } catch (error) {
      console.warn('导出大纲时出错:', error);
      content += `大纲导出失败: ${error instanceof Error ? error.message : '未知错误'}\n\n`;
    }
    
    return content;
  }
  
  /**
   * 导出大纲为独立文件
   * @param novelId 小说ID
   * @returns 大纲内容
   */
  async exportOutline(novelId: string): Promise<string> {
    try {
      const outlines = await hybridStorageService.getOutlines(novelId);
      if (!outlines || outlines.length === 0) {
        return '# 暂无大纲';
      }
      
      // 检查是否为长大纲或超长大纲
      const outlineWordCount = outlines.reduce((sum, outline) => sum + (outline.content?.length || 0), 0);
      const isLarge = isLargeOutline(outlines.length);
      const isSuperLarge = isSuperLargeOutline(outlineWordCount);
      
      if (isSuperLarge) {
        let content = '# 小说大纲 (超长大纲模式)\n\n';
        content += `> 大纲项数: ${outlines.length}，总字数: ${outlineWordCount.toLocaleString()}字\n\n`;
        
        const mainOutlines = outlines.filter(o => o.type === 'main');
        const chapterOutlines = outlines.filter(o => o.type === 'chapter');
        
        content += `## 卷结构 (${mainOutlines.length}卷)\n\n`;
        mainOutlines.forEach((outline, index) => {
          content += `${index + 1}. ${outline.title}\n`;
          if (outline.content) {
            content += `   ${outline.content.substring(0, 250)}${outline.content.length > 250 ? '...' : ''}\n`;
          }
        });
        
        content += `\n## 章节统计 (${chapterOutlines.length}章节)\n\n`;
        mainOutlines.forEach(main => {
          const chapters = chapterOutlines.filter(ch => ch.parentId === main.id);
          if (chapters.length > 0) {
            content += `### ${main.title} (${chapters.length}章节)\n`;
            // 显示前15个章节
            const displayChapters = chapters.slice(0, 15);
            displayChapters.forEach((chapter, index) => {
              content += `${index + 1}. ${chapter.title}\n`;
            });
            if (chapters.length > 15) {
              content += `${16}. ...还有${chapters.length - 15}个章节\n`;
            }
            content += '\n';
          }
        });
        
        // 未分配章节
        const unassignedChapters = chapterOutlines.filter(ch => !ch.parentId || !mainOutlines.some(main => main.id === ch.parentId));
        if (unassignedChapters.length > 0) {
          content += `## 未分配章节 (${unassignedChapters.length}章节)\n\n`;
          // 显示前15个未分配章节
          const displayUnassigned = unassignedChapters.slice(0, 15);
          displayUnassigned.forEach((chapter, index) => {
            content += `${index + 1}. ${chapter.title}\n`;
          });
          if (unassignedChapters.length > 15) {
            content += `${16}. ...还有${unassignedChapters.length - 15}个章节\n`;
          }
          content += '\n';
        }
        
        return content;
      } else if (isLarge) {
        let content = '# 小说大纲 (长大纲模式)\n\n';
        content += `> 大纲项数: ${outlines.length}\n\n`;
        
        const mainOutlines = outlines.filter(o => o.type === 'main');
        const chapterOutlines = outlines.filter(o => o.type === 'chapter');
        
        content += `## 卷结构 (${mainOutlines.length}卷)\n\n`;
        mainOutlines.forEach((outline, index) => {
          content += `${index + 1}. ${outline.title}\n`;
          if (outline.content) {
            content += `   ${outline.content.substring(0, 200)}${outline.content.length > 200 ? '...' : ''}\n`;
          }
        });
        
        content += `\n## 章节统计 (${chapterOutlines.length}章节)\n\n`;
        mainOutlines.forEach(main => {
          const chapters = chapterOutlines.filter(ch => ch.parentId === main.id);
          if (chapters.length > 0) {
            content += `### ${main.title} (${chapters.length}章节)\n`;
            chapters.forEach((chapter, index) => {
              content += `${index + 1}. ${chapter.title}\n`;
            });
            content += '\n';
          }
        });
        
        return content;
      } else {
        let content = '# 小说大纲\n\n';
        const mainOutlines = outlines.filter(o => o.type === 'main');
        const chapterOutlines = outlines.filter(o => o.type === 'chapter');
        
        mainOutlines.forEach(main => {
          content += `## ${main.title}\n\n`;
          if (main.content) {
            content += `${main.content}\n\n`;
          }
          
          const chapters = chapterOutlines.filter(ch => ch.parentId === main.id);
          chapters.forEach(chapter => {
            content += `### ${chapter.title}\n\n`;
            if (chapter.content) {
              content += `${chapter.content}\n\n`;
            }
            if (chapter.summary) {
              content += `摘要: ${chapter.summary}\n\n`;
            }
          });
        });
        
        return content;
      }
    } catch (error) {
      console.error('导出大纲失败:', error);
      throw new Error(`导出大纲失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

// 创建导出服务实例
export const exportService = new ExportService();