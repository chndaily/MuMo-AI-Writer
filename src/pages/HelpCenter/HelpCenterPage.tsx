import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Col, 
  Row, 
  Space, 
  Typography, 
  Tabs, 
  List, 
  Avatar,
  Divider,
  Tag,
  Modal,
  message,
  Input,
  Form,
  Select,
  Breadcrumb
} from 'antd';
import AIHelpChat from './AIHelpChat';
import { 
  QuestionCircleOutlined, 
  BookOutlined, 
  RobotOutlined, 
  CommentOutlined,
  BarChartOutlined,
  FileTextOutlined,
  BulbOutlined,
  ToolOutlined,
  LikeOutlined,
  DislikeOutlined,
  SendOutlined,
  DownloadOutlined,
  TeamOutlined,
  HomeOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const HelpCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('docs');
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackForm] = Form.useForm();
  const [isDiagnosticsModalVisible, setIsDiagnosticsModalVisible] = useState(false);

  // 文档数据
  const documentationItems = [
    {
      id: '1',
      title: '快速入门指南',
      description: '了解如何开始使用 Novelcrafter 进行创作，包括创建小说、添加章节等基本操作',
      icon: <BookOutlined />,
      tags: ['新手', '入门'],
      lastUpdated: '2025-10-15'
    },
    {
      id: '2',
      title: '角色管理系统',
      description: '如何创建和管理小说中的角色，包括角色属性设置、关系图谱等高级功能',
      icon: <RobotOutlined />,
      tags: ['角色', '管理'],
      lastUpdated: '2025-10-10'
    },
    {
      id: '3',
      title: 'AI 创作辅助',
      description: '使用 AI 功能提升创作效率，包括AI写作助手、智能情节生成等',
      icon: <BulbOutlined />,
      tags: ['AI', '创作'],
      lastUpdated: '2025-10-12'
    },
    {
      id: '4',
      title: '提示词库使用',
      description: '如何使用和创建提示词模板，提高AI生成内容的质量和一致性',
      icon: <CommentOutlined />,
      tags: ['提示词', '模板'],
      lastUpdated: '2025-10-08'
    },
    {
      id: '5',
      title: '世界观设定',
      description: '构建完整的世界观设定，包括地点、文化、历史等元素',
      icon: <FileTextOutlined />,
      tags: ['世界观', '设定'],
      lastUpdated: '2025-10-18'
    },
    {
      id: '6',
      title: '团队协作功能',
      description: '如何与团队成员协作创作，权限管理、版本控制等',
      icon: <TeamOutlined />,
      tags: ['团队', '协作'],
      lastUpdated: '2025-10-16'
    },
    {
      id: '7',
      title: '会员权限说明',
      description: '详细了解不同会员等级的功能权限和限制',
      icon: <CreditCardOutlined />,
      tags: ['会员', '权限'],
      lastUpdated: '2025-10-29'
    },
    {
      id: '8',
      title: '测试用户创建',
      description: '管理员如何创建测试用户账户用于平台测试',
      icon: <ToolOutlined />,
      tags: ['管理员', '测试'],
      lastUpdated: '2025-10-30'
    }
  ];

  // 今日小贴士数据
  const dailyTips = [
    {
      id: '1',
      title: '使用角色关系图',
      content: '在角色管理中，您可以创建角色之间的关系图，帮助您更好地构建复杂的人物关系网络。通过可视化的关系图，您可以直观地看到角色之间的联系和互动。',
      category: '技巧'
    },
    {
      id: '2',
      title: '批量导出功能',
      content: '您可以在设置中启用批量导出功能，一次性导出多章内容。支持多种格式导出，包括TXT、DOCX、PDF等，方便您在不同平台使用。',
      category: '功能'
    },
    {
      id: '3',
      title: '快捷键操作',
      content: '使用 Ctrl+Shift+N 可以快速创建新角色，Ctrl+Shift+S 保存当前工作。掌握更多快捷键可以大幅提升您的创作效率。',
      category: '快捷键'
    },
    {
      id: '4',
      title: 'AI写作助手',
      content: '在创作过程中遇到瓶颈时，可以使用AI写作助手获取灵感。选中一段文字后右键选择"AI优化"，可以让AI帮助您改进文笔。',
      category: 'AI功能'
    },
    {
      id: '5',
      title: '版本历史',
      content: '系统会自动保存您的创作历史，您可以在任何时候查看和恢复到之前的版本。在章节编辑页面点击"历史版本"按钮即可查看。',
      category: '功能'
    },
    {
      id: '6',
      title: '提示词库',
      content: '善用提示词库可以提高AI生成内容的质量。您可以创建自己的提示词模板，或者使用系统预设的提示词来获得更好的效果。',
      category: '技巧'
    }
  ];

  // 模拟反馈选项
  const feedbackCategories = [
    '功能建议',
    'BUG报告',
    '用户体验',
    '性能问题',
    '其他'
  ];

  // 模拟诊断信息
  const diagnosticInfo = {
    version: '1.2.5',
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    online: navigator.onLine,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  const handleViewDocument = (docId: string) => {
    // 根据文档ID显示具体内容
    const doc = documentationItems.find(item => item.id === docId);
    if (doc) {
      Modal.info({
        title: doc.title,
        width: 800,
        content: (
          <div>
            <Paragraph>
              <Text type="secondary">最后更新: {doc.lastUpdated}</Text>
            </Paragraph>
            <Divider />
            <Paragraph>
              {getDocumentContent(docId)}
            </Paragraph>
          </div>
        ),
        onOk() {},
      });
    }
  };

  // 根据文档ID获取文档内容
  const getDocumentContent = (docId: string) => {
    switch (docId) {
      case '1':
        return (
          <div>
            <Title level={5}>欢迎使用 Novelcrafter</Title>
            <Paragraph>
              Novelcrafter 是一款专为小说创作者设计的智能写作工具，集成了先进的 AI 技术，
              帮助您更高效地进行小说创作。
            </Paragraph>
            <Title level={5}>开始创作</Title>
            <Paragraph>
              1. 在首页点击"新建小说"按钮创建您的第一部作品
              <br />2. 为您的小说添加标题和简介
              <br />3. 进入创作界面开始写作
            </Paragraph>
            <Title level={5}>基本操作</Title>
            <Paragraph>
              <ul>
                <li>章节管理：在左侧边栏可以添加、删除、重命名章节</li>
                <li>内容编辑：在主编辑区域进行写作，支持富文本格式</li>
                <li>保存功能：系统会自动保存您的创作内容</li>
                <li>历史版本：可以查看和恢复之前的版本</li>
              </ul>
            </Paragraph>
          </div>
        );
      case '2':
        return (
          <div>
            <Title level={5}>角色管理系统介绍</Title>
            <Paragraph>
              角色管理系统是 Novelcrafter 的核心功能之一，
              帮助您创建和管理小说中的各种角色。
            </Paragraph>
            <Title level={5}>创建角色</Title>
            <Paragraph>
              1. 在创作界面左侧边栏选择"角色管理"
              <br />2. 点击"新建角色"按钮
              <br />3. 填写角色的基本信息（姓名、性别、年龄等）
              <br />4. 设置角色的详细属性（性格、背景、动机等）
            </Paragraph>
            <Title level={5}>角色关系图</Title>
            <Paragraph>
              <ul>
                <li>可视化展示角色之间的关系</li>
                <li>支持自定义关系类型（朋友、敌人、家人等）</li>
                <li>可以随时调整和修改关系</li>
                <li>帮助您构建复杂的人物网络</li>
              </ul>
            </Paragraph>
          </div>
        );
      case '3':
        return (
          <div>
            <Title level={5}>AI 创作辅助功能</Title>
            <Paragraph>
              Novelcrafter 集成了强大的 AI 功能，
              可以帮助您提升创作效率和质量。
            </Paragraph>
            <Title level={5}>AI 写作助手</Title>
            <Paragraph>
              <ul>
                <li>情节生成：根据您的设定自动生成故事情节</li>
                <li>对话创作：帮助您写出自然流畅的角色对话</li>
                <li>文笔优化：改进句子结构和表达方式</li>
                <li>创意激发：提供创作灵感和建议</li>
              </ul>
            </Paragraph>
            <Title level={5}>使用技巧</Title>
            <Paragraph>
              <ul>
                <li>提供详细的上下文信息可以获得更好的结果</li>
                <li>使用提示词库可以提高生成内容的质量</li>
                <li>不满意的结果可以要求重新生成</li>
                <li>可以随时调整 AI 的创作风格</li>
              </ul>
            </Paragraph>
          </div>
        );
      case '4':
        return (
          <div>
            <Title level={5}>提示词库使用指南</Title>
            <Paragraph>
              提示词库是 Novelcrafter 的重要功能，
              帮助您更好地使用 AI 创作功能。
            </Paragraph>
            <Title level={5}>系统提示词</Title>
            <Paragraph>
              系统预设了多种提示词模板，涵盖不同创作场景：
              <ul>
                <li>情节发展</li>
                <li>角色塑造</li>
                <li>世界观构建</li>
                <li>对话生成</li>
              </ul>
            </Paragraph>
            <Title level={5}>自定义提示词</Title>
            <Paragraph>
              您可以创建自己的提示词模板：
              <br />1. 在提示词库页面点击"新建提示词"
              <br />2. 设置提示词的名称和描述
              <br />3. 编写具体的提示词内容
              <br />4. 保存并使用您的提示词
            </Paragraph>
          </div>
        );
      case '5':
        return (
          <div>
            <Title level={5}>世界观设定功能</Title>
            <Paragraph>
              世界观设定帮助您构建完整的小说背景，
              让您的故事更加丰富和可信。
            </Paragraph>
            <Title level={5}>设定类型</Title>
            <Paragraph>
              <ul>
                <li>地点设定：描述故事发生的世界和具体场所</li>
                <li>文化设定：构建不同群体的文化背景</li>
                <li>历史设定：设计世界的历史发展脉络</li>
                <li>科技设定：设定世界的科技水平</li>
                <li>魔法设定：如果需要，可以设定魔法系统</li>
              </ul>
            </Paragraph>
            <Title level={5}>使用建议</Title>
            <Paragraph>
              <ul>
                <li>从核心设定开始，逐步完善细节</li>
                <li>保持设定的一致性</li>
                <li>设定应该服务于故事发展</li>
                <li>可以随时修改和完善设定</li>
              </ul>
            </Paragraph>
          </div>
        );
      case '6':
        return (
          <div>
            <Title level={5}>团队协作功能</Title>
            <Paragraph>
              团队协作功能让多人共同创作成为可能，
              适合大型项目和工作室使用。
            </Paragraph>
            <Title level={5}>权限管理</Title>
            <Paragraph>
              <ul>
                <li>创建者：拥有最高权限，可以管理团队成员</li>
                <li>编辑者：可以编辑内容，但不能管理成员</li>
                <li>查看者：只能查看内容，不能进行编辑</li>
              </ul>
            </Paragraph>
            <Title level={5}>协作流程</Title>
            <Paragraph>
              <ul>
                <li>创建团队项目</li>
                <li>邀请团队成员</li>
                <li>分配角色和权限</li>
                <li>开始协作创作</li>
                <li>版本控制和冲突解决</li>
              </ul>
            </Paragraph>
          </div>
        );
      case '7':
        return (
          <div>
            <Title level={5}>会员权限说明</Title>
            <Paragraph>
              Novelcrafter 提供三种会员等级，不同等级享有不同的功能权限。
            </Paragraph>
            
            <Title level={5}>免费会员</Title>
            <Paragraph>
              免费会员可以体验基础的创作功能，适合初次使用者。
            </Paragraph>
            <Paragraph>
              <ul>
                <li><strong>小说创作：</strong>创建最多3本小说</li>
                <li><strong>基础编辑：</strong>使用基本的文本编辑功能</li>
                <li><strong>导出功能：</strong>支持TXT和Markdown格式导出</li>
                <li><strong>AI辅助：</strong>每天可使用AI功能10次</li>
                <li><strong>云同步：</strong>基础云同步功能（限制50MB存储空间）</li>
              </ul>
            </Paragraph>
            
            <Title level={5}>基础会员</Title>
            <Paragraph>
              基础会员适合日常创作者，提供更多实用功能。
            </Paragraph>
            <Paragraph>
              <ul>
                <li><strong>小说创作：</strong>创建最多20本小说</li>
                <li><strong>高级编辑：</strong>支持富文本编辑和格式化</li>
                <li><strong>导出功能：</strong>支持TXT、Markdown、DOCX格式导出</li>
                <li><strong>AI辅助：</strong>每天可使用AI功能100次</li>
                <li><strong>拼写检查：</strong>实时拼写和语法检查</li>
                <li><strong>创作统计：</strong>详细的创作数据分析</li>
                <li><strong>云同步：</strong>增强云同步功能（限制1GB存储空间）</li>
                <li><strong>高级功能：</strong>解锁大纲、创作、聊天、回顾、提示词、设置等核心功能</li>
              </ul>
            </Paragraph>
            
            <Title level={5}>专业会员</Title>
            <Paragraph>
              专业会员面向专业作家和团队，提供完整的创作套件。
            </Paragraph>
            <Paragraph>
              <ul>
                <li><strong>小说创作：</strong>无限制创建小说</li>
                <li><strong>全部编辑功能：</strong>包含所有编辑和格式化功能</li>
                <li><strong>导出功能：</strong>支持所有格式导出（TXT、Markdown、DOCX、PDF、EPUB）</li>
                <li><strong>AI辅助：</strong>无限制使用AI功能</li>
                <li><strong>可视化工具：</strong>角色关系图、情节发展图等可视化分析工具</li>
                <li><strong>高级统计：</strong>深度创作分析和趋势预测</li>
                <li><strong>云同步：</strong>完整云同步功能（限制10GB存储空间）</li>
                <li><strong>优先支持：</strong>享受优先技术支持服务</li>
                <li><strong>抢先体验：</strong>优先体验新功能和特性</li>
                <li><strong>团队协作：</strong>支持多人协作创作</li>
              </ul>
            </Paragraph>
            
            <Title level={5}>升级会员</Title>
            <Paragraph>
              如需升级会员，请前往<Button type="link" onClick={() => navigate('/membership')}>会员中心</Button>查看详细信息并进行升级。
            </Paragraph>
          </div>
        );
      case '8':
        return (
          <div>
            <Title level={5}>测试用户创建</Title>
            <Paragraph>
              管理员可以通过专门的页面创建测试用户账户，用于平台功能测试。
            </Paragraph>
            
            <Title level={5}>访问方式</Title>
            <Paragraph>
              只有管理员账户可以访问测试用户创建功能。请使用以下链接访问：
            </Paragraph>
            <Paragraph>
              <Button 
                type="primary" 
                href="/create-test-users" 
                target="_blank"
                icon={<ToolOutlined />}
              >
                打开测试用户创建页面
              </Button>
            </Paragraph>
            
            <Title level={5}>使用说明</Title>
            <Paragraph>
              1. 点击上面的按钮打开测试用户创建页面
              <br />2. 使用管理员账户的邮箱和密码登录
              <br />3. 系统将自动创建以下测试用户：
              <ul>
                <li>用户名：蜗牛丢了壳，邮箱：763337611@qq.com</li>
                <li>用户名：测试员1，邮箱：test1@example.com</li>
                <li>用户名：测试员2，邮箱：test2@example.com</li>
              </ul>
              4. 所有测试用户的默认密码均为：mumo123
              <br />5. 测试用户将被设置为专业会员级别，拥有完整的功能权限
            </Paragraph>
            
            <Title level={5}>注意事项</Title>
            <Paragraph>
              <ul>
                <li>此功能仅供管理员使用，普通用户无法访问</li>
                <li>测试用户创建后，可以用于平台功能测试</li>
                <li>请妥善保管管理员账户信息，避免泄露</li>
                <li>在生产环境中，请谨慎使用此功能</li>
              </ul>
            </Paragraph>
          </div>
        );
      default:
        return <Paragraph>文档内容正在准备中...</Paragraph>;
    }
  };

  const handleOpenTip = (tipId: string) => {
    const tip = dailyTips.find(t => t.id === tipId);
    if (tip) {
      Modal.info({
        title: tip.title,
        content: (
          <div>
            <Paragraph>{tip.content}</Paragraph>
            <Tag color="blue">{tip.category}</Tag>
          </div>
        ),
        onOk() {},
      });
    }
  };

  const handleChatWithAI = () => {
    setActiveTab('ai-chat');
  };

  const handleFeedbackSubmit = (values: any) => {
    console.log('反馈提交:', values);
    message.success('感谢您的反馈！我们会尽快处理。');
    setIsFeedbackModalVisible(false);
    feedbackForm.resetFields();
  };

  const handleDiagnostics = () => {
    setIsDiagnosticsModalVisible(true);
  };

  const handleExportDiagnostics = () => {
    const diagnosticsText = `Novelcrafter 诊断信息\n\n${JSON.stringify(diagnosticInfo, null, 2)}`;
    const blob = new Blob([diagnosticsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'novelcrafter-diagnostics.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('诊断信息已导出');
  };

  const tabItems = [
    {
      key: 'docs',
      label: '查看文档',
      icon: <FileTextOutlined />,
      children: (
        <div>
          <Title level={4} style={{ marginBottom: '16px' }}>文档中心</Title>
          <Row gutter={[16, 16]}>
            {documentationItems.map(item => (
              <Col span={12} key={item.id}>
                <Card 
                  hoverable 
                  onClick={() => handleViewDocument(item.id)}
                  style={{ height: '100%' }}
                >
                  <Space align="start" size="middle">
                    <Avatar size="large" icon={item.icon} />
                    <div>
                      <Title level={5} style={{ margin: 0 }}>{item.title}</Title>
                      <Paragraph type="secondary" style={{ margin: '4px 0' }}>
                        {item.description}
                      </Paragraph>
                      <Space size="small">
                        {item.tags.map(tag => (
                          <Tag key={tag} color="blue">{tag}</Tag>
                        ))}
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          更新于 {item.lastUpdated}
                        </Text>
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )
    },
    {
      key: 'tips',
      label: '今日小贴士',
      icon: <BulbOutlined />,
      children: (
        <div>
          <Title level={4} style={{ marginBottom: '16px' }}>今日小贴士</Title>
          <List
            itemLayout="horizontal"
            dataSource={dailyTips}
            renderItem={item => (
              <List.Item
                actions={[<Button type="link" onClick={() => handleOpenTip(item.id)}>查看详情</Button>]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<BulbOutlined />} />}
                  title={item.title}
                  description={<Text type="secondary">{item.content}</Text>}
                />
                <Tag color="green">{item.category}</Tag>
              </List.Item>
            )}
          />
        </div>
      )
    },
    {
      key: 'ai-chat',
      label: 'AI 支持聊天',
      icon: <RobotOutlined />,
      children: (
        <div style={{ height: '600px' }}>
          <Title level={4} style={{ marginBottom: '16px' }}>与 AI 支持聊天</Title>
          <AIHelpChat />
        </div>
      )
    },
    {
      key: 'feedback',
      label: '反馈 / 路线图',
      icon: <LikeOutlined />,
      children: (
        <div>
          <Title level={4} style={{ marginBottom: '16px' }}>反馈与建议</Title>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="提交反馈" extra={<LikeOutlined />}>
                <Paragraph>
                  您的意见对我们非常重要。请告诉我们您的使用体验、遇到的问题或功能建议。
                </Paragraph>
                <Paragraph>
                  我们会认真考虑每一条反馈，并在后续版本中不断改进产品。您提交的反馈将帮助我们更好地理解用户需求。
                </Paragraph>
                <Button 
                  type="primary" 
                  onClick={() => setIsFeedbackModalVisible(true)}
                  block
                >
                  提交反馈
                </Button>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="产品路线图" extra={<BarChartOutlined />}>
                <Paragraph>
                  查看我们未来的产品规划和发展方向，您也可以对功能优先级进行投票。
                </Paragraph>
                <Paragraph>
                  我们的开发团队会根据用户反馈和市场需求制定产品发展计划。您可以通过投票来表达对特定功能的期待。
                </Paragraph>
                <Button 
                  type="default" 
                  onClick={() => message.info('产品路线图功能即将上线')}
                  block
                >
                  查看路线图
                </Button>
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'diagnostics',
      label: '支持诊断',
      icon: <ToolOutlined />,
      children: (
        <div>
          <Title level={4} style={{ marginBottom: '16px' }}>系统诊断</Title>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                运行系统诊断可以帮助我们更好地了解您遇到的问题，收集的信息仅用于技术支持。
              </Paragraph>
              <Paragraph>
                诊断信息包括：应用版本、浏览器信息、系统环境、网络状态等。这些信息将帮助我们的技术支持团队快速定位和解决问题。
              </Paragraph>
              <Paragraph type="warning">
                请注意：诊断信息不包含您的创作内容或个人隐私数据。
              </Paragraph>
              <Button 
                type="primary" 
                icon={<ToolOutlined />}
                onClick={handleDiagnostics}
              >
                运行诊断
              </Button>
            </Space>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 面包屑导航 */}
        <Breadcrumb>
          <Breadcrumb.Item href="/">
            <HomeOutlined />
            <span>首页</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>帮助中心</Breadcrumb.Item>
        </Breadcrumb>
        
        <div>
          <Title level={2}>
            <Space>
              <QuestionCircleOutlined />
              <span>帮助中心</span>
            </Space>
          </Title>
          <Paragraph type="secondary">
            获取使用帮助、查看文档、提交反馈或进行系统诊断
          </Paragraph>
        </div>

        <Tabs 
          activeKey={activeTab} 
          items={tabItems}
          onChange={setActiveTab}
        />

        {/* 反馈提交模态框 */}
        <Modal
          title="提交反馈"
          open={isFeedbackModalVisible}
          onCancel={() => setIsFeedbackModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={feedbackForm}
            layout="vertical"
            onFinish={handleFeedbackSubmit}
          >
            <Form.Item
              name="category"
              label="反馈类型"
              rules={[{ required: true, message: '请选择反馈类型' }]}
            >
              <Select placeholder="请选择反馈类型">
                {feedbackCategories.map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: '请输入反馈标题' }]}
            >
              <Input placeholder="简要描述您的反馈" />
            </Form.Item>
            
            <Form.Item
              name="content"
              label="详细描述"
              rules={[{ required: true, message: '请输入详细描述' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="请详细描述您的问题、建议或体验" 
              />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                  提交反馈
                </Button>
                <Button onClick={() => setIsFeedbackModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 诊断信息模态框 */}
        <Modal
          title="系统诊断信息"
          open={isDiagnosticsModalVisible}
          onCancel={() => setIsDiagnosticsModalVisible(false)}
          width={800}
          footer={[
            <Button key="close" onClick={() => setIsDiagnosticsModalVisible(false)}>
              关闭
            </Button>,
            <Button 
              key="export" 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={handleExportDiagnostics}
            >
              导出诊断信息
            </Button>
          ]}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph type="secondary">
              以下信息将帮助我们的技术支持团队更好地了解您的系统环境：
            </Paragraph>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {Object.entries(diagnosticInfo).map(([key, value]) => (
                <div key={key} style={{ marginBottom: '8px' }}>
                  <Text strong>{key}:</Text> {String(value)}
                </div>
              ))}
            </div>
          </Space>
        </Modal>
      </Space>
    </div>
  );
};

export default HelpCenterPage;