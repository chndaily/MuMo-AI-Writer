import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Space, Card, Typography, message, Dropdown, Menu, Modal, Statistic, Row, Col, Divider, InputNumber, Progress, Select, Tooltip, Collapse, List, Alert } from 'antd';
import { 
  SaveOutlined, 
  EyeOutlined, 
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  SettingOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  HistoryOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  AimOutlined,
  BookOutlined,
  FileOutlined,
  CaretRightOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined // 新增导入
} from '@ant-design/icons';
import TailwindAdvancedEditor from '@/components/novel/tiptapNovel/advanced-editor';
import { useCreationCenterStore } from '@/stores/creationCenterStore';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { hybridStorageService } from '@/services/hybridStorageService';
import { databaseManager, getDatabaseStatus } from '@/services/index';
import { spellCheckService } from '@/services/spellCheckService';
import { exportService } from '@/services/exportService'; // 新增导入

const { Title } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// 字符统计函数
const analyzeText = (text: string) => {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      lines: 0,
      paragraphs: 0
    };
  }
  
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const words = trimmedText ? trimmedText.split(/\s+/).length : 0;
  const lines = text.split(/\r\n|\r|\n/).length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
  
  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    paragraphs
  };
};

// 章节信息接口
interface ChapterInfo {
  id: string;
  title: string;
  content: string;
  order: number;
}

// 章节版本接口
interface ChapterVersion {
  id: string;
  chapterId: string;
  content: string;
  wordCount: number;
  createdAt: string;
  versionName?: string;
}

