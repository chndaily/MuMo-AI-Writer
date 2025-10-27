import React, { useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Button, 
  Space,
  message,
  Tag
} from 'antd';

const { TextArea } = Input;
const { Option } = Select;

interface EditNovelModalProps {
  visible: boolean;
  novel: any;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditNovelModal: React.FC<EditNovelModalProps> = ({ visible, novel, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  // 直接使用 databaseManager 获取数据
  const updateNovel = async (id: string, updates: any) => {
    const { databaseManager } = await import('@/services/index');
    const novel = await databaseManager.novels.getNovel(id);
    if (novel) {
      await databaseManager.novels.updateNovel({ ...novel, ...updates });
    }
  };
  
  const refreshNovels = async () => {
    const { databaseManager } = await import('@/services/index');
    // 修改为只获取当前用户的小说
    const { useMembershipStore } = await import('@/stores/membershipStore');
    const { membershipInfo } = useMembershipStore.getState();
    await databaseManager.novels.getNovelsByUserId(membershipInfo.email || 'anonymous');
  };

  const genres = [
    { value: 'fantasy', label: '奇幻', color: 'purple' },
    { value: 'urban', label: '都市', color: 'blue' },
    { value: 'historical', label: '历史', color: 'orange' },
    { value: 'scifi', label: '科幻', color: 'green' },
    { value: 'martial', label: '武侠', color: 'red' },
    { value: 'romance', label: '言情', color: 'pink' },
    { value: 'mystery', label: '悬疑', color: 'default' },
    { value: 'horror', label: '恐怖', color: 'volcano' },
    { value: 'adventure', label: '冒险', color: 'cyan' }
  ];

  useEffect(() => {
    if (visible && novel) {
      form.setFieldsValue({
        title: novel.title,
        genre: novel.genre,
        author: novel.author,
        description: novel.description,
        targetWordCount: novel.targetWordCount,
        tags: novel.tags ? novel.tags.join(', ') : ''
      });
    }
  }, [visible, novel, form]);

  const handleSubmit = async (values: any) => {
    try {
      if (!novel) return;
      
      const updateData = {
        title: values.title,
        genre: values.genre,
        author: values.author,
        description: values.description,
        targetWordCount: values.targetWordCount,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : []
      };

      await updateNovel(novel.id, updateData);
      await refreshNovels();
      
      message.success('小说信息更新成功！');
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error('更新小说失败:', error);
      message.error(`更新失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <Modal
      title="编辑小说资料"
      open={visible}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="title"
          label="书名"
          rules={[{ required: true, message: '请输入书名' }]}
        >
          <Input placeholder="输入你的小说标题" />
        </Form.Item>

        <Form.Item
          name="genre"
          label="类型"
          rules={[{ required: true, message: '请选择小说类型' }]}
        >
          <Select placeholder="选择小说类型">
            {genres.map(genre => (
              <Option key={genre.value} value={genre.value}>
                <Tag color={genre.color}>{genre.label}</Tag>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="author"
          label="作者"
        >
          <Input placeholder="输入作者名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="简介"
        >
          <TextArea 
            rows={4} 
            placeholder="简单描述你的小说内容、主题或特色..." 
          />
        </Form.Item>

        <Form.Item
          name="targetWordCount"
          label="目标字数"
        >
          <InputNumber
            min={1000}
            max={10000000}
            step={10000}
            style={{ width: '100%' }}
            placeholder="设定目标完成字数"
          />
        </Form.Item>

        <Form.Item
          name="tags"
          label="标签"
        >
          <Input placeholder="输入标签，用逗号分隔（如：热血,冒险,友情）" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              保存修改
            </Button>
            <Button onClick={() => {
              form.resetFields();
              onCancel();
            }}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditNovelModal;