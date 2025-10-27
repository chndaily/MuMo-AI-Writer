import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, Modal, Input, Collapse, Tag, message } from 'antd';
import type { PromptCollection, AttachmentInfo } from '#/promptLibrary';
import { extractCaseLibraryAttachments, getCaseLibraryMetadata } from '@/utils/caseLibraryUtils';
import { FileTextOutlined, DownloadOutlined, SearchOutlined, MergeCellsOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface CaseLibraryPreviewProps {
  collection: PromptCollection;
}

const CaseLibraryPreview: React.FC<CaseLibraryPreviewProps> = ({ collection }) => {
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [mergedContent, setMergedContent] = useState<string>('');
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);

  // 初始化附件数据
  useEffect(() => {
    const initAttachments = async () => {
      const originalAttachments = collection.attributes.attachments || [];
      // 直接使用附件内容，不再从IndexedDB中获取
      setAttachments(originalAttachments);
    };
    
    initAttachments();
  }, [collection]);

  // 过滤附件
  const filteredAttachments = attachments.filter(att => 
    att.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (att.content && att.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 预览附件内容
  const handlePreviewAttachment = async (attachment: AttachmentInfo) => {
    // 直接使用附件内容，不再从IndexedDB中获取
    const content = attachment.content || '';
    
    setPreviewContent(content);
    setPreviewTitle(attachment.name);
    setIsPreviewModalVisible(true);
  };

  // 下载附件
  const handleDownloadAttachment = async (attachment: AttachmentInfo) => {
    // 直接使用附件内容，不再从IndexedDB中获取
    const content = attachment.content || '';
    
    if (!content) {
      message.warning('附件内容为空');
      return;
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 合并所有分块内容
  const handleMergeContent = async () => {
    // 直接使用附件内容，不再从IndexedDB中获取
    const allContents = attachments.map(att => att.content || '');
    const allContent = allContents.join('\n\n---\n\n');
    
    setMergedContent(allContent);
    setPreviewContent(allContent);
    setPreviewTitle(`${collection.attributes.name} (合并内容)`);
    setIsPreviewModalVisible(true);
  };

  // 下载合并内容
  const handleDownloadMergedContent = () => {
    if (!mergedContent) {
      message.warning('没有内容可以下载');
      return;
    }
    
    const blob = new Blob([mergedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.attributes.name}-完整内容.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('合并内容下载成功');
  };

  // 获取内容预览（前200个字符）
  const getContentPreview = (content: string) => {
    if (!content) return '';
    const preview = content.substring(0, 200);
    return content.length > 200 ? `${preview}...` : preview;
  };

  // 检查是否为分块文件
  const isChunkedFile = (name: string) => {
    return name.includes('(第') && name.includes('部分)');
  };

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4}>案例库预览</Title>
      
      {/* 搜索框 */}
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索附件..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          allowClear
        />
      </div>
      
      {/* 元信息和操作按钮 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>集合信息</Text>
          <Text type="secondary">名称: {collection.attributes.name}</Text>
          <Text type="secondary">附件数量: {attachments.length}</Text>
          {collection.attributes.description && (
            <Text type="secondary">描述: {collection.attributes.description}</Text>
          )}
          
          {/* 合并和下载按钮 */}
          {attachments.length > 1 && (
            <Space style={{ marginTop: 8 }}>
              <Button 
                icon={<MergeCellsOutlined />} 
                onClick={handleMergeContent}
                size="small"
              >
                合并预览
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={handleDownloadMergedContent}
                size="small"
              >
                下载合并内容
              </Button>
            </Space>
          )}
        </Space>
      </Card>
      
      {/* 附件列表 */}
      {filteredAttachments.length > 0 ? (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Collapse ghost>
            {filteredAttachments.map((attachment, index) => (
              <Panel
                header={
                  <Space>
                    <FileTextOutlined />
                    <Text strong>{attachment.name}</Text>
                    {isChunkedFile(attachment.name) && (
                      <Tag color="blue">分块</Tag>
                    )}
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {(attachment.size / 1024).toFixed(1)}KB
                    </Text>
                  </Space>
                }
                key={attachment.id}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    上传时间: {dayjs(attachment.uploadedAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                  
                  {attachment.content && (
                    <Paragraph 
                      ellipsis={{ rows: 3, expandable: true }} 
                      style={{ fontSize: '12px', margin: 0 }}
                    >
                      {attachment.content}
                    </Paragraph>
                  )}
                  
                  <Space>
                    <Button 
                      size="small" 
                      onClick={() => handlePreviewAttachment(attachment)}
                    >
                      预览
                    </Button>
                    <Button 
                      size="small" 
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadAttachment(attachment)}
                    >
                      下载
                    </Button>
                  </Space>
                </Space>
              </Panel>
            ))}
          </Collapse>
        </div>
      ) : (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#999'
        }}>
          <Text>暂无附件</Text>
        </div>
      )}
      
      {/* 预览模态框 */}
      <Modal
        title={previewTitle}
        visible={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsPreviewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            {previewContent}
          </pre>
        </div>
      </Modal>
    </Card>
  );
};

export default CaseLibraryPreview;