import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Popconfirm,
  message,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Divider
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import { useMembershipStore } from '@/stores/membershipStore';
import { useTeamStore, TeamMemberRole } from '@/stores/teamStore';

interface TeamMember {
  key: string;
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
  lastActive: string;
}

const TeamManagementPage: React.FC = () => {
  const { membershipInfo } = useMembershipStore();
  const { members, addMember, removeMember, updateMemberRole } = useTeamStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [form] = Form.useForm();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // 角色选项
  const roleOptions = [
    { label: '管理员', value: '管理员' },
    { label: '编辑', value: '编辑' },
    { label: '审阅', value: '审阅' },
    { label: '访客', value: '访客' },
  ];

  // 将团队store中的成员数据转换为页面使用的格式
  useEffect(() => {
    const formattedMembers = members.map(member => ({
      key: member.id,
      id: member.id,
      name: member.name,
      email: member.email,
      role: getRoleDisplayName(member.role),
      status: 'active',
      joinDate: member.joinedAt ? new Date(member.joinedAt).toISOString().split('T')[0] : '',
      lastActive: member.lastActiveAt ? new Date(member.lastActiveAt).toISOString().split('T')[0] : '',
    }));
    
    setTeamMembers(formattedMembers);
  }, [members]);

  // 获取角色显示名称
  const getRoleDisplayName = (role: TeamMemberRole): string => {
    switch (role) {
      case TeamMemberRole.OWNER: return '拥有者';
      case TeamMemberRole.ADMIN: return '管理员';
      case TeamMemberRole.MEMBER: return '成员';
      case TeamMemberRole.VIEWER: return '访客';
      default: return '成员';
    }
  };

  // 邀请成员
  const handleInviteMember = () => {
    setIsModalVisible(true);
    setEditingMember(null);
    form.resetFields();
  };

  // 编辑成员
  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setIsModalVisible(true);
    form.setFieldsValue(member);
  };

  // 删除成员
  const handleDeleteMember = (memberId: string) => {
    removeMember('default-team-id', memberId); // 这里需要实际的团队ID
    message.success('成员已删除');
  };

  // 保存成员
  const handleSaveMember = () => {
    form.validateFields().then(values => {
      if (editingMember) {
        // 编辑成员
        message.success('成员信息已更新');
      } else {
        // 新增成员
        const newMember = {
          userId: `user_${Date.now()}`,
          name: values.name,
          email: values.email,
          role: getRoleValue(values.role),
          joinedAt: new Date(),
        };
        
        // 这里需要实际的团队ID
        addMember('default-team-id', newMember);
        message.success('成员已邀请');
      }
      setIsModalVisible(false);
    });
  };

  // 获取角色值
  const getRoleValue = (roleName: string): TeamMemberRole => {
    switch (roleName) {
      case '拥有者': return TeamMemberRole.OWNER;
      case '管理员': return TeamMemberRole.ADMIN;
      case '成员': return TeamMemberRole.MEMBER;
      case '访客': return TeamMemberRole.VIEWER;
      default: return TeamMemberRole.MEMBER;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '成员',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TeamMember) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar icon={<UserOutlined />} style={{ marginRight: '8px' }} />
          <div>
            <div>{text}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        let color = 'default';
        if (role === '拥有者') color = 'red';
        if (role === '管理员') color = 'gold';
        if (role === '成员') color = 'blue';
        if (role === '访客') color = 'green';
        return <Tag color={color}>{role}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '非活跃'}
        </Tag>
      ),
    },
    {
      title: '加入时间',
      dataIndex: 'joinDate',
      key: 'joinDate',
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActive',
      key: 'lastActive',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TeamMember) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditMember(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个成员吗？"
            onConfirm={() => handleDeleteMember(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          <TeamOutlined style={{ marginRight: '8px' }} />
          团队管理
        </h1>
        <p style={{ color: '#666' }}>管理您的团队成员和权限</p>
      </div>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="团队成员"
              value={teamMembers.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃成员"
              value={teamMembers.filter(m => m.status === 'active').length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="管理员"
              value={teamMembers.filter(m => m.role === '管理员').length}
              prefix={<LockOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最大成员数"
              value={membershipInfo.maxTeamMembers || 5}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="团队成员列表" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleInviteMember}
            disabled={teamMembers.length >= (membershipInfo.maxTeamMembers || 5)}
          >
            邀请成员
          </Button>
        }
      >
        <Table 
          dataSource={teamMembers} 
          columns={columns} 
          pagination={{
            pageSize: 10,
          }}
        />
      </Card>

      <Modal
        title={editingMember ? "编辑成员" : "邀请成员"}
        open={isModalVisible}
        onOk={handleSaveMember}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入成员姓名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入成员邮箱" prefix={<MailOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择成员角色" options={roleOptions} />
          </Form.Item>
          
          {editingMember && (
            <>
              <Divider />
              <Form.Item
                name="status"
                label="状态"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="活跃" 
                  unCheckedChildren="非活跃" 
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default TeamManagementPage;