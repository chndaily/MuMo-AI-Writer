import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { 
  Layout, 
  message, 
  Button, 
  Card, 
  Space, 
  Typography, 
  Select, 
  Input, 
  Divider, 
  List, 
  Avatar,
  Drawer,
  Tabs,
  Alert,
  Tag,
  Slider,
  Radio,
  Modal,
  Spin,
  Progress
} from 'antd';
import { 
  SaveOutlined, 
  UndoOutlined, 
  RedoOutlined, 
  EyeOutlined, 
  EditOutlined,
  BranchesOutlined,
  BulbOutlined,
  FileTextOutlined,
  CompassOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  SoundOutlined,
  CloseOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ClearOutlined,
  UserOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import useStyles from './useStyles';
import { useNovelStore } from '../../stores/novelStore';
import { useLLMConfigStore } from '@/stores/llmConfigStore';
import { useAIServiceStore } from '@/stores/aiServiceStore';
import { defaultModelService } from '@/services/defaultModelService';
import { useModelSelection } from '@/hooks/useModelSelection';
import { useLLM } from '@/hooks/useLLM';
import { useMembership } from '@/hooks/useMembership';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCreationCenterStore } from '@/stores/creationCenterStore';
import { AIGenerationType } from '@/types/ai-generation';
import { Novel } from '#/novel';
import { enhanceTypeSpecificGuidance } from '@/utils/worldElementUtils';
import { contentSyncService } from '@/services/contentSyncService';

import { eventBus } from '@/utils/eventBus';
import { hybridStorageService } from '@/services/hybridStorageService';
import { usePromptLibraryStore } from '@/stores/promptLibraryStore';
import { 
  OUTLINE_GENERATION_PROMPT,
  PLOT_GENERATION_PROMPT,
  CHARACTER_GENERATION_PROMPT,
  LOCATION_GENERATION_PROMPT,
  CULTURE_GENERATION_PROMPT,
  TECHNOLOGY_GENERATION_PROMPT,
  MAGIC_GENERATION_PROMPT,
  HISTORY_GENERATION_PROMPT,
  OPTIMIZE_GENERATION_PROMPT,
  CONTENT_GENERATION_PROMPT
} from '@/constants/aiPrompts';
import BookSelector, { BookSelectorRef } from '@/components/novel/BookSelector';
import SyncPanel from '@/components/novel/SyncPanel';
import { extractFullPromptLibraryContext } from '@/utils/aiKnowledgeBaseUtils';
import { searchKnowledgeBase } from '@/utils/aiKnowledgeBaseUtils';
import aiUsageHistoryService from '@/services/aiUsageHistoryService'
import { databaseManager } from '@/services/index';

// 修改为使用优化的数据同步服务
import { optimizedDataSyncService } from '@/services/optimizedDataSyncService';

const { Content, Sider } = Layout
const { TextArea } = Input
const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TabPane } = Tabs

interface StoryNode {
  id: string
  title: string
  content: string
  type: 'chapter' | 'scene' | 'event'
  timestamp: string
  characters: string[]
  locations: string[]
  emotions: string[]
  connections: string[]
}

interface Character {
  id: string
  name: string
  avatar: string
  personality: string
  relationships: Record<string, string>
  voice: string
  color: string
}

interface AIGeneration {
  mode: 'free' | 'style' | 'fill'
  temperature: number
  style: string
  context: string
}

