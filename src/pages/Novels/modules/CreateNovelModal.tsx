import React from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Upload, 
  Button, 
  Space,
  message,
  Tag
} from 'antd';
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { databaseManager } from '@/services/index';
import { useMembershipStore } from '@/stores/membershipStore'; // 新增导入

const { TextArea } = Input;
const { Option } = Select;

interface CreateNovelModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  onNovelCreated?: () => void; // 新增的小说创建成功回调
}

const CreateNovelModal: React.FC<CreateNovelModalProps> = ({ visible, onCancel, onSuccess }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  // 直接使用 databaseManager 获取数据
  const refreshNovels = async () => {
    const { databaseManager } = await import('@/services/index');
    // 修改为只获取当前用户的小说
    const { useMembershipStore } = await import('@/stores/membershipStore');
    const { membershipInfo } = useMembershipStore.getState();
    await databaseManager.novels.getNovelsByUserId(membershipInfo.email || 'anonymous');
  };
  const { membershipInfo } = useMembershipStore(); // 获取当前用户信息

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

  const handleSubmit = async (values: any) => {
    try {
      console.log('开始创建新书:', values);
      
      // 初始化数据库
      // databaseManager.initializeDatabase() 方法已移除
      
      // 获取当前用户ID（从会员信息中提取）
      const currentUserId = membershipInfo.email || 'anonymous';
      
      const novelData = {
        title: values.title,
        content: '',
        genre: values.genre,
        wordCount: 0,
        progress: 0,
        status: 'draft' as const,
        description: values.description || '',
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : [],
        author: values.author || membershipInfo.username || '匿名作者',
        targetWordCount: values.targetWordCount || 100000,
        isPublic: false,
        // 自动关联当前用户
        userId: currentUserId
      };

      console.log('小说数据:', novelData);
      
      // 直接使用 databaseManager 添加小说，它会自动生成ID和时间戳
      const createdNovel = await databaseManager.novels.addNovel(novelData);
      
      console.log('小说创建成功，验证数据...', createdNovel);
      
      // 验证数据是否保存成功
      // 修改为只获取当前用户的小说
      const allNovels = await databaseManager.novels.getNovelsByUserId(currentUserId);
      const savedNovel = allNovels.find(n => n.id === createdNovel.id);
      
      if (savedNovel) {
        console.log('✅ 数据保存验证成功:', savedNovel.title);
      } else {
        console.error('❌ 数据保存验证失败');
        throw new Error('数据保存验证失败');
      }
      
      // 刷新列表
      await refreshNovels();
      
      if (values.withAI) {
        // 如果选择了AI辅助，跳转到AI工作台
        message.success('新书创建成功！正在跳转到AI工作台...');
        setTimeout(() => {
          navigate('/ai-workspace', {
            state: {
              mode: 'outline',
              novelData: createdNovel,
              prompt: `为小说《${values.title}》生成详细大纲。类型：${genres.find(g => g.value === values.genre)?.label}。简介：${values.description}`
            }
          });
        }, 1000);
      } else {
        message.success('新书创建成功！');
      }

      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error('创建新书失败:', error);
      message.error(`创建失败：${error instanceof Error ? error.message : '未知错误'}`); 
    }
  };

  const generateWithAI = () => {
    const title = form.getFieldValue('title');
    const genre = form.getFieldValue('genre');
    
    if (!title) {
      message.warning('请先输入书名');
      return;
    }

    // 跳转到AI工作台生成书籍基本信息
    navigate('/ai-workspace', {
      state: {
        mode: 'book-info',
        title: title,
        genre: genre,
        prompt: `为小说《${title}》生成详细的书籍信息，包括简介、主要角色、世界观设定等。${genre ? `类型：${genres.find(g => g.value === genre)?.label}` : ''}`
      }
    });
  };

  return (
    <Modal
      title="创建新书"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          author: membershipInfo.username || '匿名作者',
          targetWordCount: 100000
        }}
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
          <Input placeholder="输入作者名称" defaultValue={membershipInfo.username || '匿名作者'} />
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
              创建新书
            </Button>
            <Button onClick={onCancel}>
              取消
            </Button>
            <Button 
              icon={<ThunderboltOutlined />}
              onClick={generateWithAI}
            >
              AI辅助创建
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateNovelModal;