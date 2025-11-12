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
  ArrowLeftOutlined,
  ApiOutlined,
  ExperimentOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import useStyles from './useStyles';
import CharacterGenerationHelper from '@/components/ai/CharacterGenerationHelper';
import WorldSettingGenerationHelper from '@/components/ai/WorldSettingGenerationHelper';
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
import { outlineSyncService } from '@/services/outlineSyncService';

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
  
  // 角色生成助手状态
  const [characterHelperVisible, setCharacterHelperVisible] = useState(false);
  // 世界设定生成助手状态
  const [worldSettingHelperVisible, setWorldSettingHelperVisible] = useState(false);
  const [worldSettingHelperType, setWorldSettingHelperType] = useState<'location' | 'culture' | 'technology' | 'magic' | 'history' | null>(null);

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
              // 确保小说对象有id字段（处理API返回_id但没有id的情况）
              const novelWithId = {
                ...novel,
                id: novel.id || (novel as any)._id || state.novelId
              };
              setTargetNovel(novelWithId);
              // 加载章节列表
              await loadChapters(novelWithId.id);
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
    // 确保模型数据已经加载完成
    if (loadingModels) {
      console.log('Models are still loading, waiting...');
      return;
    }
    
    // 优先使用useModelSelection hook中的模型列表
    if (availableModels.length > 0 && !selectedConfigId) {
      // 优先使用默认模型（管理员配置的统一默认模型）
      const defaultModel = availableModels.find(model => model.isDefault);
      if (defaultModel) {
        console.log('Selecting default model:', defaultModel);
        setSelectedConfigId(defaultModel.id);
      } else {
        // 如果没有默认模型，使用第一个可用模型
        console.log('Selecting first available model:', availableModels[0]);
        setSelectedConfigId(availableModels[0].id);
      }
    } else if (configs.length > 0 && !selectedConfigId) {
      // 回退到useLLM hook中的配置
      console.log('Falling back to LLM config, defaultConfigId:', defaultConfigId);
      setSelectedConfigId(defaultConfigId || configs[0].id);
    }
  }, [configs, selectedConfigId, defaultConfigId, availableModels, loadingModels]);

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
          
          // 将内容和摘要一起添加到画布中，摘要保留在内容后面
          setContent(prevContent => {
            const separator = prevContent.endsWith('\n') ? '\n' : '\n\n';
            // 将内容和摘要一起插入，摘要跟在内容后面
            const contentWithSummary = content + '\n\n#SUMMARY#\n' + summary;
            return prevContent + separator + contentWithSummary;
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
    // 确保小说对象有id字段（处理API返回_id但没有id的情况）
    const novelWithId = {
      ...novel,
      id: novel.id || (novel as any)._id || novelId
    };
    setTargetNovel(novelWithId);
    // 当选择小说时，加载对应的章节列表
    if (novelId) {
      await loadChapters(novelId);
    } else {
      setChapters([]);
    }
  };

  // 刷新世界观设定数据
  const refreshWorldSettingsData = async (novelId: string) => {
    try {
      // 重新加载章节列表来刷新数据
      await loadChapters(novelId);
      
      // 触发相关组件更新
      eventBus.emit('dataRefreshNeeded', { novelId });
    } catch (error) {
      console.error('刷新世界观设定数据失败:', error);
    }
  };

  // 监听删除和同步完成事件
  useEffect(() => {
    const handleWorldSettingDeleted = () => {
      // 当世界观设定被删除时，刷新相关数据
      if (targetNovel?.id) {
        refreshWorldSettingsData(targetNovel.id);
      }
    };
    
    const handleWorldSettingSyncComplete = (event: CustomEvent) => {
      // 当同步完成时，刷新相关数据
      const { novelId, type } = event.detail || {};
      // 优先使用事件中的novelId，如果没有则使用targetNovel.id
      const idToUse = novelId || targetNovel?.id;
      if (idToUse) {
        refreshWorldSettingsData(idToUse);
      }
    };
    
    // 监听删除和同步完成事件
    window.addEventListener('worldSettingDeleted', handleWorldSettingDeleted);
    window.addEventListener('worldSettingSyncComplete', handleWorldSettingSyncComplete as EventListener);
    
    return () => {
      window.removeEventListener('worldSettingDeleted', handleWorldSettingDeleted);
      window.removeEventListener('worldSettingSyncComplete', handleWorldSettingSyncComplete as EventListener);
    };
  }, [targetNovel?.id]);

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
      message.warning('请先选择目标小说并生成内容');
      return;
    }
    
    // 直接执行同步
    performSync();
  }

  // 执行同步
  const performSync = async () => {
    if (!targetNovel || !content) return;
    
    try {
      // 使用优化的数据同步服务替换旧的同步服务
      // 根据generationType执行相应的同步操作
      console.log('开始同步操作，generationType:', generationType);
      let result: any;
      switch (generationType) {
        case 'content':
        case 'optimize':
        case 'plot':
          // 对于内容相关操作，使用内容同步服务
          if (selectedChapterId) {
            // 使用解析后的内容和摘要（如果有的话）
            const contentToSync = parsedContent ? parsedContent.content : content;
            // 确保摘要保留在内容后面
            const fullContentToSync = parsedContent 
              ? `${contentToSync}\n#SUMMARY#\n${parsedContent.summary}` 
              : contentToSync;
              
            // 根据操作类型选择不同的同步方法
            if (generationType === 'optimize') {
              // 内容优化使用替换方式
              result = await contentSyncService.syncToChapter(
                fullContentToSync,  // 传递包含摘要的完整内容
                targetNovel.id,
                selectedChapterId
              );
            } else if (generationType === 'plot') {
              // 情节发展使用追加方式
              result = await contentSyncService.appendToChapter(
                fullContentToSync,  // 传递包含摘要的完整内容
                targetNovel.id,
                selectedChapterId
              );
            } else {
              // 内容创作使用追加方式
              result = await contentSyncService.appendToChapter(
                fullContentToSync,  // 传递包含摘要的完整内容
                targetNovel.id,
                selectedChapterId
              );
            }
          } else {
            message.warning('请选择目标章节');
            return;
          }
          break;
        case 'outline':
          // 对于大纲生成，使用专门的大纲同步服务，采用智能合并模式
          result = await outlineSyncService.syncOutline(content, targetNovel.id, { syncMode: 'merge' });
          break;
        case 'character':
        case 'location':
        case 'culture':
        case 'technology':
        case 'magic':
        case 'history':
          // 对于世界观设定相关操作，使用专门的同步服务
          console.log('世界观设定同步，类型:', generationType);
          // 根据类型导入相应的同步服务
          if (generationType === 'character') {
            console.log('调用角色同步服务');
            const { characterSyncService } = await import('@/services/sync/CharacterSyncService');
            result = await characterSyncService.syncCharacters(content, targetNovel.id);
          } else if (generationType === 'location') {
            console.log('调用地点同步服务');
            const { locationSyncService } = await import('@/services/sync/LocationSyncService');
            result = await locationSyncService.syncLocations(content, targetNovel.id);
          } else if (generationType === 'culture') {
            console.log('调用文化同步服务');
            const { cultureSyncService } = await import('@/services/sync/CultureSyncService');
            result = await cultureSyncService.syncCultures(content, targetNovel.id);
          } else if (generationType === 'technology') {
            console.log('调用科技同步服务');
            const { technologySyncService } = await import('@/services/sync/TechnologySyncService');
            result = await technologySyncService.syncTechnologies(content, targetNovel.id);
          } else if (generationType === 'magic') {
            console.log('调用魔法同步服务');
            const { magicSyncService } = await import('@/services/sync/MagicSyncService');
            result = await magicSyncService.syncMagics(content, targetNovel.id);
          } else if (generationType === 'history') {
            console.log('调用历史同步服务');
            const { historySyncService } = await import('@/services/sync/HistorySyncService');
            result = await historySyncService.syncHistories(content, targetNovel.id);
          }
          break;
        default:
          // 对于其他类型，使用优化的数据同步服务进行全量同步
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

  // 添加一个辅助函数来生成内容
  const generateContent = async (prompt: string, systemPrompt: string, config: any) => {
    // 调用AI服务生成内容
    await generateTextStream(
      {
        prompt: prompt,
        systemPrompt: systemPrompt,
        temperature: temperature,
        maxTokens: 128000
      },
      config.id
    );
    
    // 从响应状态中获取生成的内容
    return llmResponse || '';
  };

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

    console.log('handleAIGenerate: selectedConfigId=', selectedConfigId);
    console.log('handleAIGenerate: defaultConfigId=', defaultConfigId);
    console.log('handleAIGenerate: configs=', configs);
    
    if (!selectedConfigId) {
      // 如果没有选择配置，尝试使用默认配置
      if (defaultConfigId) {
        console.log('handleAIGenerate: Using default config ID', defaultConfigId);
        setSelectedConfigId(defaultConfigId);
      } else if (configs.length > 0) {
        // 如果没有默认配置，使用第一个可用配置
        console.log('handleAIGenerate: Using first available config', configs[0].id);
        setSelectedConfigId(configs[0].id);
      } else {
        message.warning('请先选择AI模型配置');
        return;
      }
    }

    // 对于特定类型的生成，需要选择目标小说
    if (['outline', 'plot', 'character', 'location', 'culture', 'technology', 'magic', 'history'].includes(generationType) && !targetNovel) {
      message.warning('请先选择目标小说');
      return;
    }

    // 对于内容生成、内容优化和情节发展，需要选择目标章节
    if (['content', 'optimize', 'plot'].includes(generationType) && !selectedChapterId) {
      message.warning('请先选择目标章节');
      return;
    }

    setIsAIGenerating(true);
    
    try {
      // 获取选中的AI配置
      const configId = selectedConfigId || defaultConfigId || (configs.length > 0 ? configs[0].id : null);
      console.log('handleAIGenerate: Using configId', configId);
      
      if (!configId) {
        throw new Error('未找到任何AI配置');
      }

      // 构建完整的提示词上下文
      let fullPrompt = prompt;
      
      // 对于大纲生成，添加小说信息作为上下文
      if (generationType === 'outline' && targetNovel) {
        // 获取小说的现有大纲信息作为上下文
        const existingOutlines = await hybridStorageService.getOutlines(targetNovel.id);
        const existingOutlineText = existingOutlines.map(outline => 
          `${outline.type === 'main' ? '##' : '###'} ${outline.title}\n${outline.content || ''}`
        ).join('\n\n');
        
        // 构建包含现有大纲的完整提示词
        fullPrompt = `小说信息：
标题：${targetNovel.title}
类型：${targetNovel.genre}
描述：${targetNovel.description || '无'}

现有大纲结构：
${existingOutlineText || '暂无'}

请基于以上信息生成新的大纲内容：
${prompt}`;
      } else if (targetNovel) {
        // 对于其他类型的生成，添加小说信息和大纲上下文
        try {
          // 获取选中的章节详细信息（如果有的话）
          let selectedChapterDetails = '';
          if (selectedChapterId && ['content', 'optimize', 'plot'].includes(generationType)) {
            try {
              // 直接获取选中章节的大纲信息作为上下文
              const outlines = await hybridStorageService.getOutlines(targetNovel.id);
              const selectedChapter = outlines.find(outline => outline.type === 'chapter' && outline.id === selectedChapterId);
              
              if (selectedChapter) {
                selectedChapterDetails = `【选中章节标题】${selectedChapter.title}\n`;
                if (selectedChapter.content) {
                  selectedChapterDetails += `\n【选中章节内容概述】\n${selectedChapter.content}\n`;
                }
                if (selectedChapter.summary) {
                  selectedChapterDetails += `\n【选中章节摘要】\n${selectedChapter.summary}\n`;
                }
              }
              console.log('获取到的选中章节详细信息:', selectedChapterDetails);
            } catch (chapterError) {
              console.warn('获取章节详细信息失败:', chapterError);
              selectedChapterDetails = '';
            }
          }
          
          // 使用增强的特定指导功能，该功能会自动包含大纲信息
          let enhancedGuidance = await enhanceTypeSpecificGuidance(generationType, targetNovel.id, selectedChapterId);
          console.log('增强指导内容:', enhancedGuidance);
          
          // 对于角色生成，额外添加大纲中提及的角色信息
          if (generationType === 'character') {
            try {
              // 获取大纲信息
              const outlines = await hybridStorageService.getOutlines(targetNovel.id);
              if (outlines && outlines.length > 0) {
                // 导入角色提取工具
                const { extractCharactersFromOutline } = await import('@/utils/outlineCharacterExtractor');
                
                // 提取大纲中提及的角色
                const mentionedCharacters = await extractCharactersFromOutline(outlines);
                
                // 获取已存在的角色
                const existingCharacters = await hybridStorageService.getWorldElements('character', targetNovel.id);
                const existingCharacterNames = existingCharacters.map((char: any) => char.name);
                
                // 过滤出未详细设定的角色
                const undetailedCharacters = mentionedCharacters.filter(
                  name => !existingCharacterNames.includes(name)
                );
                
                if (undetailedCharacters.length > 0) {
                  enhancedGuidance += `

【大纲中提及但未详细设定的角色】
请为以下角色生成详细设定：${undetailedCharacters.join('、')}`;
                }
                
                // 添加防重复指令
                if (existingCharacterNames.length > 0) {
                  enhancedGuidance += `

【重要提醒】
请勿生成与以下已存在角色重复的角色：${existingCharacterNames.join('、')}`;
                }
              }
            } catch (extractError) {
              console.warn('提取大纲角色信息失败:', extractError);
            }
          }
          
          // 如果有选中的章节详细信息，添加到增强指导中
          if (selectedChapterDetails) {
            enhancedGuidance = `【选中章节详细信息】
${selectedChapterDetails}

${enhancedGuidance}`;
            console.log('添加章节详细信息后的增强指导:', enhancedGuidance);
          }
          
          // 构建最终的提示词
          prompt = `${prompt}

${enhancedGuidance}`;
          console.log('最终构建的提示词:', prompt);
        } catch (error) {
          console.error('获取增强指导失败:', error);
        }
      }
      
      console.log('开始AI生成，配置ID:', configId, '提示词长度:', prompt.length);
      
      // 调用AI服务生成内容
      await generateTextStream(
        {
          prompt: prompt,
          systemPrompt: systemPrompt || getSystemPromptByType(generationType),
          temperature: temperature,
          maxTokens: 128000  // 增加maxTokens到128000以支持更长的内容生成
        },
        configId  // 使用确定的configId而不是selectedConfigId
      );
    } catch (error) {
      console.error('AI生成失败:', error);
      // 提供更详细的错误信息
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error(`AI生成失败: ${errorMessage}，请重试`);
      setIsAIGenerating(false);
    }
  }

  // 停止AI生成
  const handleStopGenerate = () => {
    if (stopStream) stopStream();
    if (setIsAIGenerating) setIsAIGenerating(false);
    // 清除可能的错误状态
    if (clearLLMError) clearLLMError();
    // 清除响应状态，防止内容被重复插入
    if (clearLLMResponse) clearLLMResponse();
    // 重置已处理的响应状态
    if (setProcessedResponse) setProcessedResponse(null);
    // 重置内容状态，确保不会重复插入
    if (setContent) setContent(prevContent => prevContent);
  }

  // 保存内容
  const handleSave = () => {
    if (currentNovel) {
      updateNovelContent(currentNovel.id, content);
      message.success('内容已保存');
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
    
    // 当切换到角色生成类型时，显示角色生成助手
    if (value === 'character' && targetNovel?.id) {
      setCharacterHelperVisible(true);
    }
    
    // 当切换到世界设定生成类型时，显示对应的生成助手
    if (['location', 'culture', 'technology', 'magic', 'history'].includes(value) && targetNovel?.id) {
      const settingType = value as 'location' | 'culture' | 'technology' | 'magic' | 'history';
      setWorldSettingHelperType(settingType);
      setWorldSettingHelperVisible(true);
    }
  };
  
  // 处理角色生成请求
  const handleCharacterGenerateRequest = (characterNames: string[]) => {
    // 构造自定义提示词，包含完整的大纲上下文
    const characterList = characterNames.join('、');
    
    // 获取当前小说的大纲内容作为上下文（从大纲数据中获取）
    const customPromptText = `请严格围绕以下小说大纲（含大纲内提及的人物、情节、核心冲突），为指定角色生成详细设定，确保所有角色与大纲情节强绑定、无逻辑冲突。

请为以下角色生成详细设定：${characterList}

要求：
1. 严格按照大纲中提及的角色进行设定
2. 不要生成与已有角色重复的角色
3. 为每个角色提供完整的背景、性格、能力等信息
4. 角色设定需与小说整体世界观保持一致
5. 根据角色在大纲中的出场顺序进行细节补充`;
    
    setCustomPrompt(customPromptText);
    
    // 自动触发生成
    setTimeout(() => {
      handleAIGenerate(customPromptText);
    }, 100);
  };
  
  // 处理角色生成助手取消
  const handleCharacterHelperCancel = () => {
    setCharacterHelperVisible(false);
  };
  
  // 处理打开角色生成助手
  const handleOpenCharacterHelper = () => {
    if (!targetNovel?.id) {
      message.warning('请先选择目标小说');
      return;
    }
    setCharacterHelperVisible(true);
  };
  
  // 处理世界设定生成助手取消
  const handleWorldSettingHelperCancel = () => {
    setWorldSettingHelperVisible(false);
    setWorldSettingHelperType(null);
  };
  
  // 处理打开世界设定生成助手
  const handleOpenWorldSettingHelper = (type: 'location' | 'culture' | 'technology' | 'magic' | 'history') => {
    if (!targetNovel?.id) {
      message.warning('请先选择目标小说');
      return;
    }
    setWorldSettingHelperType(type);
    setWorldSettingHelperVisible(true);
  };
  
  // 处理世界设定生成请求
  const handleWorldSettingGenerateRequest = (settingNames: string[]) => {
    // 构造自定义提示词，包含完整的大纲上下文
    const settingList = settingNames.join('、');
    
    // 获取当前小说的大纲内容作为上下文
    const customPromptText = `请严格围绕以下小说大纲（含大纲内提及的设定、情节、核心冲突），为指定${getSettingTypeName(worldSettingHelperType)}生成详细设定，确保所有设定与大纲情节强绑定、无逻辑冲突。

请为以下${getSettingTypeName(worldSettingHelperType)}生成详细设定：${settingList}

要求：
1. 严格按照大纲中提及的设定进行生成，不要生成与已有设定重复的内容
2. 为每个设定提供完整的背景、特点、作用等信息
3. 设定需与小说整体世界观保持一致
4. 确保设定与大纲情节强绑定、无逻辑冲突
5. 每个设定的生成应包含相关的核心要素
6. 根据设定在大纲中的出场顺序进行细节补充`;

    setCustomPrompt(customPromptText);
    
    // 自动触发生成
    setTimeout(() => {
      handleAIGenerate(customPromptText);
    }, 100);
  };
  
  // 获取设定类型名称
  const getSettingTypeName = (type: 'location' | 'culture' | 'technology' | 'magic' | 'history' | null) => {
    switch (type) {
      case 'location': return '地点';
      case 'culture': return '文化';
      case 'technology': return '科技';
      case 'magic': return '魔法';
      case 'history': return '历史';
      default: return '设定';
    }
  };

  // 监听目标小说变化，当选择小说时显示角色生成助手（如果当前是角色生成模式）
  useEffect(() => {
    if (generationType === 'character' && targetNovel?.id) {
      setCharacterHelperVisible(true);
    }
  }, [targetNovel?.id, generationType]);

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
    console.log('handleConfigChange: value=', value);
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
            border: '1px solid #e8e8e8',
            minWidth: '320px', // 固定最小宽度
            maxWidth: '320px', // 固定最大宽度
            height: '30px', // 固定高度
            whiteSpace: 'nowrap', // 防止换行
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>字数:</Text>
              <Text strong style={{ fontSize: '12px' }}>
                {writingStats.wordCount.toLocaleString()}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>字符:</Text>
              <Text strong style={{ fontSize: '12px' }}>
                {writingStats.charCount.toLocaleString()}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>段落:</Text>
              <Text strong style={{ fontSize: '12px' }}>
                {writingStats.paragraphCount}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              style={{ width: '200px'}}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#666' }}>模型:</span>
            <Select
              value={selectedConfigId}
              onChange={handleConfigChange}
              style={{ width: 200 }}
              loading={loadingModels}
              disabled={loadingModels}
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
          
          {/* 角色生成助手按钮（当生成类型为角色设定时显示） */}
          {targetNovel && generationType === 'character' && (
            <div>
              <div style={{ marginBottom: 8 }}><strong>角色生成：</strong></div>
              <Button 
                type="primary" 
                icon={<TeamOutlined />} 
                onClick={handleOpenCharacterHelper}
                style={{ width: '100%' }}
              >
                打开角色生成助手
              </Button>
            </div>
          )}
          
          {/* 世界设定助手按钮（当生成类型为世界设定时显示） */}
          {targetNovel && ['location', 'culture', 'technology', 'magic', 'history'].includes(generationType) && (
            <div>
              <div style={{ marginBottom: 8 }}><strong>{getSettingTypeName(generationType as any)}生成：</strong></div>
              <Button 
                type="primary" 
                icon={
                  generationType === 'location' ? <EnvironmentOutlined /> :
                  generationType === 'culture' ? <GlobalOutlined /> :
                  generationType === 'technology' ? <ApiOutlined /> :
                  generationType === 'magic' ? <ExperimentOutlined /> :
                  <HistoryOutlined />
                }
                onClick={() => handleOpenWorldSettingHelper(generationType as any)}
                style={{ width: '100%' }}
              >
                打开{getSettingTypeName(generationType as any)}生成助手
              </Button>
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
          
          {/* 角色生成助手 */}
          {targetNovel?.id && (
            <CharacterGenerationHelper
              novelId={targetNovel.id}
              onGenerateRequest={handleCharacterGenerateRequest}
              visible={characterHelperVisible}
              onCancel={handleCharacterHelperCancel}
            />
          )}
          
          {/* 世界设定生成助手 */}
          {targetNovel?.id && worldSettingHelperType && (
            <WorldSettingGenerationHelper
              novelId={targetNovel.id}
              settingType={worldSettingHelperType}
              onGenerateRequest={handleWorldSettingGenerateRequest}
              visible={worldSettingHelperVisible}
              onCancel={handleWorldSettingHelperCancel}
            />
          )}
          
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
                '性格特征与缺陷',
                '成长弧线',
                '人际关系网',
                '背景故事'
              ]}
              renderItem={item => (
                <List.Item>
                  <Typography.Text mark>[塑造]</Typography.Text> {item}
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Drawer>
    );
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
  );
}

export default AINovelWorkspace;