const AINovelWorkspace: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentNovel, updateNovelContent } = useNovelStore()
  const { selectedNovel, setSelectedNovel } = useCreationCenterStore()
  const { 
    configs, 
    defaultConfig, 
    defaultConfigId, 
    generateTextStream,
    loading,
    streaming: llmStreaming,
    error: llmError,
    response: llmResponse,
    clearError: clearLLMError,
    clearResponse: clearLLMResponse,
    stopStream
  } = useLLM()
  
  // 获取提示词库集合
  const { collections } = usePromptLibraryStore()

  // 会员权限控制
  const { checkAIGenerationPermission, useAI, membershipInfo } = useMembership()
  const { availableModels, loading: loadingModels, fetchAvailableModels } = useModelSelection()
  
  // 当会员等级变化时重新获取模型
  useEffect(() => {
    fetchAvailableModels()
  }, [fetchAvailableModels, membershipInfo.level])
  
  const [content, setContent] = useState(currentNovel?.content || '')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  const [aiMode, setAiMode] = useState<AIGeneration['mode']>('free')
  const [temperature, setTemperature] = useState(0.7)
  const [writingStyle, setWritingStyle] = useState('default')
  const [isImmersiveMode, setIsImmersiveMode] = useState(false)
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null)
  const [showStoryMap, setShowStoryMap] = useState(false)
  const [showInspirationPanel, setShowInspirationPanel] = useState(false)
  const [parallelVersions, setParallelVersions] = useState<string[]>([])
  const [versionHistory, setVersionHistory] = useState<string[]>([])
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedConfigId, setSelectedConfigId] = useState<string | undefined>(undefined)
  const [workspaceMode, setWorkspaceMode] = useState<'writing' | 'outline' | 'worldsetting'>('writing')
  // 添加一个状态来跟踪已处理的响应
  const [processedResponse, setProcessedResponse] = useState<string | null>(null)
  
  // 添加一个新的状态来存储解析后的内容和摘要
  const [parsedContent, setParsedContent] = useState<{ content: string; summary: string } | null>(null);
  
  // 新增状态
  const [generationType, setGenerationType] = useState<AIGenerationType>('content') // 默认为内容生成
  const [targetNovel, setTargetNovel] = useState<Novel | null>(selectedNovel)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null) // 添加章节选择状态
  const [chapters, setChapters] = useState<any[]>([]) // 章节列表状态
  const [loadingChapters, setLoadingChapters] = useState(false) // 章节加载状态

  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const aiButtonRef = useRef<HTMLDivElement>(null)
  const bookSelectorRef = useRef<BookSelectorRef>(null)

  const { styles } = useStyles()

  // 处理从其他页面传递的参数
  useEffect(() => {
    const state = location.state as any
    if (state) {
      if (state.mode) {
        setWorkspaceMode(state.mode)
      }
      if (state.prompt) {
        setCustomPrompt(state.prompt)
        // 自动执行生成
        setTimeout(() => {
          handleAIGenerate(state.prompt)
        }, 1000)
      }
      
      // 处理从其他页面传递的小说ID
      if (state.novelId) {
        // 延迟执行以确保组件已完全加载
        setTimeout(async () => {
          try {
            // 获取小说信息
            const novel = await databaseManager.novels.getNovel(state.novelId);
            if (novel) {
              setTargetNovel(novel);
              // 加载章节列表
              await loadChapters(state.novelId);
              // 如果有章节ID，设置选中章节
              if (state.chapterId) {
                setSelectedChapterId(state.chapterId);
              }
            }
          } catch (error) {
            console.error('获取小说信息失败:', error);
          }
        }, 500);
      }
    }
  }, [location.state])

  // 监听大纲更新事件，当大纲内容变化时重新加载章节列表
  useEffect(() => {
    const handleOutlineUpdate = () => {
      if (targetNovel?.id) {
        loadChapters(targetNovel.id);
      }
    };
    
    // 监听大纲更新事件
    window.addEventListener('outline-updated', handleOutlineUpdate);
    
    return () => {
      window.removeEventListener('outline-updated', handleOutlineUpdate);
    };
  }, [targetNovel?.id]);

  // 初始化选择默认配置
  useEffect(() => {
    // 优先使用useModelSelection hook中的模型列表
    if (availableModels.length > 0 && !selectedConfigId) {
      // 优先使用默认模型（管理员配置的统一默认模型）
      const defaultModel = availableModels.find(model => model.isDefault);
      if (defaultModel) {
        setSelectedConfigId(defaultModel.id);
      } else {
        // 如果没有默认模型，使用第一个可用模型
        setSelectedConfigId(availableModels[0].id);
      }
    } else if (configs.length > 0 && !selectedConfigId) {
      // 回退到useLLM hook中的配置
      setSelectedConfigId(defaultConfigId || configs[0].id);
    }
  }, [configs, selectedConfigId, defaultConfigId, availableModels]);

  // 监听流式状态变化，同步本地状态
  useEffect(() => {
    setIsAIGenerating(llmStreaming)
    // 当流式生成结束时，确保状态正确重置
    if (!llmStreaming && isAIGenerating) {
      setIsAIGenerating(false)
    }
  }, [llmStreaming, isAIGenerating])

  // 监听LLM响应变化，自动生成完成后插入到画布
  useEffect(() => {
    // 检查是否应该处理这个响应（响应不为空且未被处理过）
    if (!llmStreaming && llmResponse && llmResponse.trim() !== '' && llmResponse !== processedResponse) {
      // 更新已处理的响应状态
      setProcessedResponse(llmResponse);
      
      // 解析内容和摘要
      const summarySeparator = '#SUMMARY#';
      if (llmResponse.includes(summarySeparator)) {
        const parts = llmResponse.split(summarySeparator);
        if (parts.length === 2) {
          const content = parts[0].trim();
          const summary = parts[1].trim();
          
          // 更新解析后的内容
          setParsedContent({ content, summary });
          
          // 将内容添加到画布中
          setContent(prevContent => {
            const separator = prevContent.endsWith('\n') ? '\n' : '\n\n'
            return prevContent + separator + content
          });
          
          message.success('内容和摘要已解析并插入到创意画布中');
        } else {
          // 如果格式不正确，按原来的方式处理
          setContent(prevContent => {
            const separator = prevContent.endsWith('\n') ? '\n' : '\n\n'
            return prevContent + separator + llmResponse
          });
          message.success('内容已插入到创意画布中');
        }
      } else {
        // 如果没有摘要分隔符，按原来的方式处理
        setContent(prevContent => {
          const separator = prevContent.endsWith('\n') ? '\n' : '\n\n'
          return prevContent + separator + llmResponse
        });
        message.success('内容已插入到创意画布中');
      }
      
      // 插入后立即清空响应，防止重复插入
      clearLLMResponse()
    }
  }, [llmResponse, llmStreaming, processedResponse, clearLLMResponse])

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 停止所有正在进行的流式生成
      stopStream()
    }
  }, [stopStream])

  // 处理小说选择
  const handleBookSelect = async (novelId: string, novel: Novel) => {
    console.log('选择小说:', novel);
    setTargetNovel(novel);
    // 当选择小说时，加载对应的章节列表
    if (novelId) {
      await loadChapters(novelId);
    } else {
      setChapters([]);
    }
  };

  // 处理同步完成
  const handleSyncComplete = (result: any) => {
    if (result.success) {
      message.success('内容已同步到创作中心')
      // 可以跳转到对应的创作中心页面
      // navigate('/novels', { state: { activeSection: getTargetSection() } })
    }
  }

  // 处理同步点击
  const handleSyncClick = (optionKey: string) => {
    if (!targetNovel || !content) {
      message.warning('请先选择目标小说并生成内容')
      return
    }
    
    // 直接执行同步
    performSync(optionKey)
  }

  // 执行同步
  const performSync = async (optionKey: string) => {
    if (!targetNovel || !content) return
    
    try {
      // 使用优化的数据同步服务替换旧的同步服务
      // 根据generationType执行相应的同步操作
      let result;
      switch (generationType) {
        case 'content':
        case 'optimize':
        case 'plot':
          // 对于内容相关操作，使用内容同步服务
          if (selectedChapterId) {
            result = await contentSyncService.syncToChapter(content, targetNovel.id, selectedChapterId);
          } else {
            message.warning('请选择目标章节');
            return;
          }
          break;
        default:
          // 对于世界观设定相关操作，使用优化的数据同步服务进行全量同步
          result = await optimizedDataSyncService.syncAllData();
      }
      
      if (result.success) {
        message.success(result.message);
        // 添加延迟确保数据写入完成
        await new Promise(resolve => setTimeout(resolve, 500));
        // 触发同步完成事件，通知相关组件更新数据
        eventBus.emit('worldSettingSyncComplete', { novelId: targetNovel.id, type: generationType });
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('同步失败:', error);
      message.error('同步失败，请重试');
    }
  }

  // 根据生成类型获取目标模块
  const getTargetSection = () => {
    switch (generationType) {
      case 'outline':
      case 'plot':
        return 'outline'
      case 'character':
        return 'characters'
      case 'location':
      case 'culture':
      case 'technology':
      case 'magic':
      case 'history':
        return 'worldsetting'
      default:
        return 'books'
    }
  }
  
  // 加载章节列表
  const loadChapters = async (novelId: string) => {
    if (!novelId) return;
    
    setLoadingChapters(true);
    try {
      console.log('加载章节列表，小说ID:', novelId);
      // 获取大纲数据
      const outlines = await hybridStorageService.getOutlines(novelId);
      console.log('获取到的大纲数据:', outlines);
      
      // 筛选出章节类型的数据
      const chapterOutlines = outlines.filter(outline => outline.type === 'chapter');
      console.log('章节类型的大纲数据:', chapterOutlines);
      
      // 按照顺序排序
      const sortedChapters = chapterOutlines.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log('排序后的章节列表:', sortedChapters);
      setChapters(sortedChapters);
    } catch (error) {
      console.error('加载章节列表失败:', error);
      message.error('加载章节列表失败: ' + (error instanceof Error ? error.message : '未知错误'));
      setChapters([]);
    } finally {
      setLoadingChapters(false);
    }
  };

  // 生成系统提示词
  const getSystemPromptByType = (type: AIGenerationType): string => {
    switch (type) {
      case 'outline':
        return OUTLINE_GENERATION_PROMPT;
      case 'plot':
        return PLOT_GENERATION_PROMPT;
      case 'character':
        return CHARACTER_GENERATION_PROMPT;
      case 'location':
        return LOCATION_GENERATION_PROMPT;
      case 'culture':
        return CULTURE_GENERATION_PROMPT;
      case 'technology':
        return TECHNOLOGY_GENERATION_PROMPT;
      case 'magic':
        return MAGIC_GENERATION_PROMPT;
      case 'history':
        return HISTORY_GENERATION_PROMPT;
      case 'optimize':
        return OPTIMIZE_GENERATION_PROMPT;
      case 'content':
        return CONTENT_GENERATION_PROMPT;
      default:
        return '你是一位专业的小说创作助手，具备全面的文学创作能力。请根据用户的具体需求，结合小说的类型、背景和已有内容，创作符合要求的高质量小说内容。注意保持风格一致性，确保情节连贯性，并充分体现作品的独特性和创新性。';
    }
  }

  // AI生成处理 - 增强上下文信息整合
  const handleAIGenerate = async (prompt: string, systemPrompt?: string) => {
    if (!prompt.trim()) {
      message.warning('请输入生成提示词')
      return
    }

    // 检查AI使用权限
    const permission = checkAIGenerationPermission();
    if (!permission.allowed) {
      message.warning(permission.reason || '您已达到今日AI生成次数限制');
      return;
    }

    // 尝试使用AI生成次数
    const useResult = useAI();
    if (!useResult.success) {
      message.warning(useResult.reason || '无法使用AI生成功能');
      return;
    }

    // 记录AI使用历史
    try {
      // 获取当前选中的配置信息
      const currentConfig = configs.find(config => config.id === selectedConfigId);
      const modelName = currentConfig?.model || 'unknown';
      const providerName = currentConfig?.provider || 'unknown';
      
      // 记录AI使用历史
      await aiUsageHistoryService.recordAIUsage(
        getGenerationTypeName(generationType), // 使用类型
        `${providerName}/${modelName}`,       // AI模型（包含提供者信息）
        1,                                    // 使用次数
        targetNovel?.id,                      // 关联的小说ID
        `生成类型: ${generationType}, 提示词长度: ${prompt.length}` // 描述
      );
    } catch (error) {
      console.error('记录AI使用历史失败:', error);
    }

    console.log('handleAIGenerate: selectedConfigId=', selectedConfigId)
    if (!selectedConfigId) {
      // 如果没有选择配置，尝试使用默认配置
      if (defaultConfigId) {
        setSelectedConfigId(defaultConfigId);
      } else if (configs.length > 0) {
        // 如果没有默认配置，使用第一个可用配置
        setSelectedConfigId(configs[0].id);
      } else {
        message.warning('请先选择AI模型配置')
        return
      }
    }

    // 对于特定类型的生成，需要选择目标小说
    if (['outline', 'plot', 'character', 'location', 'culture', 'technology', 'magic', 'history'].includes(generationType) && !targetNovel) {
      message.warning('请先选择目标小说')
      return
    }

    // 对于内容生成、内容优化和情节发展，需要选择目标章节
    if (['content', 'optimize', 'plot'].includes(generationType) && !selectedChapterId) {
      message.warning('请先选择目标章节')
      return
    }

    setIsAIGenerating(true)
    // 清除上次的响应，确保不会重复插入旧内容
    clearLLMResponse()
    clearLLMError()
    // 重置已处理的响应状态
    setProcessedResponse(null)

    try {
      // 重新获取最新的collections数据
      const { collections } = usePromptLibraryStore.getState();
      console.log('Current collections count:', collections.length);

      const typeSystemPrompt = systemPrompt || getSystemPromptByType(generationType)
      
      // 构建更丰富的上下文信息
      let contextInfo = ''
      
      // 小说基本信息
      if (targetNovel) {
        contextInfo += `【目标小说信息】\n`
        contextInfo += `标题：《${targetNovel.title}》\n`
        contextInfo += `类型：${targetNovel.genre}\n`
        contextInfo += `描述：${targetNovel.description || '无'}\n`
        contextInfo += `当前字数：${targetNovel.wordCount?.toLocaleString() || 0}字\n`
        contextInfo += `目标字数：${targetNovel.targetWordCount?.toLocaleString() || '未设定'}字\n`
        contextInfo += `状态：${targetNovel.status || '创作中'}\n\n`
      }
      
      // 当前内容上下文
      if (content) {
        const contentLength = content.length
        const wordCount = content.split(/\s+/).length
        const paragraphCount = content.split('\n\n').length
        
        contextInfo += `【当前内容上下文】\n`
        contextInfo += `内容长度：${contentLength}字符（约${wordCount}词，${paragraphCount}段落）\n`
        
        // 对于内容创作、内容优化和情节发展，使用大纲中的摘要作为上下文
        if (['content', 'optimize', 'plot'].includes(generationType) && targetNovel && selectedChapterId) {
          try {
            // 获取当前章节的摘要
            const allChapters = await hybridStorageService.getOutlines(targetNovel.id);
            const currentChapter = allChapters.find(chapter => chapter.id === selectedChapterId);
            
            if (currentChapter && currentChapter.summary) {
              contextInfo += `当前章节摘要：\n${currentChapter.summary}\n\n`
            } else {
              // 如果没有摘要，使用原有的截取方式
              if (contentLength > 500) {
                const lastContent = content.slice(-500)
                contextInfo += `最近内容：\n${lastContent}\n\n`
              } else if (contentLength > 0) {
                contextInfo += `完整内容：\n${content}\n\n`
              }
            }
          } catch (error) {
            console.error('获取当前章节摘要失败:', error);
            // 出错时回退到原有的截取方式
            if (contentLength > 500) {
              const lastContent = content.slice(-500)
              contextInfo += `最近内容：\n${lastContent}\n\n`
            } else if (contentLength > 0) {
              contextInfo += `完整内容：\n${content}\n\n`
            }
          }
        } else {
          // 对于其他生成类型，使用原有的截取方式
          if (contentLength > 500) {
            const lastContent = content.slice(-500)
            contextInfo += `最近内容：\n${lastContent}\n\n`
          } else if (contentLength > 0) {
            contextInfo += `完整内容：\n${content}\n\n`
          }
        }
      }
      
      // 对于内容生成、内容优化和情节发展，添加之前章节的摘要作为上下文
      if (['content', 'optimize', 'plot'].includes(generationType) && targetNovel && selectedChapterId) {
        try {
          // 获取所有章节
          const allChapters = await hybridStorageService.getOutlines(targetNovel.id);
          
          // 找到当前选中的章节
          const currentChapter = allChapters.find(chapter => chapter.id === selectedChapterId);
          
          if (currentChapter) {
            // 获取之前章节的内容（按order排序）
            const previousChapters = allChapters
              .filter(chapter => chapter.type === 'chapter' && chapter.order < (currentChapter.order || 0))
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            
            // 如果有之前的章节，将它们的摘要添加到上下文信息中
            if (previousChapters.length > 0) {
              contextInfo += `【之前章节摘要】\n`
              contextInfo += `以下是之前章节的内容摘要，用于保持文章的连续性：\n\n`
              
              // 添加每个之前章节的摘要
              previousChapters.forEach((chapter, index) => {
                // 使用大纲中存储的摘要，如果没有则使用章节标题
                const chapterSummary = chapter.summary || `${chapter.title}（无摘要）`;
                
                contextInfo += `--- 第${index + 1}章：${chapter.title} ---\n`
                contextInfo += `${chapterSummary}\n\n`
              });
            }
          }
        } catch (error) {
          console.error('获取之前章节内容失败:', error);
          // 不中断生成过程，只是记录错误
        }
      }
      
      // 检查用户输入中是否包含知识库搜索指令
      const searchMatch = prompt.match(/@search\(([^)]+)\)/);
      if (searchMatch) {
        const keyword = searchMatch[1];
        try {
          console.log('Searching knowledge base for keyword:', keyword);
          console.log('Collections available for search:', collections.length);
          // 添加调试信息，检查collections的内容
          collections.forEach((collection, index) => {
            console.log(`Collection ${index}:`, collection.attributes.name, collection.type);
          });
          const searchResults = await searchKnowledgeBase(collections, keyword, 2000);
          contextInfo += `【知识库搜索结果】\n${searchResults}\n\n`;
        } catch (error) {
          console.error('知识库搜索失败:', error);
          contextInfo += `【知识库搜索结果】\n搜索失败，请稍后重试。\n\n`;
        }
      }
      
      // 使用增强的特定指导功能
      let typeSpecificGuidance = ''
      if (targetNovel) {
        typeSpecificGuidance = await enhanceTypeSpecificGuidance(generationType, targetNovel.id)
      } else {
        // 如果没有目标小说，使用原有的特定指导逻辑
        switch (generationType) {
          case 'plot':
            typeSpecificGuidance = '\n【生成要求】\n' +
                                  '- 基于提供的上下文继续创作情节，保持故事连贯性\n' +
                                  '- 深化人物性格展现，推动角色成长弧线\n' +
                                  '- 增加戏剧冲突和悬念，提升故事张力\n' +
                                  '- 注重细节描写和情感渲染，增强读者代入感\n' +
                                  '- 确保情节发展符合逻辑，避免突兀转折\n' +
                                  '- 为后续发展预留合理空间和可能性'
            break
          case 'character':
            typeSpecificGuidance = '\n【生成要求】\n' +
                                  '- 结合小说的世界观和背景创建角色\n' +
                                  '- 确保角色设定与故事风格相符\n' +
                                  '- 提供详细的外貌、性格、背景描述\n' +
                                  '- 包含角色类型分类：主角、反派、配角等\n' +
                                  '- 描述角色在故事中的作用和影响\n' +
                                  '- 设定角色的成长弧线和潜在变化\n\n' +
                                  '请按照以下结构生成角色信息：\n' +
                                  '【角色设定1：名称】\n' +
                                  '【基本信息】\n' +
                                  '【名称】：\n' +
                                  '【角色类型】：\n' +
                                  '【标签】：\n' +
                                  '【描述】：\n' +
                                  '【外貌特征】\n' +
                                  '【性格特质】\n' +
                                  '【背景故事】\n' +
                                  '【能力设定】\n' +
                                  '【人际关系】\n' +
                                  '【角色发展弧光】\n' +
                                  '【细节补充】\n' +
                                  '【角色设定2：名称】\n' +
                                  '【基本信息】\n' +
                                  '【名称】：\n' +
                                  '【角色类型】：\n' +
                                  '【标签】：\n' +
                                  '【描述】：\n' +
                                  '【外貌特征】\n' +
                                  '【性格特质】\n' +
                                  '【背景故事】\n' +
                                  '【能力设定】\n' +
                                  '【人际关系】\n' +
                                  '【角色发展弧光】\n' +
                                  '【细节补充】'
            break
          case 'location':
            typeSpecificGuidance = '\n【生成要求】\n' +
                                  '- 结合小说的世界观创建地点设定\n' +
                                  '- 描述地理位置、环境特征、气候条件\n' +
                                  '- 包括建筑风格、文化背景、历史意义\n' +
                                  '- 考虑与其他地点的关系和连接\n' +
                                  '- 使用丰富的感官细节增强真实感\n' +
                                  '- 突出地点在故事中的独特作用\n\n' +
                                  '请按照以下结构生成地点信息：\n' +
                                  '---\n' +
                                  '【地点设定1：名称】\n' +
                                  '---\n' +
                                  '【名称】：\n' +
                                  '【标签】：使用中文顿号"、"分隔，如：城市、繁华、港口\n' +
                                  '【描述】：\n' +
                                  '【类型】：由AI生成具体的类型描述，而非从预设选项中选择\n' +
                                  '【重要性】：由AI生成具体的重要性描述，而非从预设选项中选择\n' +
                                  '【地理环境】\n' +
                                  '地理位置：\n' +
                                  '气候特征：\n' +
                                  '地形特征：\n' +
                                  '自然资源：\n' +
                                  '生态环境：\n' +
                                  '【文化背景】\n' +
                                  '历史背景：\n' +
                                  '文化特色：\n' +
                                  '建筑风格：\n' +
                                  '社会结构：\n' +
                                  '【政治环境】\n' +
                                  '统治体系：\n' +
                                  '法律法规：\n' +
                                  '【经济状况】\n' +
                                  '主要产业：\n' +
                                  '贸易情况：\n' +
                                  '财富水平：\n' +
                                  '【细节补充】\n' +
                                  '---\n' +
                                  '【地点设定2：名称】\n' +
                                  '---\n' +
                                  '【名称】：\n' +
                                  '【标签】：使用中文顿号"、"分隔，如：城市、繁华、港口\n' +
                                  '【描述】：\n' +
                                  '【类型】：由AI生成具体的类型描述，而非从预设选项中选择\n' +
                                  '【重要性】：由AI生成具体的重要性描述，而非从预设选项中选择\n' +
                                  '【地理环境】\n' +
                                  '地理位置：\n' +
                                  '气候特征：\n' +
                                  '地形特征：\n' +
                                  '自然资源：\n' +
                                  '生态环境：\n' +
                                  '【文化背景】\n' +
                                  '历史背景：\n' +
                                  '文化特色：\n' +
                                  '建筑风格：\n' +
                                  '社会结构：\n' +
                                  '【政治环境】\n' +
                                  '统治体系：\n' +
                                  '法律法规：\n' +
                                  '【经济状况】\n' +
                                  '主要产业：\n' +
                                  '贸易情况：\n' +
                                  '财富水平：\n' +
                                  '【细节补充】\n' +
                                  '---\n' +
                                  '生成的地点设定数量应根据用户的具体需求和上下文来确定，可以是一个或多个，每个设定项之间使用三个短横线"---"分隔'
            break
          case 'culture':
            typeSpecificGuidance = '\n【生成要求】\n' +
                                  '- 结合小说的世界观创建文化设定\n' +
                                  '- 描述传统习俗、价值观念、艺术表现\n' +
                                  '- 包括宗教信仰、语言文字\n' +
                                  '- 考虑不同文化间的交流和冲突\n' +
                                  '- 体现文化的独特性和深度\n' +
                                  '- 与故事发展和人物塑造相关联\n\n' +
                                  '请按照以下结构生成文化设定：\n' +
                                  '【文化设定1：名称】\n' +
                                  '---\n' +
                                  '【基本信息】\n' +
                                  '【名称】：\n' +
                                  '【标签】：使用中文顿号"、"分隔，如：东方、西方、古代、现代等\n' +
                                  '【描述】：\n' +
                                  '【传统习俗】\n' +
                                  '主要节日：\n' +
                                  '礼仪规范：\n' +
                                  '【价值观念】\n' +
                                  '核心价值：\n' +
                                  '道德标准：\n' +
                                  '【艺术表现】\n' +
                                  '文学形式：\n' +
                                  '音乐舞蹈：\n' +
                                  '视觉艺术：\n' +
                                  '【宗教信仰】\n' +
                                  '主要信仰：\n' +
                                  '宗教仪式：\n' +
                                  '【语言文字】\n' +
                                  '语言特点：\n' +
                                  '文字系统：\n' +
                                  '【文化互动】\n' +
                                  '文化冲突：\n' +
                                  '文化融合：\n' +
                                  '【细节补充】\n' +
                                  '---\n' +
                                  '【文化设定2：名称】\n' +
                                  '---\n' +
                                  '【基本信息】\n' +
                                  '【名称】：\n' +
                                  '【标签】：使用中文顿号"、"分隔，如：东方、西方、古代、现代等\n' +
                                  '【描述】：\n' +
                                  '【传统习俗】\n' +
                                  '主要节日：\n' +
                                  '礼仪规范：\n' +
                                  '【价值观念】\n' +
                                  '核心价值：\n' +
                                  '道德标准：\n' +
                                  '【艺术表现】\n' +
                                  '文学形式：\n' +
                                  '音乐舞蹈：\n' +
                                  '视觉艺术：\n' +
                                  '【宗教信仰】\n' +
                                  '主要信仰：\n' +
                                  '宗教仪式：\n' +
                                  '【语言文字】\n' +
                                  '语言特点：\n' +
                                  '文字系统：\n' +
                                  '【文化互动】\n' +
                                  '文化冲突：\n' +
                                  '文化融合：\n' +
                                  '【细节补充】\n' +
                                  '---\n' +
                                  '生成的文化设定数量应根据用户的具体需求和上下文来确定，可以是一个或多个，每个设定项之间使用三个短横线"---"分隔'
            break
          case 'technology':
            typeSpecificGuidance = '\n【生成要求】\n' +
                                  '- 结合小说的世界观创建科技设定\n' +
                                  '- 描述科技水平、应用场景、使用限制\n' +
                                  '- 包括社会影响\n' +
                                  '- 考虑科技与魔法、文化的相互作用\n' +
                                  '- 体现技术的独特性和创新性\n' +
                                  '- 与故事情节发展相关联\n\n' +
                                  '请按照以下结构生成科技设定：\n' +
                                  '【科技设定1：名称】\n' +
                                  '---\n' +
                                  '【基本信息】\n' +
                                  '【名称】：\n' +
                                  '【标签】：使用中文顿号"、"分隔，如：能源、交通、医疗、通讯等\n' +
                                  '【描述】：\n' +
                                  '【科技水平】\n' +
                                  '发展阶段：\n' +
                                  '核心技术：\n' +
                                  '发展时间线：\n' +
                                  '【应用场景】\n' +
                                  '主要用途：\n' +
                                  '应用领域：\n' +
                                  '【使用限制】\n' +
                                  '能源需求：\n' +
                                  '副作用：\n' +
                                  '伦理考量：\n' +
                                  '【社会影响】\n' +
                                  '对社会的影响：\n' +
                                  '原创性考量：\n' +
                                  '【细节补充】\n' +
                                  '---\n' +
                                  '【科技设定2：名称】\n' +
                                  '---\n' +
                                  '【基本信息】\n' +
                                  '【名称】：\n' +
                                  '【标签】：使用中文顿号"、"分隔，如：能源、交通、医疗、通讯等\n' +
                                  '【描述】：\n' +
                                  '【科技水平】\n' +
                                  '发展阶段：\n' +
                                  '核心技术：\n' +
                                  '发展时间线：\n' +
                                  '【应用场景】\n' +
                                  '主要用途：\n' +
                                  '应用领域：\n' +
                                  '【使用限制】\n' +
                                  '能源需求：\n' +
                                  '副作用：\n' +
                                  '伦理考量：\n' +
                                  '【社会影响】\n' +
                                  '对社会的影响：\n' +
                                  '原创性考量：\n' +
                                  '【细节补充】\n' +
                                  '---\n' +
                                  '生成的科技设定数量应根据用户的具体需求和上下文来确定，可以是一个或多个，每个设定项之间使用三个短横线"---"分隔'
            break
          case 'magic':
            typeSpecificGuidance = '\n【生成要求】\n' +
                                  '- 结合小说的世界观创建魔法设定\n' +
                                  '- 描述魔法系统、能量源泉、施法规则\n' +
                                  '- 包括法术示例、魔法物品\n' +
                                  '- 考虑魔法与科技、文化的关系\n' +
                                  '- 体现体系的平衡性和独特性\n' +
                                  '- 与故事情节发展相关联\n\n' +
                                  '请按照以下结构生成魔法设定：\n' +
                                  '【魔法设定1：名称】\n' +
                                  '---\n' +
                                  '【基本信息】\n' +
                                  '【名称】：\n' +
                                  '【标签】：使用中文顿号"、"分隔，如：元素、召唤、治愈、诅咒等\n' +
                                  '【描述】：\n' +
                                  '【魔法系统】\n' +
                                  '体系特点：\n' +
                                  '修行方式：\n' +
                                  '平衡性原则：\n' 
                                  '【能量源泉】\n' +
                                  '来源：\n' +
                                  '获取方式：\n' +
                                  '【施法规则】\n' +
                                  '施法条件：\n' +
                                  '限制因素：\n' +
                                  '施法代价：\n' +
                                  '风险设定：\n' +
                                  '【法术示例】\n' +
                                  '基础法术：\n' +
                                  '高级法术：\n' +
                                  '【魔法物品】\n' +
                                  '代表性物品：\n' +
                                  '制作方法：\n' +
                                  '【世界观关联】\n' +
                                  '与科技的关系：\n' +
                                  '与文化的关联：\n' +
                                  '【细节补充】\n' +
                                  '---\n' +
                                  '【魔法设定2：名称】\n' +
                                  '---\n' +
                                  '【基本信息】\n' +
                                  '【名称】：\n' +
                                  '【标签】：使用中文顿号"、"分隔，如：元素、召唤、治愈、诅咒等\n' +
                                  '【描述】：\n' +
                                  '【魔法系统】\n' +
                                  '体系特点：\n' +
                                  '修行方式：\n' +
                                  '平衡性原则：\n' 
                                  '【能量源泉】\n' +
                                  '来源：\n' +
                                  '获取方式：\n' +
                                  '【施法规则】\n' +
                                  '施法条件：\n' +
                                  '限制因素：\n' +
                                  '施法代价：\n' +
                                  '风险设定：\n' +
                                  '【法术示例】\n' +
                                  '基础法术：\n' +
                                  '高级法术：\n' +
                                  '【魔法物品】\n' +
                                  '代表性物品：\n' +
                                  '制作方法：\n' +
                                  '【世界观关联】\n' +
                                  '与科技的关系：\n' +
                                  '与文化的关联：\n' +
                                  '【细节补充】\n' +
                                  '---\n' +
                                  '生成的魔法设定数量应根据用户的具体需求和上下文来确定，可以是一个或多个，每个设定项之间使用三个短横线"---"分隔'
            break
          case 'history':
            typeSpecificGuidance = '\n【生成要求】\n' +
                                  '- 结合小说的世界观创建历史设定\n' +
                                  '- 描述基本信息、时间线、重要事件\n' +
                                  '- 包括历史人物、历史后果\n' +
                                  '- 考虑历史对现在的影响和遗留\n' +
                                  '- 体现历史的复杂性和深度\n' +
                                  '- 与现有情节和角色相关联\n\n' +
                                  '请按照以下结构生成历史设定：\n' +
                                  '【历史设定1：名称】\n' +
                                  '---\n' +
                                  '【基本信息】\n' +
                                  '【名称】：\n' +
                                  '【标签】：使用中文顿号"、"分隔，如：古代、战争、王朝等\n' +
                                  '【描述】：\n' +
                                  '【时间线】\n' +
                                  '重要时期：\n' +
                                  '时间节点：\n' +
                                  '【重要事件】\n' +
                                  '重大事件：\n' +
                                  '影响：\n' +
                                  '【历史人物】\n' +
                                  '关键人物：\n' +
                                  '贡献：\n' +
                                  '【历史后果】\n' +
                                  '对后世的影响：\n' +
                                  '【细节补充】\n' +
                                  '---\n' +
                                  '【历史设定2：名称】\n' +
                                  '---\n' +
                                  '【基本信息】\n' +
                                  '【名称】：\n' +
                                  '【标签】：使用中文顿号"、"分隔，如：古代、战争、王朝等\n' +
                                  '【描述】：\n' +
                                  '【时间线】\n' +
                                  '重要时期：\n' +
                                  '时间节点：\n' +
                                  '【重要事件】\n' +
                                  '重大事件：\n' +
                                  '影响：\n' +
                                  '【历史人物】\n' +
                                  '关键人物：\n' +
                                  '贡献：\n' +
                                  '【历史后果】\n' +
                                  '对后世的影响：\n' +
                                  '【细节补充】\n' +
                                  '---\n' +
                                  '生成的历史设定数量应根据用户的具体需求和上下文来确定，可以是一个或多个，每个设定项之间使用三个短横线"---"分隔'
            break
          default:
            typeSpecificGuidance = ''
        }
      }

      // 根据创作模式调整提示词
      let modeSpecificGuidance = ''
      switch (aiMode) {
        case 'free':
          modeSpecificGuidance = '\n【创作模式：自由创作】\n' +
                                '- 请根据用户提供的主题和要求自由发挥创作\n' +
                                '- 不受特定风格或上下文的严格限制\n' +
                                '- 可以创新性地添加新的元素和情节\n' +
                                '- 保持内容的连贯性和逻辑性'
          break
        case 'style':
          modeSpecificGuidance = '\n【创作模式：风格模仿】\n' +
                                '- 请模仿指定的写作风格或作者风格\n' +
                                '- 分析并复制该风格的语调、用词、句式等特征\n' +
                                '- 保持内容与用户要求的一致性\n' +
                                '- 在模仿风格的同时确保内容的原创性'
          break
        case 'fill':
          modeSpecificGuidance = '\n【创作模式：续写填充】\n' +
                                '- 请在现有内容的基础上继续创作\n' +
                                '- 分析已有的上下文内容，然后自然地延续故事情节\n' +
                                '- 保持与前文的一致性和连贯性\n' +
                                '- 避免重复已有内容，推进故事发展'
          break
      }

      // 构建完整的提示词
      const fullPrompt = `${contextInfo}${typeSpecificGuidance}${modeSpecificGuidance}\n\n${prompt}`
      
      // 添加调试信息
      console.log('AI Generate Request:', {
        promptLength: fullPrompt.length,
        systemPromptLength: typeSystemPrompt?.length || 0,
        temperature: temperature,
        selectedConfigId: selectedConfigId,
        aiMode: aiMode
      })

      // 检查提示词长度，如果过长则截断
      let truncatedPrompt = fullPrompt;
      if (fullPrompt.length > 10000) {
        truncatedPrompt = fullPrompt.substring(0, 10000);
        console.warn('Prompt too long, truncated to 10000 characters');
      }

      // 调用LLM生成文本
      console.log('Calling generateTextStream with configId:', selectedConfigId)
      await generateTextStream(
        {
          prompt: truncatedPrompt,
          systemPrompt: typeSystemPrompt,
          temperature: temperature
        },
        selectedConfigId
      )
    } catch (error) {
      console.error('AI生成失败:', error)
      message.error('AI生成失败，请重试')
      setIsAIGenerating(false)
    }
  }

  // 停止AI生成
  const handleStopGenerate = () => {
    stopStream()
    setIsAIGenerating(false)
    // 清除可能的错误状态
    clearLLMError()
    // 清除响应状态，防止内容被重复插入
    clearLLMResponse()
    // 重置已处理的响应状态
    setProcessedResponse(null)
    // 重置内容状态，确保不会重复插入
    setContent(prevContent => prevContent)
  }

  // 保存内容
  const handleSave = () => {
    if (currentNovel) {
      updateNovelContent(currentNovel.id, content)
      message.success('内容已保存')
    }
  }

  // 撤销操作
  const handleUndo = () => {
    // 这里可以实现撤销功能
    message.info('撤销功能待实现')
  }

  // 重做操作
  const handleRedo = () => {
    // 这里可以实现重做功能
    message.info('重做功能待实现')
  }

  // 切换沉浸模式
  const toggleImmersiveMode = () => {
    setIsImmersiveMode(!isImmersiveMode)
  }

  // 切换故事地图
  const toggleStoryMap = () => {
    setShowStoryMap(!showStoryMap)
  }

  // 切换灵感面板
  const toggleInspirationPanel = () => {
    setShowInspirationPanel(!showInspirationPanel)
  }

  // 处理内容变化
  const handleContentChange = (value: string) => {
    setContent(value)
    // 更新光标位置
    if (textAreaRef.current) {
      setCursorPosition(textAreaRef.current.selectionStart)
    }
  }

  // 处理光标位置变化
  const handleCursorChange = () => {
    if (textAreaRef.current) {
      setCursorPosition(textAreaRef.current.selectionStart)
    }
  }

  // 插入文本到光标位置
  const insertTextAtCursor = (text: string) => {
    if (textAreaRef.current) {
      const startPos = textAreaRef.current.selectionStart
      const endPos = textAreaRef.current.selectionEnd
      const newContent = content.substring(0, startPos) + text + content.substring(endPos)
      setContent(newContent)
      
      // 更新光标位置到插入文本之后
      setTimeout(() => {
        if (textAreaRef.current) {
          const newCursorPos = startPos + text.length
          textAreaRef.current.setSelectionRange(newCursorPos, newCursorPos)
          setCursorPosition(newCursorPos)
        }
      }, 0)
    }
  }

  // 处理AI生成类型变化
  const handleGenerationTypeChange = (value: AIGenerationType) => {
    setGenerationType(value);
    
    // 当生成类型为内容生成、内容优化或情节发展时，且已选择小说，自动加载章节列表
    if (['content', 'optimize', 'plot'].includes(value) && targetNovel?.id) {
      loadChapters(targetNovel.id);
    }
    
    // 如果切换到不需要章节的生成类型，清空已选择的章节
    if (!['content', 'optimize', 'plot'].includes(value)) {
      setSelectedChapterId(null);
    }
  };

  // 添加一个useEffect来监听生成类型和目标小说的变化
  useEffect(() => {
    // 当生成类型为内容生成、内容优化或情节发展时，自动加载章节列表
    if (['content', 'optimize', 'plot'].includes(generationType) && targetNovel?.id) {
      loadChapters(targetNovel.id);
    }
  }, [generationType, targetNovel?.id]);

  // 处理温度变化
  const handleTemperatureChange = (value: number) => {
    setTemperature(value)
  }

  // 处理写作模式变化
  const handleWritingModeChange = (value: AIGeneration['mode']) => {
    setAiMode(value)
  }
  const handleAiModeChange = (e: any) => {
    setAiMode(e.target.value)
  }

  // 处理写作风格变化
  const handleWritingStyleChange = (value: string) => {
    setWritingStyle(value)
  }

  // 处理自定义提示词变化
  const handleCustomPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomPrompt(e.target.value)
  }

  // 处理配置选择变化
  const handleConfigChange = (value: string) => {
    setSelectedConfigId(value)
  }

  // 处理工作区模式变化
  const handleWorkspaceModeChange = (mode: 'writing' | 'outline' | 'worldsetting') => {
    setWorkspaceMode(mode)
  }

  // 计算写作统计信息
  const writingStats = useMemo(() => {
    return {
      wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
      charCount: content.length,
      paragraphCount: content.split('\n\n').filter(p => p.trim().length > 0).length
    };
  }, [content]);

  // 渲染写作统计
  const renderWritingStats = () => {
    return null; // 不再显示独立的写作统计区域
  }

  // 渲染头部工具栏
  const renderHeaderToolbar = () => {
    // 计算AI使用百分比
    const usagePercent = Math.min(
      100, 
      (membershipInfo.aiGenerationUsed / membershipInfo.aiGenerationLimit) * 100
    );
    
    return (
      <div className="workspace-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSave}
            disabled={!currentNovel}
          >
            保存
          </Button>
          <Button icon={<UndoOutlined />} onClick={handleUndo}>撤销</Button>
          <Button icon={<RedoOutlined />} onClick={handleRedo}>重做</Button>
          <Button 
            icon={isImmersiveMode ? <EyeOutlined /> : <EditOutlined />} 
            onClick={toggleImmersiveMode}
          >
            {isImmersiveMode ? '退出沉浸' : '沉浸模式'}
          </Button>
          {/* 居中显示写作统计信息 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '16px', 
            marginLeft: '16px',
            padding: '4px 12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '16px',
            border: '1px solid #e8e8e8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>字数:</Text>
              <Text strong style={{ fontSize: '12px' }}>
                {writingStats.wordCount.toLocaleString()}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>字符:</Text>
              <Text strong style={{ fontSize: '12px' }}>
                {writingStats.charCount.toLocaleString()}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>段落:</Text>
              <Text strong style={{ fontSize: '12px' }}>
                {writingStats.paragraphCount}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>AI状态:</Text>
              <div className="ai-status" style={{ display: 'flex', alignItems: 'center', marginTop: 0 }}>
                {isAIGenerating ? (
                  <Tag color="green" style={{ fontSize: '12px', padding: '0 8px' }}>生成中</Tag>
                ) : (
                  <Tag style={{ fontSize: '12px', padding: '0 8px' }}>空闲</Tag>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* AI使用统计移到这里 */}
          <Card size="small" style={{ minWidth: '220px', margin: 0, padding: '0px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text strong style={{ fontSize: '12px' }}>AI使用:</Text>
                <Text style={{ fontSize: '12px', marginLeft: '4px' }}>
                  {membershipInfo.aiGenerationUsed !== undefined ? membershipInfo.aiGenerationUsed : 0} / {membershipInfo.aiGenerationLimit === Infinity ? '无限制' : (membershipInfo.aiGenerationLimit !== undefined ? membershipInfo.aiGenerationLimit : 0)}
                </Text>
              </div>
              <div>
                <Tag 
                  color={membershipInfo.level === 'free' ? 'default' : membershipInfo.level === 'basic' ? 'blue' : 'gold'}
                  style={{ fontSize: '10px', padding: '0 4px' }}
                >
                  {membershipInfo.level === 'free' ? '免费' : membershipInfo.level === 'basic' ? '基础' : '专业'}
                </Tag>
              </div>
            </div>
            <Progress 
              percent={usagePercent} 
              size="small" 
              strokeColor={usagePercent > 90 ? '#ff4d4f' : usagePercent > 70 ? '#faad14' : '#52c41a'}
              style={{ marginTop: '0px', marginBottom: '0' }}
            />
          </Card>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#666' }}>小说:</span>
            <BookSelector 
              ref={bookSelectorRef}
              onSelect={handleBookSelect}
              selectedNovelId={targetNovel?.id}
              style={{ width: '200px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#666' }}>模型:</span>
            <Select
              value={selectedConfigId}
              onChange={handleConfigChange}
              style={{ width: 200 }}
              loading={loadingModels}
            >
              {availableModels.map(config => (
                <Option key={config.id} value={config.id}>
                  {config.name}
                  {config.model && config.model !== config.name && (
                    <span style={{ color: '#888', fontSize: '12px' }}> ({config.model})</span>
                  )}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </div>
    )
  }

  // 渲染AI控制面板
  const renderAIControlPanel = () => {
    return (
      <Card size="small" title="AI创作助手">
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 原来的AI使用统计已移到顶部工具栏 */}
          
          <div>
            <div style={{ marginBottom: 8 }}><strong>生成类型：</strong></div>
            <Select
              value={generationType}
              onChange={handleGenerationTypeChange}
              style={{ width: '100%' }}
            >
              <Option value="content">内容创作</Option>
              <Option value="optimize">内容优化</Option>
              <Option value="plot">情节发展</Option>
              <Option value="outline">大纲生成</Option>
              <Option value="character">角色设定</Option>
              <Option value="location">地点设定</Option>
              <Option value="culture">文化设定</Option>
              <Option value="technology">科技设定</Option>
              <Option value="magic">魔法设定</Option>
              <Option value="history">历史设定</Option>
            </Select>
          </div>
          
          {/* 章节选择器（当生成类型为内容生成、内容优化或情节发展时显示） */}
          {targetNovel && ['content', 'optimize', 'plot'].includes(generationType) && (
            <div>
              <div style={{ marginBottom: 8 }}><strong>目标章节：</strong></div>
              <Select
                value={selectedChapterId}
                onChange={setSelectedChapterId}
                loading={loadingChapters}
                placeholder="选择要同步到的章节"
                style={{ width: '100%' }}
                allowClear={false} // 设置为必选项
              >
                {chapters.map((chapter) => (
                  <Option key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </Option>
                ))}
              </Select>
            </div>
          )}
          
          <div>
            <div style={{ marginBottom: 8 }}><strong>创作模式：</strong></div>
            <Radio.Group 
              value={aiMode} 
              onChange={handleAiModeChange} 
              style={{ width: '100%' }}
            >
              <Radio.Button value="free">自由创作</Radio.Button>
              <Radio.Button value="style">风格模仿</Radio.Button>
              <Radio.Button value="fill">续写填充</Radio.Button>
            </Radio.Group>
          </div>
          
          <div>
            <div style={{ marginBottom: 8 }}><strong>温度：</strong></div>
            <Slider 
              min={0} 
              max={1} 
              step={0.1} 
              value={temperature} 
              onChange={handleTemperatureChange} 
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <div style={{ marginBottom: 8 }}><strong>自定义提示词：</strong></div>
            <TextArea 
              value={customPrompt} 
              onChange={handleCustomPromptChange} 
              rows={4} 
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <Button 
              type="primary" 
              icon={<BranchesOutlined />} 
              onClick={() => handleAIGenerate(customPrompt)}
              disabled={isAIGenerating}
              style={{ width: '100%' }}
            >
              生成内容
            </Button>
          </div>
          
          <div>
            <Button 
              type="default" 
              icon={<PauseCircleOutlined />} 
              onClick={handleStopGenerate}
              disabled={!isAIGenerating}
              style={{ width: '100%' }}
            >
              停止生成
            </Button>
          </div>
        </Space>
      </Card>
    )
  }

  // 渲染创意画布区
  const renderCanvasArea = () => {
    return (
      <div className="canvas-area">
        <div className="area-header">
          <h3>创意画布</h3>
          <Space>
            <Button 
              size="small" 
              icon={<BranchesOutlined />}
              onClick={toggleStoryMap}
            >
              故事地图
            </Button>
            <Button 
              size="small" 
              icon={<BulbOutlined />}
              onClick={toggleInspirationPanel}
            >
              创作灵感
            </Button>
          </Space>
        </div>
        <div className="canvas-content">
          <TextArea
            ref={textAreaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onSelect={handleCursorChange}
            onClick={handleCursorChange}
            onKeyUp={handleCursorChange}
            placeholder="在这里开始您的创作之旅..."
          />
        </div>
        {/* 恢复SyncPanel组件 */}
        {targetNovel && content && (
          <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
            <SyncPanel
              content={parsedContent ? `${parsedContent.content}\n#SUMMARY#\n${parsedContent.summary}` : content}
              novel={targetNovel}
              generationType={generationType}
              onSync={handleSyncComplete}
              selectedChapterId={selectedChapterId} // 传递章节ID
            />
          </div>
        )}
      </div>
    )
  }

  // 渲染智能控制塔
  const renderControlTower = () => {
    return (
      <div className="control-tower">
        <div className="area-header">
          <h3>智能控制塔</h3>
        </div>
        <div className="control-content">
          {renderAIControlPanel()}
          
          <Divider />
          
          <Card size="small" title="实时预览" style={{ marginTop: 16 }}>
            <div className="preview-content">
              {llmResponse ? (
                <Paragraph>
                  {llmResponse}
                </Paragraph>
              ) : (
                <Text type="secondary">AI生成的内容将在此处预览</Text>
              )}
            </div>
            {llmStreaming && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <Text type="secondary">AI正在思考中...</Text>
              </div>
            )}
            {/* 如果解析出了摘要，显示摘要预览 */}
            {parsedContent && parsedContent.summary && (
              <div style={{ marginTop: 12, padding: '8px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
                <Text strong>摘要预览:</Text>
                <Paragraph style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#555' }}>
                  {parsedContent.summary}
                </Paragraph>
              </div>
            )}
            {/* 添加插入画布按钮 */}
            {llmResponse && !llmStreaming && (
              <div style={{ marginTop: 12 }}>
                <Button 
                  type="primary" 
                  icon={<FileTextOutlined />}
                  onClick={() => {
                    setContent(prevContent => {
                      const separator = prevContent.endsWith('\n') ? '\n' : '\n\n'
                      // 使用解析后的内容，如果没有则使用原始响应
                      const contentToAdd = parsedContent ? parsedContent.content : llmResponse;
                      return prevContent + separator + contentToAdd
                    })
                    message.success('内容已插入到创意画布中')
                  }}
                  size="small"
                >
                  插入到画布
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  // 渲染导航面板
  const renderNavigationPanel = () => {
    return (
      <div className="navigation-panel">
        <div className="version-history">
          <h5>版本历史</h5>
          <List
            size="small"
            dataSource={versionHistory}
            renderItem={(item, index) => (
              <List.Item>
                <Typography.Text mark>版本 {index + 1}</Typography.Text> {item}
              </List.Item>
            )}
          />
        </div>
        
        <div className="immersion-mode">
          <h5>沉浸模式</h5>
          <Space direction="vertical">
            <Text>沉浸模式提供无干扰的创作环境</Text>
            <Button 
              type="primary" 
              icon={<EyeOutlined />}
              onClick={toggleImmersiveMode}
            >
              进入沉浸模式
            </Button>
          </Space>
        </div>
        
        <div className="content-assistant">
          <h5>内容助手</h5>
          <div style={{ padding: '0 12px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Button 
                  block 
                  icon={<CompassOutlined />}
                  onClick={() => insertTextAtCursor('[情节转折点]')}
                  title="在当前光标位置插入情节转折标记，AI将在此处生成情节转折内容"
                  style={{ textAlign: 'left', paddingLeft: 12 }}
                >
                  插入情节转折
                </Button>
                <div style={{ paddingLeft: 36, fontSize: '12px', color: '#888', marginTop: 4, marginBottom: 8 }}>
                  示例：[情节转折点：主角发现真相，原来一直信任的人是幕后黑手]
                </div>
              </div>
              
              <div>
                <Button 
                  block 
                  icon={<TeamOutlined />}
                  onClick={() => insertTextAtCursor('[角色出场]')}
                  title="在当前光标位置插入角色出场标记，AI将在此处生成角色出场内容"
                  style={{ textAlign: 'left', paddingLeft: 12 }}
                >
                  插入角色出场
                </Button>
                <div style={{ paddingLeft: 36, fontSize: '12px', color: '#888', marginTop: 4, marginBottom: 8 }}>
                  示例：[角色出场：神秘的魔法师登场，拥有预知未来的能力]
                </div>
              </div>
              
              <div>
                <Button 
                  block 
                  icon={<EnvironmentOutlined />}
                  onClick={() => insertTextAtCursor('[场景转换]')}
                  title="在当前光标位置插入场景转换标记，AI将在此处生成场景转换内容"
                  style={{ textAlign: 'left', paddingLeft: 12 }}
                >
                  插入场景转换
                </Button>
                <div style={{ paddingLeft: 36, fontSize: '12px', color: '#888', marginTop: 4, marginBottom: 8 }}>
                  示例：[场景转换：从繁华的都市切换到偏远的山村，环境对比强烈]
                </div>
              </div>
              
              <div>
                <Button 
                  block 
                  icon={<SoundOutlined />}
                  onClick={() => insertTextAtCursor('[对话开始]')}
                  title="在当前光标位置插入对话开始标记，AI将在此处生成对话内容"
                  style={{ textAlign: 'left', paddingLeft: 12 }}
                >
                  插入对话开始
                </Button>
                <div style={{ paddingLeft: 36, fontSize: '12px', color: '#888', marginTop: 4, marginBottom: 8 }}>
                  示例：[对话开始：两个敌对势力的代表进行谈判，气氛紧张]
                </div>
              </div>
            </Space>
          </div>
        </div>
        
        <div className="character-perspective">
          <h5>角色视角</h5>
          <Space>
            <Avatar 
              size="large" 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#1890ff' }}
            />
            <Avatar 
              size="large" 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#52c41a' }}
            />
            <Avatar 
              size="large" 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#faad14' }}
            />
          </Space>
        </div>
      </div>
    )
  }

  // 渲染沉浸模式覆盖层
  const renderImmersiveOverlay = () => {
    if (!isImmersiveMode) return null
    
    return (
      <div className="immersion-overlay">
        <div className="immersion-content">
          <TextArea
            className="immersion-canvas"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="沉浸创作模式..."
          />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button 
              type="primary" 
              icon={<CloseOutlined />}
              onClick={toggleImmersiveMode}
              size="large"
            >
              退出沉浸模式
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 渲染灵感面板
  const renderInspirationPanel = () => {
    return (
      <Drawer
        title="创作灵感"
        placement="right"
        onClose={() => setShowInspirationPanel(false)}
        open={showInspirationPanel}
        width={400}
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="写作技巧" key="1">
            <List
              dataSource={[
                '使用具体而非抽象的描述',
                '展示而非告诉',
                '运用五感描写',
                '制造冲突和悬念',
                '塑造立体角色'
              ]}
              renderItem={item => (
                <List.Item>
                  <Typography.Text mark>[技巧]</Typography.Text> {item}
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="情节构思" key="2">
            <List
              dataSource={[
                '三卷式结构',
                '英雄之旅',
                '反转与意外',
                '伏笔与呼应',
                '高潮与结局'
              ]}
              renderItem={item => (
                <List.Item>
                  <Typography.Text mark>[构思]</Typography.Text> {item}
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="角色塑造" key="3">
            <List
              dataSource={[
                '角色动机与目标',
                '内心冲突',
                '成长弧线',
                '对话个性化',
                '细节刻画'
              ]}
              renderItem={item => (
                <List.Item>
                  <Typography.Text mark>[角色]</Typography.Text> {item}
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Drawer>
    )
  }

  // 获取生成类型名称
  const getGenerationTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'content': '内容创作',
      'optimize': '内容优化',
      'plot': '情节发展',
      'outline': '大纲生成',
      'character': '角色设定',
      'location': '地点设定',
      'culture': '文化设定',
      'technology': '科技设定',
      'magic': '魔法设定',
      'history': '历史设定'
    };
    return typeMap[type] || '未知类型';
  };

  // 修改header部分的模型选择器以包含默认模型
  const renderHeader = () => {
    return (
      <div className="header" style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            style={{ fontSize: '16px' }}
          />
          <Typography.Title level={4} style={{ margin: 0 }}>AI小说创作工作台</Typography.Title>
        </div>
        {/* 移除重复的模型选择器，使用顶部工具栏中的模型选择器 */}
      </div>
    )
  }

  return (
    <Layout className={styles.workspace}>
      {/* 头部工具栏 */}
      {renderHeaderToolbar()}
      
      {/* 写作统计 */}
      {renderWritingStats()}
      
      {/* 主工作区布局 */}
      <div className="workspace-layout">
        {/* 创意画布区 */}
        {renderCanvasArea()}
        
        {/* 智能控制塔 */}
        {renderControlTower()}
        
        {/* 导航面板 */}
        {renderNavigationPanel()}
      </div>
      
      {/* 沉浸模式覆盖层 */}
      {renderImmersiveOverlay()}
      
      {/* 灵感面板 */}
      {renderInspirationPanel()}
    </Layout>
  )
}

export default AINovelWorkspace