const ManuscriptEditor: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedNovel } = useCreationCenterStore();
  // 直接使用 databaseManager 获取数据
  const updateNovel = useCallback(async (id: string, updates: any) => {
    const { databaseManager } = await import('@/services/index');
    const novel = await databaseManager.novels.getNovel(id);
    if (novel) {
      await databaseManager.novels.updateNovel({ ...novel, ...updates });
    }
  }, []);
  
  const getNovel = useCallback(async (id: string) => {
    const { databaseManager } = await import('@/services/index');
    return await databaseManager.novels.getNovel(id);
  }, []);
  
  // 从URL参数获取小说ID和章节ID
  const { novelId, chapterId } = useParams<{ novelId: string; chapterId?: string }>();
  
  // 编辑器内容状态
  const [content, setContent] = useState('');
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const [textStats, setTextStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    lines: 0,
    paragraphs: 0
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 新增状态：写作目标
  const [writingGoal, setWritingGoal] = useState(50000);
  const [dailyGoal, setDailyGoal] = useState(1000);
  // 新增状态：当前小说信息
  const [currentNovelInfo, setCurrentNovelInfo] = useState<any>(null);
  const [loadingNovel, setLoadingNovel] = useState(false);
  // 新增状态：章节选择相关
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [chapterContentMap, setChapterContentMap] = useState<Record<string, string>>({});
  // 新增状态：大纲概述显示
  const [showOutlineSummary, setShowOutlineSummary] = useState(true);
  const [selectedChapterOutline, setSelectedChapterOutline] = useState<string>('');
  // 新增状态：版本历史相关
  const [chapterVersions, setChapterVersions] = useState<ChapterVersion[]>([]);
  const [isVersionHistoryVisible, setIsVersionHistoryVisible] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [autoSaveVersionEnabled, setAutoSaveVersionEnabled] = useState(true);
  const [lastVersionSaved, setLastVersionSaved] = useState<Date | null>(null);
  // 新增状态：内容替换警告
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);
  const [replacedChapterId, setReplacedChapterId] = useState<string | null>(null);
  // 新增状态：拼写检查相关
  const [spellingErrors, setSpellingErrors] = useState<any[]>([]);
  const [isSpellCheckVisible, setIsSpellCheckVisible] = useState(false);
  const [spellingCheckResults, setSpellingCheckResults] = useState<any[]>([]);

  // 当URL中的chapterId参数变化时，自动选择对应的章节
  useEffect(() => {
    if (chapterId && chapters.length > 0) {
      // 检查章节ID是否在章节列表中
      const chapterExists = chapters.some(chapter => chapter.id === chapterId);
      if (chapterExists) {
        setSelectedChapterId(chapterId);
      } else {
        // 如果章节不存在，可能是数据还没加载完成，稍后再试
        const timer = setTimeout(() => {
          const chapterExists = chapters.some(chapter => chapter.id === chapterId);
          if (chapterExists) {
            setSelectedChapterId(chapterId);
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [chapterId, chapters]);
  
  // 处理编辑器内容变化的回调函数
  const handleContentChange = (newContent: string) => {
    // 使用防抖机制避免过于频繁的更新
    if (contentUpdateTimeoutRef.current) {
      clearTimeout(contentUpdateTimeoutRef.current);
    }
    
    contentUpdateTimeoutRef.current = setTimeout(() => {
      // 更新内容状态
      setContent(newContent);
      // 设置未保存状态
      setLastSaved(null);
      
      // 如果当前选择了章节，更新章节内容映射
      if (selectedChapterId) {
        setChapterContentMap(prev => ({
          ...prev,
          [selectedChapterId]: newContent
        }));
      }
    }, 100); // 100ms防抖延迟
  };

  // 编辑器引用
  const editorRef = useRef<any>(null);
  const [editorKey, setEditorKey] = useState(0); // 用于强制重新渲染编辑器
  const contentUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 用于防抖的内容更新
  
  // 格式化大纲内容，处理HTML标记
  const formatOutlineContent = (content: string) => {
    if (!content) return '';
    
    // 不再进行反斜杠清理，让正常的Markdown解析处理内容
    // 只保留原始的Markdown内容进行格式化
    
    // 先处理换行符
    let formattedContent = content.replace(/\n/g, '<br>');
    
    // 处理标题标记
    formattedContent = formattedContent.replace(/##\s+(.+?)(<br>|$)/g, '<h2>$1</h2>');
    formattedContent = formattedContent.replace(/###\s+(.+?)(<br>|$)/g, '<h3>$1</h3>');
    
    // 处理粗体
    formattedContent = formattedContent.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体
    formattedContent = formattedContent.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    return formattedContent;
  };
  

  
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // 监听自定义事件
  useEffect(() => {
    // 保存事件
    const handleSave = () => handleSaveContent();
    // 预览事件
    const handlePreview = () => {
      setIsPreviewVisible(true);
    };
    // 朗读事件
    const handleRead = () => handleReadAloud();
    // 全屏事件
    const handleFullscreen = () => toggleFullscreen();
    
    // 添加事件监听器
    window.addEventListener('manuscript-save', handleSave);
    window.addEventListener('manuscript-preview', handlePreview);
    window.addEventListener('manuscript-read', handleRead);
    window.addEventListener('manuscript-fullscreen', handleFullscreen);
    
    // 监听全屏状态变化
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // 清理事件监听器
    return () => {
      window.removeEventListener('manuscript-save', handleSave);
      window.removeEventListener('manuscript-preview', handlePreview);
      window.removeEventListener('manuscript-read', handleRead);
      window.removeEventListener('manuscript-fullscreen', handleFullscreen);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // 监听路由变化，当novelId变化时加载对应小说内容
  useEffect(() => {
    if (novelId) {
      loadNovelContent(novelId);
      loadChapters(novelId);
    }
    
    // 组件卸载时清理定时器
    return () => {
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current);
      }
    };
  }, [novelId]);
  
  // 监听大纲更新事件，当大纲内容变化时重新加载章节列表
  useEffect(() => {
    const handleOutlineUpdate = () => {
      if (novelId) {
        loadChapters(novelId);
      }
    };
    
    // 监听大纲更新事件
    window.addEventListener('outline-updated', handleOutlineUpdate);
    
    return () => {
      window.removeEventListener('outline-updated', handleOutlineUpdate);
    };
  }, [novelId]);
  
  // 监听章节内容同步事件，当AI生成的内容同步到章节时更新编辑器内容
  useEffect(() => {
    const handleChapterContentSynced = (event: CustomEvent) => {
      const { novelId: eventNovelId, chapterId, content: syncedContent, willReplaceContent } = event.detail;
      
      // 确保是当前小说的章节同步事件
      if (eventNovelId === novelId && chapterId === selectedChapterId) {
        console.log('接收到章节内容同步事件:', { chapterId, content: syncedContent, willReplaceContent });
        
        // 更新编辑器内容
        setContent(syncedContent);
        
        // 同时更新章节内容映射
        setChapterContentMap(prev => ({
          ...prev,
          [chapterId]: syncedContent
        }));
        
        // 强制重新渲染编辑器组件
        setEditorKey(prev => prev + 1);
        
        // 如果是替换内容操作，显示警告信息
        if (willReplaceContent) {
          setReplacedChapterId(chapterId);
          setShowReplaceWarning(true);
          message.warning('原有内容已被替换，如需恢复请查看版本历史');
        } else {
          message.success('AI生成的内容已同步到当前章节');
        }
        
        // 自动刷新章节列表
        setTimeout(() => {
          loadChapters(novelId);
        }, 500);
      }
    };
    
    // 监听章节内容同步事件
    window.addEventListener('chapterContentSynced', handleChapterContentSynced as EventListener);
    
    return () => {
      window.removeEventListener('chapterContentSynced', handleChapterContentSynced as EventListener);
    };
  }, [novelId, selectedChapterId]);
  
  // 当章节选择变化时，更新大纲概述并加载章节内容到编辑器
  useEffect(() => {
    console.log('章节选择变化:', { selectedChapterId, chapters });
    if (selectedChapterId) {
      // 获取选中章节的大纲概述
      const chapter = chapters.find(c => c.id === selectedChapterId);
      if (chapter) {
        setSelectedChapterOutline(chapter.content || '');
        
        // 从章节内容映射中获取章节内容并设置到编辑器
        const chapterContent = chapterContentMap[selectedChapterId] || chapter.content || '';
        console.log('设置章节内容到编辑器:', chapterContent);
        setContent(chapterContent);
        
        // 强制重新渲染编辑器组件
        setEditorKey(prev => prev + 1);
      } else {
        // 清空大纲概述显示
        setSelectedChapterOutline('');
        // 清空编辑器内容
        setContent('');
      }
    } else {
      // 清空大纲概述显示
      setSelectedChapterOutline('');
      // 如果没有选择章节，使用小说整体内容
      if (currentNovelInfo?.content) {
        console.log('使用小说整体内容:', currentNovelInfo.content);
        setContent(currentNovelInfo.content);
      } else {
        // 使用默认内容
        setContent('# 新小说\n\n开始你的创作之旅...');
      }
    }
  }, [selectedChapterId, chapters, currentNovelInfo, chapterContentMap]);
  
  // 加载小说内容
  const loadNovelContent = async (id: string) => {
    setLoadingNovel(true);
    try {
      console.log('加载小说内容，ID为:', id);
      const novel = await getNovel(id);
      console.log('从数据库获取到的小说数据:', novel);
      
      if (novel) {
        setCurrentNovelInfo(novel);
        if (novel.content) {
          console.log('设置小说内容:', novel.content.substring(0, 100) + '...');
          setContent(novel.content);
        } else {
          // 如果没有内容，设置默认内容
          const defaultContent = '# ' + (novel.title || '新小说') + '\n\n开始你的创作之旅...';
          console.log('设置默认内容:', defaultContent);
          setContent(defaultContent);
        }
        
        // 设置写作目标
        if (novel.targetWordCount) {
          setWritingGoal(novel.targetWordCount);
        }
      } else {
        // 小说不存在时的处理
        setCurrentNovelInfo(null);
        setContent('# 新小说\n\n开始你的创作之旅...');
      }
    } catch (error) {
      console.error('加载小说内容失败:', error);
      message.error('加载小说内容失败: ' + (error instanceof Error ? error.message : '未知错误'));
      
      // 出错时也设置默认内容
      setCurrentNovelInfo(null);
      setContent('# 新小说\n\n开始你的创作之旅...');
    } finally {
      setLoadingNovel(false);
    }
  };
  
  // 加载章节列表
  const loadChapters = async (id: string) => {
    setLoadingChapters(true);
    try {
      console.log('加载章节列表，小说ID:', id);
      // 获取大纲数据
      const outlines = await hybridStorageService.getOutlines(id);
      console.log('获取到的大纲数据:', outlines);
      
      // 筛选出章节类型的数据
      const chapterOutlines = outlines.filter(outline => outline.type === 'chapter');
      console.log('章节类型的大纲数据:', chapterOutlines);
      
      // 转换为章节信息
      const chapterList: ChapterInfo[] = chapterOutlines.map(outline => ({
        id: outline.id,
        title: outline.title,
        content: outline.content || '',
        order: outline.order
      })).sort((a, b) => a.order - b.order);
      
      console.log('转换后的章节列表:', chapterList);
      setChapters(chapterList);
      
      // 初始化章节内容映射为空字符串
      const contentMap: Record<string, string> = {};
      chapterList.forEach(chapter => {
        contentMap[chapter.id] = '';
      });
      setChapterContentMap(contentMap);
    } catch (error) {
      console.error('加载章节列表失败:', error);
      message.error('加载章节列表失败: ' + (error instanceof Error ? error.message : '未知错误'));
      setChapters([]);
    } finally {
      setLoadingChapters(false);
    }
  };
  
  // 处理章节选择变化
  const handleChapterChange = (chapterId: string) => {
    setSelectedChapterId(chapterId);
  };
  
  // 更新文本统计 - 使用防抖机制
  useEffect(() => {
    // 使用setTimeout进行简单的防抖
    const timer = setTimeout(() => {
      const stats = analyzeText(content);
      setTextStats(stats);
      setWordCount(stats.words);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [content]);
  
  // 自动保存定时器
  useEffect(() => {
    let autoSaveTimer: NodeJS.Timeout;
    
    if (isAutoSaveEnabled && content) {
      autoSaveTimer = setTimeout(() => {
        // 使用防抖机制，避免频繁保存
        handleSaveContent();
      }, 300000); // 5分钟自动保存（300000毫秒）
    }
    
    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [content, isAutoSaveEnabled]);
  
  // 保存内容
  const handleSaveContent = async () => {
    if (!novelId) {
      message.warning('请先选择一本小说');
      return;
    }
    
    // 避免重复保存
    if (isSaving) {
      return;
    }
    
    setIsSaving(true);
    try {
      // 如果当前选择了章节，保存章节内容
      if (selectedChapterId) {
        // 获取当前章节的完整信息
        const currentChapter = chapters.find(c => c.id === selectedChapterId);
        if (currentChapter) {
          // 更新大纲中的章节内容
          const outlineToUpdate: any = {
            id: selectedChapterId,
            novelId: novelId,
            title: currentChapter.title,
            content: content,
            type: 'chapter',
            order: currentChapter.order,
            createdAt: new Date().toISOString(), // 添加必需的字段
            lastModified: new Date().toISOString()
          };
          
          await hybridStorageService.saveOutline(outlineToUpdate);
          message.success('章节内容保存成功');
          
          // 更新本地章节列表
          setChapters(prev => prev.map(chapter => 
            chapter.id === selectedChapterId 
              ? { ...chapter, content: content } 
              : chapter
          ));
          
          // 同时更新章节内容映射
          setChapterContentMap(prev => ({
            ...prev,
            [selectedChapterId]: content
          }));
          
          // 更新大纲概述显示
          setSelectedChapterOutline(content);
        }
      } else {
        // 否则保存小说整体内容
        await updateNovel(novelId, { content, wordCount });
        message.success('小说内容保存成功');
      }
      
      setLastSaved(new Date());
      
      // 保存成功后更新当前小说信息
      const updatedNovel = await getNovel(novelId);
      if (updatedNovel) {
        setCurrentNovelInfo(updatedNovel);
      }
      
      // 触发自定义事件通知其他组件
      window.dispatchEvent(new CustomEvent('manuscript-save-success'));
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };
  
  
  // 预览功能
  const handlePreview = () => {
    setIsPreviewVisible(true);
  };
  
  // 朗读功能
  const handleReadAloud = () => {
    if (!content) {
      message.warning('没有内容可朗读');
      return;
    }
    
    if (isReading) {
      // 停止朗读
      window.speechSynthesis.cancel();
      setIsReading(false);
      message.info('朗读已停止');
    } else {
      // 开始朗读
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        setIsReading(true);
        message.info('开始朗读');
      };
      
      utterance.onend = () => {
        setIsReading(false);
        message.info('朗读完成');
      };
      
      utterance.onerror = (event) => {
        setIsReading(false);
        message.error(`朗读出错: ${event.error}`);
      };
      
      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // 显示统计信息
  const showStats = () => {
    setIsStatsVisible(true);
  };
  
  // 切换自动保存
  const toggleAutoSave = () => {
    setIsAutoSaveEnabled(!isAutoSaveEnabled);
    message.info(`${isAutoSaveEnabled ? '关闭' : '开启'}自动保存`);
  };
  
  // 切换全屏模式
  const toggleFullscreen = () => {
    const element = document.querySelector('.manuscript-editor-container');
    if (element) {
      if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
          message.error(`无法进入全屏模式: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };
  
  // 切换大纲概述显示
  const toggleOutlineSummary = () => {
    setShowOutlineSummary(!showOutlineSummary);
  };
  
  // 计算进度百分比
  const calculateProgress = () => {
    if (writingGoal <= 0) return 0;
    
    // 计算整本小说的总字符数
    let totalCharacters = 0;
    if (chapters.length > 0) {
      // 遍历所有章节，累加字符数
      chapters.forEach(chapter => {
        // 使用章节内容映射中的内容计算字符数
        const chapterContent = chapterContentMap[chapter.id] || chapter.content || '';
        totalCharacters += chapterContent.length;
      });
    } else if (currentNovelInfo?.content) {
      // 如果没有章节，使用小说整体内容
      totalCharacters = currentNovelInfo.content.length;
    }
    
    // 使用整本小说的总字符数来计算进度
    return Math.min(100, Math.round((totalCharacters / writingGoal) * 100));
  };

  // 加载章节版本历史
  const loadChapterVersions = async (chapterId: string) => {
    setLoadingVersions(true);
    try {
      console.log('加载章节版本历史，章节ID为:', chapterId);
      // 检查数据库是否已初始化
      const dbStatus = await getDatabaseStatus();
      if (!dbStatus || dbStatus === '错误') {
        throw new Error('数据库未初始化');
      }
      
      const versions = await hybridStorageService.getChapterVersions(chapterId);
      console.log('获取到的版本历史:', versions);
      setChapterVersions(versions);
    } catch (error) {
      console.error('加载章节版本历史失败:', error);
      // 检查错误类型并提供更友好的错误消息
      if (error instanceof Error && error.message.includes('数据库未初始化')) {
        message.error('加载章节版本历史失败: 数据库未初始化，请刷新页面重试');
      } else {
        message.error('加载章节版本历史失败: ' + (error instanceof Error ? error.message : '未知错误'));
      }
      setChapterVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  // 保存当前内容为新版本
  const saveCurrentContentAsVersion = async (versionName?: string) => {
    if (!selectedChapterId || !content) {
      message.warning('请先选择章节并输入内容');
      return;
    }

    try {
      const version: Omit<ChapterVersion, 'id' | 'createdAt'> = {
        chapterId: selectedChapterId,
        content: content,
        wordCount: textStats.characters,  // 直接使用字符数统计
        versionName: versionName || `版本 ${new Date().toLocaleString()}`
      };

      await hybridStorageService.saveChapterVersion(version);
      message.success('版本保存成功');
      
      // 更新版本历史列表
      if (selectedChapterId) {
        loadChapterVersions(selectedChapterId);
      }
      
      setLastVersionSaved(new Date());
    } catch (error) {
      console.error('保存版本失败:', error);
      message.error('保存版本失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 恢复到指定版本
  const restoreToVersion = async (version: ChapterVersion) => {
    try {
      setContent(version.content);
      setLastVersionSaved(new Date());
      message.success(`已恢复到版本: ${version.versionName || version.createdAt}`);
      
      // 强制重新渲染编辑器组件
      setEditorKey(prev => prev + 1);
      
      // 关闭版本历史面板
      setIsVersionHistoryVisible(false);
    } catch (error) {
      console.error('恢复版本失败:', error);
      message.error('恢复版本失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 删除指定版本
  const deleteVersion = async (version: ChapterVersion) => {
    try {
      // 确认删除操作
      const confirmed = await new Promise<boolean>(resolve => {
        Modal.confirm({
          title: '确认删除',
          content: `确定要删除版本 "${version.versionName || new Date(version.createdAt).toLocaleString()}" 吗？此操作不可撤销。`,
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      
      if (!confirmed) return;
      
      // 调用混合存储服务删除版本
      await hybridStorageService.deleteChapterVersion(version.id);
      message.success(`版本 "${version.versionName || new Date(version.createdAt).toLocaleString()}" 已删除`);
      
      // 重新加载版本历史列表
      if (selectedChapterId) {
        loadChapterVersions(selectedChapterId);
      }
    } catch (error) {
      console.error('删除版本失败:', error);
      message.error('删除版本失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 自动保存版本（每隔30分钟）
  useEffect(() => {
    if (!autoSaveVersionEnabled || !selectedChapterId || !content) {
      return;
    }

    const autoSaveTimer = setInterval(() => {
      // 检查距离上次保存版本是否已超过30分钟
      if (!lastVersionSaved || (Date.now() - lastVersionSaved.getTime()) > 30 * 60 * 1000) {
        saveCurrentContentAsVersion(`自动保存版本 ${new Date().toLocaleString()}`);
      }
    }, 60000); // 每分钟检查一次

    return () => clearInterval(autoSaveTimer);
  }, [autoSaveVersionEnabled, selectedChapterId, content, lastVersionSaved]);

  // 当章节选择变化时，加载对应的版本历史
  useEffect(() => {
    if (selectedChapterId) {
      loadChapterVersions(selectedChapterId);
    } else {
      setChapterVersions([]);
    }
  }, [selectedChapterId]);

  // 拼写检查功能
  const handleSpellCheck = async () => {
    try {
      // 使用专业的拼写检查服务
      const errors = spellCheckService.checkSpelling(content);
      
      setSpellingCheckResults(errors);
      setIsSpellCheckVisible(true);
      
      if (errors.length > 0) {
        message.info(`发现 ${errors.length} 个可能的拼写错误`);
      } else {
        message.success('未发现拼写错误');
      }
    } catch (error) {
      console.error('拼写检查失败:', error);
      message.error('拼写检查失败');
    }
  };

  // 修正拼写错误
  const handleCorrectSpelling = (originalWord: string, correctedWord: string) => {
    // 使用正则表达式精确替换单词边界
    const newContent = content.replace(new RegExp(`\\b${originalWord}\\b`, 'g'), correctedWord);
    setContent(newContent);
    
    // 更新拼写检查结果，移除已修正的错误
    setSpellingCheckResults(spellingCheckResults.filter(err => err.word !== originalWord));
    
    // 强制重新渲染编辑器组件
    setEditorKey(prev => prev + 1);
    
    message.success('拼写已修正');
  };

  // 导出章节内容
  const handleExportChapter = (format: 'txt' | 'md' | 'docx') => {
    try {
      if (!content) {
        message.warning('没有内容可导出');
        return;
      }

      // 获取当前章节标题
      const chapterTitle = selectedChapterId 
        ? chapters.find(c => c.id === selectedChapterId)?.title || '章节内容'
        : currentNovelInfo?.title || '小说内容';

      // 生成文件名
      const fileName = `${chapterTitle}_${new Date().toISOString().slice(0, 10)}.${format}`;

      // 导出内容
      exportService.exportChapterContent(content, chapterTitle, format, fileName);
      message.success(`章节内容已导出为${format.toUpperCase()}格式`);
    } catch (error) {
      console.error('导出章节内容失败:', error);
      message.error('导出章节内容失败');
    }
  };

  return (
    <div className="h-full flex flex-col manuscript-editor-container">
      {/* 顶部工具栏 */}
      <div className="flex justify-between items-center p-4 border-b flex-none">
        <div className="flex items-center gap-6">
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {currentNovelInfo?.title || selectedNovel?.title || '小说创作'}
            </Title>
            <div className="text-sm text-gray-500 mt-1">
              <span>{lastSaved ? `最后保存: ${lastSaved.toLocaleString()}` : '未保存'}</span>
            </div>
          </div>
          
          {/* 进度条 */}
          <div className="flex items-center gap-2">
            <Progress 
              percent={calculateProgress()} 
              size="small" 
              status={calculateProgress() >= 100 ? "success" : "normal"}
              style={{ width: 120 }}
            />
          </div>
        </div>
        
        <Space>
          <Button 
            icon={<SaveOutlined />} 
            onClick={handleSaveContent}
            type="primary"
            loading={isSaving}
          >
            保存
          </Button>
          <Button 
            icon={<ThunderboltOutlined />} 
            onClick={() => {
              // 跳转到AI工作台，传递当前小说ID和章节ID
              navigate('/ai-workspace', {
                state: {
                  mode: 'chapter',
                  novelId: novelId,
                  chapterId: selectedChapterId,
                  prompt: '请为这个章节生成内容'
                }
              });
            }}
          >
            AI辅助生成
          </Button>
          <Button 
            icon={<EyeOutlined />} 
            onClick={handlePreview}
          >
            预览
          </Button>
          <Button 
            icon={<BarChartOutlined />} 
            onClick={showStats}
          >
            统计
          </Button>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'export-txt',
                  label: '导出为TXT',
                  onClick: () => handleExportChapter('txt')
                },
                {
                  key: 'export-md',
                  label: '导出为Markdown',
                  onClick: () => handleExportChapter('md')
                },
                {
                  key: 'export-docx',
                  label: '导出为DOCX',
                  onClick: () => handleExportChapter('docx')
                }
              ]
            }}
          >
            <Button icon={<CloudDownloadOutlined />}>
              导出
            </Button>
          </Dropdown>
          <Button 
            icon={<CheckCircleOutlined />} 
            onClick={handleSpellCheck}
          >
            拼写检查
          </Button>
          <Button 
            icon={isReading ? <PauseCircleOutlined /> : <SoundOutlined />} 
            onClick={handleReadAloud}
            type={isReading ? 'primary' : 'default'}
          >
            {isReading ? '停止朗读' : '朗读'}
          </Button>
          <Button 
            icon={isAutoSaveEnabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
            onClick={toggleAutoSave}
            type={isAutoSaveEnabled ? 'default' : 'primary'}
          >
            {isAutoSaveEnabled ? '暂停自动保存' : '开启自动保存'}
          </Button>
          <Button 
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '退出全屏' : '全屏'}
          </Button>
        </Space>
      </div>
      
      {/* 章节选择器 */}
      <div className="flex items-center gap-4 p-3 border-b bg-gray-50">
        <BookOutlined className="text-blue-500" />
        <span className="font-medium">章节:</span>
        <Select
          value={selectedChapterId}
          onChange={handleChapterChange}
          loading={loadingChapters}
          placeholder="选择章节进行创作"
          style={{ width: 300 }}
          allowClear
        >
          {chapters.map((chapter, index) => (
            <Option key={chapter.id} value={chapter.id}>
              <Tooltip title={chapter.title}>
                <div className="flex items-center">
                  <FileOutlined className="mr-2 text-gray-400" />
                  <span className="truncate">{index + 1}. {chapter.title}</span>
                </div>
              </Tooltip>
            </Option>
          ))}
        </Select>
        {selectedChapterId && (
          <span className="text-sm text-gray-500">
            正在创作章节: {chapters.find(c => c.id === selectedChapterId)?.title}
          </span>
        )}
      </div>
      
      {/* 内容替换警告 */}
      {showReplaceWarning && (
        <Alert
          message={
            <div className="flex items-center">
              <WarningOutlined className="mr-2 text-orange-500" />
              <span>内容替换提醒</span>
            </div>
          }
          description={
            <div>
              <p>章节内容已被AI生成内容替换，如需恢复原始内容请查看版本历史。</p>
              <Button 
                size="small" 
                type="link" 
                onClick={() => {
                  setIsVersionHistoryVisible(true);
                  setShowReplaceWarning(false);
                }}
              >
                查看版本历史
              </Button>
            </div>
          }
          type="warning"
          closable
          onClose={() => setShowReplaceWarning(false)}
          style={{ borderRadius: 0 }}
        />
      )}
      
      {/* 主内容区域 - 编辑器和大纲概述 */}
      <div className="flex-1 overflow-hidden flex">
        {/* 编辑器区域 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div style={{ height: "100%" }}>
              <TailwindAdvancedEditor 
                key={editorKey} 
                ref={editorRef} 
                content={content} 
                onContentChange={handleContentChange} 
              />
            </div>
          </div>
        </div>
        
        {/* 大纲概述区域 - 始终显示折叠/展开按钮，但根据章节选择和显示状态决定内容显示 */}
        {showOutlineSummary ? (
          <div className="w-1/4 border-l p-4 overflow-auto bg-gray-50 min-w-[250px] max-w-[300px] flex flex-col" >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">大纲概述</h3>
              <Button 
                size="small" 
                onClick={toggleOutlineSummary}
                type="text"
                icon={<CaretRightOutlined />}
              />
            </div>
            {selectedChapterId ? (
              <div className="bg-white p-4 rounded border flex flex-col flex-1">
                {selectedChapterOutline ? (
                  <div className="prose max-w-none flex-1 overflow-auto" style={{ maxHeight: '250px' }}>
                    <div dangerouslySetInnerHTML={{ __html: formatOutlineContent(selectedChapterOutline) }} />
                  </div>
                ) : (
                  <p className="text-gray-500">该章节暂无大纲概述</p>
                )}
                {/* 添加插入大纲内容按钮 */}
                {selectedChapterOutline && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex gap-2">
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => {
                          console.log('插入大纲内容按钮被点击');
                          console.log('当前内容:', content);
                          console.log('选中的大纲内容:', selectedChapterOutline);
                            
                          // 将大纲概述内容追加到当前内容中
                          const newContent = content + '\n\n' + selectedChapterOutline;
                          console.log('更新后的内容:', newContent);
                          
                          // 更新内容状态
                          setContent(newContent);
                          
                          // 增加editorKey以强制重新渲染编辑器
                          setEditorKey(prev => prev + 1);
                        }}
                      >
                        插入大纲内容
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => {
                          console.log('清除内容按钮被点击');
                          console.log('清除前的内容:', content);
                          
                          // 清空内容
                          setContent('');
                          
                          // 增加editorKey以强制重新渲染编辑器
                          setEditorKey(prev => prev + 1);
                        }}
                      >
                        清除内容
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* 版本历史区域 */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-medium">版本历史</h4>
                    <Space>
                      <Button 
                        size="small" 
                        type="primary"
                        onClick={() => saveCurrentContentAsVersion()}
                      >
                        保存版本
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => setIsVersionHistoryVisible(true)}
                      >
                        查看历史
                      </Button>
                    </Space>
                  </div>
                  
                  {chapterVersions.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <div>最新版本: {new Date(chapterVersions[0].createdAt).toLocaleString()}</div>
                      <div>共 {chapterVersions.length} 个版本</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded border flex-1 flex items-center justify-center">
                <p className="text-gray-500">请选择一个章节以查看大纲概述</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center border-l bg-gray-50 w-8">
            <Button 
              onClick={toggleOutlineSummary}
              type="text"
              icon={<CaretRightOutlined rotate={180} />}
            />
          </div>
        )}
        
        {/* 版本历史模态框 */}
        <Modal
          title="章节版本历史"
          open={isVersionHistoryVisible}
          onCancel={() => setIsVersionHistoryVisible(false)}
          footer={null}
          width="60%"
          className="version-history-modal"
        >
          <div className="version-history-content">
            {loadingVersions ? (
              <div className="text-center py-4">加载中...</div>
            ) : chapterVersions.length > 0 ? (
              <List
                dataSource={chapterVersions}
                renderItem={(version) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => restoreToVersion(version)}
                      >
                        恢复此版本
                      </Button>,
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => deleteVersion(version)}
                      >
                        删除
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={version.versionName || `版本 ${new Date(version.createdAt).toLocaleString()}`}
                      description={
                        <div>
                          <div>创建时间: {new Date(version.createdAt).toLocaleString()}</div>
                          <div>字数: {version.wordCount.toLocaleString()}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>暂无版本历史</p>
                <p className="text-sm mt-2">点击"保存版本"按钮创建第一个版本</p>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Space>
                <Button 
                  type="primary"
                  onClick={() => saveCurrentContentAsVersion()}
                >
                  保存当前内容为新版本
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedChapterId) {
                      loadChapterVersions(selectedChapterId);
                    }
                  }}
                >
                  刷新
                </Button>
              </Space>
            </div>
          </div>
        </Modal>

      </div>
      
      {/* 底部状态栏 */}
      <div className="p-2 border-t text-sm text-gray-500 flex justify-between flex-none">
        <div className="flex items-center gap-4">
          <span>字符: {textStats.characters.toLocaleString()}</span>
          <span>单词: {textStats.words.toLocaleString()}</span>
          <span>段落: {textStats.paragraphs.toLocaleString()}</span>
          <span>行数: {textStats.lines.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-4">
          {isAutoSaveEnabled && (
            <span className="text-green-600 flex items-center gap-1">
              <ClockCircleOutlined />
              自动保存已开启 (5分钟)
            </span>
          )}
          <span className="flex items-center gap-1">
            <AimOutlined />
            目标: 
            <InputNumber 
              value={writingGoal}
              onChange={(value) => {
                if (value) {
                  setWritingGoal(value);
                  // 保存到小说数据中
                  if (novelId) {
                    updateNovel(novelId, { targetWordCount: value });
                  }
                }
              }}
              size="small"
              min={1}
              max={10000000}
              style={{ width: 80, marginLeft: 4 }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
            />
          </span>
        </div>
      </div>
      
      {/* 预览模态框 */}
      <Modal
        title="小说预览"
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        footer={null}
        width="80%"
        className="preview-modal"
      >
        <div className="preview-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div 
            dangerouslySetInnerHTML={{ __html: content }} 
            style={{ 
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              lineHeight: '1.6',
              padding: '20px'
            }}
          />
        </div>
      </Modal>
      
      {/* 统计信息模态框 */}
      <Modal
        title="写作统计"
        open={isStatsVisible}
        onCancel={() => setIsStatsVisible(false)}
        footer={null}
        width="60%"
        className="stats-modal"
      >
        <div className="stats-content">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="字符数" value={textStats.characters.toLocaleString()} prefix={<FileTextOutlined />} />
            </Col>
            <Col span={8}>
              <Statistic title="单词数" value={textStats.words.toLocaleString()} prefix={<FileTextOutlined />} />
            </Col>
            <Col span={8}>
              <Statistic title="段落数" value={textStats.paragraphs.toLocaleString()} prefix={<FileTextOutlined />} />
            </Col>
          </Row>
          
          <Divider />
          
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="无空格字符" value={textStats.charactersNoSpaces.toLocaleString()} />
            </Col>
            <Col span={8}>
              <Statistic title="行数" value={textStats.lines.toLocaleString()} prefix={<FileTextOutlined />} />
            </Col>
            <Col span={8}>
              <Statistic 
                title="平均段落长度" 
                value={textStats.paragraphs ? Math.round(textStats.words / textStats.paragraphs) : 0} 
                suffix="词" 
              />
            </Col>
          </Row>
          
          <Divider />
          
          <div className="mt-4">
            <h3>写作进度</h3>
            <div className="mt-2">
              <Progress 
                percent={calculateProgress()} 
                status={calculateProgress() >= 100 ? "success" : "normal"}
              />
              <div className="flex justify-between text-sm mt-1">
                <span>已完成: {wordCount.toLocaleString()} 字</span>
                <span>目标: {writingGoal.toLocaleString()} 字</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h3>写作建议</h3>
            <ul className="mt-2">
              {textStats.words < 1000 && (
                <li>• 您的文本还比较短，继续写作以丰富内容</li>
              )}
              {textStats.paragraphs > 0 && textStats.words / textStats.paragraphs < 50 && (
                <li>• 您的段落较短，可以考虑扩展段落内容</li>
              )}
              {textStats.paragraphs > 0 && textStats.words / textStats.paragraphs > 200 && (
                <li>• 您的段落较长，可以考虑适当分段以提高可读性</li>
              )}
            </ul>
          </div>
        </div>
      </Modal>
      
      {/* 拼写检查模态框 */}
      <Modal
        title="拼写检查结果"
        open={isSpellCheckVisible}
        onCancel={() => setIsSpellCheckVisible(false)}
        footer={null}
        width="60%"
        className="spell-check-modal"
      >
        <div className="spell-check-content">
          {spellingCheckResults.length > 0 ? (
            <List
              dataSource={spellingCheckResults}
              renderItem={(error) => (
                <List.Item
                  actions={[
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: error.suggestions?.map((suggestion: string, index: number) => ({
                          key: index,
                          label: suggestion,
                          onClick: () => handleCorrectSpelling(error.word, suggestion)
                        })) || []
                      }}
                    >
                      <Button type="primary" size="small">
                        修正为
                      </Button>
                    </Dropdown>,
                    <Button 
                      size="small"
                      onClick={() => {
                        setSpellingCheckResults(spellingCheckResults.filter(err => err.word !== error.word));
                      }}
                    >
                      忽略
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={`拼写错误: ${error.word}`}
                    description={
                      <div>
                        <div>建议修正:</div>
                        <Space>
                          {error.suggestions?.map((suggestion: string, index: number) => (
                            <Button 
                              key={index}
                              size="small"
                              type="link"
                              onClick={() => handleCorrectSpelling(error.word, suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
              <p>恭喜！未发现拼写错误</p>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Space>
              <Button 
                onClick={() => setIsSpellCheckVisible(false)}
              >
                关闭
              </Button>
              <Button 
                type="primary"
                onClick={handleSpellCheck}
              >
                重新检查
              </Button>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManuscriptEditor;