import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Modal, 
  Form, 
  message, 
  Space, 
  Popconfirm, 
  Tag,
  Typography,
  Select,
  InputNumber,
  Switch,
  Divider,
  List,
  Avatar
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  SoundOutlined,
  ApiOutlined,
  BookOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  UserOutlined,
  HomeOutlined,
  ReadOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { hybridStorageService } from '@/services/hybridStorageService';
import { WorldSettingType } from '@/types/ai-generation';
import { characterConfig } from './configs/characterConfig';
import { locationConfig } from './configs/locationConfig';
import { cultureConfig } from './configs/cultureConfig';
import { technologyConfig } from './configs/technologyConfig';
import { magicConfig } from './configs/magicConfig';
import { historyConfig } from './configs/historyConfig';

import { enhanceTypeSpecificGuidance } from '@/utils/worldElementUtils';
import { HISTORY_GENERATION_PROMPT } from '@/constants/aiPrompts';
import { useNavigate, useLocation } from 'react-router-dom';
import worldSettingParserService from '@/services/worldSettingParserService';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 生成UUID的函数
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface WorldElementBase {
  createdAt?: string;
  lastModified?: string;
}

interface WorldElement extends WorldElementBase {
  // 基础字段
  id: string;
  novelId?: string;
  name: string;
  description: string;
  type: 'character' | 'location' | 'culture' | 'technology' | 'magic' | 'history';
  tags: string[];
  createdAt?: string;
  lastModified?: string;
  
  // 角色特有字段
  role?: string;  // 修改为字符串类型，支持AI生成的内容
  customRole?: string;  // 自定义角色类型
  appearance?: string;      // 外貌特征
  personality?: string;     // 性格特质
  background?: string;      // 背景故事
  abilities?: string;       // 能力设定
  relationships?: string;   // 人际关系
  characterArc?: string;    // 角色发展弧光
  details?: string;         // 细节补充
  
  // 地点特有字段
  locationType?: string;    // 地点类型
  importance?: string;      // 重要性
  geography?: string;       // 地理环境
  culture?: string;         // 文化背景
  politics?: string;        // 政治环境
  economy?: string;         // 经济状况
  architecture?: string;    // 建筑特色
  socialStructure?: string; // 社会结构
  governance?: string;      // 治理体系
  laws?: string;            // 法律法规
  terrain?: string;         // 地形特征
  naturalResources?: string; // 自然资源
  ecosystem?: string;        // 生态系统
  historyBackground?: string; // 历史背景
  
  // 历史设定特有字段
  timeline?: string;        // 时间线
  events?: string;          // 重要事件
  figures?: string;         // 历史人物
  consequences?: string;    // 历史后果
  
  // 科技设定特有字段
  level?: string;           // 技术水平
  applications?: string;    // 应用领域
  limitations?: string;     // 使用限制
  impact?: string;          // 社会影响
  
  // 文化设定特有字段
  customs?: string;         // 风俗习惯
  values?: string;          // 核心价值观
  art?: string;             // 艺术形式
  religion?: string;        // 宗教信仰
  language?: string;        // 语言文字
  cultureInteraction?: string; // 与其他文化的互动
  
  // 地点经济特有字段
  mainIndustries?: string;  // 主要产业
  
  // 扩展标签系统支持
  professionTags?: string[];  // 职业标签
  personalityTags?: string[];  // 性格标签
  functionTags?: string[];  // 功能标签
}

interface WorldElementPanelProps {
  type: 'character' | 'location' | 'culture' | 'technology' | 'magic' | 'history';
  typeName: string;
  icon: React.ReactNode;
  novelId?: string;
  aiSyncData?: any;
  fields: Array<{
    name: string;
    label: string;
    type: 'input' | 'textarea' | 'select';
    placeholder?: string;
    rows?: number;
    options?: Array<{ value: string; label: string }>;
  }>;
}

// 将默认导出改为命名导出
export type { WorldElementPanelProps };

