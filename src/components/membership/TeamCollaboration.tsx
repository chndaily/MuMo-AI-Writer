import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  List, 
  Avatar, 
  Tag, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message,
  Divider,
  Timeline
} from 'antd'
import { 
  TeamOutlined, 
  UserAddOutlined, 
  EditOutlined, 
  DeleteOutlined,
  PlusOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { useTeamStore, TeamMemberRole } from '@/stores/teamStore'
import { useMembership } from '@/hooks/useMembership'
import PermissionWrapper from './PermissionWrapper'

const { Option } = Select

const TeamCollaboration: React.FC = () => {
  const { 
    teams, 
    members, 
    collaborations,
    currentTeamId,
    currentProjectId,
    createTeam,
    addMember,
    updateMemberRole,
    removeMember,
    setCurrentTeam,
    setCurrentProject,
    addCollaborationRecord
  } = useTeamStore()
  
  const { membershipInfo } = useMembership()
  const [isCreateTeamModalVisible, setIsCreateTeamModalVisible] = useState(false)
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false)
  const [teamForm] = Form.useForm()
  const [memberForm] = Form.useForm()
  
  // 当前团队
  const currentTeam = teams.find(team => team.id === currentTeamId)
  
  // 当前团队的成员
  const teamMembers = members.filter(member => 
    currentTeam?.permissions.some(p => p.projectId === member.id)
  )
  
  // 当前项目的协作记录
  const projectCollaborations = currentProjectId 
    ? collaborations.filter(record => record.projectId === currentProjectId)
    : []
  
  // 处理创建团队
  const handleCreateTeam = (values: any) => {
    try {
      const newTeam = createTeam(values.name, values.description)
      setCurrentTeam(newTeam.id)
      setIsCreateTeamModalVisible(false)
      teamForm.resetFields()
      message.success('团队创建成功')
      
      // 添加协作记录
      addCollaborationRecord({
        projectId: newTeam.id,
        userId: 'user_31DJe07dLKK0ZwPoepTqzDPvQ39',
        action: 'create',
        content: `创建了团队 "${values.name}"`
      })
    } catch (error) {
      message.error('团队创建失败')
    }
  }
  
  // 处理添加成员
  const handleAddMember = (values: any) => {
    if (!currentTeamId) {
      message.error('请先选择一个团队')
      return
    }
    
    try {
      addMember(currentTeamId, {
        userId: `user_${Date.now()}`, // 实际应用中应该从输入获取
        name: values.name,
        email: values.email,
        role: values.role
      })
      
      setIsAddMemberModalVisible(false)
      memberForm.resetFields()
      message.success('成员添加成功')
      
      // 添加协作记录
      addCollaborationRecord({
        projectId: currentTeamId,
        userId: 'user_31DJe07dLKK0ZwPoepTqzDPvQ39',
        action: 'update',
        content: `添加了成员 "${values.name}"`
      })
    } catch (error) {
      message.error('成员添加失败')
    }
  }
  
  // 处理更新成员角色
  const handleUpdateMemberRole = (memberId: string, role: TeamMemberRole) => {
    if (!currentTeamId) return
    
    updateMemberRole(currentTeamId, memberId, role)
    message.success('成员角色更新成功')
    
    // 添加协作记录
    const member = members.find(m => m.id === memberId)
    if (member) {
      addCollaborationRecord({
        projectId: currentTeamId,
        userId: 'user_31DJe07dLKK0ZwPoepTqzDPvQ39',
        action: 'update',
        content: `更新了成员 "${member.name}" 的角色为 ${role}`
      })
    }
  }
  
  // 处理移除成员
  const handleRemoveMember = (memberId: string) => {
    if (!currentTeamId) return
    
    Modal.confirm({
      title: '确认移除成员',
      content: '确定要将此成员从团队中移除吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        removeMember(currentTeamId, memberId)
        message.success('成员已移除')
        
        // 添加协作记录
        const member = members.find(m => m.id === memberId)
        if (member) {
          addCollaborationRecord({
            projectId: currentTeamId,
            userId: 'user_31DJe07dLKK0ZwPoepTqzDPvQ39',
            action: 'delete',
            content: `移除了成员 "${member.name}"`
          })
        }
      }
    })
  }
  
  return (
    <div className="team-collaboration">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">团队协作</h2>
        <p className="text-gray-600">与团队成员一起协作创作</p>
      </div>
      
      {/* 团队选择和创建 */}
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">我的团队</h3>
          <PermissionWrapper 
            feature="team_collaboration"
            showUpgradeButton={true}
            onUpgrade={(level) => message.info(`需要升级到${level === 'professional' ? '专业会员' : '基础会员'}才能使用团队功能`)}
          >
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setIsCreateTeamModalVisible(true)}
            >
              创建团队
            </Button>
          </PermissionWrapper>
        </div>
        
        {teams.length > 0 ? (
          <List
            dataSource={teams}
            renderItem={team => (
              <List.Item
                key={team.id}
                actions={[
                  <Button 
                    type={currentTeamId === team.id ? "primary" : "default"}
                    size="small"
                    onClick={() => setCurrentTeam(team.id)}
                  >
                    {currentTeamId === team.id ? '当前团队' : '选择'}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<TeamOutlined />} />}
                  title={team.name}
                  description={team.description}
                />
              </List.Item>
            )}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TeamOutlined className="text-3xl mb-2" />
            <p>暂无团队</p>
            <p className="text-sm">创建您的第一个团队开始协作</p>
          </div>
        )}
      </Card>
      
      {/* 团队成员管理 */}
      {currentTeam && (
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">团队成员</h3>
            <PermissionWrapper 
              feature="team_collaboration"
              showUpgradeButton={true}
              onUpgrade={(level) => message.info(`需要升级到${level === 'professional' ? '专业会员' : '基础会员'}才能使用团队功能`)}
            >
              <Button 
                icon={<UserAddOutlined />} 
                onClick={() => setIsAddMemberModalVisible(true)}
              >
                添加成员
              </Button>
            </PermissionWrapper>
          </div>
          
          <List
            dataSource={teamMembers}
            renderItem={member => (
              <List.Item
                key={member.id}
                actions={[
                  <Select
                    defaultValue={member.role}
                    onChange={(value) => handleUpdateMemberRole(member.id, value)}
                    disabled={!membershipInfo.teamEnabled}
                  >
                    <Option value={TeamMemberRole.OWNER}>拥有者</Option>
                    <Option value={TeamMemberRole.ADMIN}>管理员</Option>
                    <Option value={TeamMemberRole.MEMBER}>成员</Option>
                    <Option value={TeamMemberRole.VIEWER}>只读</Option>
                  </Select>,
                  <Button 
                    icon={<DeleteOutlined />} 
                    danger
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={!membershipInfo.teamEnabled}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar>{member.name.charAt(0)}</Avatar>}
                  title={member.name}
                  description={
                    <Space>
                      <span>{member.email}</span>
                      <Tag color={
                        member.role === TeamMemberRole.OWNER ? 'gold' :
                        member.role === TeamMemberRole.ADMIN ? 'blue' :
                        member.role === TeamMemberRole.MEMBER ? 'green' : 'default'
                      }>
                        {member.role === TeamMemberRole.OWNER && '拥有者'}
                        {member.role === TeamMemberRole.ADMIN && '管理员'}
                        {member.role === TeamMemberRole.MEMBER && '成员'}
                        {member.role === TeamMemberRole.VIEWER && '只读'}
                      </Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
      
      {/* 协作历史 */}
      {projectCollaborations.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold mb-4">
            <HistoryOutlined className="mr-2" />
            协作历史
          </h3>
          <Timeline>
            {projectCollaborations.slice(0, 10).map(record => (
              <Timeline.Item key={record.id}>
                <p className="font-medium">{record.content}</p>
                <p className="text-gray-500 text-sm">
                  {new Date(record.timestamp).toLocaleString()}
                </p>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      )}
      
      {/* 创建团队模态框 */}
      <Modal
        title="创建团队"
        open={isCreateTeamModalVisible}
        onCancel={() => {
          setIsCreateTeamModalVisible(false)
          teamForm.resetFields()
        }}
        onOk={() => teamForm.submit()}
      >
        <Form
          form={teamForm}
          layout="vertical"
          onFinish={handleCreateTeam}
        >
          <Form.Item
            name="name"
            label="团队名称"
            rules={[{ required: true, message: '请输入团队名称' }]}
          >
            <Input placeholder="输入团队名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="团队描述"
          >
            <Input.TextArea placeholder="输入团队描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 添加成员模态框 */}
      <Modal
        title="添加成员"
        open={isAddMemberModalVisible}
        onCancel={() => {
          setIsAddMemberModalVisible(false)
          memberForm.resetFields()
        }}
        onOk={() => memberForm.submit()}
      >
        <Form
          form={memberForm}
          layout="vertical"
          onFinish={handleAddMember}
        >
          <Form.Item
            name="name"
            label="成员姓名"
            rules={[{ required: true, message: '请输入成员姓名' }]}
          >
            <Input placeholder="输入成员姓名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱地址"
            rules={[{ required: true, message: '请输入邮箱地址' }]}
          >
            <Input placeholder="输入邮箱地址" type="email" />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="成员角色"
            rules={[{ required: true, message: '请选择成员角色' }]}
          >
            <Select placeholder="选择成员角色">
              <Option value={TeamMemberRole.ADMIN}>管理员</Option>
              <Option value={TeamMemberRole.MEMBER}>成员</Option>
              <Option value={TeamMemberRole.VIEWER}>只读</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TeamCollaboration