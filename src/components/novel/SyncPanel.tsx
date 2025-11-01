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
import { AIGenerationType, SyncOption, WorldSettingType, SyncResult } from '@/types/ai-generation';
// 移除对旧同步服务的引用
// import { syncService } from '@/services/syncService';
import { contentSyncService } from '@/services/contentSyncService'; // 导入新的内容同步服务
import { optimizedDataSyncService } from '@/services/optimizedDataSyncService'; // 导入优化的数据同步服务
import { outlineSyncService } from '@/services/outlineSyncService'; // 导入大纲同步服务
import { worldSettingSyncService } from '@/services/worldSettingSyncService'; // 导入世界观设定同步服务

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
  const [syncModeModalVisible, setSyncModeModalVisible] = useState(false); // 添加同步模式模态框状态
  const [worldViewSyncModeModalVisible, setWorldViewSyncModeModalVisible] = useState(false); // 添加世界观设定同步模式模态框状态
  const [selectedSyncOption, setSelectedSyncOption] = useState<string>('');
  const [syncOptions, setSyncOptions] = useState<{
    overwrite?: boolean;
    merge?: boolean;
    settingType?: WorldSettingType;
  }>({});
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false); // 添加确认状态
  const [replaceWarningInfo, setReplaceWarningInfo] = useState<{ // 添加替换警告信息状态
    type: string;
    typeName: string;
    count: number;
    names: string[];
  } | null>(null);

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

  // 添加事件监听器来处理替换警告
  useEffect(() => {
    const handleReplaceWarning = (event: CustomEvent) => {
      const info = event.detail;
      if (info.novelId === novel.id) {
        setReplaceWarningInfo(info);
        setShowReplaceConfirm(true);
      }
    };

    // 添加事件监听器
    window.addEventListener('worldSettingReplaceWarning', handleReplaceWarning as EventListener);

    // 清理事件监听器
    return () => {
      window.removeEventListener('worldSettingReplaceWarning', handleReplaceWarning as EventListener);
    };
  }, [novel.id]);

  // 执行同步操作
  const performSync = useCallback(async (optionKey: string) => {
    if (!content || !novel.id) {
      message.error('缺少必要参数');
      return;
    }

    setSelectedSyncOption(optionKey);
    setSyncing(true);
    try {
      let result: SyncResult;
      
      switch (optionKey) {
        case 'character':
        case 'location':
        case 'culture':
        case 'technology':
        case 'magic':
        case 'history':
          // 使用新的世界观设定同步服务，默认使用合并模式
          result = await worldSettingSyncService.syncWorldSettings(content, novel.id, optionKey as WorldSettingType, { syncMode: 'merge' });
          break;
        case 'outline':
        case 'plot':
          // 对于大纲生成，使用专门的大纲同步服务，采用智能合并模式
          if (parsedContent && parsedContent.content) {
            // 如果有解析出的内容，使用解析后的内容
            result = await outlineSyncService.syncOutline(parsedContent.content, novel.id, { syncMode: 'merge' });
          } else {
            // 否则使用原始内容，采用智能合并模式
            result = await outlineSyncService.syncOutline(content, novel.id, { syncMode: 'merge' });
          }
          break;
        default:
          // 对于其他类型，使用优化的数据同步服务
          result = await optimizedDataSyncService.syncAllData();
      }

      if (result.success) {
        message.success(result.message);
        // 添加额外的延迟确保数据完全同步
        await new Promise(resolve => setTimeout(resolve, 300));
        onSync?.(result);
      } else {
        message.warning(`同步存在问题：${result.message}`);
      }
    } catch (error) {
      console.error('同步失败:', error);
      message.error('同步失败，请重试');
    } finally {
      setSyncing(false);
      setSyncModalVisible(false);
      setWorldViewSyncModeModalVisible(false); // 关闭世界观设定同步模式对话框
    }
  }, [content, generationType, novel.id, onSync, parsedContent, selectedChapterId, syncOptions]);

  const handleSyncClick = useCallback((optionKey: string) => {
    // 对于大纲同步，提供智能同步选项
    if (optionKey === 'outline' || optionKey === 'plot') {
      // 显示智能同步选项模态框
      setSyncModeModalVisible(true);
    } else if (['character', 'location', 'culture', 'technology', 'magic', 'history'].includes(optionKey)) {
      // 对于世界观设定，显示同步模式选择对话框
      setWorldViewSyncModeModalVisible(true);
    } else {
      // 对于其他类型，直接执行同步
      performSync(optionKey);
    }
  }, [performSync]);

  // 执行同步操作（带同步模式）
  const performSyncWithMode = useCallback(async (optionKey: string, syncMode: 'replace' | 'merge' | 'specific' = 'merge') => {
    if (!content || !novel.id) {
      message.error('缺少必要参数');
      return;
    }

    setSelectedSyncOption(optionKey);
    setSyncing(true);
    try {
      let result: SyncResult;
      
      switch (optionKey) {
        case 'character':
        case 'location':
        case 'culture':
        case 'technology':
        case 'magic':
        case 'history':
          // 使用新的世界观设定同步服务
          result = await worldSettingSyncService.syncWorldSettings(content, novel.id, optionKey as WorldSettingType, { syncMode });
          break;
        case 'outline':
        case 'plot':
          // 对于大纲生成，使用专门的大纲同步服务
          if (parsedContent && parsedContent.content) {
            // 如果有解析出的内容，使用解析后的内容
            result = await outlineSyncService.syncOutline(parsedContent.content, novel.id, { syncMode });
          } else {
            // 否则使用原始内容
            result = await outlineSyncService.syncOutline(content, novel.id, { syncMode });
          }
          break;
        default:
          // 对于其他类型，使用优化的数据同步服务
          result = await optimizedDataSyncService.syncAllData();
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
      setSyncModeModalVisible(false);
      setWorldViewSyncModeModalVisible(false); // 关闭世界观设定同步模式对话框
    }
  }, [content, generationType, novel.id, onSync, parsedContent, selectedChapterId, syncOptions]);

  const handleConfirmReplace = () => {
    setShowReplaceConfirm(false);
    setReplaceWarningInfo(null);
    performSync(selectedSyncOption);
  };

  const handleCancelReplace = () => {
    setShowReplaceConfirm(false);
    setReplaceWarningInfo(null);
    setSelectedSyncOption('');
  };

  const handleModalOk = () => {
    // 不再需要手动选择世界观设定类型，直接执行同步
    performSync(selectedSyncOption);
  };

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
        {replaceWarningInfo ? (
          <>
            <p>此操作将用新内容替换现有的{replaceWarningInfo.typeName}设定，原有内容将无法恢复。</p>
            <p>即将被替换的{replaceWarningInfo.typeName}包括：</p>
            <ul>
              {replaceWarningInfo.names.map((name, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
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

      {/* 同步模式选择对话框 */}
      <Modal
        title="选择大纲同步模式"
        open={syncModeModalVisible}
        onCancel={() => setSyncModeModalVisible(false)}
        footer={[
          <Button key="replace" onClick={() => performSyncWithMode('outline', 'replace')}>
            完全替换
          </Button>,
          <Button key="merge" type="primary" onClick={() => performSyncWithMode('outline', 'merge')}>
            智能合并
          </Button>,
          <Button key="cancel" onClick={() => setSyncModeModalVisible(false)}>
            取消
          </Button>
        ]}
      >
        <p>请选择大纲同步模式：</p>
        <ul>
          <li><strong>完全替换</strong>：删除现有大纲，用新内容完全替换</li>
          <li><strong>智能合并</strong>：保留现有结构，只更新或添加新内容</li>
        </ul>
        <p>推荐使用<strong>智能合并</strong>模式，以保护您已有的创作内容。</p>
      </Modal>
      
      {/* 世界观设定同步模式选择对话框 */}
      <Modal
        title="选择世界观设定同步模式"
        open={worldViewSyncModeModalVisible}
        onCancel={() => setWorldViewSyncModeModalVisible(false)}
        footer={[
          <Button key="replace" onClick={() => performSyncWithMode(selectedSyncOption, 'replace')}>
            完全替换
          </Button>,
          <Button key="merge" type="primary" onClick={() => performSyncWithMode(selectedSyncOption, 'merge')}>
            智能合并
          </Button>,
          <Button key="cancel" onClick={() => setWorldViewSyncModeModalVisible(false)}>
            取消
          </Button>
        ]}
      >
        <p>请选择世界观设定同步模式：</p>
        <ul>
          <li><strong>完全替换</strong>：删除现有设定，用新内容完全替换</li>
          <li><strong>智能合并</strong>：保留现有结构，只更新或添加新内容</li>
        </ul>
        <p>推荐使用<strong>智能合并</strong>模式，以保护您已有的创作内容。</p>
      </Modal>
    </>
  );
};

export default SyncPanel;