const WorldElementPanel: React.FC<WorldElementPanelProps> = ({ 
  type, 
  typeName, 
  icon, 
  novelId, 
  aiSyncData,
  fields 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [elements, setElements] = useState<WorldElement[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingElement, setEditingElement] = useState<WorldElement | null>(null);
  const [form] = Form.useForm();

  // 如果没有选择小说，显示提示
  if (!novelId) {
    return (
      <div className="world-setting-panel">
        <div className="panel-header">
          <h2>{icon} {typeName}设定</h2>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px',
          color: '#8c8c8c'
        }}>
          {icon && React.cloneElement(icon as React.ReactElement, { style: { fontSize: '48px', marginBottom: '16px' } })}
          <p style={{ fontSize: '16px' }}>请先在"我的书籍"中选择一本小说</p>
          <p style={{ color: '#bfbfbf' }}>选择后即可管理该小说的{typeName}设定</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (novelId) {
      loadWorldElements();
    }
  }, [novelId, type, typeName]);

  // 处理AI同步数据
  useEffect(() => {
    if (aiSyncData && aiSyncData.generatedContent) {
      // 解析AI生成的内容并自动填充表单
      handleAISync(aiSyncData.generatedContent);
    }
  }, [aiSyncData?.generatedContent]);

  // 监听世界设定同步完成事件，自动刷新数据
  useEffect(() => {
    const handleWorldSettingSyncComplete = (event: CustomEvent) => {
      const { novelId: eventNovelId, type: eventType } = event.detail;
      // 确保是当前小说的世界设定同步事件
      // 修复：使用正确的变量名进行比较，避免变量覆盖问题
      if (eventNovelId === novelId && eventType === type) {
        // 添加一个小延迟确保数据同步完成
        setTimeout(() => {
          loadWorldElements();
        }, 500);
      }
    };

    // 监听数据刷新事件
    const handleDataRefresh = (event: CustomEvent) => {
      const { novelId: eventNovelId } = event.detail;
      // 确保是当前小说的数据刷新事件
      if (eventNovelId === novelId) {
        // 添加一个小延迟确保数据同步完成
        setTimeout(() => {
          loadWorldElements();
        }, 500);
      }
    };

    // 监听世界设定同步完成事件
    window.addEventListener('worldSettingSyncComplete', handleWorldSettingSyncComplete as EventListener);
    window.addEventListener('dataRefreshNeeded', handleDataRefresh as EventListener);
    
    return () => {
      window.removeEventListener('worldSettingSyncComplete', handleWorldSettingSyncComplete as EventListener);
      window.removeEventListener('dataRefreshNeeded', handleDataRefresh as EventListener);
    };
  }, [novelId, type]);

  // 处理URL参数，自动打开特定元素的编辑对话框
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    let elementId = null;
    
    // 根据面板类型获取对应的参数名
    switch (type) {
      case 'character':
        elementId = searchParams.get('characterId');
        break;
      case 'location':
        elementId = searchParams.get('locationId');
        break;
      case 'culture':
        elementId = searchParams.get('cultureId');
        break;
      case 'technology':
        elementId = searchParams.get('technologyId');
        break;
      case 'magic':
        elementId = searchParams.get('magicId');
        break;
      case 'history':
        elementId = searchParams.get('historyId');
        break;
      default:
        break;
    }
    
    // 如果有elementId参数且当前面板类型匹配，则自动打开编辑对话框
    if (elementId) {
      // 延迟执行以确保元素数据已加载
      const timer = setTimeout(() => {
        const element = elements.find(el => el.id === elementId);
        if (element) {
          handleEdit(element);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location.search, elements, type]);

  // 修改loadWorldElements方法，添加强制刷新机制
  const loadWorldElements = useCallback(async () => {
    try {
      const allElements = await hybridStorageService.getWorldElements(type, novelId);
      // 直接设置状态，强制触发重新渲染
      setElements(allElements);
      
      // 添加一个微任务延迟，确保状态更新完成
      await new Promise(resolve => setTimeout(resolve, 0));
    } catch (error) {
      if (error instanceof Error) {
        message.error(`加载数据失败: ${error.message}`);
      } else {
        message.error('加载数据失败，请检查网络连接或刷新页面重试');
      }
    }
  }, [novelId, type, typeName]);

  const handleAdd = () => {
    setEditingElement(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 用于强制更新组件的hook
  const [, updateState] = React.useState<object>();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const handleEdit = (element: WorldElement) => {
    setEditingElement(element);
    setModalVisible(true);
    // 延迟设置表单字段值，确保表单组件已挂载
    setTimeout(() => {
      // 在编辑时，我们需要确保描述字段不包含其他字段的内容
      // 如果描述字段包含其他字段的内容，我们只保留真正的描述部分
      let description = element.description || '';
    
    // 检查描述是否包含其他字段的内容（通过检查是否包含字段标题）
    // 修复：只有在确定描述包含其他字段内容时才清空，避免误判正常描述
    if (description.includes('外貌：') && description.includes('性格：') && description.includes('背景：')) {
      // 这可能是合并了其他字段的描述，我们需要提取真正的描述部分
      // 在这种情况下，我们暂时清空描述，让用户重新填写
      description = '';
    }
    
    // 对于地点类型，检查是否包含其他字段内容
    // 修复：改进判断逻辑，避免误判正常的描述内容
    // 只有当描述明显包含多个字段内容时才清空
    if (type === 'location' && 
        description.includes('【地理环境】') && 
        description.includes('【文化背景】') &&
        description.includes('【政治环境】') &&
        description.includes('【经济状况】')) {
      // 这种情况下，描述包含了完整的地点设定内容，我们需要提取真正的描述部分
      // 查找【描述】字段的内容
      const descMatch = description.match(/【描述】[:：]\s*([^\n【]+)/);
      if (descMatch && descMatch[1]) {
        description = descMatch[1].trim();
      } else {
        // 如果找不到明确的描述字段，尝试查找描述内容
        const lines = description.split('\n');
        let descLines = [];
        let inDescSection = false;
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.includes('【描述】') || trimmedLine.includes('【简介】')) {
            inDescSection = true;
            // 提取冒号后的内容
            const colonIndex = Math.max(trimmedLine.indexOf('：'), trimmedLine.indexOf(':'));
            if (colonIndex > -1) {
              const content = trimmedLine.substring(colonIndex + 1).trim();
              if (content) {
                descLines.push(content);
              }
            }
            continue;
          } else if (trimmedLine.includes('【') && trimmedLine.includes('】')) {
            // 遇到其他字段标题，结束描述部分
            inDescSection = false;
            continue;
          }
          
          if (inDescSection && trimmedLine) {
            descLines.push(trimmedLine);
          }
        }
        
        if (descLines.length > 0) {
          description = descLines.join('\n');
        } else {
          // 如果仍然找不到描述内容，清空描述让用户重新填写
          description = '';
        }
      }
    }
    
    // 对于科技设定类型，清理社会影响和细节补充字段中的标签内容
    let impact = element.impact || '';
    let details = element.details || '';
    
    if (type === 'technology') {
      // 清理社会影响字段中的标签内容
      if (impact.includes('对社会的影响：')) {
        // 提取"对社会的影响："之后的实际内容
        const impactLines = impact.split('\n');
        const cleanedImpactLines = impactLines.map(line => {
          if (line.includes('对社会的影响：')) {
            const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
            if (colonIndex > -1) {
              return line.substring(colonIndex + 1).trim();
            }
          } else if (line.includes('对经济的影响：')) {
            const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
            if (colonIndex > -1) {
              return line.substring(colonIndex + 1).trim();
            }
          } else if (line.includes('对文化的影响：')) {
            const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
            if (colonIndex > -1) {
              return line.substring(colonIndex + 1).trim();
            }
          }
          return line;
        }).filter(line => line.trim() !== ''); // 过滤掉空行
        
        impact = cleanedImpactLines.join('\n');
      }
      
      // 清理细节补充字段中的标签内容
      if (details.includes('细节补充：')) {
        // 提取"细节补充："之后的实际内容
        const detailsLines = details.split('\n');
        const cleanedDetailsLines = detailsLines.map(line => {
          if (line.includes('细节补充：')) {
            const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
            if (colonIndex > -1) {
              return line.substring(colonIndex + 1).trim();
            }
          }
          return line;
        }).filter(line => line.trim() !== ''); // 过滤掉空行
        
        details = cleanedDetailsLines.join('\n');
      }
    }
    
    // 对于魔法设定类型，清理细节补充字段中的标签内容
    if (type === 'magic') {
      // 清理细节补充字段中的标签内容
      if (details.includes('细节补充：')) {
        // 提取"细节补充："之后的实际内容
        const detailsLines = details.split('\n');
        const cleanedDetailsLines = detailsLines.map(line => {
          if (line.includes('细节补充：')) {
            const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
            if (colonIndex > -1) {
              return line.substring(colonIndex + 1).trim();
            }
          }
          return line;
        }).filter(line => line.trim() !== ''); // 过滤掉空行
        
        details = cleanedDetailsLines.join('\n');
      }
    }
    
    // 对于历史设定类型，清理细节补充字段中的标签内容
    if (type === 'history') {
      // 清理时间线、重要事件、历史人物、历史后果和细节补充字段中的标签内容
      let timeline = element.timeline || '';
      let events = element.events || '';
      let figures = element.figures || '';
      let consequences = element.consequences || '';
      let details = element.details || '';
      
      // 清理时间线字段中的标签内容
      if (timeline.includes('时间线：')) {
        // 提取"时间线："之后的实际内容
        const timelineLines = timeline.split('\n');
        const cleanedTimelineLines = timelineLines.map(line => {
          if (line.includes('时间线：')) {
            const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
            if (colonIndex > -1) {
              return line.substring(colonIndex + 1).trim();
            }
          }
          return line;
        }).filter(line => line.trim() !== ''); // 过滤掉空行
        
        timeline = cleanedTimelineLines.join('\n');
      }
      
      // 清理重要事件字段中的标签内容
      if (events.includes('重要事件：')) {
        // 提取"重要事件："之后的实际内容
        const eventsLines = events.split('\n');
        const cleanedEventsLines = eventsLines.map(line => {
          if (line.includes('重要事件：')) {
            const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
            if (colonIndex > -1) {
              return line.substring(colonIndex + 1).trim();
            }
          }
          return line;
        }).filter(line => line.trim() !== ''); // 过滤掉空行
        
        events = cleanedEventsLines.join('\n');
      }
      
      // 清理历史人物字段中的标签内容
      if (figures.includes('历史人物：')) {
        // 提取"历史人物："之后的实际内容
        const figuresLines = figures.split('\n');
        const cleanedFiguresLines = figuresLines.map(line => {
          if (line.includes('历史人物：')) {
            const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
            if (colonIndex > -1) {
              return line.substring(colonIndex + 1).trim();
            }
          }
          return line;
        }).filter(line => line.trim() !== ''); // 过滤掉空行
        
        figures = cleanedFiguresLines.join('\n');
      }
      
      // 清理历史后果字段中的标签内容
      if (consequences.includes('历史后果：')) {
        // 提取"历史后果："之后的实际内容
        const consequencesLines = consequences.split('\n');
        const cleanedConsequencesLines = consequencesLines.map(line => {
          if (line.includes('历史后果：')) {
            const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
            if (colonIndex > -1) {
              return line.substring(colonIndex + 1).trim();
            }
          }
          return line;
        }).filter(line => line.trim() !== ''); // 过滤掉空行
        
        consequences = cleanedConsequencesLines.join('\n');
      }
      
      // 清理细节补充字段中的标签内容
      if (details.includes('细节补充：')) {
        // 提取"细节补充："之后的实际内容
        const detailsLines = details.split('\n');
        const cleanedDetailsLines = detailsLines.map(line => {
          if (line.includes('细节补充：')) {
            const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
            if (colonIndex > -1) {
              return line.substring(colonIndex + 1).trim();
            }
          }
          return line;
        }).filter(line => line.trim() !== ''); // 过滤掉空行
        
        details = cleanedDetailsLines.join('\n');
      }
      
      // 更新element变量中的历史设定字段，以便在formValues中使用
      element.timeline = timeline;
      element.events = events;
      element.figures = figures;
      element.consequences = consequences;
      element.details = details;
    }
    
    // 准备表单字段值
    const formValues: any = {
      ...element,
      description,
      tags: element.tags ? element.tags.join('、') : '', // 使用中文顿号连接标签
      details: element.details || details,
      governance: element.governance || '',
      laws: element.laws || '',
      mainIndustries: element.mainIndustries || '',
      impact: impact
    };
    
    // 对于文化设定类型，添加新增字段的处理
    if (type === 'culture') {
      Object.assign(formValues, {
        customs: element.customs || '',
        values: element.values || '',
        art: element.art || '',
        religion: element.religion || '',
        language: element.language || '',
        cultureInteraction: element.cultureInteraction || ''
      });
    }
    
    // 特殊处理地点类型字段
    if (type === 'location') {
      // 使用元素的locationType字段值填充表单
      formValues.locationType = element.locationType || '';  // 使用元素的locationType字段值
    }
    
    // 特殊处理角色类型字段 - 修复角色类型显示问题
    if (element.type === 'character') {
      // 确保角色类型字段正确设置
      formValues.role = element.role || '';
      formValues.customRole = element.customRole || '';
    }
    
      form.setFieldsValue(formValues);
    }, 0);
  };

  const handleDelete = async (id: string) => {
    try {
      await hybridStorageService.deleteWorldElement(id, type);
      const newElements = elements.filter(el => el.id !== id);
      setElements(newElements);
      message.success('删除成功');
      
      // 发布数据刷新事件，通知其他组件数据已更新
      window.dispatchEvent(new CustomEvent('dataRefreshNeeded', {
        detail: { novelId }
      }));
    } catch (error) {
      console.error(`删除${typeName}设定失败:`, error);
      message.error('删除失败');
    }
  };

  // 处理AI同步数据
  const handleAISync = async (content: string) => {
    try {
      // 使用worldSettingParserService来解析AI生成的内容
      let parsedData: any;
      
      switch (type) {
        case 'location':
          parsedData = await worldSettingParserService.parseLocationContent(content);
          break;
        case 'character':
          parsedData = await worldSettingParserService.parseCharacterContent(content);
          break;
        case 'culture':
        case 'technology':
        case 'magic':
        case 'history':
        default:
          // 对于其他类型，使用通用解析方法
          parsedData = worldSettingParserService.parseSettingDetails(content, type);
          break;
      }
      
      // 准备表单数据
      const formData: any = {
        name: parsedData.name || 'AI生成内容',
        // 修复：确保只使用真正的描述内容，而不是整个AI生成的内容
        description: parsedData.description || '',
        tags: parsedData.tags ? parsedData.tags.join('、') : ''
      };
      
      // 根据不同类型添加特定字段
      if (type === 'location') {
        // 修复：确保只同步需要的字段，避免同步所有AI生成的内容
        Object.assign(formData, {
          locationType: parsedData.locationType || '',  // 使用locationType字段
          importance: parsedData.importance || '',
          geography: parsedData.geography || '',
          culture: parsedData.culture || '',
          politics: parsedData.politics || '',
          economy: parsedData.economy || '',
          details: parsedData.details || ''
        });
      } else if (type === 'character') {
        Object.assign(formData, {
          role: parsedData.role || 'supporting',
          customRole: parsedData.customRole || '', // 添加自定义角色类型
          appearance: parsedData.appearance || '',
          personality: parsedData.personality || '',
          background: parsedData.background || '',
          abilities: parsedData.abilities || '',
          relationships: parsedData.relationships || '',
          characterArc: parsedData.characterArc || '',
          details: parsedData.details || ''
        });
      } else if (type === 'culture') {
        // 对于文化设定类型，处理主项字段
        Object.assign(formData, {
          customs: parsedData.customs || '',
          values: parsedData.values || '',
          art: parsedData.art || '',
          religion: parsedData.religion || '',
          language: parsedData.language || '',
          cultureInteraction: parsedData.cultureInteraction || '',
          details: parsedData.details || ''
        });
      } else if (type === 'technology') {
        // 对于科技设定类型，清理社会影响和细节补充字段中的标签内容
        let impact = parsedData.impact || '';
        let details = parsedData.details || '';
        
        // 清理社会影响字段中的标签内容
        if (impact.includes('对社会的影响：')) {
          // 提取"对社会的影响："之后的实际内容
          const impactLines = impact.split('\n');
          const cleanedImpactLines = impactLines.map(line => {
            if (line.includes('对社会的影响：')) {
              const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
              if (colonIndex > -1) {
                return line.substring(colonIndex + 1).trim();
              }
            } else if (line.includes('对经济的影响：')) {
              const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
              if (colonIndex > -1) {
                return line.substring(colonIndex + 1).trim();
              }
            } else if (line.includes('对文化的影响：')) {
              const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
              if (colonIndex > -1) {
                return line.substring(colonIndex + 1).trim();
              }
            }
            return line;
          }).filter(line => line.trim() !== ''); // 过滤掉空行
          
          impact = cleanedImpactLines.join('\n');
        }
        
        // 清理细节补充字段中的标签内容
        if (details.includes('细节补充：')) {
          // 提取"细节补充："之后的实际内容
          const detailsLines = details.split('\n');
          const cleanedDetailsLines = detailsLines.map(line => {
            if (line.includes('细节补充：')) {
              const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
              if (colonIndex > -1) {
                return line.substring(colonIndex + 1).trim();
              }
            }
            return line;
          }).filter(line => line.trim() !== ''); // 过滤掉空行
          
          details = cleanedDetailsLines.join('\n');
        }
        
        Object.assign(formData, {
          level: parsedData.level || '',
          applications: parsedData.applications || '',
          limitations: parsedData.limitations || '',
          impact: impact,
          details: details
        });
      } else if (type === 'magic') {
        // 对于魔法设定类型，清理细节补充字段中的标签内容
        let details = parsedData.details || '';
        
        // 清理细节补充字段中的标签内容
        if (details.includes('细节补充：')) {
          // 提取"细节补充："之后的实际内容
          const detailsLines = details.split('\n');
          const cleanedDetailsLines = detailsLines.map(line => {
            if (line.includes('细节补充：')) {
              const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
              if (colonIndex > -1) {
                return line.substring(colonIndex + 1).trim();
              }
            }
            return line;
          }).filter(line => line.trim() !== ''); // 过滤掉空行
          
          details = cleanedDetailsLines.join('\n');
        }
        
        Object.assign(formData, {
          level: parsedData.level || '',
          applications: parsedData.applications || '',
          limitations: parsedData.limitations || '',
          impact: parsedData.impact || '',
          details: details
        });
      } else if (type === 'history') {
        // 对于历史设定类型，清理细节补充字段中的标签内容
        let details = parsedData.details || '';
        
        // 清理细节补充字段中的标签内容
        if (details.includes('细节补充：')) {
          // 提取"细节补充："之后的实际内容
          const detailsLines = details.split('\n');
          const cleanedDetailsLines = detailsLines.map(line => {
            if (line.includes('细节补充：')) {
              const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
              if (colonIndex > -1) {
                return line.substring(colonIndex + 1).trim();
              }
            }
            return line;
          }).filter(line => line.trim() !== ''); // 过滤掉空行
          
          details = cleanedDetailsLines.join('\n');
        }
        
        Object.assign(formData, {
          timeline: parsedData.timeline || '',
          events: parsedData.events || '',
          figures: parsedData.figures || '',
          consequences: parsedData.consequences || '',
          details: details
        });
      }
      
      // 填充表单
      form.setFieldsValue(formData);
      setModalVisible(true);
      
      message.success('AI生成内容已同步到表单，请检查并保存');
    } catch (error) {
      console.error('处理AI同步数据失败:', error);
      message.error('同步AI数据失败');
    }
  };
  
  // 从文本行中提取值
  const extractValue = (line: string): string => {
    // 处理中文冒号和英文冒号
    const colonIndex = line.indexOf('：');
    if (colonIndex > -1) {
      return line.substring(colonIndex + 1).trim();
    }
    
    const englishColonIndex = line.indexOf(':');
    if (englishColonIndex > -1) {
      return line.substring(englishColonIndex + 1).trim();
    }
    
    return line.trim();
  };

  const handleSubmit = async (values: any) => {
    try {
      console.log(`开始保存${typeName}设定:`, values);
      
      // 处理标签数据
      const tags = values.tags ? values.tags.split('、').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];
      
      // 准备保存的数据
      const elementData: any = {
        novelId: novelId,
        name: values.name,
        description: values.description,
        type: type,
        tags: tags,
        createdAt: editingElement?.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      
      // 只有在编辑现有元素时才设置ID，添加新元素时不设置ID，让后端生成
      if (editingElement?.id) {
        elementData.id = editingElement.id;
        // 对于后端API，我们需要确保使用_id字段而不是id字段
        elementData._id = editingElement.id;
      } else {
        // 添加新元素时不设置ID，让后端生成
        // 确保不包含任何ID字段
        delete elementData.id;
        delete elementData._id;
      }
      
      // 根据不同类型添加特定字段
      switch (type) {
        case 'character':
          // 修复角色类型处理，确保正确保存role和customRole字段
          elementData.role = values.role || 'supporting';  // 默认角色类型为配角
          elementData.customRole = values.customRole || '';  // 自定义角色类型
          elementData.appearance = values.appearance;
          elementData.personality = values.personality;
          elementData.background = values.background;
          elementData.abilities = values.abilities;
          elementData.relationships = values.relationships;
          elementData.characterArc = values.characterArc;
          elementData.details = values.details;
          break;
        case 'location':
          elementData.locationType = values.locationType;
          elementData.importance = values.importance;
          elementData.geography = values.geography;
          elementData.culture = values.culture;
          elementData.politics = values.politics;
          elementData.economy = values.economy;
          elementData.details = values.details;
          elementData.architecture = values.architecture;
          elementData.socialStructure = values.socialStructure;
          elementData.governance = values.governance;
          elementData.laws = values.laws;
          elementData.terrain = values.terrain;
          elementData.naturalResources = values.naturalResources;
          elementData.ecosystem = values.ecosystem;
          elementData.historyBackground = values.historyBackground;
          break;
        case 'culture':
          elementData.customs = values.customs;
          elementData.values = values.values;
          elementData.art = values.art;
          elementData.religion = values.religion;
          elementData.language = values.language;
          elementData.cultureInteraction = values.cultureInteraction;
          elementData.details = values.details;
          break;
        case 'technology':
          elementData.level = values.level;
          elementData.applications = values.applications;
          elementData.limitations = values.limitations;
          elementData.impact = values.impact;
          elementData.details = values.details;
          break;
        case 'magic':
          elementData.level = values.level;
          elementData.applications = values.applications;
          elementData.limitations = values.limitations;
          elementData.impact = values.impact;
          elementData.details = values.details;
          break;
        case 'history':
          elementData.timeline = values.timeline;
          elementData.events = values.events;
          elementData.figures = values.figures;
          elementData.consequences = values.consequences;
          elementData.details = values.details;
          break;
      }
      
      console.log('准备保存的数据:', elementData);
      
      // 保存到混合存储服务
      await hybridStorageService.saveWorldElement(elementData, type);
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
      console.error(`保存${typeName}设定失败:`, error);
      message.error('操作失败');
    }
  };

  // AI生成设定
  const generateWithAI = async () => {
    // 检查是否已选择小说
    if (!novelId) {
      message.warning('请先选择目标小说');
      return;
    }

    try {
      // 根据不同类型生成不同的提示词
      let basePrompt = '';
      
      switch (type) {
        case 'character':
          basePrompt = '为我的小说生成详细的角色设定，要求如下：\n\n' +
                  '【角色基本信息】\n' +
                  '1. 姓名：角色的全名\n' +
                  '2. 角色类型：主角、反派、配角、次要角色等\n' +
                  '3. 标签：用中文顿号"、"分隔的关键词（如：战士、法师、商人等）\n' +
                  '4. 描述：角色的简要概述\n\n' +
                  '【外貌特征】\n' +
                  '1. 年龄和性别\n' +
                  '2. 身高、体型、肤色\n' +
                  '3. 面部特征、发型、眼睛颜色\n' +
                  '4. 穿着风格和标志性饰品\n\n' +
                  '【性格特质】\n' +
                  '1. 核心性格特点（3-5个关键词）\n' +
                  '2. 优点和缺点\n' +
                  '3. 习惯动作和口头禅\n' +
                  '4. 恐惧和弱点\n\n' +
                  '【背景故事】\n' +
                  '1. 出生背景和家庭环境\n' +
                  '2. 成长经历和关键事件\n' +
                  '3. 教育背景和技能学习\n' +
                  '4. 重要的人际关系\n\n' +
                  '【能力设定】\n' +
                  '1. 天赋能力：与生俱来的能力\n' +
                  '2. 学习技能：通过学习获得的技能\n' +
                  '3. 战斗技能：战斗相关的能力\n' +
                  '4. 特殊能力：独特的超自然能力\n\n' +
                  '【人际关系】\n' +
                  '1. 家庭关系：父母、兄弟姐妹等\n' +
                  '2. 友情关系：朋友和同伴\n' +
                  '3. 爱情关系：恋人或配偶\n' +
                  '4. 敌对关系：敌人和对手\n\n' +
                  '【角色发展弧光】\n' +
                  '1. 初始状态：故事开始时的角色状态\n' +
                  '2. 成长过程：角色经历的关键转变\n' +
                  '3. 最终状态：故事结束时的角色状态\n' +
                  '4. 转变原因：促使角色改变的关键因素\n\n' +
                  '【细节补充】\n' +
                  '1. 兴趣爱好：角色的兴趣和爱好\n' +
                  '2. 价值观念：角色的核心价值观\n' +
                  '3. 其他相关信息';
          break;
          
        case 'location':
          basePrompt = '为我的小说生成详细的地点设定，要求如下：\n\n' +
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
                  '请按照以上结构生成地点信息，每个字段一行，使用中文冒号分隔字段名和内容。';
          break;
          
        case 'culture':
          basePrompt = '为我的小说生成详细的文化设定，要求如下：\n\n' +
                  '【基本信息】\n' +
                  '1. 名称：文化的完整名称\n' +
                  '2. 标签：使用中文顿号"、"分隔，如：东方、西方、古代、现代等\n' +
                  '3. 描述：文化的简要概述\n\n' +
                  '【传统习俗】\n' +
                  '1. 节日庆典：重要的节日和庆典活动\n' +
                  '2. 礼仪规范：日常的礼仪和行为规范\n' +
                  '3. 婚丧嫁娶：婚丧嫁娶的习俗\n' +
                  '4. 饮食习惯：饮食文化和特色食物\n\n' +
                  '【价值观念】\n' +
                  '1. 核心价值：文化的核心价值观念\n' +
                  '2. 道德标准：道德评判标准\n' +
                  '3. 社会观念：对社会、家庭、个人的看法\n\n' +
                  '【艺术表现】\n' +
                  '1. 文学形式：主要的文学体裁和作品\n' +
                  '2. 音乐舞蹈：音乐和舞蹈特色\n' +
                  '3. 视觉艺术：绘画、雕塑等艺术形式\n' +
                  '4. 表演艺术：戏剧、曲艺等表演形式\n\n' +
                  '【宗教信仰】\n' +
                  '1. 主要信仰：主要的宗教信仰\n' +
                  '2. 宗教仪式：重要的宗教仪式\n' +
                  '3. 神话传说：重要的神话和传说\n\n' +
                  '【语言文字】\n' +
                  '1. 语言特点：语言的特色和语法结构\n' +
                  '2. 文字系统：文字的书写系统\n' +
                  '3. 文学传统：文学创作传统\n\n' +
                  '【文化互动】\n' +
                  '1. 文化冲突：与其他文化之间的冲突和矛盾\n' +
                  '2. 文化融合：与其他文化的交流和融合\n\n' +
                  '【细节补充】\n' +
                  '1. 教育体系：教育制度和学习方式\n' +
                  '2. 科技水平：科技发展水平\n' +
                  '3. 其他相关信息';
          break;
          
        case 'technology':
          basePrompt = '为我的小说生成详细的技术设定，要求如下：\n\n' +
                  '【基本信息】\n' +
                  '1. 名称：技术的完整名称\n' +
                  '2. 标签：使用中文顿号"、"分隔，如：能源、交通、医疗、通讯等\n' +
                  '3. 描述：技术的简要概述\n\n' +
                  '【科技水平】\n' +
                  '1. 发展阶段：技术的发展阶段\n' +
                  '2. 核心技术：核心技术原理\n' +
                  '3. 技术特点：技术的主要特点\n\n' +
                  '【应用场景】\n' +
                  '1. 主要用途：技术的主要用途\n' +
                  '2. 应用领域：技术应用的领域\n' +
                  '3. 使用方式：技术的具体使用方式\n\n' +
                  '【使用限制】\n' +
                  '1. 能源需求：技术运行所需的能源\n' +
                  '2. 资源消耗：技术运行所需的资源\n' +
                  '3. 副作用：技术使用可能产生的副作用\n' +
                  '4. 使用门槛：技术使用的难度和条件\n\n' +
                  '【社会影响】\n' +
                  '1. 对社会的影响：技术对社会结构的影响\n' +
                  '2. 对经济的影响：技术对经济发展的推动\n' +
                  '3. 对文化的影响：技术对文化发展的影响\n\n' +
                  '【细节补充】\n' +
                  '1. 发展历史：技术的发展历史\n' +
                  '2. 未来趋势：技术的未来发展方向\n' +
                  '3. 其他相关信息';
          break;
          
        case 'magic':
          basePrompt = '为我的小说生成详细的魔法设定，要求如下：\n\n' +
                  '【基本信息】\n' +
                  '1. 名称：魔法体系的完整名称\n' +
                  '2. 标签：使用中文顿号"、"分隔，如：元素、召唤、治愈、诅咒等\n' +
                  '3. 描述：魔法体系的简要概述\n\n' +
                  '【魔法系统】\n' +
                  '1. 体系特点：魔法体系的主要特点\n' +
                  '2. 修行方式：学习和掌握魔法的方式\n' +
                  '3. 等级体系：魔法师的等级划分\n\n' +
                  '【能量源泉】\n' +
                  '1. 来源：魔法力量的来源\n' +
                  '2. 获取方式：获取魔法力量的方式\n' +
                  '3. 储存方式：魔法力量的储存方式\n\n' +
                  '【施法规则】\n' +
                  '1. 施法条件：施法所需的条件\n' +
                  '2. 限制因素：施法的限制和约束\n' +
                  '3. 消耗机制：施法的能量消耗\n\n' +
                  '【法术示例】\n' +
                  '1. 基础法术：初学者可以掌握的法术\n' +
                  '2. 中级法术：中级魔法师可以掌握的法术\n' +
                  '3. 高级法术：高级魔法师可以掌握的法术\n' +
                  '4. 禁忌法术：被禁止使用的法术\n\n' +
                  '【魔法物品】\n' +
                  '1. 法器类型：主要的魔法物品类型\n' +
                  '2. 制作方法：魔法物品的制作方法\n' +
                  '3. 使用方式：魔法物品的使用方式\n\n' +
                  '【世界观关联】\n' +
                  '1. 与科技的关系：魔法与科技的相互影响\n' +
                  '2. 与文化的关系：魔法在文化中的地位和作用\n' +
                  '3. 与历史的关系：魔法在历史事件中的作用\n' +
                  '4. 与其他元素的关系：魔法与世界观中其他元素的关联\n\n' +
                  '【细节补充】\n' +
                  '1. 魔法师职业：不同的魔法师职业\n' +
                  '2. 魔法组织：魔法师和相关组织\n' +
                  '3. 其他相关信息';
          break;
          
        case 'history':
          basePrompt = HISTORY_GENERATION_PROMPT;
          break;
      }

      // 使用增强的特定指导功能，该功能会自动包含大纲信息和已有元素信息
      const enhancedGuidance = await enhanceTypeSpecificGuidance(type, novelId);
      
      // 构建包含上下文的完整提示词
      const fullPrompt = `${basePrompt}\n\n${enhancedGuidance}`;

      navigate('/ai-workspace', {
        state: {
          mode: 'world-setting',
          type: type,
          prompt: fullPrompt
        }
      });
    } catch (error) {
      console.error('AI生成提示词失败:', error);
      message.error('AI生成提示词失败，请重试');
    }
  };

  const renderElementCard = (element: WorldElement) => {
    // 处理描述内容显示，避免显示完整的地点设定内容
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
            title={`确认删除这个${typeName}吗？`}
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
            {icon} {element.name}
          </h4>
        </div>
        {/* 修复角色类型显示问题，确保只要元素类型是角色就显示标签，即使role和customRole为空 */}
        {element.type === 'character' && (
          <div className="element-role" style={{ marginBottom: '8px' }}>
            <Tag 
              color={element.role === 'protagonist' ? 'red' : element.role === 'antagonist' ? 'volcano' : 'blue'}
              style={{ fontSize: '12px', lineHeight: '20px', height: '22px', borderRadius: '4px' }}
            >
              {(element.customRole && element.customRole.trim()) || (element.role && element.role.trim()) || '未设置类型'}
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
        {/* 根据用户需求，恢复角色和地点的标签显示，使其像文化、科技设定一样显示标签内容 */}
        <div className="element-tags" style={{ marginBottom: '12px',minHeight: '50px' }}>
          {Array.isArray(element.tags) && element.tags.map(tag => (
            <Tag 
              key={tag} 
              color="blue"
              style={{ fontSize: '12px', lineHeight: '20px', height: '22px', borderRadius: '4px' }} // 修复高度拼写错误
            >
              {tag}
            </Tag>
          ))}
        </div>
      </Card>
    );
  };

  // 使用从API获取的数据，已经按novelId和type过滤
  const filteredElements = elements;

  return (
    <div className="world-setting-panel" style={{ padding: '24px' }}>
      <div 
        className="panel-header" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          padding: '16px 0',
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <Title level={2} style={{ margin: 0, fontSize: '24px', color: '#262626' }}>
          {icon} {typeName}设定
        </Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            disabled={!novelId}
            style={{ borderRadius: '6px' }}
          >
            新增{typeName}
          </Button>
          <Button 
            icon={<ThunderboltOutlined />} 
            onClick={generateWithAI}
            disabled={!novelId}
            style={{ borderRadius: '6px' }}
          >
            AI生成
          </Button>
        </Space>
      </div>



      <div 
        className="world-elements-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '16px',
          marginTop: '16px'
        }}
      >
        {filteredElements.length > 0 ? (
          filteredElements.map(renderElementCard)
        ) : (
          <div 
            className="empty-state" 
            style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '40px 0',
              color: '#8c8c8c'
            }}
          >
            {icon && React.cloneElement(icon as React.ReactElement, { style: { fontSize: 48, color: '#d9d9d9' } })}
            <p style={{ fontSize: '16px', margin: '16px 0 8px 0' }}>还没有{typeName}设定</p>
            <p style={{ fontSize: '14px', color: '#bfbfbf', marginBottom: '24px' }}>点击下方按钮开始创建您的第一个{typeName}设定</p>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!novelId}>
                添加{typeName}
              </Button>
              <Button 
                icon={<ThunderboltOutlined />} 
                onClick={generateWithAI}
                disabled={!novelId}
              >
                AI生成
              </Button>
            </Space>
          </div>
        )}
      </div>

      <Modal
        title={editingElement ? `编辑${typeName}` : `新增${typeName}`}
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
        >
          {/* 动态渲染字段，避免重复渲染name和description字段 */}
          {fields.map(field => {
            if (field.type === 'textarea') {
              return (
                <Form.Item 
                  key={field.name} 
                  name={field.name} 
                  label={field.label}
                >
                  <TextArea 
                    rows={field.rows || 3} 
                    placeholder={field.placeholder} 
                  />
                </Form.Item>
              );
            } else if (field.type === 'select') {
              return (
                <Form.Item 
                  key={field.name} 
                  name={field.name} 
                  label={field.label}
                >
                  <Select 
                    placeholder={field.placeholder}
                    onChange={(value) => {
                      // 当角色类型改变时，强制更新组件以重新渲染条件字段
                      if (field.name === 'role') {
                        setTimeout(() => forceUpdate(), 0);
                      }
                    }}
                  >
                    {field.options?.map(option => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              );
            } else {
              // 默认使用输入框
              return (
                <Form.Item 
                  key={field.name} 
                  name={field.name} 
                  label={field.label}
                >
                  <Input placeholder={field.placeholder} />
                </Form.Item>
              );
            }
          })}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingElement ? '保存修改' : `添加${typeName}`}
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

export default WorldElementPanel;