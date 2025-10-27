import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  Space, 
  Card, 
  Typography, 
  message, 
  Tabs, 
  Upload, 
  List,
  Progress,
  Switch,
  Tag // 导入Tag组件
} from 'antd';
import { 
  MinusCircleOutlined, 
  PlusOutlined, 
  UploadOutlined,
  DeleteOutlined, // 导入DeleteOutlined图标
  FileTextOutlined // 导入FileTextOutlined图标
} from '@ant-design/icons';
import { CollectionType, PromptType, PromptMessage, PromptModel, Collection, AttachmentInfo } from '#/promptLibrary'; // 导入AttachmentInfo类型
import { generateUUID } from '@/utils';
import dayjs from 'dayjs';
import { usePromptLibraryStore } from '@/stores/promptLibraryStore';
import { useNovelPromptLibraryStore } from '@/stores/novelPromptLibraryStore'; // 导入小说特定提示词库store

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

// 自定义集合类型枚举，用于UI显示
type CustomCollectionType = 
  | CollectionType.Personas
  | CollectionType.Models
  | CollectionType.Defaults
  | CollectionType.Presets
  | 'creative-assistance'
  | 'content-processing'
  | 'text-editing'
  | 'case-library';

interface EditPromptFormProps {
  collection?: Collection | null;
  onCancel: () => void;
  onSuccess: () => void;
}

// 添加一个辅助函数来从集合名称获取提示词类型
const getPromptTypeFromCollectionName = (name: string): string => {
  if (name.includes('经典')) {
    return 'classic-prompt';
  }
  return PromptType.Other; // 对于案例库类，应该使用PromptType.Other
};

// 定义不同集合类型对应的提示词类型选项
const getPromptTypeOptions = (collectionType: CustomCollectionType | null) => {
  switch (collectionType) {
    case 'creative-assistance':
      return [
        { value: PromptType.Component, label: '提示词组件（Prompt Components）' },
        { value: PromptType.WorkshopChat, label: '工作坊对话（Workshop Chats）' },
      ];
    case 'content-processing':
      return [
        { value: PromptType.SceneSummarization, label: '场景摘要（Scene Summaries）' },
        { value: PromptType.SceneBeatCompletion, label: '场景补全（Scene Completions）' },
        { value: PromptType.SceneCharacterDetection, label: '场景角色检测（Scene Character Detection）' },
      ];
    case 'text-editing':
      return [
        { value: PromptType.ManuscriptReplacement, label: '文本替换（Text Replacements）' },
        { value: PromptType.ManuscriptCompletion, label: '文本补全（Text Completion）' },
      ];
    case 'case-library':
      // 为案例库类保持使用PromptType.Other
      return [
        { value: PromptType.Other, label: '案例库（Case Library）' }
      ];
    case CollectionType.Personas:
      // 角色设定类型不使用提示词类型
      return [];
    default:
      // 默认选项包含所有类型
      return [
        { value: PromptType.Component, label: '提示词组件（Prompt Components）' },
        { value: PromptType.WorkshopChat, label: '工作坊对话（Workshop Chats）' },
        { value: PromptType.SceneSummarization, label: '场景摘要（Scene Summaries）' },
        { value: PromptType.SceneBeatCompletion, label: '场景补全（Scene Completions）' },
        { value: PromptType.SceneCharacterDetection, label: '场景角色检测（Scene Character Detection）' },
        { value: PromptType.ManuscriptReplacement, label: '文本替换（Text Replacements）' },
        { value: PromptType.ManuscriptCompletion, label: '文本补全（Text Completion）' },
        { value: PromptType.Other, label: '其它（Other）' },
      ];
  }
};

// 集合类型选项
const collectionTypeOptions = [
  { value: CollectionType.Personas, label: '角色设定（Character Settings）' },
  { value: 'creative-assistance', label: '创作辅助类（Creative Assistance）' },
  { value: 'content-processing', label: '内容处理类（Content Processing）' },
  { value: 'text-editing', label: '文本编辑类（Text Editing）' },
  { value: 'case-library', label: '案例库类（Case Library）' },
  { value: CollectionType.Models, label: '模型集合（Model Collections）' },
  { value: CollectionType.Defaults, label: '默认设置（Defaults）' },
  { value: CollectionType.Presets, label: '预设（Presets）' },
];

