import { NovelOutline } from '#/novel';

/**
 * 导出服务
 * 提供多种格式的导出功能
 */
class ExportService {
  /**
   * 导出为JSON格式
   * @param data 要导出的数据
   * @param filename 文件名
   */
  public exportAsJson(data: any, filename: string): void {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      this.downloadFile(jsonData, filename, 'application/json');
    } catch (error) {
      console.error('导出JSON失败:', error);
      throw new Error('导出JSON失败');
    }
  }

  /**
   * 导出为Markdown格式
   * @param acts 大纲数据
   * @param filename 文件名
   */
  public exportAsMarkdown(acts: any[], filename: string): void {
    try {
      let markdownContent = `# 小说大纲\n\n`;
      markdownContent += `导出时间: ${new Date().toLocaleString()}\n\n`;
      
      acts.forEach((act, actIndex) => {
        markdownContent += `## 第${actIndex + 1}卷 ${act.title}\n\n`;
        if (act.content) {
          markdownContent += `${act.content}\n\n`;
        }
        
        act.chapters.forEach((chapter: any, chapterIndex: number) => {
          markdownContent += `### ${actIndex + 1}.${chapterIndex + 1} ${chapter.title}\n\n`;
          if (chapter.content) {
            markdownContent += `${chapter.content}\n\n`;
          }
          if (chapter.summary) {
            markdownContent += `**摘要**: ${chapter.summary}\n\n`;
          }
        });
        
        markdownContent += `---\n\n`;
      });
      
      this.downloadFile(markdownContent, filename, 'text/markdown');
    } catch (error) {
      console.error('导出Markdown失败:', error);
      throw new Error('导出Markdown失败');
    }
  }

  /**
   * 导出为TXT格式
   * @param acts 大纲数据
   * @param filename 文件名
   */
  public exportAsTxt(acts: any[], filename: string): void {
    try {
      let txtContent = `小说大纲\n=======\n\n`;
      txtContent += `导出时间: ${new Date().toLocaleString()}\n\n`;
      
      acts.forEach((act, actIndex) => {
        txtContent += `第${actIndex + 1}卷 ${act.title}\n`;
        if (act.content) {
          txtContent += `${act.content}\n\n`;
        }
        
        act.chapters.forEach((chapter: any, chapterIndex: number) => {
          txtContent += `${actIndex + 1}.${chapterIndex + 1} ${chapter.title}\n`;
          if (chapter.content) {
            txtContent += `${chapter.content}\n\n`;
          }
          if (chapter.summary) {
            txtContent += `摘要: ${chapter.summary}\n\n`;
          }
        });
        
        txtContent += `----------\n\n`;
      });
      
      this.downloadFile(txtContent, filename, 'text/plain');
    } catch (error) {
      console.error('导出TXT失败:', error);
      throw new Error('导出TXT失败');
    }
  }

  /**
   * 导出为DOCX格式
   * @param acts 大纲数据
   * @param filename 文件名
   */
  public exportAsDocx(acts: any[], filename: string): void {
    try {
      let docxContent = `小说大纲\n=======\n\n`;
      docxContent += `导出时间: ${new Date().toLocaleString()}\n\n`;
      
      acts.forEach((act, actIndex) => {
        docxContent += `第${actIndex + 1}卷 ${act.title}\n`;
        if (act.content) {
          docxContent += `${act.content}\n\n`;
        }
        
        act.chapters.forEach((chapter: any, chapterIndex: number) => {
          docxContent += `${actIndex + 1}.${chapterIndex + 1} ${chapter.title}\n`;
          if (chapter.content) {
            docxContent += `${chapter.content}\n\n`;
          }
          if (chapter.summary) {
            docxContent += `摘要: ${chapter.summary}\n\n`;
          }
        });
        
        docxContent += `----------\n\n`;
      });
      
      // 注意：这仍然是文本格式，不是真正的DOCX格式
      // 真正的DOCX导出需要使用专门的库如docxtemplater或PizZip
      this.downloadFile(docxContent, filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } catch (error) {
      console.error('导出DOCX失败:', error);
      throw new Error('导出DOCX失败');
    }
  }

  /**
   * 导出章节内容
   * @param content 章节内容
   * @param title 章节标题
   * @param format 导出格式
   * @param filename 文件名
   */
  public exportChapterContent(content: string, title: string, format: 'txt' | 'md' | 'docx', filename: string): void {
    try {
      let exportContent = '';
      let mimeType = '';
      
      switch (format) {
        case 'txt':
          exportContent = `${title}\n=======\n\n${content}`;
          mimeType = 'text/plain';
          break;
        case 'md':
          exportContent = `# ${title}\n\n${content}`;
          mimeType = 'text/markdown';
          break;
        case 'docx':
          exportContent = `${title}\n=======\n\n${content}`;
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        default:
          throw new Error('不支持的导出格式');
      }
      
      this.downloadFile(exportContent, filename, mimeType);
    } catch (error) {
      console.error('导出章节内容失败:', error);
      throw new Error('导出章节内容失败');
    }
  }

  /**
   * 导出内容（通用方法）
   * @param content 内容
   * @param format 格式
   * @returns 导出的内容字符串
   */
  public exportContent(content: string, format: 'txt' | 'md' | 'docx'): string {
    switch (format) {
      case 'txt':
        return content;
      case 'md':
        return content;
      case 'docx':
        return content;
      default:
        return content;
    }
  }

  /**
   * 下载文件
   * @param content 文件内容
   * @param filename 文件名
   * @param mimeType MIME类型
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// 创建导出服务实例
export const exportService = new ExportService();