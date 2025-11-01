import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Modal, 
  Form, 
  message, 
  Space, 
  Popconfirm, 
  Tabs,
  Tag,
  Typography,
  Tooltip,
  Select
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ThunderboltOutlined,
  GlobalOutlined,
  UserOutlined,
  EnvironmentOutlined,
  BookOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { hybridStorageService } from '@/services/hybridStorageService';
import { generateUUID } from '@/utils/uuidUtils';
import type { WorldSettingType } from '@/types/ai-generation';
// 导入事件总线
import { eventBus } from '@/utils/eventBus';
import worldSettingParserService from '@/services/worldSettingParserService';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface WorldElement {
  id: string
  novelId?: string // 添加 novelId 字段
  name: string
  description: string
  type: 'character' | 'location' | 'culture' | 'technology' | 'magic' | 'history'
  tags: string[]
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'side' | 'foil' | 'mentor' | 'loveInterest' | 'rival' | 'neutral' | 'keySupporting' | 'minorSupporting' | 'complexSupporting' | 'custom'
  customRole?: string  // 自定义角色类型
  // 角色扩展标签字段
  professionTags?: string[]
  personalityTags?: string[]
  functionTags?: string[]
  appearance?: string
  personality?: string
  background?: string
  abilities?: string
  relationships?: string
  characterArc?: string
  details?: string
  // 地点字段
  locationType?: string  // 添加locationType字段
  importance?: string
  geography?: string
  culture?: string
  politics?: string
  economy?: string
  // 添加缺失的字段以匹配locationConfig.ts中的定义
  architecture?: string
  socialStructure?: string
  governance?: string
  laws?: string
  terrain?: string
  naturalResources?: string
  ecosystem?: string
  historyBackground?: string
  // 历史设定字段
  timeline?: string
  events?: string
  figures?: string
  consequences?: string
  // 科技设定字段
  level?: string
  applications?: string
  limitations?: string
  impact?: string
  // 文化设定字段
  customs?: string
  values?: string
  art?: string
  religion?: string
  language?: string
  cultureInteraction?: string
  // 地点经济字段
  mainIndustries?: string
  // 时间戳字段
  createdAt?: string
  lastModified?: string
}

interface WorldSettingPanelProps {
  aiSyncData?: any;
  novelId?: string; // 添加小说ID参数
}

