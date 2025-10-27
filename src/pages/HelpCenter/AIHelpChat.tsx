import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, List, Card, Typography, Spin, Space, message, Avatar, Alert } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import { useLLM } from '@/hooks/useLLM';
import { useDefaultModels } from '@/hooks/useDefaultModels';
import { useAIServiceStore } from '@/stores/aiServiceStore';

const { TextArea } = Input;
const { Paragraph, Title } = Typography;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIHelpChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是您的AI帮助助手，可以为您解答关于小说创作系统使用的问题。请问有什么我可以帮助您的吗？',
      timestamp: new Date()
    },
    {
      id: 'example1',
      role: 'assistant',
      content: '以下是一些您可以询问的示例问题：\n\n1. 如何创建新角色？\n2. 如何使用AI生成情节？\n3. 如何导出小说内容？\n4. 如何设置角色关系图？\n5. 如何使用提示词库？\n\n您可以直接问我任何关于小说创作系统使用的问题！',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { generateTextStream, response, streaming, configs, defaultConfig, defaultConfigId, clearResponse } = useLLM();
  const { getAllAvailableModels } = useDefaultModels();
  const [selectedConfigId, setSelectedConfigId] = useState<string | undefined>(undefined);
  const [lastProcessedResponse, setLastProcessedResponse] = useState<string | null>(null); // 添加这个状态来跟踪已处理的响应
  
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

  // 检查是否有AI配置或默认模型
  const hasAIConfig = configs.length > 0 || !!selectedConfigId || !!defaultConfigId;
  const hasDefaultConfig = !!defaultConfig || !!selectedConfigId || !!defaultConfigId;

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理AI响应
  useEffect(() => {
    console.log('AI响应更新:', { response, streaming, loading });
    if (response && !streaming && response !== lastProcessedResponse) {
      // 更新已处理的响应状态
      setLastProcessedResponse(response);
      
      // 移除思考提示消息
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('thinking_')));
      
      const newMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setLoading(false);
      console.log('添加AI消息:', newMessage);
    }
  }, [response, streaming, loading, lastProcessedResponse]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    try {
      console.log('发送消息:', inputValue);
      // 添加用户消息到聊天记录
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // 重置已处理的响应状态
      setLastProcessedResponse(null);
      
      // 立即添加思考提示
      const thinkingMessage: Message = {
        id: `thinking_${Date.now()}`,
        role: 'assistant',
        content: '正在思考中，请稍候...',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, thinkingMessage]);
      setLoading(true);
      
      // 构造发送给AI的完整提示词
      let fullPrompt = `你是一个专业的Novelcrafter使用帮助助手。请根据用户的问题提供准确、有用的解答。

以下是用户的问题：
${inputValue}

请以简洁明了的方式回答，回答的内容字数控制在200字以内，并提供具体的操作步骤或建议。如果问题涉及具体功能，请说明如何在界面中找到相关选项。`;

      console.log('调用AI服务:', { fullPrompt });
      // 调用AI服务，传递选定的配置ID
      await generateTextStream({
        prompt: fullPrompt,
        temperature: 0.7
      }, selectedConfigId || defaultConfigId || undefined);
      
      // 清空输入框
      setInputValue('');
    } catch (err) {
      console.error('发送消息失败:', err);
      message.error('发送消息失败，请检查AI配置或稍后重试');
      setLoading(false);
      
      // 添加错误消息到聊天记录
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: '抱歉，我无法回答您的问题。请确保已正确配置AI服务，或稍后重试。',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Card 
          style={{ 
            flex: 1, 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* 修改这里的条件判断，允许使用默认模型 */}
          {!hasAIConfig && !selectedConfigId && !defaultConfigId && (
            <Alert
              message="AI服务未配置"
              description={
                <div>
                  <p>请先配置AI服务才能使用AI助手功能，或者联系管理员配置默认AI模型。</p>
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<SettingOutlined />}
                    onClick={() => window.open('/llm-config', '_blank')}
                  >
                    前往配置AI服务
                  </Button>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}
          {(!hasAIConfig || !hasDefaultConfig) && selectedConfigId && (
            <Alert
              message="使用默认AI模型"
              description="当前正在使用管理员配置的默认AI模型。"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '400px'
          }}>
            <List
              dataSource={messages}
              renderItem={item => (
                <List.Item style={{ 
                  border: 'none', 
                  padding: '8px 0',
                  alignItems: item.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: item.role === 'user' ? 'row-reverse' : 'row',
                    width: '100%',
                    justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      maxWidth: '80%',
                      flexDirection: item.role === 'user' ? 'row-reverse' : 'row'
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
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                            }
                          }
                        >
                          {item.content}
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
            <div ref={messagesEndRef} />
          </div>
        </Card>
      </div>
      
      <div style={{ 
        padding: '16px 0 0 0',
        borderTop: '1px solid #f0f0f0'
      }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>常见问题：</div>
            <Space wrap>
              <Button size="small" onClick={() => setInputValue('如何创建新角色？')} disabled={loading}>
                创建角色
              </Button>
              <Button size="small" onClick={() => setInputValue('如何使用AI生成情节？')} disabled={loading}>
                AI生成情节
              </Button>
              <Button size="small" onClick={() => setInputValue('如何导出小说内容？')} disabled={loading}>
                导出内容
              </Button>
              <Button size="small" onClick={() => setInputValue('如何使用提示词库？')} disabled={loading}>
                提示词库
              </Button>
              <Button size="small" onClick={() => setInputValue('如何管理多个小说项目？')} disabled={loading}>
                管理项目
              </Button>
              <Button size="small" onClick={() => setInputValue('如何设置角色关系图？')} disabled={loading}>
                角色关系
              </Button>
              <Button size="small" onClick={() => setInputValue('如何构建世界观设定？')} disabled={loading}>
                世界观设定
              </Button>
              <Button size="small" onClick={() => setInputValue('如何使用团队协作功能？')} disabled={loading}>
                团队协作
              </Button>
            </Space>
          </div>
          <TextArea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onPressEnter={handleKeyPress}
            placeholder="请输入您的问题..."
            autoSize={{ minRows: 2, maxRows: 4 }}
            disabled={loading}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={handleSend}
              loading={loading}
              disabled={!inputValue.trim() || loading || (!hasAIConfig && !selectedConfigId && !defaultConfigId)}
            >
              发送
            </Button>
          </div>
        </Space>
      </div>
    </div>
  );
};

export default AIHelpChat;