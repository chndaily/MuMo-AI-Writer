import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Select, message, Card, List, Tag, Space, Modal, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, BookOutlined } from '@ant-design/icons';
import { WritingRecord } from '#/novel';

interface WritingRecordPanelProps {
  novelId?: string;
  aiSyncData?: any;
}

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const WritingRecordPanel: React.FC<WritingRecordPanelProps> = ({ novelId, aiSyncData }) => {
  const [form] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState<WritingRecord | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  // 直接使用 databaseManager 获取数据
  const [writingRecords, setWritingRecords] = useState<WritingRecord[]>([]);
  
  const refreshWritingRecords = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const records = await databaseManager.writingRecords.getWritingRecordsByNovelId(novelId);
      setWritingRecords(records);
    }
  };
  
  const addWritingRecord = async (record: any) => {
    const { databaseManager } = await import('@/services/index');
    return await databaseManager.writingRecords.addWritingRecord(record);
  };
  
  const updateWritingRecord = async (id: string, updates: any) => {
    const { databaseManager } = await import('@/services/index');
    const record = await databaseManager.writingRecords.getWritingRecord(id);
    if (record) {
      await databaseManager.writingRecords.updateWritingRecord({ ...record, ...updates });
    }
  };
  
  const deleteWritingRecord = async (id: string) => {
    const { databaseManager } = await import('@/services/index');
    await databaseManager.writingRecords.deleteWritingRecord(id);
  };
  
  // 使用从API获取的数据，已经按novelId过滤
  const novelWritingRecords = writingRecords;

  useEffect(() => {
    if (novelId) {
      refreshWritingRecords(novelId);
    }
  }, [novelId, refreshWritingRecords]);

  // 处理AI同步数据
  useEffect(() => {
    if (aiSyncData && aiSyncData.generatedContent && novelId) {
      // 如果有AI生成的内容，自动创建一个新的写作记录
      const newRecord = {
        novelId,
        title: 'AI生成内容',
        content: aiSyncData.generatedContent,
        wordCount: aiSyncData.generatedContent.length,
        writingTime: 0,
        type: 'idea' as const,
        status: 'draft' as const,
      };
      
      addWritingRecord(newRecord);
      message.success('AI生成内容已保存为写作记录');
    }
  }, [aiSyncData, novelId, addWritingRecord]);

  const handleCreateRecord = () => {
    if (!novelId) {
      message.warning('请先选择一本小说');
      return;
    }
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditRecord = (record: WritingRecord) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDeleteRecord = (recordId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个写作记录吗？此操作不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteWritingRecord(recordId);
          message.success('写作记录删除成功');
        } catch (error) {
          message.error('删除失败，请重试');
        }
      }
    });
  };

  const handleFinish = async (values: any) => {
    try {
      if (editingRecord) {
        // 更新现有记录
        await updateWritingRecord(editingRecord.id, {
          ...values,
          wordCount: values.content ? values.content.length : 0,
        });
        message.success('写作记录更新成功');
      } else {
        // 创建新记录
        if (!novelId) {
          message.error('请选择一本小说');
          return;
        }
        
        await addWritingRecord({
          ...values,
          novelId,
          wordCount: values.content ? values.content.length : 0,
          writingTime: 0,
        });
        message.success('写作记录创建成功');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  const getRecordTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'writing_session': 'blue',
      'idea': 'green',
      'research': 'purple',
      'outline': 'orange',
      'character_development': 'cyan',
      'world_building': 'geekblue',
      'plot_development': 'magenta'
    };
    
    return colorMap[type] || 'default';
  };

  const getRecordTypeDisplayName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'writing_session': '写作会话',
      'idea': '创意',
      'research': '研究',
      'outline': '大纲',
      'character_development': '角色发展',
      'world_building': '世界观构建',
      'plot_development': '情节发展'
    };
    
    return typeMap[type] || '未知类型';
  };

  const getRecordStatusDisplayName = (status: string): string => {
    const statusMap: Record<string, string> = {
      'draft': '草稿',
      'published': '已发布',
      'archived': '已归档'
    };
    
    return statusMap[status] || '未知状态';
  };

  return (
    <div className="writing-record-panel">
      <div className="panel-header">
        <h2>
          <BookOutlined />
          写作记录
        </h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreateRecord}
          disabled={!novelId}
        >
          新建记录
        </Button>
      </div>
      
      {novelWritingRecords.length > 0 ? (
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={novelWritingRecords}
          renderItem={record => (
            <List.Item>
              <Card 
                title={record.title}
                extra={
                  <Space>
                    <Tag color={getRecordTypeColor(record.type)}>
                      {getRecordTypeDisplayName(record.type)}
                    </Tag>
                    <Tag>{getRecordStatusDisplayName(record.status)}</Tag>
                  </Space>
                }
                actions={[
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => handleEditRecord(record)}
                  >
                    编辑
                  </Button>,
                  <Button 
                    type="text" 
                    icon={<DeleteOutlined />} 
                    danger
                    onClick={() => handleDeleteRecord(record.id)}
                  >
                    删除
                  </Button>
                ]}
              >
                <div className="record-content">
                  {record.content ? (
                    <Text>
                      {record.content.substring(0, 100)}
                      {record.content.length > 100 ? '...' : ''}
                    </Text>
                  ) : (
                    <Text type="secondary" className="empty-content">
                      暂无内容
                    </Text>
                  )}
                </div>
                <div className="record-meta">
                  <Space>
                    <span>{record.wordCount} 字</span>
                    <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                  </Space>
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <div className="empty-state">
          <FileTextOutlined style={{ fontSize: '48px', color: '#ccc' }} />
          <p>暂无写作记录</p>
          <p>点击上方"新建记录"按钮开始创建您的第一个写作记录</p>
        </div>
      )}

      <Modal
        title={editingRecord ? "编辑写作记录" : "新建写作记录"}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            type: 'writing_session',
            status: 'draft',
          }}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="输入记录标题" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select>
              <Option value="writing_session">写作会话</Option>
              <Option value="idea">创意</Option>
              <Option value="research">研究</Option>
              <Option value="outline">大纲</Option>
              <Option value="character_development">角色发展</Option>
              <Option value="world_building">世界观构建</Option>
              <Option value="plot_development">情节发展</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="published">已发布</Option>
              <Option value="archived">已归档</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="content"
            label="内容"
          >
            <TextArea 
              rows={8} 
              placeholder="输入记录内容"
              showCount
              maxLength={10000}
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? "更新记录" : "创建记录"}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WritingRecordPanel;