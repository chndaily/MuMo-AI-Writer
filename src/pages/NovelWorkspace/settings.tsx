import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Card, Form, Input, Button, Switch, Select, Upload, message, Spin, Alert, Space } from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { useLLMConfigStore } from '@/stores/llmConfigStore';
import { useSupabaseConfigStore } from '@/stores/supabaseConfigStore';
import { useParams } from '@/router/hooks';
import { useAIServiceStore } from '@/stores/aiServiceStore';
import { defaultModelService } from '@/services/defaultModelService';
import { useDefaultModels } from '@/hooks/useDefaultModels';

const { TabPane } = Tabs;
const { Option } = Select;

// 扩展Novel接口以包含设置相关的字段
interface NovelSettings {
  writingPreferences?: {
    wordCountGoal?: number;
    autoSave?: boolean;
    autoSaveInterval?: number;
    showWordCount?: boolean;
  };
  aiSettings?: {
    enableAI?: boolean;
    aiModel?: string;
    temperature?: number;
    maxTokens?: number;
  };
  exportSettings?: {
    defaultFormat?: 'txt' | 'docx' | 'pdf' | 'epub' | 'markdown';
    includeOutline?: boolean;
    includeCharacters?: boolean;
    includeWorldSettings?: boolean;
  };
}

