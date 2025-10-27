import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, List, Card, Typography, Spin, Alert, Space, message, Avatar, Popconfirm } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import { usePromptLibraryStore } from '@/stores/promptLibraryStore';
import { searchKnowledgeBase } from '@/utils/aiKnowledgeBaseUtils';
import type { Collection } from '#/promptLibrary';
import { useLLM } from '@/hooks/useLLM';
import { useDefaultModels } from '@/hooks/useDefaultModels';
import { hybridStorageService } from '@/services/hybridStorageService';
import { Message } from '@/services/chatStore';

interface ChatPanelProps {
  novelId: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ novelId }) => {
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

  // 处理AI响应，防止重复添加
  useEffect(() => {
    // 只有当有新的响应且不是正在处理时才添加消息
    if (response && !streaming && !isProcessingResponse && response !== lastProcessedResponse) {
      setIsProcessingResponse(true);
      setLastProcessedResponse(response);
      
      const newMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setLoading(false);
      clearResponse(); // 清除响应以避免重复处理
      
      // 重置处理状态
      setTimeout(() => {
        setIsProcessingResponse(false);
      }, 100);
    }
  }, [response, streaming, isProcessingResponse, lastProcessedResponse, clearResponse]);

  // 清空对话记录
  const clearChatHistory = async () => {
    setMessages([]);
    setLastProcessedResponse(null);
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
      let fullPrompt = '你是一个专业的网文写作助手。请根据用户的需求提供创作建议和帮助。\n\n';
      
      // 添加知识库检索指令说明
      fullPrompt += '你可以访问以下知识库内容来回答用户问题：\n';
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
          console.log('Searching knowledge base in chat with keyword:', keyword);
          console.log('Collections available for chat search:', collections.length);
          // 添加调试信息，检查collections的内容
          collections.forEach((collection, index) => {
            console.log(`Chat Collection ${index}:`, collection.attributes.name, collection.type);
          });
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
                style={{ border: 'none', padding: '8px 0' }}
                actions={[
                  <Popconfirm
                    title="确定要删除这条消息吗？"
                    onConfirm={() => deleteMessage(item.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="text" icon={<DeleteOutlined />} size="small" />
                  </Popconfirm>
                ]}
              >
                <div style={{ 
                  display: 'flex', 
                  width: '100%',
                  flexDirection: item.role === 'user' ? 'row-reverse' : 'row'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    maxWidth: '80%'
                  }}>
                    <Avatar 
                      icon={item.role === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                      style={{ 
                        backgroundColor: item.role === 'user' ? '#1890ff' : '#52c41a',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ 
                      marginLeft: item.role === 'user' ? 0 : 12, 
                      marginRight: item.role === 'user' ? 12 : 0,
                      textAlign: item.role === 'user' ? 'right' : 'left'
                    }}>
                      <div style={{ 
                        backgroundColor: item.role === 'user' ? '#e6f7ff' : '#f6ffed',
                        borderRadius: 8,
                        padding: '8px 12px',
                        display: 'inline-block',
                        maxWidth: '100%',
                        wordBreak: 'break-word'
                      }}>
                        <Typography.Text>{item.content}</Typography.Text>
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999', 
                        marginTop: 4,
                        textAlign: item.role === 'user' ? 'right' : 'left'
                      }}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
          {loading && (
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