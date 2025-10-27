import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, Select, message, Card, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { hybridStorageService } from '@/services/hybridStorageService';
import { Character, Location } from '#/novel';
import { generateUUID } from '@/utils/uuidUtils';

const { TextArea } = Input;
const { Option } = Select;



interface SidebarProps {
  activeTab: 'characters' | 'locations';
  novelId?: string; // 添加小说ID参数
}

const CharacterList: React.FC<{ characters: Character[], onEdit: (character: Character) => void, onDelete: (id: string) => void }> = ({ 
  characters, 
  onEdit, 
  onDelete 
}) => (
  <div className="sidebar-list">
    {characters.map(character => (
      <Card
        key={character.id}
        size="small"
        className="sidebar-list-item"
        actions={[
          <EditOutlined key="edit" onClick={() => onEdit(character)} />,
          <Popconfirm
            title="确认删除这个角色吗？"
            onConfirm={() => onDelete(character.id)}
            okText="确认"
            cancelText="取消"
          >
            <DeleteOutlined key="delete" />
          </Popconfirm>
        ]}
      >
        <div className="sidebar-list-item-info">
          <div className="sidebar-list-item-title">{character.name}</div>
          <Tag color={character.role === 'protagonist' ? 'red' : character.role === 'antagonist' ? 'volcano' : 'blue'}>
            {character.role === 'protagonist' ? '主角' : 
             character.role === 'antagonist' ? '反角' : 
             character.role === 'supporting' ? '配角' : '次要角色'}
          </Tag>
          <div className="sidebar-list-item-desc">{character.description}</div>
        </div>
      </Card>
    ))}
    {characters.length === 0 && (
      <div className="empty-state">
        <p>还没有角色设定，开始创建角色吧！</p>
      </div>
    )}
  </div>
);