interface SettingsPageProps {
  novelId: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ novelId }) => {
  // 直接使用 databaseManager 获取数据
  const [novels, setNovels] = useState<any[]>([]);
  const [currentNovel, setCurrentNovel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const updateNovel = async (id: string, updates: any) => {
    const { databaseManager } = await import('@/services/index');
    const novel = await databaseManager.novels.getNovel(id);
    if (novel) {
      await databaseManager.novels.updateNovel({ ...novel, ...updates });
    }
  };
  
  // 获取当前小说信息
  const fetchCurrentNovel = async () => {
    setLoading(true);
    try {
      const { databaseManager } = await import('@/services/index');
      const novel = await databaseManager.novels.getNovel(novelId);
      setCurrentNovel(novel);
    } catch (error) {
      console.error('获取小说信息失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 刷新小说数据
  const refreshNovels = async () => {
    const { databaseManager } = await import('@/services/index');
    // 修改为只获取当前用户的小说
    const { useMembershipStore } = await import('@/stores/membershipStore');
    const { membershipInfo } = useMembershipStore.getState();
    const novelsData = await databaseManager.novels.getNovelsByUserId(membershipInfo.email || 'anonymous');
    setNovels(novelsData);
  };
  const { getAllConfigs, getDefaultConfig } = useLLMConfigStore();
  const [form] = Form.useForm();
  const [llmConfigs, setLlmConfigs] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  
  // 使用useDefaultModels hook获取模型数据
  const defaultModelsData = useDefaultModels();
  
  // 获取可用模型
  const fetchAvailableModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const models = await defaultModelsData.getAllAvailableModels();
      setAvailableModels(models);
    } catch (error) {
      console.error('获取可用模型失败:', error);
    } finally {
      setLoadingModels(false);
    }
  }, []);
  
  useEffect(() => {
    fetchAvailableModels();
  }, [fetchAvailableModels]);
  
  // 组件加载时获取当前小说信息
  useEffect(() => {
    fetchCurrentNovel();
    refreshNovels();
  }, [novelId]);
  
  // 基本信息表单初始值
  const [basicInfoInitialValues, setBasicInfoInitialValues] = useState({
    title: currentNovel?.title || '',
    author: currentNovel?.author || '',
    description: currentNovel?.description || '',
    genre: currentNovel?.genre || '',
    status: currentNovel?.status || 'draft',
  });
  
  // 当小说数据变化时更新表单初始值
  useEffect(() => {
    setBasicInfoInitialValues({
      title: currentNovel?.title || '',
      author: currentNovel?.author || '',
      description: currentNovel?.description || '',
      genre: currentNovel?.genre || '',
      status: currentNovel?.status || 'draft',
    });
    
    // 更新表单字段值
    if (form && currentNovel) {
      form.setFieldsValue({
        title: currentNovel.title || '',
        author: currentNovel.author || '',
        description: currentNovel.description || '',
        genre: currentNovel.genre || '',
        status: currentNovel.status || 'draft',
      });
    }
  }, [currentNovel, form]);
  
  // 加载LLM配置
  useEffect(() => {
    try {
      const configs = getAllConfigs();
      setLlmConfigs(configs);
      setLoading(false);
    } catch (error) {
      console.error('加载LLM配置失败:', error);
      message.error('加载AI模型配置失败');
      setLoading(false);
    }
  }, [getAllConfigs]);
  
  // 保存基本信息
  const onSaveBasicInfo = async (values: any) => {
    try {
      if (currentNovel && novelId) {
        await updateNovel(novelId, {
          ...values,
          lastModified: new Date().toISOString()
        });
        message.success('保存成功');
      }
    } catch (error) {
      message.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };
  
  // 处理封面图片上传
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(currentNovel?.coverImage || null);
  
  const handleCoverUpload = (file: any) => {
    try {
      // 检查文件类型
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
        return false;
      }
      
      // 检查文件大小 (限制为2MB)
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过2MB!');
        return false;
      }
      
      // 保存文件和预览
      setCoverImageFile(file);
      
      // 生成预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      return false; // 阻止自动上传
    } catch (error) {
      message.error('文件处理失败: ' + (error instanceof Error ? error.message : '未知错误'));
      return false;
    }
  };
  
  // 保存封面图片
  const onSaveCoverImage = async () => {
    try {
      if (currentNovel && novelId && (coverImageFile || currentNovel.coverImage)) {
        let coverImageToSave = currentNovel.coverImage || '';
        
        // 如果有新文件，处理上传
        if (coverImageFile) {
          // 将图片转换为base64格式
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64Image = e.target?.result as string;
            coverImageToSave = base64Image;
            
            // 保存到数据库
            await updateNovel(novelId, {
              ...currentNovel,
              coverImage: coverImageToSave,
              lastModified: new Date().toISOString()
            });
            
            // 同步到云端（如果启用了Supabase）
            const { client, isEnabled } = useSupabaseConfigStore.getState();
            if (isEnabled && client) {
              try {
                await client
                  .from('novels')
                  .upsert({
                    id: novelId,
                    title: currentNovel.title,
                    content: currentNovel.content,
                    genre: currentNovel.genre,
                    word_count: currentNovel.wordCount,
                    progress: currentNovel.progress,
                    status: currentNovel.status,
                    description: currentNovel.description,
                    tags: currentNovel.tags,
                    cover_image: coverImageToSave,
                    author: currentNovel.author,
                    target_word_count: currentNovel.targetWordCount,
                    is_public: currentNovel.isPublic,
                    created_at: currentNovel.createdAt,
                    last_modified: new Date().toISOString()
                  });
                message.success('封面图片已保存并同步到云端');
              } catch (error) {
                console.error('同步到云端失败:', error);
                message.warning('封面图片已保存到本地，但同步到云端失败');
              }
            } else {
              message.success('封面图片已保存到本地');
            }
          };
          reader.readAsDataURL(coverImageFile);
        } else {
          // 没有新文件，但可能需要同步现有封面到云端
          await updateNovel(novelId, {
            ...currentNovel,
            lastModified: new Date().toISOString()
          });
          
          // 同步到云端（如果启用了Supabase）
          const { client, isEnabled } = useSupabaseConfigStore.getState();
          if (isEnabled && client) {
            try {
              await client
                .from('novels')
                .upsert({
                  id: novelId,
                  title: currentNovel.title,
                  content: currentNovel.content,
                  genre: currentNovel.genre,
                  word_count: currentNovel.wordCount,
                  progress: currentNovel.progress,
                  status: currentNovel.status,
                  description: currentNovel.description,
                  tags: currentNovel.tags,
                  cover_image: coverImageToSave,
                  author: currentNovel.author,
                  target_word_count: currentNovel.targetWordCount,
                  is_public: currentNovel.isPublic,
                  created_at: currentNovel.createdAt,
                  last_modified: new Date().toISOString()
                });
              message.success('封面图片信息已同步到云端');
            } catch (error) {
              console.error('同步到云端失败:', error);
              message.warning('封面图片信息已保存到本地，但同步到云端失败');
            }
          } else {
            message.success('封面图片信息已保存到本地');
          }
        }
      } else {
        message.info('请先选择一张图片');
      }
    } catch (error) {
      message.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };
  
  // 移除封面图片
  const onRemoveCoverImage = async () => {
    try {
      if (currentNovel && novelId) {
        // 从数据库中移除封面图片
        await updateNovel(novelId, {
          ...currentNovel,
          coverImage: undefined,
          lastModified: new Date().toISOString()
        });
        
        // 同步到云端（如果启用了Supabase）
        const { client, isEnabled } = useSupabaseConfigStore.getState();
        if (isEnabled && client) {
          try {
            await client
              .from('novels')
              .upsert({
                id: novelId,
                title: currentNovel.title,
                content: currentNovel.content,
                genre: currentNovel.genre,
                word_count: currentNovel.wordCount,
                progress: currentNovel.progress,
                status: currentNovel.status,
                description: currentNovel.description,
                tags: currentNovel.tags,
                cover_image: null,
                author: currentNovel.author,
                target_word_count: currentNovel.targetWordCount,
                is_public: currentNovel.isPublic,
                created_at: currentNovel.createdAt,
                last_modified: new Date().toISOString()
              });
            message.success('封面图片已移除并同步到云端');
          } catch (error) {
            console.error('同步到云端失败:', error);
            message.warning('封面图片已从本地移除，但同步到云端失败');
          }
        } else {
          message.success('封面图片已从本地移除');
        }
        
        // 清除状态
        setCoverImageFile(null);
        setCoverImagePreview(null);
      }
    } catch (error) {
      message.error('移除失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };
  
  // 保存写作偏好
  const onSaveWritingPreferences = async (values: any) => {
    try {
      if (currentNovel && novelId) {
        await updateNovel(novelId, {
          ...(currentNovel as any),
          writingPreferences: values,
          lastModified: new Date().toISOString()
        });
        message.success('保存成功');
      }
    } catch (error) {
      message.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };
  
  // 保存AI设置
  const onSaveAISettings = async (values: any) => {
    try {
      if (currentNovel && novelId) {
        await updateNovel(novelId, {
          ...(currentNovel as any),
          aiSettings: values,
          lastModified: new Date().toISOString()
        });
        message.success('保存成功');
      }
    } catch (error) {
      message.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };
  
  // 保存导出设置
  const onSaveExportSettings = async (values: any) => {
    try {
      if (currentNovel && novelId) {
        await updateNovel(novelId, {
          ...(currentNovel as any),
          exportSettings: values,
          lastModified: new Date().toISOString()
        });
        message.success('保存成功');
      }
    } catch (error) {
      message.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  return (
    <div className="p-6 h-full overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 20px)' }}>
      <h1 className="text-2xl font-bold mb-6">小说设置</h1>
      
      <div className="flex-1 overflow-hidden">
        <Tabs defaultActiveKey="1" className="h-full flex flex-col">
          {/* 基本信息 */}
          <TabPane tab="基本信息" key="1" className="h-full overflow-hidden">
            <div className="h-full overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="space-y-6 pb-6">
                <Card title="小说基本信息">
                  <Form
                    form={form}
                    initialValues={basicInfoInitialValues}
                    onFinish={onSaveBasicInfo}
                    layout="vertical"
                  >
                    <Form.Item
                      name="title"
                      label="小说标题"
                      rules={[{ required: true, message: '请输入小说标题' }]}
                    >
                      <Input placeholder="请输入小说标题" />
                    </Form.Item>
                    
                    <Form.Item
                      name="author"
                      label="作者"
                      rules={[{ required: true, message: '请输入作者姓名' }]}
                    >
                      <Input placeholder="请输入作者姓名" />
                    </Form.Item>
                    
                    <Form.Item
                      name="description"
                      label="小说简介"
                    >
                      <Input.TextArea rows={4} placeholder="请输入小说简介" />
                    </Form.Item>
                    
                    <Form.Item
                      name="genre"
                      label="小说类型"
                    >
                      <Select
                        placeholder="请选择小说类型"
                        allowClear
                      >
                        <Option value="fantasy">奇幻</Option>
                        <Option value="sci-fi">科幻</Option>
                        <Option value="romance">言情</Option>
                        <Option value="mystery">悬疑</Option>
                        <Option value="thriller">惊悚</Option>
                        <Option value="horror">恐怖</Option>
                        <Option value="adventure">冒险</Option>
                        <Option value="historical">历史</Option>
                        <Option value="biography">传记</Option>
                        <Option value="other">其他</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name="status"
                      label="创作状态"
                    >
                      <Select placeholder="请选择创作状态">
                        <Option value="draft">草稿</Option>
                        <Option value="writing">创作中</Option>
                        <Option value="editing">编辑中</Option>
                        <Option value="published">已发布</Option>
                        <Option value="archived">已归档</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item>
                      <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                        保存基本信息
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
                
                <Card title="封面图片">
                  <Form 
                    layout="vertical"
                  >
                    <Form.Item
                      label="上传封面"
                      extra="建议尺寸: 300x400 像素，支持JPG、PNG格式，大小不超过2MB"
                    >
                      <Upload
                        name="cover"
                        listType="picture"
                        maxCount={1}
                        beforeUpload={handleCoverUpload}
                        showUploadList={false}
                      >
                        <Button icon={<UploadOutlined />}>选择文件</Button>
                      </Upload>
                    </Form.Item>
                      
                    {/* 封面图片预览 */}
                    {coverImagePreview && (
                      <div className="mb-4">
                        <div className="relative inline-block">
                          <img 
                            src={coverImagePreview} 
                            alt="封面预览" 
                            style={{ 
                              maxWidth: '200px', 
                              maxHeight: '250px', 
                              border: '1px solid #d9d9d9', 
                              borderRadius: '4px',
                              objectFit: 'cover'
                            }} 
                          />
                          <Button 
                            type="link" 
                            danger 
                            size="small" 
                            onClick={onRemoveCoverImage}
                            style={{ position: 'absolute', top: '-10px', right: '-10px' }}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    )}
                      
                    <Form.Item>
                      <Space>
                        <Button 
                          type="primary" 
                          icon={<SaveOutlined />} 
                          onClick={onSaveCoverImage}
                          disabled={!coverImageFile && !currentNovel?.coverImage}
                        >
                          保存封面
                        </Button>
                        {currentNovel?.coverImage && !coverImageFile && (
                          <Button 
                            danger 
                            onClick={onRemoveCoverImage}
                          >
                            移除现有封面
                          </Button>
                        )}
                      </Space>
                    </Form.Item>
                  </Form>
                </Card>
              </div>
            </div>
          </TabPane>
          
          {/* 写作偏好 */}
          <TabPane tab="写作偏好" key="2" className="h-full overflow-hidden">
            <div className="h-full overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="space-y-6 pb-6">
                <Card title="写作偏好设置">
                  <Form
                    layout="vertical"
                    initialValues={currentNovel?.['writingPreferences'] || {}}
                    onFinish={onSaveWritingPreferences}
                  >
                    <Form.Item
                      name="wordCountGoal"
                      label="每日字数目标"
                    >
                      <Input type="number" placeholder="例如: 2000" addonAfter="字" />
                    </Form.Item>
                    
                    <Form.Item
                      name="autoSave"
                      label="自动保存"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    
                    <Form.Item
                      name="autoSaveInterval"
                      label="自动保存间隔(分钟)"
                    >
                      <Input type="number" placeholder="例如: 5" />
                    </Form.Item>
                    
                    <Form.Item
                      name="showWordCount"
                      label="显示字数统计"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    
                    <Form.Item>
                      <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                        保存写作偏好
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </div>
            </div>
          </TabPane>
          
          {/* AI设置 */}
          <TabPane tab="AI设置" key="3" className="h-full overflow-hidden">
            <div className="h-full overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="space-y-6 pb-6">
                <Card title="AI辅助写作设置">
                  <Spin spinning={loading}>
                    <Form
                      layout="vertical"
                      initialValues={{
                        ...(currentNovel?.['aiSettings'] || {}),
                        aiModel: currentNovel?.['aiSettings']?.aiModel || (getDefaultConfig()?.id || undefined)
                      }}
                      onFinish={onSaveAISettings}
                    >
                      <Form.Item
                        name="enableAI"
                        label="启用AI辅助"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                      
                      <Form.Item
                        name="aiModel"
                        label="AI模型"
                        extra={llmConfigs.length === 0 ? "请先在AI模型配置页面添加模型配置" : ""}
                      >
                        <Select 
                          placeholder="请选择AI模型" 
                          disabled={loadingModels || (llmConfigs.length === 0 && availableModels.length === 0)}
                          loading={loadingModels}
                        >
                          {availableModels.map(config => (
                            <Option key={config.id} value={config.id}>
                              {config.name} {config.model ? `(${config.model})` : ''}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      {llmConfigs.length === 0 && availableModels.length === 0 && !loadingModels && (
                        <Alert
                          message="提示"
                          description="暂无AI模型配置，请先到AI模型配置页面添加模型配置。"
                          type="info"
                          showIcon
                          className="mb-4"
                        />
                      )}
                      
                      <Form.Item
                        name="temperature"
                        label="创造性(温度)"
                      >
                        <Input type="number" min={0} max={1} step={0.1} placeholder="例如: 0.7" />
                      </Form.Item>
                      
                      <Form.Item
                        name="maxTokens"
                        label="最大输出长度"
                      >
                        <Input type="number" placeholder="例如: 1000" />
                      </Form.Item>
                      
                      <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                          保存AI设置
                        </Button>
                      </Form.Item>
                    </Form>
                  </Spin>
                </Card>
              </div>
            </div>
          </TabPane>
          
          {/* 导出设置 */}
          <TabPane tab="导出设置" key="4" className="h-full overflow-hidden">
            <div className="h-full overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="space-y-6 pb-6">
                <Card title="导出格式设置">
                  <Form 
                    layout="vertical"
                    initialValues={currentNovel?.['exportSettings'] || {}}
                    onFinish={onSaveExportSettings}
                  >
                    <Form.Item
                      name="defaultFormat"
                      label="默认导出格式"
                    >
                      <Select placeholder="请选择默认导出格式">
                        <Option value="txt">TXT 文本</Option>
                        <Option value="docx">DOCX 文档</Option>
                        <Option value="pdf">PDF 文档</Option>
                        <Option value="epub">EPUB 电子书</Option>
                        <Option value="markdown">Markdown</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name="includeOutline"
                      label="导出时包含大纲"
                      valuePropName="checked"
                    >
                      <Switch defaultChecked />
                    </Form.Item>
                    
                    <Form.Item
                      name="includeCharacters"
                      label="导出时包含角色设定"
                      valuePropName="checked"
                    >
                      <Switch defaultChecked />
                    </Form.Item>
                    
                    <Form.Item
                      name="includeWorldSettings"
                      label="导出时包含世界观设定"
                      valuePropName="checked"
                    >
                      <Switch defaultChecked />
                    </Form.Item>
                    
                    <Form.Item>
                      <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                        保存导出设置
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;