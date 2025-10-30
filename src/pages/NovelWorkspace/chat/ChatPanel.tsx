import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, List, Card, Typography, Spin, Alert, Space, message, Avatar, Popconfirm } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, DeleteOutlined, ClearOutlined, LockOutlined } from '@ant-design/icons';
import { usePromptLibraryStore } from '@/stores/promptLibraryStore';
import { searchKnowledgeBase } from '@/utils/aiKnowledgeBaseUtils';
import type { Collection } from '#/promptLibrary';
import { useLLM } from '@/hooks/useLLM';
import { useDefaultModels } from '@/hooks/useDefaultModels';
import { hybridStorageService } from '@/services/hybridStorageService';
import { Message } from '@/services/chatStore';
import { useMembership } from '@/hooks/useMembership';
import { useNavigate } from 'react-router-dom';

interface ChatPanelProps {
  novelId: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ novelId }) => {
  const navigate = useNavigate();
  const { checkPermission, isFree } = useMembership();
  
  // 检查用户是否有访问权限
  const hasPermission = checkPermission('chat');
  
  // 如果没有权限，显示升级提示
  if (!hasPermission) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <Alert
          message="权限不足"
          description={
            <div>
              <p>当前功能需要基础会员或更高等级才能使用。</p>
              <p className="mt-2">
                <Button 
                  type="primary" 
                  onClick={() => navigate('/membership')}
                >
                  升级会员
                </Button>
              </p>
            </div>
          }
          type="warning"
          showIcon
          icon={<LockOutlined />}
        />
      </div>
    );
  }
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { collections } = usePromptLibraryStore();
  const { generateTextStream, response, streaming, defaultConfigId, clearResponse } = useLLM();
  const { getAllAvailableModels } = useDefaultModels();
  const [selectedConfigId, setSelectedConfigId] = useState<string | undefined>(undefined);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [lastProcessedResponse, setLastProcessedResponse] = useState<string | null>(null);
  // 添加状态来跟踪流式响应的显示内容
  const [streamingMessage, setStreamingMessage] = useState<{ id: string; content: string } | null>(null);
  const [displayedContent, setDisplayedContent] = useState('');
  const [contentIndex, setContentIndex] = useState(0);

  // 初始化时设置默认模型
  useEffect(() => {
    const initializeDefaultModel = async () => {
      try {
        const availableModels = await getAllAvailableModels();
        if (availableModels.length > 0) {
          // 优先使用默认模型（管理员配置的统一默认模型）
          const defaultModel = availableModels.find(model => model.isDefault);
          if (defaultModel) {
            setSelectedConfigId(defaultModel.id);
          } else {
            // 如果没有默认模型，使用第一个可用模型
            setSelectedConfigId(availableModels[0].id);
          }
        } else if (defaultConfigId) {
          // 回退到默认配置
          setSelectedConfigId(defaultConfigId);
        }
      } catch (error) {
        console.error('初始化默认模型失败:', error);
        // 如果初始化失败，仍然使用默认配置
        if (defaultConfigId) {
          setSelectedConfigId(defaultConfigId);
        }
      }
    };

    initializeDefaultModel();
  }, [defaultConfigId, getAllAvailableModels]);

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 加载聊天记录
  useEffect(() => {
    const loadChatHistory = async () => {
      if (novelId) {
        try {
          const chatData = await hybridStorageService.getChatHistory(novelId);
          if (chatData && chatData.messages) {
            // 确保时间戳是Date对象
            const messagesWithDates = chatData.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(messagesWithDates);
          }
        } catch (err) {
          console.error('加载聊天记录失败:', err);
        }
      }
    };

    loadChatHistory();
  }, [novelId]);

  // 保存聊天记录
  useEffect(() => {
    const saveChatHistory = async () => {
      if (novelId && messages.length > 0) {
        try {
          await hybridStorageService.saveChatHistory(novelId, { messages });
        } catch (err) {
          console.error('保存聊天记录失败:', err);
        }
      }
    };

    // 防抖保存
    const timeoutId = setTimeout(saveChatHistory, 1000);
    return () => clearTimeout(timeoutId);
  }, [messages, novelId]);

  // 添加本地流式检测状态
  const [localStreaming, setLocalStreaming] = useState(false);
  const responseUpdateTimer = useRef<NodeJS.Timeout | null>(null);
  // 添加流式消息ID跟踪
  const streamingMessageIdRef = useRef<string | null>(null);

  // 监听response变化来检测流式响应
  useEffect(() => {
    if (response && response.length > 0) {
      // 设置流式状态为true
      setLocalStreaming(true);
      
      // 清除之前的定时器
      if (responseUpdateTimer.current) {
        clearTimeout(responseUpdateTimer.current);
      }
      
      // 设置定时器，如果在一段时间内没有更新，认为流式结束
      responseUpdateTimer.current = setTimeout(() => {
        setLocalStreaming(false);
      }, 500); // 500ms内没有更新认为流式结束
    } else if (response === null || response === '') {
      // 如果response为空，确保流式状态为false
      setLocalStreaming(false);
    }
    
    // 清理函数
    return () => {
      if (responseUpdateTimer.current) {
        clearTimeout(responseUpdateTimer.current);
      }
    };
  }, [response]);

  // 处理AI响应，防止重复添加
  useEffect(() => {
    // 如果正在流式传输（本地检测或hook检测），跳过处理
    if (localStreaming || streaming) {
      return;
    }
    
    // 只有当有新的响应且不是正在处理且不是流式响应时才添加消息
    if (response && !isProcessingResponse && response !== lastProcessedResponse) {
      setIsProcessingResponse(true);
      setLastProcessedResponse(response);
      
      // 检查是否已经存在流式消息ID，如果存在则更新该消息，否则创建新消息
      const messageId = streamingMessageIdRef.current || `assistant_${Date.now()}`;
      
      const newMessage: Message = {
        id: messageId,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      // 如果是流式消息转换，更新现有消息；否则添加新消息
      if (streamingMessageIdRef.current) {
        setMessages(prev => {
          const existingMessageIndex = prev.findIndex(msg => msg.id === messageId);
          if (existingMessageIndex !== -1) {
            // 更新现有消息
            const updatedMessages = [...prev];
            updatedMessages[existingMessageIndex] = newMessage;
            return updatedMessages;
          } else {
            // 添加新消息
            return [...prev, newMessage];
          }
        });
      } else {
        // 添加新消息
        setMessages(prev => [...prev, newMessage]);
      }
      
      setLoading(false);
      clearResponse(); // 清除响应以避免重复处理
      
      // 重置处理状态和流式消息ID引用
      setTimeout(() => {
        setIsProcessingResponse(false);
        streamingMessageIdRef.current = null;
      }, 100);
    }
  }, [response, streaming, localStreaming, isProcessingResponse, lastProcessedResponse, clearResponse]);

  // 处理流式响应更新，添加打字机动画效果
  useEffect(() => {
    // 只有在流式传输且有响应时才处理
    if ((localStreaming || streaming) && response) {
      // 如果还没有创建流式消息，则创建一个
      if (!streamingMessage) {
        // 生成唯一的流式消息ID并保存
        const messageId = `streaming_${Date.now()}`;
        streamingMessageIdRef.current = messageId;
        
        const newStreamingMessage = {
          id: messageId,
          content: response
        };
        setStreamingMessage(newStreamingMessage);
        setContentIndex(0);
        setDisplayedContent('');
      } else {
        // 只有当新内容比当前流式消息内容长时才更新
        if (response.length > streamingMessage.content.length) {
          // 更新流式消息内容
          setStreamingMessage(prev => prev ? { ...prev, content: response } : null);
        }
      }
    }
  }, [response, localStreaming, streaming, streamingMessage, contentIndex, displayedContent.length]);

  // 监听流式状态结束，将流式消息转换为普通消息
  useEffect(() => {
    // 当流式状态结束且有流式消息时
    if (!localStreaming && !streaming && streamingMessage) {
      // 确保显示所有内容
      setDisplayedContent(streamingMessage.content);
      
      // 流式响应完成，将其转换为普通消息
      const newMessage: Message = {
        id: streamingMessage.id, // 使用原来的流式消息ID
        role: 'assistant',
        content: streamingMessage.content,
        timestamp: new Date()
      };
      
      // 更新消息列表，替换流式消息为普通消息
      setMessages(prev => {
        // 检查是否已经存在具有相同ID的消息
        const existingMessageIndex = prev.findIndex(msg => msg.id === streamingMessage.id);
        if (existingMessageIndex !== -1) {
          // 如果存在，替换它
          const updatedMessages = [...prev];
          updatedMessages[existingMessageIndex] = newMessage;
          return updatedMessages;
        } else {
          // 如果不存在，添加新消息
          return [...prev, newMessage];
        }
      });
      
      // 清理流式状态
      setStreamingMessage(null);
      setDisplayedContent('');
      setContentIndex(0);
      // 注意：不立即清理streamingMessageIdRef，而是在处理完响应后清理
    }
  }, [localStreaming, streaming, streamingMessage]);

  // 打字机动画效果，根据字符类型调整速度
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (streamingMessage && contentIndex < streamingMessage.content.length) {
      const currentChar = streamingMessage.content.charAt(contentIndex);
      
      // 根据字符类型调整延迟时间
      let delay = 10; // 默认延迟
      
      // 如果是标点符号，增加延迟以模拟停顿
      if (/[，。！？；：、]/.test(currentChar)) {
        delay = 100; // 标点符号停顿100ms
      } else if (/[,.!?;:]/.test(currentChar)) {
        delay = 50; // 英文标点符号停顿50ms
      } else if (/\s/.test(currentChar)) {
        delay = 5; // 空格延迟5ms
      }
      
      timer = setTimeout(() => {
        setDisplayedContent(prev => prev + currentChar);
        setContentIndex(prev => prev + 1);
      }, delay);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [contentIndex, streamingMessage, displayedContent.length]);

  // 清空对话记录
  const clearChatHistory = async () => {
    setMessages([]);
    setLastProcessedResponse(null);
    // 清理流式状态
    setStreamingMessage(null);
    setDisplayedContent('');
    setContentIndex(0);
    streamingMessageIdRef.current = null;
    try {
      await hybridStorageService.clearChatHistory(novelId);
      message.success('对话记录已清空');
    } catch (err) {
      console.error('清空聊天记录失败:', err);
      message.error('清空聊天记录失败');
    }
  };

  // 删除单条消息
  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    message.success('消息已删除');
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    try {
      // 添加用户消息到聊天记录
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      setLoading(true);
      setError(null);
      setLastProcessedResponse(null); // 重置已处理的响应
      
      // 构建对话历史上下文（只保留最近几轮对话）
      let conversationContext = '';
      const recentMessages = [...messages, userMessage].slice(-4); // 保留最近2轮对话
      recentMessages.forEach(msg => {
        const contentPreview = msg.content.length > 200 
          ? msg.content.substring(0, 200) + '...' 
          : msg.content;
        conversationContext += `${msg.role === 'user' ? '用户' : '助手'}: ${contentPreview}\n`;
      });
      
      // 构造发送给AI的完整提示词
      let fullPrompt = `你是一个专业的网文写作助手，专门为中文网络小说创作者提供帮助，涵盖玄幻、仙侠、都市、言情、历史、科幻、悬疑、游戏、体育、军事等各类小说类型。你的职责包括但不限于：

1. 协助用户构思小说标题、简介、情节、人物设定、世界观构建
2. 提供针对不同小说类型的写作技巧和创作建议
3. 帮助润色和优化文本内容
4. 协助解决创作过程中遇到的各种问题

请遵循以下原则与用户交互：
- 使用亲切、专业的语调
- 回答具体、实用，避免空泛的建议
- 结合用户提供的上下文信息进行个性化回答
- 保持创造性，但不要编造用户未提及的信息
- 针对不同小说类型提供专业化的建议

`;
      
      // 添加知识库检索指令说明
      fullPrompt += '你可以访问以下知识库内容结合你的专业能力来回答用户问题：\n';
      fullPrompt += '使用"@search(keyword)"指令来检索知识库中的相关内容，例如：@search(凡人修仙传)\n\n';
      
      // 添加对话历史上下文
      if (conversationContext) {
        fullPrompt += `【对话历史】\n${conversationContext}\n`;
      }
      
      // 检查是否包含搜索指令
      const searchMatch = inputValue.match(/@search\(([^)]+)\)/);
      if (searchMatch) {
        const keyword = searchMatch[1];
        try {
          const searchResults = await searchKnowledgeBase(collections, keyword, 2000);
          fullPrompt += `
知识库搜索结果:
${searchResults}

`;
        } catch (error) {
          console.error('知识库搜索失败:', error);
          fullPrompt += `
知识库搜索结果:
搜索失败，请稍后重试。

`;
        }
      }
      
      // 添加当前用户输入
      fullPrompt += `\n用户: ${inputValue}`;

      // 调用AI服务，传递选定的配置ID
      await generateTextStream(
        {
          prompt: fullPrompt,
          temperature: 0.7
        },
        selectedConfigId || defaultConfigId || undefined
      );
      
      // 清空输入框
      setInputValue('');
    } catch (err) {
      console.error('发送消息失败:', err);
      setError(err instanceof Error ? err.message : '发送消息失败');
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: '抱歉，我无法处理您的请求。请稍后重试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
    }
  };

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card 
        title="AI创作聊天助手" 
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
        extra={
          <Space>
            <Popconfirm
              title="确定要清空所有对话记录吗？"
              onConfirm={clearChatHistory}
              okText="确定"
              cancelText="取消"
            >
              <Button icon={<ClearOutlined />} size="small">清空记录</Button>
            </Popconfirm>
          </Space>
        }
      >
        {/* 消息列表 - 添加滚动条 */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px',
          boxSizing: 'border-box'
        }}
        className="chat-messages-container overflow-y-auto"
        >
          <List
            dataSource={messages}
            renderItem={item => (
              <List.Item 
                style={{ 
                  border: 'none', 
                  padding: '8px 0',
                  alignItems: item.role === 'user' ? 'flex-end' : 'flex-start',
                  flexDirection: item.role === 'user' ? 'row' : 'row-reverse'
                }}
                actions={
                  item.role === 'user' ? [
                    <Popconfirm
                      title="确定要删除这条消息吗？"
                      onConfirm={() => deleteMessage(item.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="text" icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                  ] : []
                }
              >
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  width: '100%',
                  justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{ 
                    display: 'flex',
                    maxWidth: '80%',
                    flexDirection: item.role === 'user' ? 'row' : 'row-reverse'
                  }}>
                    <Avatar 
                      icon={item.role === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                      style={{ 
                        backgroundColor: item.role === 'user' ? '#1890ff' : '#f0f0f0',
                        color: item.role === 'user' ? '#fff' : 'rgba(0, 0, 0, 0.65)',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ 
                      margin: '0 12px',
                      textAlign: item.role === 'user' ? 'right' : 'left'
                    }}>
                      <div 
                        style={
                          {
                            display: 'inline-block',
                            padding: '12px 16px',
                            borderRadius: '16px',
                            backgroundColor: item.role === 'user' ? '#1890ff' : '#f0f0f0',
                            color: item.role === 'user' ? '#fff' : 'rgba(0, 0, 0, 0.85)',
                            textAlign: 'left',
                            maxWidth: '100%',
                            wordWrap: 'break-word',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                            whiteSpace: 'pre-wrap'  // 保持换行和空格
                          }
                        }
                      >
                        <Typography.Text>{item.content}</Typography.Text>
                      </div>
                      <div 
                        style={{ 
                          fontSize: '12px', 
                          color: '#999', 
                          marginTop: '4px',
                          textAlign: item.role === 'user' ? 'right' : 'left'
                        }}
                      >
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
          {/* 渲染流式消息 */}
          {streamingMessage && (
            <List.Item 
              style={{ 
                border: 'none', 
                padding: '8px 0',
                alignItems: 'flex-start',
                flexDirection: 'row-reverse'
              }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'row',
                width: '100%',
                justifyContent: 'flex-start'
              }}>
                <div style={{ 
                  display: 'flex',
                  maxWidth: '80%',
                  flexDirection: 'row-reverse'
                }}>
                  <Avatar 
                    icon={<RobotOutlined />} 
                    style={{ 
                      backgroundColor: '#f0f0f0',
                      color: 'rgba(0, 0, 0, 0.65)',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ 
                    margin: '0 12px',
                    textAlign: 'left'
                  }}>
                    <div 
                      style={
                        {
                          display: 'inline-block',
                          padding: '12px 16px',
                          borderRadius: '16px',
                          backgroundColor: '#f0f0f0',
                          color: 'rgba(0, 0, 0, 0.85)',
                          textAlign: 'left',
                          maxWidth: '100%',
                          wordWrap: 'break-word',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                          whiteSpace: 'pre-wrap'  // 保持换行和空格
                        }
                      }
                    >
                      <Typography.Text>
                        {displayedContent}
                      </Typography.Text>
                    </div>
                    <div 
                      style={{ 
                        fontSize: '12px', 
                        color: '#999', 
                        marginTop: '4px',
                        textAlign: 'left'
                      }}
                    >
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            </List.Item>
          )}
          {loading && !streaming && (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Spin size="small" />
              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>AI正在思考中...</Typography.Text>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* 输入区域 - 固定在底部 */}
        <div style={{ 
          padding: '16px', 
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
          flexShrink: 0
        }}>
          {error && (
            <Alert 
              message="发送失败" 
              description={error} 
              type="error" 
              showIcon 
              style={{ marginBottom: 16 }}
            />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Input.TextArea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onPressEnter={handleKeyPress}
              placeholder="输入您的创作问题或想法... (使用 @search(关键词) 来检索知识库)"
              autoSize={{ minRows: 2, maxRows: 4 }}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              disabled={!inputValue.trim() || loading}
              style={{ height: 'auto' }}
            >
              发送
            </Button>
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#999', 
            marginTop: 8,
            textAlign: 'center'
          }}>
            与AI讨论您的创作想法，获取专业的写作建议
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatPanel;