/**
 * 拼写检查服务
 * 提供基础的拼写检查功能
 */
class SpellCheckService {
  // 基础词典 - 在实际应用中应该从外部加载
  private dictionary: Set<string> = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
    'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
    'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
    'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
    'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    // 中文常用词
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你',
    '会', '着', '没有', '看', '好', '自己', '这', '那', '里', '来', '个', '他', '她', '它', '们', '这个', '那个', '什么', '时候',
    '哪里', '怎么', '为什么', '因为', '所以', '但是', '如果', '虽然', '然后', '现在', '已经', '还是', '只是', '可以', '应该',
    '能够', '需要', '必须', '一定', '可能', '也许', '大概', '或者', '以及', '还有', '同时', '接着', '于是', '因此', '然而',
    '但是', '可是', '不过', '而且', '并且', '或者', '还是', '或者', '或者', '或者'
  ]);

  // 常见错误拼写映射
  private commonMistakes: Record<string, string[]> = {
    'teh': ['the'],
    'recieve': ['receive'],
    'seperate': ['separate'],
    'definately': ['definitely'],
    'occured': ['occurred'],
    'existance': ['existence'],
    'accomodate': ['accommodate'],
    'ackward': ['awkward'],
    'alot': ['a lot'],
    'begining': ['beginning'],
    'belive': ['believe'],
    'calender': ['calendar'],
    'cemetary': ['cemetery'],
    'changeing': ['changing'],
    'collegue': ['colleague'],
    'comming': ['coming'],
    'deffinately': ['definitely'],
    'definatly': ['definitely'],
    'definetly': ['definitely'],
    'disasterous': ['disastrous'],
    'druming': ['drumming'],
    'embarass': ['embarrass'],
    'enviroment': ['environment'],
    'excede': ['exceed'],
    'experiance': ['experience'],
    'firey': ['fiery'],
    'goverment': ['government'],
    'guage': ['gauge'],
    'harrass': ['harass'],
    'illegaly': ['illegally'],
    'independance': ['independence'],
    'jewlery': ['jewelry'],
    'levle': ['level'],
    'maintainance': ['maintenance'],
    'medacine': ['medicine'],
    'mischeivous': ['mischievous'],
    'mispell': ['misspell'],
    'neccessary': ['necessary'],
    'occurence': ['occurrence'],
    'paralell': ['parallel'],
    'peice': ['piece'],
    'persistant': ['persistent'],
    'posession': ['possession'],
    'pronounciation': ['pronunciation'],
    'publically': ['publicly'],
    'refered': ['referred'],
    'relevent': ['relevant'],
    'ressurect': ['resurrect'],
    'sence': ['sense'],
    'sieze': ['seize'],
    'supercede': ['supersede'],
    'superfulous': ['superfluous'],
    'tendancy': ['tendency'],
    'therefor': ['therefore'],
    'threshhold': ['threshold'],
    'tommorow': ['tomorrow'],
    'tounge': ['tongue'],
    'truely': ['truly'],
    'unkown': ['unknown'],
    'unneccessary': ['unnecessary'],
    'weild': ['wield'],
    'whitch': ['which'],
    'writen': ['written']
  };

  /**
   * 检查单词是否在词典中
   * @param word 要检查的单词
   * @returns 是否在词典中
   */
  private isInDictionary(word: string): boolean {
    // 转换为小写进行检查
    const lowerWord = word.toLowerCase();
    
    // 直接检查
    if (this.dictionary.has(lowerWord)) {
      return true;
    }
    
    // 检查常见错误拼写
    if (this.commonMistakes[lowerWord]) {
      return true;
    }
    
    // 检查复数形式
    if (lowerWord.endsWith('s') && this.dictionary.has(lowerWord.slice(0, -1))) {
      return true;
    }
    
    // 检查过去式
    if (lowerWord.endsWith('ed')) {
      const base = lowerWord.slice(0, -2);
      if (this.dictionary.has(base)) return true;
      
      // 双写末尾辅音字母的情况
      if (base.length > 1 && base[base.length - 1] === base[base.length - 2]) {
        if (this.dictionary.has(base.slice(0, -1))) return true;
      }
    }
    
    // 检查进行时
    if (lowerWord.endsWith('ing')) {
      const base = lowerWord.slice(0, -3);
      if (this.dictionary.has(base)) return true;
      
      // 去掉末尾的e
      if (base.endsWith('e')) {
        if (this.dictionary.has(base.slice(0, -1))) return true;
      }
      
      // 双写末尾辅音字母的情况
      if (base.length > 1 && base[base.length - 1] === base[base.length - 2]) {
        if (this.dictionary.has(base.slice(0, -1))) return true;
      }
    }
    
    return false;
  }

  /**
   * 获取单词的建议修正
   * @param word 可能拼写错误的单词
   * @returns 建议的修正列表
   */
  private getSuggestions(word: string): string[] {
    const lowerWord = word.toLowerCase();
    
    // 检查常见错误拼写映射
    if (this.commonMistakes[lowerWord]) {
      return this.commonMistakes[lowerWord];
    }
    
    // 生成可能的修正建议
    const suggestions: string[] = [];
    
    // 1. 检查是否只是大小写问题
    for (const dictWord of this.dictionary) {
      if (dictWord.toLowerCase() === lowerWord) {
        suggestions.push(dictWord);
        if (suggestions.length >= 3) break;
      }
    }
    
    // 2. 如果单词长度大于3，检查是否是复数形式错误
    if (word.length > 3) {
      if (word.endsWith('s')) {
        const singular = word.slice(0, -1);
        if (this.isInDictionary(singular)) {
          suggestions.push(singular);
        }
      }
    }
    
    // 3. 简单的编辑距离检查（只检查距离为1的情况）
    for (const dictWord of this.dictionary) {
      if (Math.abs(dictWord.length - word.length) <= 1) {
        if (this.editDistance(lowerWord, dictWord.toLowerCase()) <= 1) {
          suggestions.push(dictWord);
          if (suggestions.length >= 5) break;
        }
      }
    }
    
    return [...new Set(suggestions)]; // 去重
  }

  /**
   * 计算两个字符串的编辑距离
   * @param s1 字符串1
   * @param s2 字符串2
   * @returns 编辑距离
   */
  private editDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // 删除
            dp[i][j - 1] + 1,     // 插入
            dp[i - 1][j - 1] + 1  // 替换
          );
        }
      }
    }
    
    return dp[m][n];
  }

  /**
   * 检查文本中的拼写错误
   * @param text 要检查的文本
   * @returns 拼写错误列表
   */
  public checkSpelling(text: string): Array<{ word: string; index: number; suggestions: string[] }> {
    const errors: Array<{ word: string; index: number; suggestions: string[] }> = [];
    
    // 使用正则表达式分割单词，保留位置信息
    const wordRegex = /[a-zA-Z\u4e00-\u9fa5]+/g;
    let match;
    
    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      const index = match.index;
      
      // 只检查长度大于1的单词
      if (word.length > 1 && !this.isInDictionary(word)) {
        const suggestions = this.getSuggestions(word);
        errors.push({ word, index, suggestions });
      }
    }
    
    return errors;
  }

  /**
   * 添加单词到词典
   * @param word 要添加的单词
   */
  public addToDictionary(word: string): void {
    this.dictionary.add(word.toLowerCase());
  }

  /**
   * 从词典中移除单词
   * @param word 要移除的单词
   */
  public removeFromDictionary(word: string): void {
    this.dictionary.delete(word.toLowerCase());
  }

  /**
   * 获取词典大小
   * @returns 词典中的单词数量
   */
  public getDictionarySize(): number {
    return this.dictionary.size;
  }

  /**
   * 清空词典
   */
  public clearDictionary(): void {
    this.dictionary.clear();
  }
}

// 创建拼写检查服务实例
export const spellCheckService = new SpellCheckService();