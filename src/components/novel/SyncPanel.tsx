import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Space, Typography, message, Spin, Tag, Modal, Select, Radio, Popconfirm } from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  EditOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Novel } from '#/novel';
import { AIGenerationType, SyncOption, WorldSettingType } from '@/types/ai-generation';
// 移除对旧同步服务的引用
// import { syncService } from '@/services/syncService';
import { contentSyncService } from '@/services/contentSyncService'; // 导入新的内容同步服务
import { optimizedDataSyncService } from '@/services/optimizedDataSyncService'; // 导入优化的数据同步服务
import { outlineSyncService } from '@/services/outlineSyncService'; // 导入大纲同步服务

const { Text, Paragraph } = Typography;
const { Option } = Select;

interface SyncPanelProps {
  content: string;
  novel: Novel;
  generationType: AIGenerationType;
  onSync?: (result: any) => void;
  style?: React.CSSProperties;
  selectedChapterId?: string; // 添加章节ID属性
}

const SyncPanel: React.FC<SyncPanelProps> = ({ 
  content, 
  novel, 
  generationType, 
  onSync,
  style,
  selectedChapterId // 接收章节ID
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [selectedSyncOption, setSelectedSyncOption] = useState<string>('');
  const [syncOptions, setSyncOptions] = useState<{
    overwrite?: boolean;
    merge?: boolean;
    settingType?: WorldSettingType;
  }>({});
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false); // 添加确认状态

  // 添加状态来存储解析后的内容和摘要
  const [parsedContent, setParsedContent] = useState<{ content: string; summary: string } | null>(null);

  // 解析内容和摘要
  useEffect(() => {
    const summarySeparator = '#SUMMARY#';
    if (content.includes(summarySeparator)) {
      const parts = content.split(summarySeparator);
      if (parts.length === 2) {
        const contentPart = parts[0].trim();
        const summaryPart = parts[1].trim();
        setParsedContent({ content: contentPart, summary: summaryPart });
      }
    }
  }, [content]);

  const getSyncOptions = (): SyncOption[] => {
    switch (generationType) {
      case 'outline':
        return [
          { 
            key: 'outline', 
            label: '同步到大纲管理', 
            icon: <FileTextOutlined />,
            description: '将生成的大纲内容同步到大纲管理模块',
            targetModule: 'outline'
          }
        ];
      case 'character':
        return [
          { 
            key: 'character', 
            label: '同步到角色设定', 
            icon: <UserOutlined />,
            description: '将生成的角色信息同步到世界观设定模块',
            targetModule: 'worldview'
          }
        ];
      case 'location':
        return [
          { 
            key: 'location', 
            label: '同步到地点设定', 
            icon: <EnvironmentOutlined />,
            description: '将生成的地点信息同步到世界观设定模块',
            targetModule: 'worldview'
          }
        ];
      case 'culture':
        return [
          { 
            key: 'culture', 
            label: '同步到文化设定', 
            icon: <GlobalOutlined />,
            description: '将生成的文化信息同步到世界观设定模块',
            targetModule: 'worldview'
          }
        ];
      case 'technology':
        return [
          { 
            key: 'technology', 
            label: '同步到科技设定', 
            icon: <ThunderboltOutlined />,
            description: '将生成的科技信息同步到世界观设定模块',
            targetModule: 'worldview'
          }
        ];
      case 'magic':
        return [
          { 
            key: 'magic', 
            label: '同步到魔法设定', 
            icon: <GlobalOutlined />,
            description: '将生成的魔法信息同步到世界观设定模块',
            targetModule: 'worldview'
          }
        ];
      case 'history':
        return [
          { 
            key: 'history', 
            label: '同步到历史设定', 
            icon: <GlobalOutlined />,
            description: '将生成的历史信息同步到世界观设定模块',
            targetModule: 'worldview'
          }
        ];
      case 'plot':
        return [
          { 
            key: 'plot', 
            label: '同步情节内容', 
            icon: <FileTextOutlined />,
            description: '将生成的情节内容同步到选定章节',
            targetModule: 'outline'
          }
        ];
      case 'content':
        return [
          { 
            key: 'content', 
            label: '同步到章节内容', 
            icon: <EditOutlined />,
            description: '将生成的内容同步到对应章节',
            targetModule: 'content'
          }
        ];
      case 'optimize':
        return [
          { 
            key: 'optimize', 
            label: '替换原内容', 
            icon: <EditOutlined />,
            description: '用优化后的内容替换原有内容',
            targetModule: 'content'
          }
        ];
      default:
        return [];
    }
  };

  const handleSyncClick = (optionKey: string) => {
    setSelectedSyncOption(optionKey);
    
    // 自动设置世界观设定类型，无需手动选择
    const settingTypeMap: Record<AIGenerationType, WorldSettingType | undefined> = {
      'character': 'character',
      'location': 'location', 
      'culture': 'culture',
      'technology': 'technology',
      'magic': 'magic',
      'history': 'history',
      'outline': undefined,
      'plot': undefined,
      'content': undefined,
      'optimize': undefined
    };
    
    const settingType = settingTypeMap[generationType];
    if (settingType) {
      setSyncOptions({ ...syncOptions, settingType });
    }
    
    // 对于可能替换原有内容的操作，显示确认对话框
    // 1. 章节相关操作且有选中章节时需要确认
    const isChapterOperation = (optionKey === 'optimize' || optionKey === 'content' || optionKey === 'plot') && selectedChapterId;
    // 2. 世界观设定操作（角色、地点、文化等）且不是新增操作时需要确认
    const isWorldSettingOperation = (['character', 'location', 'culture', 'technology', 'magic', 'history'].includes(generationType)) && optionKey === generationType;
    
    if (isChapterOperation || isWorldSettingOperation) {
      setShowReplaceConfirm(true);
    } else {
      performSync(optionKey);
    }
  };

  const handleConfirmReplace = () => {
    setShowReplaceConfirm(false);
    performSync('optimize');
  };

  const handleCancelReplace = () => {
    setShowReplaceConfirm(false);
    setSelectedSyncOption('');
  };

  const performSync = useCallback(async (optionKey: string) => {
    setSyncing(true);
    
    try {
      let result;
      
      // 如果是内容创作、内容优化或情节发展且有选中的章节ID，使用新的contentSyncService
      if ((generationType === 'content' || generationType === 'optimize' || generationType === 'plot') && selectedChapterId) {
        // 使用解析后的内容和摘要（如果有的话）
        const contentToSync = parsedContent ? parsedContent.content : content;
        const fullContentToSync = parsedContent 
          ? `${contentToSync}\n#SUMMARY#\n${parsedContent.summary}` 
          : contentToSync;
          
        // 根据操作类型选择不同的同步方法
        if (generationType === 'optimize') {
          // 内容优化使用替换方式
          result = await contentSyncService.syncToChapter(
            fullContentToSync,  // 传递包含摘要的完整内容
            novel.id,
            selectedChapterId
          );
        } else if (generationType === 'plot') {
          // 情节发展使用追加方式
          result = await contentSyncService.appendToChapter(
            fullContentToSync,  // 传递包含摘要的完整内容
            novel.id,
            selectedChapterId
          );
        } else {
          // 内容创作使用追加方式
          result = await contentSyncService.appendToChapter(
            fullContentToSync,  // 传递包含摘要的完整内容
            novel.id,
            selectedChapterId
          );
        }
      } else {
        // 否则使用专门的同步服务
        switch (generationType) {
          case 'character':
            // 导入并使用角色同步服务
            const { characterSyncService } = await import('@/services/sync/CharacterSyncService');
            result = await characterSyncService.syncCharacters(content, novel.id);
            break;
          case 'location':
            // 导入并使用地点同步服务
            const { locationSyncService } = await import('@/services/sync/LocationSyncService');
            result = await locationSyncService.syncLocations(content, novel.id);
            break;
          case 'culture':
            // 导入并使用文化同步服务
            const { cultureSyncService } = await import('@/services/sync/CultureSyncService');
            result = await cultureSyncService.syncCultures(content, novel.id);
            break;
          case 'technology':
            // 导入并使用科技同步服务
            const { technologySyncService } = await import('@/services/sync/TechnologySyncService');
            result = await technologySyncService.syncTechnologies(content, novel.id);
            break;
          case 'magic':
            // 导入并使用魔法同步服务
            const { magicSyncService } = await import('@/services/sync/MagicSyncService');
            result = await magicSyncService.syncMagics(content, novel.id);
            break;
          case 'history':
            // 导入并使用历史同步服务
            const { historySyncService } = await import('@/services/sync/HistorySyncService');
            result = await historySyncService.syncHistories(content, novel.id);
            break;
          case 'outline':
          case 'plot':
            // 对于大纲生成，使用专门的大纲同步服务
            if (parsedContent && parsedContent.content) {
              // 如果有解析出的内容，使用解析后的内容
              result = await outlineSyncService.syncOutline(parsedContent.content, novel.id);
            } else {
              // 否则使用原始内容
              result = await outlineSyncService.syncOutline(content, novel.id);
            }
            break;
          default:
            // 对于其他类型，使用优化的数据同步服务
            result = await optimizedDataSyncService.syncAllData();
        }
      }

      if (result.success) {
        message.success(result.message);
        // 添加额外的延迟确保数据完全同步
        await new Promise(resolve => setTimeout(resolve, 300));
        onSync?.(result);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('同步失败:', error);
      message.error('同步失败，请重试');
    } finally {
      setSyncing(false);
      setSyncModalVisible(false);
    }
  }, [content, generationType, novel.id, onSync, parsedContent, selectedChapterId, syncOptions]);

  const handleModalOk = () => {
    // 不再需要手动选择世界观设定类型，直接执行同步
    performSync(selectedSyncOption);
  };

  const currentSyncOptions = getSyncOptions();

  if (currentSyncOptions.length === 0) {
    return null;
  }

  return (
    <>
      <Card 
        title={
          <Space>
            <ThunderboltOutlined />
            <span>同步到《{novel.title}》的创作中心</span>
          </Space>
        }
        style={{
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          ...style
        }}
        size="small"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">
              将AI生成的内容同步到对应的创作模块中，便于后续编辑和管理。
            </Text>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Tag color="blue" icon={<CheckCircleOutlined />}>
              内容长度: {content.length} 字符
            </Tag>
            <Tag color="green">
              目标小说: {novel.title}
            </Tag>
            {parsedContent && parsedContent.summary && (
              <Tag color="purple">
                摘要长度: {parsedContent.summary.length} 字符
              </Tag>
            )}
          </div>

          <Space wrap>
            {currentSyncOptions.map(option => (
              <Button
                key={option.key}
                type="primary"
                icon={option.icon}
                loading={syncing && selectedSyncOption === option.key}
                onClick={() => handleSyncClick(option.key)}
                disabled={syncing}
                style={{ 
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
              >
                {option.label}
              </Button>
            ))}
          </Space>

          {content.length > 1000 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: '8px 12px',
              background: '#fffbe6',
              borderRadius: '6px',
              border: '1px solid #ffe58f'
            }}>
              <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
              <Text type="warning">
                内容较长，同步后请在创作中心中检查和调整
              </Text>
            </div>
          )}
        </Space>
      </Card>

      {/* 内容替换确认对话框 */}
      <Modal
        title="确认替换内容"
        open={showReplaceConfirm}
        onOk={handleConfirmReplace}
        onCancel={handleCancelReplace}
        okText="确认替换"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        {['character', 'location', 'culture', 'technology', 'magic', 'history'].includes(generationType) ? (
          <>
            <p>此操作将用新内容替换现有的{generationType === 'character' ? '角色' : generationType === 'location' ? '地点' : generationType === 'culture' ? '文化' : generationType === 'technology' ? '科技' : generationType === 'magic' ? '魔法' : '历史'}设定，原有内容将无法恢复。</p>
            <p>建议在替换前先备份当前设定。</p>
            <p>是否确认替换？</p>
          </>
        ) : (
          <>
            <p>此操作将用新内容完全替换章节的原有内容，原有内容将无法恢复。</p>
            <p>建议在替换前先保存当前内容为新版本。</p>
            <p>是否确认替换？</p>
          </>
        )}
      </Modal>
    </>
  );
};

export default SyncPanel;