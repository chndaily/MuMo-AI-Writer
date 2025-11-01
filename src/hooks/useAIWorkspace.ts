import { useState, useCallback, useEffect, useRef } from 'react'
import { message, notification } from 'antd'
import { aiService, AIGenerationMode, AIGenerationParams } from '../services/aiService'
import { useNovelStore } from '../stores/novelStore'
import type { ParallelVersion, InconsistencyIssue, SemanticSuggestion, StylePreset, EnvironmentSound } from '../services/aiService'

export interface WorkspaceState {
  content: string
  cursorPosition: number
  isGenerating: boolean
  currentMode: AIGenerationMode
  temperature: number
  writingStyle: string
  isImmersiveMode: boolean
  showStoryMap: boolean
  showInspirationPanel: boolean
  parallelVersions: ParallelVersion[]
  versionHistory: string[]
  currentCharacter: string | null
  analysisResult: any
  inconsistencies: InconsistencyIssue[]
}

export const useAIWorkspace = () => {
  const { currentNovel, updateNovelContent } = useNovelStore()
  const [state, setState] = useState<WorkspaceState>({
    content: currentNovel?.content || '',
    cursorPosition: 0,
    isGenerating: false,
    currentMode: AIGenerationMode.FREE,
    temperature: 0.7,
    writingStyle: 'default',
    isImmersiveMode: false,
    showStoryMap: false,
    showInspirationPanel: false,
    parallelVersions: [],
    versionHistory: [],
    currentCharacter: null,
    analysisResult: null,
    inconsistencies: [],
  })

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const analysisTimeoutRef = useRef<NodeJS.Timeout>()

  // 自动保存
  const autoSave = useCallback((content: string) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (currentNovel) {
        updateNovelContent(currentNovel.id, content)
        message.success('自动保存成功')
      }
    }, 2000)
  }, [currentNovel, updateNovelContent])

  // 更新内容
  const updateContent = useCallback((newContent: string) => {
    setState(prev => ({ ...prev, content: newContent }))
    autoSave(newContent)
  }, [autoSave])

  // 更新光标位置
  const updateCursorPosition = useCallback((position: number) => {
    setState(prev => ({ ...prev, cursorPosition: position }))
  }, [])

  // AI生成内容
  const generateContent = useCallback(async (mode?: AIGenerationMode) => {
    const generationMode = mode || state.currentMode

    setState(prev => ({ ...prev, isGenerating: true }))

    try {
      const params: AIGenerationParams = {
        mode: generationMode,
        content: state.content,
        temperature: state.temperature,
        style: state.writingStyle,
        character: state.currentCharacter || undefined,
      }

      const response = await aiService.generateContent(params)

      if (response.success && response.data) {
        // 在光标位置插入生成的内容
        const beforeCursor = state.content.slice(0, state.cursorPosition)
        const afterCursor = state.content.slice(state.cursorPosition)
        const newContent = beforeCursor + response.data + afterCursor

        updateContent(newContent)

        // 保存版本历史
        setState(prev => ({
          ...prev,
          versionHistory: [...prev.versionHistory, state.content]
        }))

        message.success('AI生成完成')

        // 触发内容分析
        triggerContentAnalysis(newContent)
      } else {
        message.error(response.error || '生成失败')
      }
    } catch (error) {
      console.error('AI生成错误:', error)
      message.error('AI服务暂时不可用')
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }))
    }
  }, [state, updateContent])

  // 生成平行宇宙版本
  const generateParallelVersions = useCallback(async () => {
    try {
      const versions = await aiService.generateParallelVersions(state.content)
      setState(prev => ({ ...prev, parallelVersions: versions }))

      notification.success({
        message: '平行宇宙生成完成',
        description: `已生成${versions.length}个不同方向的情节分支`,
      })
    } catch (error) {
      message.error('平行宇宙生成失败')
    }
  }, [state.content])

  // 触发内容分析
  const triggerContentAnalysis = useCallback(async (content: string) => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current)
    }

    analysisTimeoutRef.current = setTimeout(async () => {
      try {
        const analysis = await aiService.analyzeContent(content)
        const inconsistencies = await aiService.detectInconsistencies(content)

        setState(prev => ({
          ...prev,
          analysisResult: analysis,
          inconsistencies,
        }))

        // 显示重要提醒
        if (inconsistencies.some(issue => issue.severity === 'high')) {
          notification.warning({
            message: '检测到重要问题',
            description: '请检查内容的一致性问题',
          })
        }
      } catch (error) {
        console.error('内容分析失败:', error)
      }
    }, 1000)
  }, [])

  // 切换沉浸式模式
  const toggleImmersiveMode = useCallback(() => {
    setState(prev => {
      const newMode = !prev.isImmersiveMode
      if (newMode) {
        message.info('已进入沉浸式创作模式')
      }
      return { ...prev, isImmersiveMode: newMode }
    })
  }, [])

  // 切换故事地图
  const toggleStoryMap = useCallback(() => {
    setState(prev => ({ ...prev, showStoryMap: !prev.showStoryMap }))
  }, [])

  // 切换灵感面板
  const toggleInspirationPanel = useCallback(() => {
    setState(prev => ({ ...prev, showInspirationPanel: !prev.showInspirationPanel }))
  }, [])

  // 更新生成参数
  const updateGenerationParams = useCallback((params: Partial<{
    mode: AIGenerationMode
    temperature: number
    writingStyle: string
    currentCharacter: string | null
  }>) => {
    setState(prev => ({ ...prev, ...params }))
  }, [])

  // 语义联想
  const getSemanticSuggestions = useCallback(async (keyword: string): Promise<SemanticSuggestion[]> => {
    try {
      return await aiService.getSemanticSuggestions(keyword)
    } catch (error) {
      console.error('语义联想失败:', error)
      return []
    }
  }, [])

  // 生成角色对话
  const generateDialogue = useCallback(async (character: string, context: string) => {
    try {
      const dialogue = await aiService.generateDialogue(character, context, state.writingStyle)
      return dialogue
    } catch (error) {
      console.error('对话生成失败:', error)
      return ''
    }
  }, [state.writingStyle])

  // 获取写作风格预设
  const getStylePresets = useCallback((): StylePreset[] => {
    return aiService.getStylePresets()
  }, [])

  // 获取环境音效
  const getEnvironmentSounds = useCallback((): EnvironmentSound[] => {
    return aiService.getEnvironmentSounds()
  }, [])

  // 保存当前版本
  const saveVersion = useCallback(() => {
    setState(prev => ({
      ...prev,
      versionHistory: [...prev.versionHistory, prev.content]
    }))
    message.success('版本已保存')
  }, [])

  // 恢复到指定版本
  const restoreVersion = useCallback((index: number) => {
    const versions = state.versionHistory
    if (index >= 0 && index < versions.length) {
      const versionContent = versions[index]
      updateContent(versionContent)
      message.success('已恢复到指定版本')
    }
  }, [state.versionHistory, updateContent])

  // 清理资源
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }
    }
  }, [])

  return {
    // 状态
    ...state,

    // 操作方法
    updateContent,
    updateCursorPosition,
    generateContent,
    generateParallelVersions,
    toggleImmersiveMode,
    toggleStoryMap,
    toggleInspirationPanel,
    updateGenerationParams,
    getSemanticSuggestions,
    generateDialogue,
    getStylePresets,
    getEnvironmentSounds,
    saveVersion,
    restoreVersion,

    // 计算属性
    wordCount: state.content.length,
    paragraphCount: state.content.split('\n\n').length,
    hasUnsavedChanges: state.versionHistory.length > 0,
  }
}