// 默认消息模板
const defaultMessageTemplate: PromptMessage = {
  type: 'system',
  text: '',
  format: 'aic2'
};

const EditPromptForm: React.FC<EditPromptFormProps> = ({ collection, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const { addCollection, updateCollection } = usePromptLibraryStore();
  const [messages, setMessages] = useState<PromptMessage[]>(collection && collection.type === CollectionType.Prompts ? collection.attributes.messages : [defaultMessageTemplate]);
  const [models, setModels] = useState<PromptModel[]>(collection && collection.type === CollectionType.Models ? collection.attributes.models : []);
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedCollectionType, setSelectedCollectionType] = useState<CustomCollectionType | null>(null);
  // 添加附件状态
  const [attachments, setAttachments] = useState<AttachmentInfo[]>(collection && collection.type === CollectionType.Prompts ? collection.attributes.attachments || [] : []);
  const attachmentsRef = useRef<AttachmentInfo[]>(collection && collection.type === CollectionType.Prompts ? collection.attributes.attachments || [] : []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 添加上传进度状态
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // 更新attachmentsRef当attachments状态变化时
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  
  // 初始化表单数据
  useEffect(() => {
    if (collection) {
      // 映射实际的CollectionType到自定义的CustomCollectionType
      let customType: CustomCollectionType | null = null;
      switch (collection.type) {
        case CollectionType.Personas:
          customType = CollectionType.Personas;
          break;
        case CollectionType.Models:
          customType = CollectionType.Models;
          break;
        case CollectionType.Defaults:
          customType = CollectionType.Defaults;
          break;
        case CollectionType.Presets:
          customType = CollectionType.Presets;
          break;
        case CollectionType.Prompts:
          // 对于提示词集合，我们需要根据提示词类型和名称来判断具体分类
          switch (collection.attributes.type) {
            case PromptType.Component:
            case PromptType.WorkshopChat:
              customType = 'creative-assistance';
              break;
            case PromptType.SceneSummarization:
            case PromptType.SceneBeatCompletion:
            case PromptType.SceneCharacterDetection:
              customType = 'content-processing';
              break;
            case PromptType.ManuscriptReplacement:
            case PromptType.ManuscriptCompletion:
              customType = 'text-editing';
              break;
            case PromptType.Other:
              // 对于案例库类，直接设为case-library
              customType = 'case-library';
              break;
            default:
              customType = 'creative-assistance'; // 默认值
              break;
          }
          break;
      }
      
      form.setFieldsValue({
        type: customType,
        name: collection.attributes.name,
      });
      setSelectedCollectionType(customType);
      
      // 根据不同类型的集合设置特定字段
      if (collection.type === CollectionType.Prompts) {
        // 对于案例库类，需要特殊处理提示词类型
        if (customType === 'case-library') {
          // 确保表单字段正确设置为PromptType.Other
          form.setFieldsValue({
            promptType: PromptType.Other,
            description: collection.attributes.description || '',
            nsfw: collection.attributes.nsfw || false,
            name: collection.attributes.name, // 确保名称字段正确设置
          });
        } else {
          // 对于非案例库类，直接使用集合的提示词类型
          form.setFieldsValue({
            promptType: collection.attributes.type,
            description: collection.attributes.description || '',
            nsfw: collection.attributes.nsfw || false,
          });
        }
        setMessages(collection.attributes.messages);
        // 确保附件状态正确设置
        setAttachments(collection.attributes.attachments || []);
        console.log('Initialized attachments:', collection.attributes.attachments);
      } else if (collection.type === CollectionType.Defaults) {
        form.setFieldsValue({
          content: collection.attributes.content,
          category: collection.attributes.category,
        });
      } else if (collection.type === CollectionType.Personas) {
        form.setFieldsValue({
          content: collection.attributes.content,
          personality: collection.attributes.personality?.join('\n') || '',
          background: collection.attributes.background || '',
        });
      } else if (collection.type === CollectionType.Presets) {
        form.setFieldsValue({
          content: collection.attributes.content,
          category: collection.attributes.category,
        });
      } else if (collection.type === CollectionType.Models) {
        setModels(collection.attributes.models);
      }
    } else {
      form.setFieldsValue({
        type: CollectionType.Personas,
        name: '',
        promptType: PromptType.Component,
        description: '',
        nsfw: false,
      });
      setSelectedCollectionType(CollectionType.Personas);
      setMessages([defaultMessageTemplate]);
      setModels([]);
    }
  }, [collection, form]);

  // 添加消息
  const addMessage = (type: 'system' | 'user' | 'assistant') => {
    setMessages([...messages, { ...defaultMessageTemplate, type }]);
  };

  // 更新消息
  const updateMessage = (index: number, field: keyof PromptMessage, value: any) => {
    const newMessages = [...messages];
    newMessages[index] = { ...newMessages[index], [field]: value };
    setMessages(newMessages);
  };

  // 删除消息
  const removeMessage = (index: number) => {
    if (messages.length <= 1) {
      message.warning('至少需要保留一条消息');
      return;
    }
    const newMessages = [...messages];
    newMessages.splice(index, 1);
    setMessages(newMessages);
  };

  // 添加模型
  const addModel = () => {
    const newModel: PromptModel = {
      internalId: generateUUID({ prefix: 'model_', length: 28 }),
      id: '',
      name: '',
    };
    setModels([...models, newModel]);
  };

  // 更新模型
  const updateModel = (index: number, field: keyof PromptModel, value: any) => {
    const newModels = [...models];
    newModels[index] = { ...newModels[index], [field]: value };
    setModels(newModels);
  };

  // 删除模型
  const removeModel = (index: number) => {
    const newModels = [...models];
    newModels.splice(index, 1);
    setModels(newModels);
  };

  // 处理集合类型变化
  const handleCollectionTypeChange = (value: CustomCollectionType) => {
    setSelectedCollectionType(value);
    // 重置提示词类型
    form.setFieldsValue({ promptType: undefined });
    
    // 如果是新建集合，根据集合类型设置默认的提示词类型
    if (!collection) {
      let defaultPromptType: PromptType | string | undefined;
      switch (value) {
        case 'creative-assistance':
          defaultPromptType = PromptType.Component;
          break;
        case 'content-processing':
          defaultPromptType = PromptType.SceneSummarization;
          break;
        case 'text-editing':
          defaultPromptType = PromptType.ManuscriptReplacement;
          break;
        case 'case-library':
          // 对于案例库类，应该使用PromptType.Other而不是'novel-example'
          defaultPromptType = PromptType.Other;
          break;
        default:
          defaultPromptType = PromptType.Component;
      }
      if (defaultPromptType) {
        form.setFieldsValue({ promptType: defaultPromptType });
      }
    }
  };

  // 处理文件上传
  const handleFileUpload = (file: File) => {
    // 检查文件类型
    if (!file.type.includes('text/plain') && !file.name.endsWith('.txt')) {
      message.error('只支持上传txt文本文件');
      return false;
    }

    // 检查文件大小 (限制为30MB)
    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      message.error(`文件 "${file.name}" 大小为 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过了30MB限制，请减小文件大小后重试`);
      return false;
    }

    // 处理正常大小的文件
    processFileContent(file);
    return false; // 阻止默认上传行为
  };

  // 处理大文件上传 (简化处理，不再进行分割)
  const handleLargeFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    // 直接提示文件过大
    message.error(`文件 "${file.name}" 大小为 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过了30MB限制，请减小文件大小后重试`);
    setIsUploading(false);
    setUploadProgress(0);
    return;
  };

  // 处理正常文件内容
  const processFileContent = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        
        // 检查文件内容大小是否超过MongoDB单个文档限制(16MB)
        const contentSizeInBytes = new Blob([content]).size;
        if (contentSizeInBytes > 16 * 1024 * 1024) {
          // 如果文件过大，直接报错
          message.error(`文件 "${file.name}" 内容过大，超出了MongoDB单个文档16MB限制，请减小文件大小后重试`);
          setIsUploading(false);
          setUploadProgress(0);
          return;
        } else {
          // 文件大小在限制内，直接创建单个附件
          const newAttachment: AttachmentInfo = {
            id: generateUUID({ prefix: 'attachment_', length: 28 }),
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            content: content, // 直接存储内容，不再存储到IndexedDB
            uploadedAt: dayjs().toISOString()
          };

          setAttachments(prev => {
            const newAttachments = [...prev, newAttachment];
            attachmentsRef.current = newAttachments;
            return newAttachments;
          });
          setIsUploading(false);
          setUploadProgress(0);
          message.success(`文件 "${file.name}" 上传成功`);
        }
      } catch (error) {
        console.error('处理文件内容时出错:', error);
        setIsUploading(false);
        setUploadProgress(0);
        message.error(`处理文件 "${file.name}" 时出错: ${error.message}`);
      }
    };

    reader.onerror = () => {
      setIsUploading(false);
      setUploadProgress(0);
      message.error(`文件 "${file.name}" 读取失败`);
    };

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        setUploadProgress(progress);
      }
    };

    reader.readAsText(file);
  };

  // 删除附件
  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => {
      const newAttachments = prev.filter(att => att.id !== id);
      attachmentsRef.current = newAttachments;
      return newAttachments;
    });
  };

  // 提交表单
  const onFinish = async (values: any) => {
    try {
      const customCollectionType = values.type;
      
      // 将自定义的集合类型映射到实际的CollectionType
      let actualCollectionType: CollectionType;
      let promptType: PromptType | string | undefined;
      let collectionName = values.name;
      
      switch (customCollectionType) {
        case CollectionType.Personas:
          actualCollectionType = CollectionType.Personas;
          break;
        case CollectionType.Models:
          actualCollectionType = CollectionType.Models;
          break;
        case CollectionType.Defaults:
          actualCollectionType = CollectionType.Defaults;
          break;
        case CollectionType.Presets:
          actualCollectionType = CollectionType.Presets;
          break;
        case 'creative-assistance':
          actualCollectionType = CollectionType.Prompts;
          // 对于创作辅助类，使用选择的提示词类型
          promptType = values.promptType || PromptType.Component;
          break;
        case 'content-processing':
          actualCollectionType = CollectionType.Prompts;
          // 对于内容处理类，使用选择的提示词类型
          promptType = values.promptType || PromptType.SceneSummarization;
          break;
        case 'text-editing':
          actualCollectionType = CollectionType.Prompts;
          // 对于文本编辑类，使用选择的提示词类型
          promptType = values.promptType || PromptType.ManuscriptReplacement;
          break;
        case 'case-library':
          actualCollectionType = CollectionType.Prompts;
          // 根据选择的提示词类型设置实际的PromptType和名称
          promptType = PromptType.Other; // 案例库类始终使用PromptType.Other
          
          // 对于案例库类，我们简化名称处理逻辑
          // 在编辑模式下，直接使用用户输入的名称
          // 在新建模式下，根据提示词类型设置默认名称
          if (!collection) {
            // 新建模式 - 使用更通用的名称
            if (collectionName === '' || collectionName === '新提示词集合') {
              collectionName = '案例库集合';
            }
          }
          // 编辑模式下保持原有名称不变，除非用户修改了名称字段
          // 由于我们使用的是form.getFieldValue('name')获取的值，所以会自动反映用户的修改
          break;
        default:
          actualCollectionType = CollectionType.Prompts;
          promptType = values.promptType || PromptType.Component;
          break;
      }
      
      // 根据集合类型创建不同的集合数据
      let collectionData: any = {
        // 确保使用原有的ID，或者生成新的ID
        id: collection?.id || generateUUID({ prefix: 'user_', length: 28 }),
        type: actualCollectionType,
        meta: {
          state: 'active',
          createdAt: collection?.meta?.createdAt || dayjs().toISOString(),
          updatedAt: dayjs().toISOString()
        },
        attributes: {
          name: collectionName,
        },
        relationships: {
          owner: {
            id: collection?.relationships?.owner?.id || 'user_30EbWOl1QqDvn9wVbufNwCJzFdE', // 使用现有ID或固定用户ID
            type: 'users'
          }
        }
      };

      // 根据类型设置特定属性
      switch (actualCollectionType) {
        case CollectionType.Prompts:
          // 检查提示词消息是否有空内容
          const hasEmptyMessage = messages.some(msg => !msg.text.trim());
          if (hasEmptyMessage) {
            message.error('所有消息内容都不能为空');
            return;
          }
          
          collectionData.attributes = {
            ...collectionData.attributes,
            type: promptType as PromptType, // 确保保存的是PromptType类型
            description: values.description || null,
            nsfw: values.nsfw || false,
            messages: messages,
            models: [], // 简化处理，不包含模型配置
            // 添加附件信息（内容将直接存储在MongoDB中，不再存储到IndexedDB）
            attachments: attachmentsRef.current
          };
          break;
          
        case CollectionType.Defaults:
          collectionData.attributes = {
            ...collectionData.attributes,
            content: values.content || '',
            category: values.category || 'default'
          };
          break;
          
        case CollectionType.Personas:
          collectionData.attributes = {
            ...collectionData.attributes,
            content: values.content || '',
            personality: values.personality ? values.personality.split('\n').filter((p: string) => p.trim()) : [],
            background: values.background || ''
          };
          break;
          
        case CollectionType.Presets:
          collectionData.attributes = {
            ...collectionData.attributes,
            content: values.content || '',
            category: values.category || 'default'
          };
          break;
          
        case CollectionType.Models:
          collectionData.attributes = {
            ...collectionData.attributes,
            models: models
          };
          break;
      }

      // 处理标签
      if (collection) {
        // 编辑模式 - 保留原有的标签
        if (collection.attributes?.tags) {
          collectionData.attributes.tags = collection.attributes.tags;
        }
        // 保留原有的meta信息
        collectionData.meta = {
          ...collection.meta,
          updatedAt: dayjs().toISOString()
        };
        // 保留原有的relationships信息
        collectionData.relationships = collection.relationships;
        // 确保使用原有的ID
        collectionData.id = collection.id;
        
        await updateCollection(collectionData);
        message.success('集合更新成功');
      } else {
        // 新建模式 - 添加适当的标签
        // 检查是否是小说特定的提示词库（通过URL路径判断）
        const isNovelSpecific = window.location.pathname.includes('/novels/');
        
        if (isNovelSpecific) {
          // 从小说特定提示词库store获取novelId
          const novelStoreState = useNovelPromptLibraryStore.getState();
          const novelId = novelStoreState.novelId;
          
          // 添加公共标签和小说ID标签
          collectionData.attributes.tags = [
            { id: 'public', name: 'Public', type: 'public' },
            { id: novelId || '', name: `novel-${novelId}`, type: 'novel' }
          ];
          
          // 添加项目关联
          if (novelId) {
            if (!collectionData.relationships) {
              collectionData.relationships = {
                owner: {
                  id: 'user_30EbWOl1QqDvn9wVbufNwCJzFdE',
                  type: 'users'
                }
              };
            }
            collectionData.relationships.projects = [
              {
                type: 'novels' as const,
                id: novelId
              }
            ];
          }
        } else {
          // 全局提示词库 - 只添加公共标签
          collectionData.attributes.tags = [
            { id: 'public', name: 'Public', type: 'public' }
          ];
        }
        
        // 如果是全局提示词库，使用全局store的addCollection方法
        // 如果是小说特定提示词库，使用小说特定store的addCollection方法
        if (isNovelSpecific) {
          const { addCollection: addNovelCollection } = useNovelPromptLibraryStore.getState();
          await addNovelCollection(collectionData);
        } else {
          const { addCollection: addGlobalCollection } = usePromptLibraryStore.getState();
          await addGlobalCollection(collectionData);
        }
        message.success('集合创建成功');
      }
      
      onSuccess();
    } catch (error) {
      console.error('保存集合失败:', error);
      message.error('保存集合失败: ' + (error as Error).message);
    }
  };

  // 获取当前选中的集合类型对应的提示词类型选项
  const currentPromptTypeOptions = getPromptTypeOptions(selectedCollectionType);

  // 定义Tabs的items
  const tabsItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
          {({ getFieldValue }) => {
            const type = getFieldValue('type');
            switch (type) {
              case CollectionType.Personas:
                return (
                  <>
                    <Form.Item
                      name="content"
                      label="角色内容"
                      rules={[{ required: true, message: '请输入角色内容' }]}
                    >
                      <TextArea placeholder="请输入角色内容" rows={6} />
                    </Form.Item>
                    
                    <Form.Item
                      name="personality"
                      label="角色性格（每行一个）"
                    >
                      <TextArea placeholder="每行输入一个性格特征" rows={4} />
                    </Form.Item>
                    
                    <Form.Item
                      name="background"
                      label="角色背景"
                    >
                      <TextArea placeholder="请输入角色背景信息" rows={3} />
                    </Form.Item>
                  </>
                );
              case CollectionType.Models:
                return (
                  <>
                    <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
                      添加和配置模型
                    </Text>
                    
                    {models.map((model, index) => (
                      <Card 
                        size="small" 
                        key={model.internalId} 
                        style={{ marginBottom: 16 }}
                        title={`模型 ${index + 1}`}
                        extra={
                          <Button 
                            size="small" 
                            danger 
                            onClick={() => removeModel(index)}
                          >
                            删除
                          </Button>
                        }
                      >
                        <Form.Item
                          label="模型名称"
                          required
                          style={{ marginBottom: 12 }}
                        >
                          <Input
                            value={model.name}
                            onChange={(e) => updateModel(index, 'name', e.target.value)}
                            placeholder="请输入模型名称"
                          />
                        </Form.Item>
                        
                        <Form.Item
                          label="模型ID"
                          required
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            value={model.id}
                            onChange={(e) => updateModel(index, 'id', e.target.value)}
                            placeholder="请输入模型ID，如：openai/gpt-4"
                          />
                        </Form.Item>
                      </Card>
                    ))}
                    
                    <Button 
                      type="dashed" 
                      onClick={addModel}
                      style={{ width: '100%', marginBottom: 16 }}
                    >
                      添加模型
                    </Button>
                  </>
                );
              case CollectionType.Defaults:
                return (
                  <>
                    <Form.Item
                      name="content"
                      label="内容"
                      rules={[{ required: true, message: '请输入内容' }]}
                    >
                      <TextArea placeholder="请输入默认内容" rows={6} />
                    </Form.Item>
                    
                    <Form.Item
                      name="category"
                      label="分类"
                    >
                      <Input placeholder="请输入分类" />
                    </Form.Item>
                  </>
                );
              case CollectionType.Presets:
                return (
                  <>
                    <Form.Item
                      name="content"
                      label="预设内容"
                      rules={[{ required: true, message: '请输入预设内容' }]}
                    >
                      <TextArea placeholder="请输入预设内容" rows={6} />
                    </Form.Item>
                    
                    <Form.Item
                      name="category"
                      label="分类"
                    >
                      <Input placeholder="请输入分类" />
                    </Form.Item>
                  </>
                );
              case 'case-library':
                // 只有案例库类允许修改提示词类型
                return (
                  <>
                    <Form.Item
                      name="promptType"
                      label="提示词类型"
                      rules={[{ required: true, message: '请选择提示词类型' }]}
                    >
                      <Select 
                        options={currentPromptTypeOptions} 
                        placeholder="请选择提示词类型" 
                      />
                    </Form.Item>
                    
                    <Form.Item
                      name="description"
                      label="描述"
                    >
                      <TextArea placeholder="请输入提示词描述" rows={3} />
                    </Form.Item>
                    
                    <Form.Item
                      name="nsfw"
                      label="NSFW内容"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="是" unCheckedChildren="否" />
                    </Form.Item>
                    
                    {/* 附件上传区域 - 仅对案例库类显示 */}
                    <Form.Item label="附件">
                      <Upload
                        beforeUpload={handleFileUpload}
                        showUploadList={false}
                        accept=".txt,text/plain"
                        disabled={isUploading}
                      >
                        <Button 
                          icon={<UploadOutlined />} 
                          loading={isUploading}
                          disabled={isUploading}
                        >
                          {isUploading ? '上传中...' : '上传txt文件'}
                        </Button>
                      </Upload>
                      
                      {/* 上传进度条 */}
                      {isUploading && (
                        <div style={{ marginTop: 8 }}>
                          <Progress percent={Math.round(uploadProgress)} />
                        </div>
                      )}
                      
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          支持上传txt文本文件，大小不超过30MB
                        </Text>
                      </div>
                      
                      {/* 附件列表 */}
                      {attachments.length > 0 && (
                        <List
                          size="small"
                          dataSource={attachments}
                          renderItem={item => (
                            <List.Item
                              actions={[
                                <Button 
                                  type="text" 
                                  icon={<DeleteOutlined />} 
                                  onClick={() => handleRemoveAttachment(item.id)}
                                  size="small"
                                  danger
                                  disabled={isUploading}
                                />
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<FileTextOutlined />}
                                title={<Text ellipsis style={{ maxWidth: '200px' }}>{item.name}</Text>}
                                description={
                                  <Space size="small">
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      {(item.size / 1024).toFixed(1)}KB
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      {dayjs(item.uploadedAt).format('YYYY-MM-DD HH:mm')}
                                    </Text>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                    </Form.Item>
                  </>
                );
              case 'creative-assistance':
              case 'content-processing':
              case 'text-editing':
                // 对于其他提示词类型，允许选择对应的提示词类型
                return (
                  <>
                    <Form.Item
                      name="promptType"
                      label="提示词类型"
                      rules={[{ required: true, message: '请选择提示词类型' }]}
                    >
                      <Select 
                        options={currentPromptTypeOptions} 
                        placeholder="请选择提示词类型" 
                      />
                    </Form.Item>
                    
                    <Form.Item
                      name="description"
                      label="描述"
                    >
                      <TextArea placeholder="请输入提示词描述" rows={3} />
                    </Form.Item>
                    
                    <Form.Item
                      name="nsfw"
                      label="NSFW内容"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="是" unCheckedChildren="否" />
                    </Form.Item>
                  </>
                );
              default:
                return null;
            }
          }}
        </Form.Item>
      )
    },
    {
      key: 'messages',
      label: '消息内容',
      disabled: !selectedCollectionType || ![
        'creative-assistance',
        'content-processing',
        'text-editing',
        'case-library'
      ].includes(selectedCollectionType),
      children: (
        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
          {({ getFieldValue }) => {
            const type = getFieldValue('type');
            const isPromptType = [
              'creative-assistance',
              'content-processing',
              'text-editing',
              'case-library'
            ].includes(type);
            
            if (isPromptType) {
              return (
                <>
                  <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
                    定义AI交互的消息序列，至少需要一条消息
                  </Text>
                  
                  {messages.map((msg, index) => (
                    <Card 
                      size="small" 
                      key={index} 
                      style={{ marginBottom: 16 }}
                      title={
                        <Space>
                          <Tag color={msg.type === 'system' ? 'blue' : msg.type === 'user' ? 'green' : 'purple'}>
                            {msg.type === 'system' ? '系统' : msg.type === 'user' ? '用户' : '助手'}
                          </Tag>
                          <Select
                            size="small"
                            value={msg.type}
                            onChange={(value) => updateMessage(index, 'type', value)}
                            options={[
                              { value: 'system', label: '系统' },
                              { value: 'user', label: '用户' },
                              { value: 'assistant', label: '助手' }
                            ]}
                            style={{ width: 80 }}
                          />
                        </Space>
                      }
                      extra={
                        <Button 
                          size="small" 
                          danger 
                          onClick={() => removeMessage(index)}
                        >
                          删除
                        </Button>
                      }
                    >
                      <Form.Item
                        label="消息内容"
                        required
                        style={{ marginBottom: 0 }}
                      >
                        <TextArea
                          value={msg.text}
                          onChange={(e) => updateMessage(index, 'text', e.target.value)}
                          placeholder="请输入消息内容"
                          rows={4}
                          style={{ fontSize: '12px' }}
                        />
                      </Form.Item>
                    </Card>
                  ))}
                  
                  <Space style={{ marginBottom: 16 }}>
                    <Button onClick={() => addMessage('system')}>添加系统消息</Button>
                    <Button onClick={() => addMessage('user')}>添加用户消息</Button>
                    <Button onClick={() => addMessage('assistant')}>添加助手消息</Button>
                  </Space>
                </>
              );
            }
            return null;
          }}
        </Form.Item>
      )
    }
  ];

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4}>{collection ? '编辑集合' : '创建集合'}</Title>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ flex: 1, overflow: 'auto' }}
      >
        <Form.Item
          name="type"
          label="集合类型"
          rules={[{ required: true, message: '请选择集合类型' }]}
        >
          <Select 
            options={collectionTypeOptions} 
            placeholder="请选择集合类型"
            disabled={!!collection} // 编辑时不能更改类型
            onChange={handleCollectionTypeChange}
          />
        </Form.Item>
        
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input placeholder="请输入名称" />
        </Form.Item>
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={tabsItems}
        />
        
        <div style={{ 
          position: 'sticky', 
          bottom: 0, 
          padding: '16px 0', 
          background: 'white',
          borderTop: '1px solid #f0f0f0'
        }}>
          <Space>
            <Button type="primary" htmlType="submit">
              {collection ? '更新集合' : '创建集合'}
            </Button>
            <Button onClick={onCancel}>取消</Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
};

export default EditPromptForm;