const LocationList: React.FC<{ locations: Location[], onEdit: (location: Location) => void, onDelete: (id: string) => void }> = ({ 
  locations, 
  onEdit, 
  onDelete 
}) => (
  <div className="sidebar-list">
    {locations.map(location => (
      <Card
        key={location.id}
        size="small"
        className="sidebar-list-item"
        actions={[
          <EditOutlined key="edit" onClick={() => onEdit(location)} />,
          <Popconfirm
            title="确认删除这个地点吗？"
            onConfirm={() => onDelete(location.id)}
            okText="确认"
            cancelText="取消"
          >
            <DeleteOutlined key="delete" />
          </Popconfirm>
        ]}
      >
        <div className="sidebar-list-item-info">
          <div className="sidebar-list-item-title">{location.name}</div>
          <Tag color={location.importance === 'high' ? 'red' : location.importance === 'medium' ? 'orange' : 'default'}>
            {location.importance === 'high' ? '重要' : location.importance === 'medium' ? '一般' : '次要'}
          </Tag>
          <div className="sidebar-list-item-desc">{location.description}</div>
        </div>
      </Card>
    ))}
    {locations.length === 0 && (
      <div className="empty-state">
        <p>还没有地点设定，开始创建地点吧！</p>
      </div>
    )}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ activeTab, novelId }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Character | Location | null>(null);
  const [form] = Form.useForm();

  // 如果没有选择小说，显示提示
  if (!novelId) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px',
        color: '#8c8c8c'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          {activeTab === 'characters' ? '👥' : '🏠'}
        </div>
        <p style={{ fontSize: '16px' }}>
          请先在“我的书籍”中选择一本小说
        </p>
        <p style={{ color: '#bfbfbf' }}>
          选择后即可管理该小说的{activeTab === 'characters' ? '角色' : '地点'}信息
        </p>
      </div>
    );
  }

  // 加载真实数据
  useEffect(() => {
    if (novelId) {
      loadData();
    }
  }, [activeTab, novelId]);

  const loadData = async () => {
    try {
      if (activeTab === 'characters') {
        const charactersData = await hybridStorageService.getCharacters(novelId);
        setCharacters(charactersData);
      } else {
        const locationsData = await hybridStorageService.getLocations(novelId);
        setLocations(locationsData);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: Character | Location) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      if (activeTab === 'characters') {
        await hybridStorageService.deleteCharacter(id);
        setCharacters(prev => prev.filter(c => c.id !== id));
      } else {
        await hybridStorageService.deleteLocation(id);
        setLocations(prev => prev.filter(l => l.id !== id));
      }
      message.success('删除成功');
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleSave = async (values: any) => {
    try {
      const now = new Date().toISOString();
      
      if (activeTab === 'characters') {
        const characterData: Character = {
          id: editingItem?.id || generateUUID(), // 使用标准ID生成
          novelId: novelId || '', // 使用传入的小说ID
          name: values.name,
          description: values.description,
          role: values.role,
          appearance: values.appearance,
          personality: values.personality,
          background: values.background,
          relationships: values.relationships,
          createdAt: editingItem?.createdAt || now,
          lastModified: now
        };

        if (editingItem) {
          await hybridStorageService.updateCharacter(characterData);
          setCharacters(prev => prev.map(c => c.id === editingItem.id ? characterData : c));
        } else {
          await hybridStorageService.saveCharacter(characterData);
          setCharacters(prev => [...prev, characterData]);
        }
      } else {
        const locationData: Location = {
          id: editingItem?.id || generateUUID(),
          novelId: novelId || '', // 使用传入的小说ID
          name: values.name,
          description: values.description,
          type: values.type,
          importance: values.importance,
          geography: values.geography,
          climate: values.climate,
          politics: values.politics,
          economy: values.economy,
          createdAt: editingItem?.createdAt || now,
          lastModified: now
        };

        if (editingItem) {
          await hybridStorageService.updateLocation(locationData);
          setLocations(prev => prev.map(l => l.id === editingItem.id ? locationData : l));
        } else {
          await hybridStorageService.saveLocation(locationData);
          setLocations(prev => [...prev, locationData]);
        }
      }

      setModalVisible(false);
      form.resetFields();
      message.success(editingItem ? '更新成功' : '创建成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  const isCharacterTab = activeTab === 'characters';
  const title = isCharacterTab ? '角色' : '地点';
  const items = isCharacterTab ? characters : locations;

  return (
    <div className="novelcrafter-sidebar-inner">
      <section className="sidebar-section">
        <div className="sidebar-section-header">
          <h3>{title}管理</h3>
          <Button 
            className="sidebar-btn" 
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建{title}
          </Button>
        </div>
        
        {isCharacterTab ? (
          <CharacterList 
            characters={characters} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        ) : (
          <LocationList 
            locations={locations} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        )}
      </section>

      <Modal
        title={`${editingItem ? '编辑' : '新建'}${title}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="name"
            label={`${title}名称`}
            rules={[{ required: true, message: `请输入${title}名称` }]}
          >
            <Input placeholder={`输入${title}名称`} />
          </Form.Item>

          {isCharacterTab ? (
            <>
              <Form.Item
                name="role"
                label="角色类型"
                rules={[{ required: true, message: '请选择角色类型' }]}
              >
                <Select placeholder="选择角色类型">
                  <Option value="protagonist">主角</Option>
                  <Option value="antagonist">反角</Option>
                  <Option value="supporting">配角</Option>
                  <Option value="minor">次要角色</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="appearance" label="外貌描述">
                <TextArea rows={2} placeholder="描述角色的外貌特征" />
              </Form.Item>
              
              <Form.Item name="personality" label="性格特点">
                <TextArea rows={2} placeholder="描述角色的性格特点" />
              </Form.Item>
              
              <Form.Item name="background" label="背景故事">
                <TextArea rows={3} placeholder="描述角色的背景故事" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="type"
                label="地点类型"
                rules={[{ required: true, message: '请选择地点类型' }]}
              >
                <Select placeholder="选择地点类型">
                  <Option value="city">城市</Option>
                  <Option value="building">建筑</Option>
                  <Option value="nature">自然环境</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="importance"
                label="重要程度"
                rules={[{ required: true, message: '请选择重要程度' }]}
              >
                <Select placeholder="选择重要程度">
                  <Option value="high">重要</Option>
                  <Option value="medium">一般</Option>
                  <Option value="low">次要</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="geography" label="地理环境">
                <TextArea rows={2} placeholder="描述地理环境和地形" />
              </Form.Item>
              
              <Form.Item name="climate" label="气候特点">
                <TextArea rows={2} placeholder="描述气候和天气特点" />
              </Form.Item>
              
              <Form.Item name="politics" label="政治环境">
                <TextArea rows={2} placeholder="描述政治体制和统治情况" />
              </Form.Item>
              
              <Form.Item name="economy" label="经济情况">
                <TextArea rows={2} placeholder="描述经济发展和贸易情况" />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="description"
            label="详细描述"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <TextArea rows={4} placeholder={`详细描述这个${title}...`} />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="primary" htmlType="submit">
                {editingItem ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Sidebar; 