const WorldSettingPanel: React.FC<WorldSettingPanelProps> = ({ aiSyncData, novelId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('character');
  const [elements, setElements] = useState<WorldElement[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingElement, setEditingElement] = useState<WorldElement | null>(null);
  const [form] = Form.useForm();

  // 如果没有选择小说，显示提示
  if (!novelId) {
    return (
      <div className="world-setting-panel">
        <div className="panel-header">
          <h2><GlobalOutlined /> 世界观设定</h2>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px',
          color: '#8c8c8c'
        }}>
          <GlobalOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <p style={{ fontSize: '16px' }}>请先在“我的书籍”中选择一本小说</p>
          <p style={{ color: '#bfbfbf' }}>选择后即可管理该小说的世界观设定</p>
        </div>
      </div>
    );
  }

  const elementTypes = [
    { key: 'character', label: '角色', icon: <UserOutlined />, color: 'blue' },
    { key: 'location', label: '地点', icon: <EnvironmentOutlined />, color: 'green' },
    { key: 'culture', label: '文化', icon: <BookOutlined />, color: 'purple' },
    { key: 'technology', label: '科技', icon: <ThunderboltOutlined />, color: 'orange' },
    { key: 'magic', label: '魔法', icon: <GlobalOutlined />, color: 'magenta' },
    { key: 'history', label: '历史', icon: <BookOutlined />, color: 'volcano' }
  ];

  useEffect(() => {
    // 加载世界观设定数据
    if (novelId) {
      loadWorldElements();
    }
    
    // 监听世界设定同步完成事件
    const handleSyncComplete = (data: { novelId: string, type: string }) => {
      // 如果是当前小说的数据同步完成，重新加载数据
      if (data.novelId === novelId) {
        console.log('收到世界设定同步完成事件，重新加载数据');
        loadWorldElements();
      }
    };
    
    eventBus.on('worldSettingSyncComplete', handleSyncComplete);
    
    // 清理事件监听
    return () => {
      eventBus.off('worldSettingSyncComplete', handleSyncComplete);
    };
  }, [novelId]);

  const loadWorldElements = async (retryCount = 0) => {
    try {
      console.log('WorldSettingPanel.loadWorldElements 调用，novelId:', novelId, '重试次数:', retryCount);
      // 添加延迟确保数据已保存
      await new Promise(resolve => setTimeout(resolve, 300));
      const allElements = await hybridStorageService.getWorldElements(undefined, novelId);
      console.log('加载到的世界观数据:', allElements);
      console.log('加载到的世界观数据数量:', allElements.length);
      // 添加详细日志，查看每个元素的类型
      allElements.forEach((element, index) => {
        console.log(`元素 ${index + 1}:`, {
          id: element.id,
          name: element.name,
          type: element.type,
          novelId: element.novelId
        });
      });
      setElements(allElements);
      
      // 如果是重试加载，显示成功消息
      if (retryCount > 0) {
        message.success(`数据加载成功，共加载 ${allElements.length} 个元素`);
      }
    } catch (error) {
      console.error('加载世界观设定失败:', error);
      // 如果是第一次失败，尝试重试一次
      if (retryCount < 3) {
        console.log('加载失败，尝试重试...');
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadWorldElements(retryCount + 1);
      } else {
        // 提供更详细的错误信息
        if (error instanceof Error) {
          message.error(`加载数据失败: ${error.message}`);
        } else {
          message.error('加载数据失败，请检查网络连接或刷新页面重试');
        }
      }
    }
  };

  const saveWorldElements = async (newElements: WorldElement[]) => {
    try {
      // 按类型分组保存
      const elementsByType: { [key: string]: WorldElement[] } = {};
      newElements.forEach(element => {
        if (!elementsByType[element.type]) {
          elementsByType[element.type] = [];
        }
        elementsByType[element.type].push(element);
      });

      // 分别保存每种类型
      for (const [type, elements] of Object.entries(elementsByType)) {
        for (const element of elements) {
          await hybridStorageService.saveWorldElement(element, type as WorldSettingType);
        }
      }

      setElements(newElements);
    } catch (error) {
      console.error('保存世界观设定失败:', error);
      message.error('保存数据失败');
    }
  };

  const handleAdd = () => {
    setEditingElement(null);
    form.resetFields();
    // 设置当前标签页的类型为默认值
    form.setFieldsValue({ type: activeTab });
    setModalVisible(true);
  };

  // 监听表单角色类型字段的变化
  useEffect(() => {
    const handleRoleChange = () => {
      // 强制更新表单以确保自定义角色类型字段的显示状态正确
      form.setFieldsValue({
        ...form.getFieldsValue(),
      });
    };

    // 监听角色类型字段的变化
    const roleField = form.getFieldInstance('role');
    if (roleField) {
      roleField.on('change', handleRoleChange);
    }

    return () => {
      if (roleField) {
        roleField.off('change', handleRoleChange);
      }
    };
  }, [form]);

  const handleEdit = (element: WorldElement) => {
    setEditingElement(element);
    // 在编辑时，我们需要确保描述字段不包含其他字段的内容
    // 如果描述字段包含其他字段的内容，我们只保留真正的描述部分
    let description = element.description || '';
    
    // 检查描述是否包含其他字段的内容（通过检查是否包含字段标题）
    if (description.includes('外貌：') && description.includes('性格：') && description.includes('背景：')) {
      // 这可能是合并了其他字段的描述，我们需要提取真正的描述部分
      // 在这种情况下，我们暂时清空描述，让用户重新填写
      description = '';
    }
    
    // 准备表单字段值
    const formValues: any = {
      ...element,
      description,
      tags: element.tags ? element.tags.join('、') : '', // 使用中文顿号连接标签
    };
    
    // 特殊处理地点类型字段
    if (element.type === 'location') {
      // 对于地点类型，确保locationType字段正确设置
      formValues.locationType = element.locationType || '';
      // 确保type字段设置为'location'以便正确显示表单
      formValues.type = 'location';
    }
    
    form.setFieldsValue(formValues);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const elementToDelete = elements.find(el => el.id === id);
      if (elementToDelete) {
        await hybridStorageService.deleteWorldElement(id, elementToDelete.type);
        const newElements = elements.filter(el => el.id !== id);
        setElements(newElements);
        message.success('删除成功');
      }
    } catch (error) {
      console.error('删除世界观设定失败:', error);
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      console.log('开始保存世界观设定:', values);
      console.log('当前 novelId:', novelId);
      
      // 处理标签数据
      const tags = values.tags ? values.tags.split('、').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];
      
      // 对于地点类型，使用locationType作为type字段的值
      let elementType = values.type;
      let locationTypeValue = undefined;
      if (values.type === 'location') {
        // 使用locationType字段的值作为具体的类型描述
        locationTypeValue = values.locationType || '';
        // elementType保持为'location'，但locationType字段存储具体的类型描述
        elementType = 'location';
      }
      
      const elementData: WorldElement = {
        id: editingElement?.id || generateUUID(), // 使用标准ID生成
        novelId: novelId || '', // 添加 novelId 字段
        name: values.name,
        description: values.description,
        type: elementType, // 使用处理后的elementType
        tags: tags, // 使用处理后的标签数组
        // 角色相关字段
        role: values.role,
        customRole: values.customRole, // 添加自定义角色类型
        appearance: values.appearance,
        personality: values.personality,
        background: values.background,
        abilities: values.abilities,
        relationships: values.relationships,
        characterArc: values.characterArc,
        // 地点相关字段
        locationType: locationTypeValue, // 保存具体的地点类型描述
        importance: values.importance,
        geography: values.geography,
        culture: values.culture,
        politics: values.politics,
        economy: values.economy,
        details: values.details,
        // 添加缺失的字段
        architecture: values.architecture,
        socialStructure: values.socialStructure,
        governance: values.governance,
        laws: values.laws,
        terrain: values.terrain,
        naturalResources: values.naturalResources,
        ecosystem: values.ecosystem,
        historyBackground: values.historyBackground,
      };
      
      console.log('准备保存的数据:', elementData);

      // 保存到混合存储服务
      await hybridStorageService.saveWorldElement(elementData, values.type as WorldSettingType);
      console.log('保存成功');

      // 添加额外的延迟和强制更新以确保UI正确刷新
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadWorldElements();
      
      if (editingElement) {
        message.success('修改成功');
      } else {
        message.success('添加成功');
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('保存世界观设定失败:', error);
      message.error('操作失败');
    }
  };

  const handleAISync = async (content: string) => {
    try {
      // 解析AI生成的内容
      let parsedElements: any[] = [];
      
      switch (activeTab) {
        case 'location':
          parsedElements = await worldSettingParserService.parseLocationContent(content);
          break;
        case 'character':
          parsedElements = await worldSettingParserService.parseCharacterContent(content);
          break;
        case 'culture':
        case 'technology':
        case 'magic':
        case 'history':
        default:
          // 对于其他类型，使用通用解析方法
          parsedElements = [worldSettingParserService.parseSettingDetails(content, activeTab as any)];
          break;
      }
      
      if (parsedElements && parsedElements.length > 0) {
        // 只取第一个元素进行同步
        const element = parsedElements[0];
        
        // 准备表单数据
        const formData: any = {
          name: element.name || 'AI生成内容',
          description: element.description || '',
          tags: element.tags ? element.tags.join('、') : '',
          type: activeTab
        };
        
        // 根据不同类型添加特定字段
        if (activeTab === 'location') {
          Object.assign(formData, {
            locationType: element.locationType || '',
            importance: element.importance || '',
            geography: element.geography || '',
            culture: element.culture || '',
            politics: element.politics || '',
            economy: element.economy || '',
            details: element.details || ''
          });
        } else if (activeTab === 'character') {
          Object.assign(formData, {
            role: element.role || 'supporting',
            customRole: element.customRole || '', // 添加自定义角色类型
            appearance: element.appearance || '',
            personality: element.personality || '',
            background: element.background || '',
            abilities: element.abilities || '',
            relationships: element.relationships || '',
            characterArc: element.characterArc || '',
            details: element.details || ''
          });
        } else if (activeTab === 'culture') {
          Object.assign(formData, {
            customs: element.customs || '',
            values: element.values || '',
            art: element.art || '',
            religion: element.religion || '',
            language: element.language || '',
            cultureInteraction: element.cultureInteraction || '',
            details: element.details || ''
          });
        } else if (activeTab === 'technology' || activeTab === 'magic') {
          Object.assign(formData, {
            level: element.level || '',
            applications: element.applications || '',
            limitations: element.limitations || '',
            impact: element.impact || '',
            details: element.details || ''
          });
        } else if (activeTab === 'history') {
          Object.assign(formData, {
            timeline: element.timeline || '',
            events: element.events || '',
            figures: element.figures || '',
            consequences: element.consequences || '',
            details: element.details || ''
          });
        }
        
        // 填充表单
        form.setFieldsValue(formData);
        setModalVisible(true);
        
        message.success('AI生成内容已同步到表单，请检查并保存');
      }
    } catch (error) {
      console.error('处理AI同步数据失败:', error);
      message.error('同步AI数据失败');
    }
  };

  const generateWithAI = (type: string) => {
    navigate('/ai-workspace', {
      state: {
        mode: 'world-setting',
        type: type,
        prompt: `为我的小说生成${elementTypes.find(t => t.key === type)?.label}设定，包括详细的描述和背景信息。`
      }
    });
  };

  const syncToAIWorkspace = () => {
    // 将世界观设定同步到AI工作台
    navigate('/ai-workspace', {
      state: {
        mode: 'world-sync',
        worldElements: elements,
        prompt: '同步当前世界观设定到AI工作台，用于后续的内容生成。'
      }
    });
    message.success('正在同步到AI工作台...');
  };

  const renderElementCard = (element: WorldElement) => {
    const typeInfo = elementTypes.find(t => t.key === element.type);
    
    // 处理描述内容，确保不会显示其他字段的内容
    let displayDescription = element.description || '';
    
    // 对于角色类型，清理描述中的其他字段内容
    if (element.type === 'character') {
      // 如果描述包含其他字段的内容，只显示真正的描述部分
      if (displayDescription.includes('外貌：') && displayDescription.includes('性格：') && displayDescription.includes('背景：')) {
        // 提取描述的第一部分作为真正的描述
        const descLines = displayDescription.split('\n');
        const actualDescLines = [];
        for (const line of descLines) {
          // 如果遇到字段标题，停止提取
          if (line.includes('外貌：') || line.includes('性格：') || line.includes('背景：') || 
              line.includes('能力：') || line.includes('关系：') || line.includes('发展：') ||
              line.includes('【外貌特征】') || line.includes('【性格特质】') || line.includes('【背景故事】') ||
              line.includes('【能力设定】') || line.includes('【人际关系】') || line.includes('【角色发展弧光】')) {
            break;
          }
          actualDescLines.push(line);
        }
        displayDescription = actualDescLines.join('\n');
      }
    }
    
    // 对于地点类型，清理描述中的其他字段内容
    if (element.type === 'location') {
      // 如果描述包含其他字段的内容，只显示真正的描述部分
      if (displayDescription.includes('地理环境：') && displayDescription.includes('文化背景：') && displayDescription.includes('政治环境：')) {
        // 提取描述的第一部分作为真正的描述
        const descLines = displayDescription.split('\n');
        const actualDescLines = [];
        for (const line of descLines) {
          // 如果遇到字段标题，停止提取
          if (line.includes('地理环境：') || line.includes('文化背景：') || line.includes('政治环境：') || 
              line.includes('经济状况：') || line.includes('【地理环境】') || line.includes('【文化背景】') ||
              line.includes('【政治环境】') || line.includes('【经济状况】')) {
            break;
          }
          actualDescLines.push(line);
        }
        displayDescription = actualDescLines.join('\n');
      }
    }

    return (
      <Card
        key={element.id}
        className="world-element-card"
        style={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        actions={[
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(element)}
            key="edit"
          >
            编辑
          </Button>,
          <Popconfirm
            title={`确认删除这个${typeInfo?.label || '设定'}吗？`}
            onConfirm={() => handleDelete(element.id)}
            okText="确认"
            cancelText="取消"
            key="delete-confirm"
          >
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              danger
            >
              删除
            </Button>
          </Popconfirm>
        ]}
      >
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
            {typeInfo?.icon} {element.name}
          </h4>
        </div>
        {element.type === 'character' && element.role && (
          <div className="element-role" style={{ marginBottom: '8px' }}>
            <Tag 
              color={element.role === 'protagonist' ? 'red' : element.role === 'antagonist' ? 'volcano' : 'blue'}
              style={{ fontSize: '12px', lineHeight: '20px', height: '22px', borderRadius: '4px' }}
            >
              {element.role === 'protagonist' ? '主角' : 
               element.role === 'antagonist' ? '反角' : 
               element.role === 'supporting' ? '配角' : 
               element.role === 'minor' ? '次要角色' : 
               element.role === 'side' ? '侧面角色' : 
               element.role === 'foil' ? '对照角色' : 
               element.role === 'mentor' ? '导师角色' : 
               element.role === 'loveInterest' ? '恋爱对象' : 
               element.role === 'rival' ? '竞争对手' : 
               element.role === 'neutral' ? '中立角色' : 
               element.role === 'keySupporting' ? '重要配角' : 
               element.role === 'minorSupporting' ? '次要配角' : 
               element.role === 'complexSupporting' ? '复杂配角' : 
               element.role === 'custom' ? (element.customRole || '自定义类型') : 
               element.role}
            </Tag>
          </div>
        )}
        <div 
          className="element-content" 
          style={{ 
            minHeight: '100px', 
            marginBottom: '12px', 
            color: '#595959', 
            fontSize: '13px', 
            lineHeight: '1.5' 
          }}
        >
          {displayDescription}
        </div>
        <div className="element-tags" style={{ marginBottom: '12px' }}>
          {element.tags && element.tags.map(tag => (
            <Tag 
              key={tag} 
              color="blue"
              style={{ fontSize: '12px', lineHeight: '20px', height: '22px', borderRadius: '4px' }}
            >
              {tag}
            </Tag>
          ))}
        </div>
      </Card>
    );
  };

  const filteredElements = elements.filter(el => el.type === activeTab);

  const tabItems = elementTypes.map(type => ({
    key: type.key,
    label: (
      <span>
        {type.icon}
        {type.label}
      </span>
    ),
    children: (
      <div className="world-elements-grid">
        {filteredElements.length > 0 ? (
          filteredElements.map(renderElementCard)
        ) : (
          <div className="empty-state">
            <GlobalOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <p>还没有{type.label}设定</p>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加{type.label}
              </Button>
              <Button 
                icon={<ThunderboltOutlined />} 
                onClick={() => generateWithAI(type.key)}
              >
                AI生成
              </Button>
            </Space>
          </div>
        )}
      </div>
    )
  }));

  return (
    <div className="world-setting-panel">
      <div className="panel-header">
        <Title level={2}>
          <GlobalOutlined /> 世界观设定
        </Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
          >
            新增设定
          </Button>
          <Button 
            icon={<ThunderboltOutlined />} 
            onClick={() => generateWithAI(activeTab)}
          >
            AI生成
          </Button>
          <Button onClick={syncToAIWorkspace}>
            同步到AI工作台
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="world-tabs"
      />

      <Modal
        title={editingElement ? '编辑设定' : '新增设定'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: activeTab }}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="输入名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select>
              {elementTypes.map(type => (
                <Select.Option key={type.key} value={type.key}>
                  {type.icon} {type.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={4} placeholder="详细描述这个设定..." />
          </Form.Item>

          {/* 角色相关字段 */}
          {form.getFieldValue('type') === 'character' && (
            <>
              <Form.Item name="role" label="角色类型">
                <Select placeholder="请选择角色类型">
                  <Select.Option value="protagonist">主角</Select.Option>
                  <Select.Option value="antagonist">反角</Select.Option>
                  <Select.Option value="supporting">配角</Select.Option>
                  <Select.Option value="minor">次要角色</Select.Option>
                  <Select.Option value="side">侧面角色</Select.Option>
                  <Select.Option value="foil">对照角色</Select.Option>
                  <Select.Option value="mentor">导师角色</Select.Option>
                  <Select.Option value="loveInterest">恋爱对象</Select.Option>
                  <Select.Option value="rival">竞争对手</Select.Option>
                  <Select.Option value="neutral">中立角色</Select.Option>
                  <Select.Option value="keySupporting">重要配角</Select.Option>
                  <Select.Option value="minorSupporting">次要配角</Select.Option>
                  <Select.Option value="complexSupporting">复杂配角</Select.Option>
                  <Select.Option value="custom">自定义类型</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item 
                name="customRole" 
                label="自定义角色类型"
                hidden={form.getFieldValue('role') !== 'custom'}
              >
                <Input placeholder="请输入具体的角色类型描述，如：配角（医疗线核心成员）" />
              </Form.Item>
              <Form.Item name="tags" label="标签">
                <Input placeholder="请输入标签，多个标签请用中文顿号“、”分隔，如：剑士、勇敢、推动者" />
              </Form.Item>
              <Form.Item name="appearance" label="外貌特征">
                <TextArea rows={3} placeholder="描述角色的外貌特征..." />
              </Form.Item>
              <Form.Item name="personality" label="性格特质">
                <TextArea rows={3} placeholder="描述角色的性格特质..." />
              </Form.Item>
              <Form.Item name="background" label="背景故事">
                <TextArea rows={3} placeholder="描述角色的背景故事..." />
              </Form.Item>
              <Form.Item name="abilities" label="能力设定">
                <TextArea rows={3} placeholder="描述角色的特殊能力或技能..." />
              </Form.Item>
              <Form.Item name="relationships" label="人际关系">
                <TextArea rows={3} placeholder="描述角色的重要人际关系..." />
              </Form.Item>
              <Form.Item name="characterArc" label="角色发展弧光">
                <TextArea rows={3} placeholder="描述角色的成长和变化过程..." />
              </Form.Item>
              <Form.Item name="details" label="细节补充">
                <TextArea rows={3} placeholder="其他关于角色的细节信息..." />
              </Form.Item>
            </>
          )}

          {/* 地点相关字段 */}
          {form.getFieldValue('type') === 'location' && (
            <>
              <Form.Item name="tags" label="标签">
                <Input placeholder="请输入标签，多个标签请用中文顿号'、'分隔，如：城市、村庄、山脉、森林等" />
              </Form.Item>
              <Form.Item name="locationType" label="类型">
                <Input placeholder="由AI生成具体的类型描述..." />
              </Form.Item>
              <Form.Item name="importance" label="重要性">
                <Input placeholder="由AI生成具体的重要性描述..." />
              </Form.Item>
              <Form.Item name="geography" label="地理环境">
                <TextArea rows={4} placeholder="描述地点的地理环境，包括地理位置、气候特征、地形特征、自然资源、生态环境等..." />
              </Form.Item>
              <Form.Item name="culture" label="文化背景">
                <TextArea rows={4} placeholder="描述地点的文化背景，包括历史背景、文化特色、建筑风格、社会结构等..." />
              </Form.Item>
              <Form.Item name="politics" label="政治环境">
                <TextArea rows={3} placeholder="描述地点的政治环境，包括统治体系、法律法规等..." />
              </Form.Item>
              <Form.Item name="economy" label="经济状况">
                <TextArea rows={4} placeholder="描述地点的经济状况，包括主要产业、贸易情况、财富水平等..." />
              </Form.Item>
              <Form.Item name="details" label="细节补充">
                <TextArea rows={3} placeholder="其他关于地点的细节信息..." />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingElement ? '保存修改' : '添加设定'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorldSettingPanel;