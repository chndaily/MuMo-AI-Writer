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
  List,
  Tag,
  Typography
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { hybridStorageService } from '@/services/hybridStorageService';

const { Title, Text } = Typography;

interface CustomRole {
  id: string;
  name: string;
  displayName: string;
  createdAt: string;
  lastModified: string;
}

const CustomRoleManager: React.FC = () => {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCustomRoles();
  }, []);

  const loadCustomRoles = async () => {
    try {
      // 从本地存储加载自定义角色类型
      const storedRoles = localStorage.getItem('customCharacterRoles');
      if (storedRoles) {
        setCustomRoles(JSON.parse(storedRoles));
      }
    } catch (error) {
      console.error('加载自定义角色类型失败:', error);
      message.error('加载自定义角色类型失败');
    }
  };

  const saveCustomRoles = async (roles: CustomRole[]) => {
    try {
      // 保存到本地存储
      localStorage.setItem('customCharacterRoles', JSON.stringify(roles));
      setCustomRoles(roles);
      message.success('保存成功');
    } catch (error) {
      console.error('保存自定义角色类型失败:', error);
      message.error('保存自定义角色类型失败');
    }
  };

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (role: CustomRole) => {
    setEditingRole(role);
    form.setFieldsValue(role);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const newRoles = customRoles.filter(role => role.id !== id);
      await saveCustomRoles(newRoles);
      message.success('删除成功');
    } catch (error) {
      console.error('删除自定义角色类型失败:', error);
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      let newRoles = [...customRoles];
      
      if (editingRole) {
        // 更新现有角色类型
        newRoles = newRoles.map(role => 
          role.id === editingRole.id 
            ? { ...role, ...values, lastModified: new Date().toISOString() } 
            : role
        );
      } else {
        // 添加新角色类型
        const newRole: CustomRole = {
          id: Date.now().toString(),
          name: values.name,
          displayName: values.displayName,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };
        newRoles.push(newRole);
      }
      
      await saveCustomRoles(newRoles);
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('保存自定义角色类型失败:', error);
      message.error('保存失败');
    }
  };

  return (
    <div className="custom-role-manager">
      <Card 
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>自定义角色类型管理</Title>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
          >
            添加自定义类型
          </Button>
        }
      >
        {customRoles.length > 0 ? (
          <List
            dataSource={customRoles}
            renderItem={role => (
              <List.Item
                actions={[
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => handleEdit(role)}
                    key="edit"
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    title="确认删除这个自定义角色类型吗？"
                    onConfirm={() => handleDelete(role.id)}
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
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color="blue">{role.displayName}</Tag>
                      <Text code>{role.name}</Text>
                    </Space>
                  }
                  description={
                    <Space size="large">
                      <Text type="secondary">创建时间: {new Date(role.createdAt).toLocaleString()}</Text>
                      <Text type="secondary">最后修改: {new Date(role.lastModified).toLocaleString()}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
            <p>暂无自定义角色类型</p>
            <p style={{ color: '#bfbfbf' }}>点击上方按钮添加您的第一个自定义角色类型</p>
          </div>
        )}
      </Card>

      <Modal
        title={editingRole ? '编辑自定义角色类型' : '添加自定义角色类型'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
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
            name="displayName"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="请输入显示名称，如：医疗线核心成员" />
          </Form.Item>

          <Form.Item
            name="name"
            label="标识符"
            rules={[{ required: true, message: '请输入标识符' }]}
          >
            <Input placeholder="请输入标识符，如：medicalCoreMember" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                {editingRole ? '保存修改' : '添加类型'}
              </Button>
              <Button icon={<CloseOutlined />} onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomRoleManager;