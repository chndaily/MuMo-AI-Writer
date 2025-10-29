import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Typography, Space, Divider, Modal, Form, Input, message, Popconfirm, Tag, Tooltip, Row, Col, Tree, Empty, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined, ExportOutlined, ImportOutlined, FullscreenOutlined, FullscreenExitOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, EyeOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useMembership } from '@/hooks/useMembership';

const { Title, Text } = Typography;

// 获取章节状态颜色
const getChapterStatusColor = (content: string) => {
  if (!content || content.trim() === '') {
    return 'default'; // 无内容
  } else if (content.length < 100) {
    return 'orange'; // 草稿
  } else {
    return 'green'; // 已完成
  }
};

// 获取章节状态文本
const getChapterStatusText = (content: string) => {
  if (!content || content.trim() === '') {
    return '无内容';
  } else if (content.length < 100) {
    return '草稿';
  } else {
    return '已完成';
  }
};

// 获取章节状态图标
const getChapterStatusIcon = (content: string) => {
  if (!content || content.trim() === '') {
    return <ClockCircleOutlined />;
  } else if (content.length < 100) {
    return <EditOutlined />;
  } else {
    return <CheckCircleOutlined />;
  }
};

// 章节卡片组件（增强版）
const ChapterCard: React.FC<{ 
  id: string;
  title: string; 
  content: string;
  wordCount: number;
  lastModified: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onEnterCreation: (id: string) => void;
  onViewContent: (content: string) => void;
}> = ({ id, title, content, wordCount, lastModified, onEdit, onDelete, onEnterCreation, onViewContent }) => {
  const [expanded, setExpanded] = useState(false);
  const maxPreviewLength = 100;
  
  // 计算内容预览
  const getContentPreview = () => {
    if (!content) return <Text type="secondary">暂无内容</Text>;
    
    // 使用 ReactMarkdown 渲染 Markdown
    const previewContent = content.substring(0, maxPreviewLength) + (content.length > maxPreviewLength ? '...' : '');
    
    if (content.length <= maxPreviewLength) {
      return (
        <div className="whitespace-pre-wrap">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{previewContent}</ReactMarkdown>
        </div>
      );
    }
    
    if (expanded) {
      return (
        <div>
          <div className="whitespace-pre-wrap">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
          </div>
          <Button type="link" onClick={() => setExpanded(false)}>收起</Button>
        </div>
      );
    }
    
    return (
      <div>
        <div className="whitespace-pre-wrap">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{previewContent}</ReactMarkdown>
        </div>
        <Button type="link" onClick={() => setExpanded(true)}>展开</Button>
      </div>
    );
  };

  // 格式化日期
  const formatLastModified = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      size="small" 
      title={
        <div className="flex justify-between items-center">
          <span>{title}</span>
          <Space>
            <Tag color={getChapterStatusColor(content)} icon={getChapterStatusIcon(content)}>
              {getChapterStatusText(content)}
            </Tag>
            <Tag color="blue">{wordCount} 字</Tag>
          </Space>
        </div>
      }
      extra={
        <Space>
          <Tooltip title="查看内容">
            <Button type="text" icon={<EyeOutlined />} onClick={() => onViewContent(content)} />
          </Tooltip>
          <Tooltip title="进入创作">
            <Button type="text" icon={<FileTextOutlined />} onClick={() => onEnterCreation(id)} />
          </Tooltip>
          <Tooltip title="编辑大纲">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(id)} />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个章节吗？"
            onConfirm={() => onDelete(id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      }
      className="mb-4 hover:shadow-md transition-shadow"
    >
      <div className="mb-2">
        <Text type="secondary" style={{ fontSize: '12px' }}>
          最后修改: {formatLastModified(lastModified)}
        </Text>
      </div>
      {getContentPreview()}
    </Card>
  );
};

// 卷结构组件（增强版）
const ActBlock: React.FC<{ 
  id: string;
  title: string; 
  content?: string; // 添加content属性
  chapters: { id: string; title: string; content: string; wordCount: number; lastModified: string }[];
  progress: number;
  onAddChapter: (actId: string) => void;
  onEditAct: (id: string) => void; // 添加onEditAct属性
  onEditChapter: (id: string) => void;
  onDeleteChapter: (id: string) => void;
  onEnterCreation: (id: string) => void;
  onViewContent: (content: string) => void;
}> = ({ id, title, content, chapters, progress, onAddChapter, onEditAct, onEditChapter, onDeleteChapter, onEnterCreation, onViewContent }) => (
  <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
    <div className="flex justify-between items-center mb-3">
      <Title level={3} className="!mb-0 flex items-center">
        <span className="mr-2">{title}</span>
        <Tag color="blue">{progress}%</Tag>
      </Title>
      <Space>
        <Button type="primary" onClick={() => onAddChapter(id)} icon={<PlusOutlined />}>添加章节</Button>
        <Button 
          type="default" 
          onClick={() => onEditAct(id)} 
          icon={<EditOutlined />}
        >
          编辑卷
        </Button>
        <Popconfirm
          title="确认删除"
          description="确定要删除这个卷吗？这将删除所有相关章节。"
          onConfirm={() => onDeleteChapter(id)}
          okText="确认"
          cancelText="取消"
        >
          <Button type="primary" danger icon={<DeleteOutlined />}>删除卷</Button>
        </Popconfirm>
      </Space>
    </div>
    
    {/* 添加卷内容显示 */}
    {content && (
      <div className="act-content mb-4 p-3 bg-white rounded border">
        <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>') }} />
      </div>
    )}
    
    {chapters.length > 0 ? (
      chapters.map((chapter, index) => (
        <ChapterCard 
          key={chapter.id}
          id={chapter.id}
          title={`${index + 1}. ${chapter.title}`}
          content={chapter.content}
          wordCount={chapter.wordCount}
          lastModified={chapter.lastModified}
          onEdit={onEditChapter}
          onDelete={onDeleteChapter}
          onEnterCreation={onEnterCreation}
          onViewContent={onViewContent}
        />
      ))
    ) : (
      <Card>
        <Empty description="暂无章节，请添加" />
        <div className="text-center mt-4">
          <Button type="primary" onClick={() => onAddChapter(id)} icon={<PlusOutlined />}>
            添加第一个章节
          </Button>
        </div>
      </Card>
    )}
  </div>
);

// 树形视图组件
const TreeView: React.FC<{ 
  actsData: any[];
  onEditChapter: (id: string) => void;
  onDeleteChapter: (id: string) => void;
  onEnterCreation: (id: string) => void;
  onViewContent: (content: string) => void;
  onAddChapter: (actId: string) => void;
  onDeleteAct: (id: string) => void;
  onEditAct: (id: string) => void; // 添加onEditAct属性
}> = ({ actsData, onEditChapter, onDeleteChapter, onEnterCreation, onViewContent, onAddChapter, onDeleteAct, onEditAct }) => {
  // 构建树形数据结构
  const treeData = actsData.map(act => ({
    title: (
      <div className="flex justify-between items-center w-full py-2">
        <span className="font-medium">{act.title}</span>
        <Space>
          <Tag color="blue">{act.progress}%</Tag>
          <Button type="text" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); onAddChapter(act.id); }} />
          <Button type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); onEditAct(act.id); }} />
          <Popconfirm
            title="确认删除"
            description="确定要删除这个卷吗？这将删除所有相关章节。"
            onConfirm={() => onDeleteAct(act.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="text" icon={<DeleteOutlined />} danger onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        </Space>
      </div>
    ),
    key: act.id,
    children: act.chapters.map((chapter: any, index: number) => ({
      title: (
        <div className="flex justify-between items-center w-full py-2">
          <span>{`${index + 1}. ${chapter.title}`}</span>
          <Space>
            <Tag color={getChapterStatusColor(chapter.content)} icon={getChapterStatusIcon(chapter.content)}>
              {getChapterStatusText(chapter.content)}
            </Tag>
            <Tag color="blue">{chapter.wordCount} 字</Tag>
            <Button type="text" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); onViewContent(chapter.content); }} />
            <Button type="text" icon={<FileTextOutlined />} onClick={(e) => { e.stopPropagation(); onEnterCreation(chapter.id); }} />
            <Button type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); onEditChapter(chapter.id); }} />
            <Popconfirm
              title="确认删除"
              description="确定要删除这个章节吗？"
              onConfirm={() => onDeleteChapter(chapter.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="text" icon={<DeleteOutlined />} danger onClick={(e) => e.stopPropagation()} />
            </Popconfirm>
          </Space>
        </div>
      ),
      key: chapter.id,
    }))
  }));

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      {actsData.length > 0 ? (
        <Tree
          className="w-full"
          treeData={treeData}
          defaultExpandAll
          titleRender={(nodeData) => nodeData.title}
        />
      ) : (
        <Empty description="暂无故事结构，请添加" />
      )}
    </div>
  );
};

// 栅格视图组件
const GridView: React.FC<{ 
  actsData: any[];
  onEditChapter: (id: string) => void;
  onDeleteChapter: (id: string) => void;
  onEnterCreation: (id: string) => void;
  onViewContent: (content: string) => void;
}> = ({ actsData, onEditChapter, onDeleteChapter, onEnterCreation, onViewContent }) => {
  // 将所有章节扁平化处理
  const allChapters = actsData.flatMap(act => 
    act.chapters.map((chapter: any, index: number) => ({
      ...chapter,
      actTitle: act.title,
      chapterIndex: index + 1
    }))
  );

  return (
    <div className="p-4">
      {allChapters.length > 0 ? (
        <Row gutter={[16, 16]}>
          {allChapters.map((chapter) => (
            <Col xs={24} sm={12} md={8} lg={6} key={chapter.id}>
              <Card 
                size="small"
                className="h-full hover:shadow-md transition-shadow flex flex-col"
                title={
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium truncate">{chapter.actTitle}</span>
                    <Tag color="blue">{chapter.chapterIndex}</Tag>
                  </div>
                }
                extra={
                  <Space>
                    <Tooltip title="查看内容">
                      <Button type="text" icon={<EyeOutlined />} onClick={() => onViewContent(chapter.content)} size="small" />
                    </Tooltip>
                    <Tooltip title="进入创作">
                      <Button 
                        type="text" 
                        icon={<FileTextOutlined />} 
                        onClick={() => onEnterCreation(chapter.id)} 
                        size="small" 
                      />
                    </Tooltip>
                    <Tooltip title="编辑">
                      <Button type="text" icon={<EditOutlined />} onClick={() => onEditChapter(chapter.id)} size="small" />
                    </Tooltip>
                    <Popconfirm
                      title="确认删除"
                      description="确定要删除这个章节吗？"
                      onConfirm={() => onDeleteChapter(chapter.id)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button type="text" icon={<DeleteOutlined />} danger size="small" />
                    </Popconfirm>
                  </Space>
                }
              >
                {/* 章节标题行，包含标题、状态和字数统计 */}
                <div className="flex justify-between items-center mb-2">
                  <Text strong className="text-sm truncate flex-grow mr-2">{chapter.title}</Text>
                  <Space size="small">
                    <Tag color={getChapterStatusColor(chapter.content)} icon={getChapterStatusIcon(chapter.content)} style={{ margin: 0 }}>
                      {getChapterStatusText(chapter.content)}
                    </Tag>
                    <Tag color="blue" style={{ margin: 0 }}>{chapter.wordCount} 字</Tag>
                  </Space>
                </div>
                
                {/* 章节内容预览区域 */}
                <div className="chapter-content-preview flex-grow" style={{ 
                  marginBottom: '12px', 
                  padding: '8px', 
                  backgroundColor: '#f9f9f9', 
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {chapter.content ? (
                    <div dangerouslySetInnerHTML={{ __html: chapter.content.replace(/\n/g, '<br>') }} />
                  ) : (
                    <Text type="secondary">暂无内容</Text>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <Empty description="暂无章节" />
        </div>
      )}
    </div>
  );
};

// 内容预览模态框
const ContentPreviewModal: React.FC<{ 
  content: string;
  visible: boolean;
  onCancel: () => void;
}> = ({ content, visible, onCancel }) => {
  return (
    <Modal
      title="内容预览"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <div className="max-h-96 overflow-y-auto p-4 bg-gray-50 rounded">
        {content ? (
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
        ) : (
          <Empty description="暂无内容" />
        )}
      </div>
    </Modal>
  );
};

// 故事板主页面组件
const NovelStoryboard: React.FC = () => {
  const navigate = useNavigate();
  const { novelId } = useParams();
  const { checkPermission, isFree } = useMembership(); // 新增权限检查
  
  // 检查用户是否有访问权限
  const hasPermission = checkPermission('storyboard');
  
  // 如果没有权限，显示升级提示
  if (!hasPermission) {
    return (
      <div className="outline-board h-full overflow-y-auto p-4 bg-gray-100">
        <Alert
          message="权限不足"
          description={
            <div>
              <p>当前功能需要基础会员或更高等级才能使用。</p>
              <p className="mt-2">
                <Button 
                  type="primary" 
                  onClick={() => navigate('/membership')}
                >
                  升级会员
                </Button>
              </p>
            </div>
          }
          type="warning"
          showIcon
          icon={<LockOutlined />}
        />
      </div>
    );
  }
  
  // 直接使用 databaseManager 获取数据
  const [outlines, setOutlines] = useState<any[]>([]);
  const refreshOutlines = useCallback(async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const outlinesData = await databaseManager.outlines.getOutlinesByNovelId(novelId);
      setOutlines(outlinesData);
    }
  }, []);
  const addOutline = useCallback(async (outline: any) => {
    const { databaseManager } = await import('@/services/index');
    return await databaseManager.outlines.addOutline(outline);
  }, []);
  const updateOutline = useCallback(async (outline: any) => {
    const { databaseManager } = await import('@/services/index');
    await databaseManager.outlines.updateOutline(outline);
  }, []);
  const deleteOutline = useCallback(async (id: string) => {
    const { databaseManager } = await import('@/services/index');
    await databaseManager.outlines.deleteOutline(id);
  }, []);
  
  // 将从IndexedDB加载的平面数据转换为层级结构
  const [actsData, setActsData] = useState<any[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'act' | 'chapter'>('act');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [parentId, setParentId] = useState<string>(''); // 用于章节的父级ID（卷ID）
  const [form] = Form.useForm();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'elastic' | 'grid' | 'tree'>('elastic'); // 视图模式
  const [previewContent, setPreviewContent] = useState(''); // 预览内容
  const [previewVisible, setPreviewVisible] = useState(false); // 预览模态框可见性
  const [importInputKey, setImportInputKey] = useState(Date.now()); // 用于重置文件输入

  // 监听自定义事件
  useEffect(() => {
    // AI生成事件
    const handleAIGenerate = () => handleAIAssist();
    // 导出事件
    const handleExport = () => handleExportOutline();
    // 导入事件
    const handleImport = () => handleImportOutline();
    // 全屏事件
    const handleFullscreen = () => toggleFullscreen();
    // 添加章节事件（来自侧边栏）
    const handleAddChapter = () => handleAddChapterClick();
    // 视图模式切换事件
    const handleViewChange = (e: CustomEvent) => setViewMode(e.detail);
    // 大纲更新事件
    const handleOutlineUpdated = () => {
      if (novelId) {
        refreshOutlines(novelId);
      }
    };
    
    // 添加事件监听器
    window.addEventListener('storyboard-ai-generate', handleAIGenerate);
    window.addEventListener('storyboard-export', handleExport);
    window.addEventListener('storyboard-import', handleImport);
    window.addEventListener('storyboard-fullscreen', handleFullscreen);
    window.addEventListener('storyboard-add-chapter', handleAddChapter);
    window.addEventListener('storyboard-view-change', handleViewChange as EventListener);
    window.addEventListener('outline-updated', handleOutlineUpdated);
    
    // 监听全屏状态变化
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // 清理事件监听器
    return () => {
      window.removeEventListener('storyboard-ai-generate', handleAIGenerate);
      window.removeEventListener('storyboard-export', handleExport);
      window.removeEventListener('storyboard-import', handleImport);
      window.removeEventListener('storyboard-fullscreen', handleFullscreen);
      window.removeEventListener('storyboard-add-chapter', handleAddChapter);
      window.removeEventListener('storyboard-view-change', handleViewChange as EventListener);
      window.removeEventListener('outline-updated', handleOutlineUpdated);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [novelId, refreshOutlines]);
  
  // 加载大纲数据
  useEffect(() => {
    if (novelId) {
      refreshOutlines(novelId);
    }
  }, [novelId, refreshOutlines]);

  // 当outlines数据变化时，转换为层级结构
  useEffect(() => {
    if (outlines.length > 0) {
      console.log('=== 开始转换大纲数据 ===');
      console.log('原始outlines数据:', outlines);
      const transformedData = transformOutlinesToHierarchy(outlines);
      console.log('转换后的数据:', transformedData);
      setActsData(transformedData);
      console.log('=== 大纲数据转换完成 ===');
    } else {
      setActsData([]);
    }
  }, [outlines]);

  // 将平面的outline数据转换为层级结构
  const transformOutlinesToHierarchy = (outlines: any[]): any[] => {
    console.log('=== transformOutlinesToHierarchy 开始 ===');
    console.log('输入的outlines:', outlines);
    
    // 使用Map优化查找性能
    const outlineMap = new Map<string, any>()
    const actMap = new Map<string, any>()
    
    // 先建立ID到对象的映射
    outlines.forEach(outline => {
      outlineMap.set(outline.id, outline)
    })
    
    // 分类处理不同类型的outline
    const acts: any[] = []
    const chaptersByAct = new Map<string, any[]>()
    
    // 处理acts (主线大纲)
    outlines.filter((o: any) => o.type === 'main').forEach(outline => {
      const act: any = {
        id: outline.id,
        title: outline.title,
        content: outline.content,
        order: outline.order,
        chapters: [],
        totalWords: 0
      }
      acts.push(act)
      actMap.set(outline.id, act)
      chaptersByAct.set(outline.id, [])
    })
    
    console.log('处理完acts:', acts);
    
    // 处理chapters (章节大纲)
    outlines.filter((o: any) => o.type === 'chapter').forEach(outline => {
      console.log('处理章节:', outline);
      // 修复：正确处理parentId，确保各种情况都被正确处理
      let parentId = outline.parentId;
      // 处理null、undefined、空字符串等情况
      if (parentId === null || parentId === undefined || parentId === '') {
        parentId = undefined;
      }
      
      // 计算字数
      const wordCount = outline.content ? outline.content.length : 0;
      
      const chapter: any = {
        id: outline.id,
        title: outline.title,
        content: outline.content,
        order: outline.order,
        wordCount: wordCount,
        lastModified: outline.lastModified
      }
      
      console.log(`章节 ${outline.id} 处理后的parentId:`, parentId);
      
      // 将章节添加到对应的卷下
      if (parentId && chaptersByAct.has(parentId)) {
        console.log(`将章节 ${outline.id} 添加到卷 ${parentId}`);
        chaptersByAct.get(parentId)!.push(chapter)
      } else if (parentId && !chaptersByAct.has(parentId)) {
        // 修复：parentId指向的卷不存在
        console.warn(`章节 ${outline.id} 指向的卷 ${parentId} 不存在`);
        if (acts.length > 0) {
          // 将章节添加到第一个卷中
          console.log(`将章节 ${outline.id} 添加到第一个卷 ${acts[0].id} 中`);
          chaptersByAct.get(acts[0].id)!.push(chapter);
        } else {
          // 创建一个特殊的"未分类"卷来容纳这些章节
          console.log(`创建"未分类"卷来容纳章节 ${outline.id}`);
          const uncategorizedAct: any = {
            id: 'uncategorized',
            title: '未分类章节',
            content: '这些章节的父级卷已被删除或不存在',
            order: 999,
            chapters: [],
            totalWords: 0
          };
          acts.push(uncategorizedAct);
          actMap.set('uncategorized', uncategorizedAct);
          chaptersByAct.set('uncategorized', [chapter]);
        }
      } else if (!parentId && acts.length > 0) {
        // 修复：如果章节没有parentId但存在卷，将章节添加到第一个卷中
        // 这是为了处理更新后parentId丢失的情况
        console.warn(`章节 ${outline.id} 缺少parentId，将其添加到第一个卷 ${acts[0].id} 中`);
        chaptersByAct.get(acts[0].id)!.push(chapter);
      } else {
        console.warn(`章节 ${outline.id} 无法找到对应的卷 (parentId: ${parentId})`);
        // 如果没有任何卷，创建一个特殊的"未分类"卷
        if (acts.length === 0) {
          console.log(`创建"未分类"卷来容纳章节 ${outline.id}`);
          const uncategorizedAct: any = {
            id: 'uncategorized',
            title: '未分类章节',
            content: '这些章节没有父级卷',
            order: 999,
            chapters: [],
            totalWords: 0
          };
          acts.push(uncategorizedAct);
          actMap.set('uncategorized', uncategorizedAct);
          chaptersByAct.set('uncategorized', [chapter]);
        }
      }
    })
    
    // 组装数据并按order排序
    acts.forEach(act => {
      // 对章节按order排序
      const chapters = (chaptersByAct.get(act.id) || []).sort((a: any, b: any) => a.order - b.order)
      act.chapters = chapters
      
      // 计算卷的进度（基于章节完成状态）
      if (chapters.length > 0) {
        const completedChapters = chapters.filter((chapter: any) => 
          chapter.content && chapter.content.trim() !== '' && chapter.content.length >= 100
        ).length;
        act.progress = Math.round((completedChapters / chapters.length) * 100);
      } else {
        act.progress = 0;
      }
    })
    
    // 按order排序Acts
    acts.sort((a: any, b: any) => a.order - b.order)
    
    console.log('转换结果:', acts);
    console.log('=== transformOutlinesToHierarchy 结束 ===');
    
    return acts;
  };

  const handleAddAct = () => {
    setModalType('act');
    setEditingItem(null);
    setParentId('');
    form.resetFields();
    setModalVisible(true);
  };

  const handleAddChapterClick = (actId?: string) => {
    setModalType('chapter');
    setEditingItem(null);
    setParentId(actId || (actsData.length > 0 ? actsData[0].id : ''));
    form.resetFields();
    setModalVisible(true);
  };

  // 添加处理卷编辑的函数
  const handleEditAct = (id: string) => {
    const act = outlines.find(o => o.id === id);
    if (act) {
      setModalType('act');
      setEditingItem(act);
      setParentId('');
      // 设置表单字段值，将HTML标签转换为纯文本
      form.setFieldsValue({
        title: act.title,
        content: act.content ? act.content.replace(/<[^>]*>/g, '') : ''
      });
      setModalVisible(true);
    }
  };

  const handleEditChapter = (id: string) => {
    const chapter = outlines.find(o => o.id === id);
    if (chapter) {
      setModalType('chapter');
      setEditingItem(chapter);
      setParentId(chapter.parentId || '');
      // 设置表单字段值，将HTML标签转换为纯文本
      form.setFieldsValue({
        title: chapter.title,
        content: chapter.content ? chapter.content.replace(/<[^>]*>/g, '') : ''
      });
      setModalVisible(true);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    try {
      // 先获取要删除的章节信息
      const chapterToDelete = outlines.find(o => o.id === id);
      if (!chapterToDelete) {
        message.error('未找到要删除的章节');
        return;
      }
      
      // 删除章节
      await deleteOutline(id);
      
      // 获取同级章节并重新排序
      if (chapterToDelete.parentId) {
        const { databaseManager } = await import('@/services/index');
        // 获取同级章节
        const siblingChapters = outlines
          .filter(o => o.parentId === chapterToDelete.parentId && o.id !== id && o.type === 'chapter')
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // 重新分配order值
        for (let i = 0; i < siblingChapters.length; i++) {
          const chapter = siblingChapters[i];
          if (chapter.order !== i + 1) {
            // 只有当order值不正确时才更新
            await updateOutline({
              ...chapter,
              order: i + 1
            });
          }
        }
      }
      
      // 触发大纲更新事件，通知其他组件大纲已更新
      window.dispatchEvent(new CustomEvent('outline-updated'));
      message.success('章节删除成功');
    } catch (error) {
      console.error('删除章节失败:', error);
      message.error('删除章节失败');
    }
  };
  
  const handleDeleteAct = async (id: string) => {
    try {
      // 删除卷及其所有章节
      await deleteOutline(id);
      // 删除该卷下的所有章节
      const chaptersToDelete = outlines.filter(o => o.parentId === id);
      for (const chapter of chaptersToDelete) {
        await deleteOutline(chapter.id);
      }
      
      // 触发大纲更新事件，通知其他组件大纲已更新
      window.dispatchEvent(new CustomEvent('outline-updated'));
      message.success('卷删除成功');
    } catch (error) {
      console.error('删除卷失败:', error);
      message.error('删除卷失败');
    }
  };
  
  const handleEnterCreation = (id: string) => {
    // 跳转到章节创作页面，并传递章节ID作为URL参数
    navigate(`/novels/${novelId}/manuscript/${id}`);
  };
  
  const handleViewContent = (content: string) => {
    setPreviewContent(content);
    setPreviewVisible(true);
  };
  
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (modalType === 'act') {
        // 添加或编辑卷
        if (editingItem) {
          // 编辑卷
          const { databaseManager } = await import('@/services/index');
          const outline = await databaseManager.outlines.getOutline(editingItem.id);
          if (outline) {
            await updateOutline({
              ...outline,
              ...values
            });
          }
        } else {
          // 添加卷
          await addOutline({
            novelId: novelId!,
            title: values.title,
            content: values.content || '',
            type: 'main',
            order: actsData.length + 1,
            parentId: undefined
          });
        }
        message.success('卷保存成功');
      } else if (modalType === 'chapter') {
        // 添加或编辑章节
        if (editingItem) {
          // 编辑章节
          const { databaseManager } = await import('@/services/index');
          const outline = await databaseManager.outlines.getOutline(editingItem.id);
          if (outline) {
            // 检查是否改变了父级
            const parentChanged = outline.parentId !== parentId;
            
            // 更新章节
            await updateOutline({
              ...outline,
              ...values,
              parentId: parentId
            });
            
            // 如果改变了父级，需要重新排序原父级和新父级下的章节
            if (parentChanged) {
              // 重新排序原父级下的章节
              if (outline.parentId) {
                const originalSiblings = outlines
                  .filter(o => o.parentId === outline.parentId && o.id !== outline.id && o.type === 'chapter')
                  .sort((a, b) => (a.order || 0) - (b.order || 0));
                
                // 重新分配order值
                for (let i = 0; i < originalSiblings.length; i++) {
                  const chapter = originalSiblings[i];
                  if (chapter.order !== i + 1) {
                    await updateOutline({
                      ...chapter,
                      order: i + 1
                    });
                  }
                }
              }
              
              // 重新排序新父级下的章节
              if (parentId) {
                const newSiblings = [...outlines.filter(o => o.parentId === parentId && o.id !== outline.id && o.type === 'chapter'), {...outline, ...values, parentId: parentId}]
                  .sort((a, b) => (a.order || 0) - (b.order || 0));
                
                // 重新分配order值
                for (let i = 0; i < newSiblings.length; i++) {
                  const chapter = newSiblings[i];
                  if (chapter.order !== i + 1) {
                    await updateOutline({
                      ...chapter,
                      order: i + 1
                    });
                  }
                }
              }
            }
          }
        } else {
          // 添加章节
          // 获取同级章节并按order排序
          const siblingChapters = outlines
            .filter(o => o.parentId === parentId && o.type === 'chapter')
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          
          // 计算新的order值，确保连续且唯一
          const newOrder = siblingChapters.length > 0 
            ? Math.max(...siblingChapters.map(c => c.order || 0)) + 1 
            : 1;
          
          await addOutline({
            novelId: novelId!,
            title: values.title,
            content: values.content || '',
            type: 'chapter',
            order: newOrder,
            parentId: parentId
          });
        }
        message.success('章节保存成功');
      }
      
      // 触发大纲更新事件，通知其他组件大纲已更新
      window.dispatchEvent(new CustomEvent('outline-updated'));
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };
  
  const handleAIAssist = () => {
    // 跳转到AI工作台
    navigate('/ai-workspace', {
      state: {
        mode: 'outline',
        prompt: '请为小说生成大纲结构',
        novelId: novelId
      }
    });
  };

  // 导出大纲
  const handleExportOutline = () => {
    try {
      // 将当前的大纲数据转换为可导出的格式
      const exportData = {
        acts: actsData,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const outlineJson = JSON.stringify(exportData, null, 2);
      const blob = new Blob([outlineJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `小说大纲_${novelId}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('大纲导出成功');
    } catch (error) {
      console.error('导出大纲失败:', error);
      message.error('导出大纲失败');
    }
  };

  // 导入大纲
  const handleImportOutline = () => {
    // 触发文件选择
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };
  
  // 切换全屏模式
  const toggleFullscreen = () => {
    const element = document.querySelector('.outline-board');
    if (element) {
      if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
          message.error(`无法进入全屏模式: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  // 计算整体进度
  const calculateOverallProgress = () => {
    if (actsData.length === 0) return 0;
    
    let totalChapters = 0;
    let completedChapters = 0;
    
    actsData.forEach(act => {
      totalChapters += act.chapters.length;
      completedChapters += act.chapters.filter((chapter: any) => 
        chapter.content && chapter.content.trim() !== '' && chapter.content.length >= 100
      ).length;
    });
    
    return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  };

  // 渲染不同视图模式
  const renderView = () => {
    switch (viewMode) {
      case 'elastic':
        return (
          <>
            {actsData.map((act: any) => (
              <ActBlock 
                key={act.id}
                id={act.id}
                title={act.title}
                content={act.content} // 添加content属性
                chapters={act.chapters}
                progress={act.progress}
                onAddChapter={handleAddChapterClick}
                onEditAct={handleEditAct} // 添加onEditAct属性
                onEditChapter={handleEditChapter}
                onDeleteChapter={handleDeleteAct}
                onEnterCreation={handleEnterCreation}
                onViewContent={handleViewContent}
              />
            ))}
            {actsData.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Empty description="暂无故事结构，请添加" />
                <div className="mt-4">
                  <Button type="primary" onClick={handleAddAct} icon={<PlusOutlined />}>
                    创建第一个故事结构
                  </Button>
                </div>
              </div>
            )}
          </>
        );
      case 'grid':
        return (
          <GridView 
            actsData={actsData}
            onEditChapter={handleEditChapter}
            onDeleteChapter={handleDeleteChapter}
            onEnterCreation={handleEnterCreation}
            onViewContent={handleViewContent}
          />
        );
      case 'tree':
        return (
          <TreeView 
            actsData={actsData}
            onEditChapter={handleEditChapter}
            onDeleteChapter={handleDeleteChapter}
            onEnterCreation={handleEnterCreation}
            onViewContent={handleViewContent}
            onAddChapter={handleAddChapterClick}
            onDeleteAct={handleDeleteAct}
            onEditAct={handleEditAct} // 添加onEditAct属性
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="outline-board h-full overflow-y-auto p-4 bg-gray-100">
      {/* 隐藏的文件输入元素用于导入 */}
      <input
        key={importInputKey}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const content = event.target?.result as string;
              const importedData = JSON.parse(content);
              
              // 验证导入的数据结构
              if (!importedData.acts || !Array.isArray(importedData.acts)) {
                throw new Error('无效的大纲数据格式');
              }
              
              // 确认是否要导入
              if (!window.confirm('导入将覆盖当前的大纲数据，是否继续？')) {
                // 重置文件输入
                setImportInputKey(Date.now());
                return;
              }
              
              // 删除现有的所有大纲数据
              for (const outline of outlines) {
                await deleteOutline(outline.id);
              }
              
              // 导入新的大纲数据
              for (const act of importedData.acts) {
                // 添加卷
                const actData = {
                  novelId: novelId,
                  type: 'main',
                  title: act.title,
                  content: act.content || '',
                  order: act.order || 0,
                };
                
                const newAct = await addOutline(actData as any);
                
                // 添加章节
                if (act.chapters && Array.isArray(act.chapters)) {
                  for (const chapter of act.chapters) {
                    const chapterData = {
                      novelId: novelId,
                      parentId: (newAct as any).id,
                      type: 'chapter',
                      title: chapter.title,
                      content: chapter.content || '',
                      order: chapter.order || 0,
                    };
                    
                    await addOutline(chapterData as any);
                  }
                }
              }
              
              // 刷新数据
              await refreshOutlines(novelId);
              
              // 重置文件输入
              setImportInputKey(Date.now());
              
              message.success('大纲导入成功');
            } catch (error: any) {
              console.error('导入大纲失败:', error);
              message.error(`导入大纲失败：${error.message || '未知错误'}`);
              // 重置文件输入
              setImportInputKey(Date.now());
            }
          };
          reader.readAsText(file);
        }}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>故事板</Title>
          <Text type="secondary">整体进度: {calculateOverallProgress()}%</Text>
        </div>
        <Space>
          <Button type="primary" onClick={handleAddAct} icon={<PlusOutlined />}>
            添加新卷
          </Button>
          <Button 
            type="default" 
            onClick={handleAIAssist} 
            icon={<ThunderboltOutlined />}
          >
            AI辅助生成
          </Button>
          <Button 
            type="default" 
            onClick={handleExportOutline} 
            icon={<ExportOutlined />}
          >
            导出
          </Button>
          <Button 
            type="default" 
            onClick={() => {
              // 触发文件选择
              const input = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (input) {
                input.click();
              }
            }} 
            icon={<ImportOutlined />}
          >
            导入
          </Button>
          <Button 
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '退出全屏' : '全屏'}
          </Button>
        </Space>
      </div>
      
      <Divider />
      
      {renderView()}
      
      <Modal
        title={`${editingItem ? '编辑' : '添加'}${modalType === 'act' ? '卷' : '章节'}`}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
          >
            <Input.TextArea 
              placeholder="请输入内容" 
              rows={6}
              // 在显示前将HTML标签转换为纯文本
              {...(editingItem ? { 
                defaultValue: editingItem.content ? editingItem.content.replace(/<[^>]*>/g, '') : '' 
              } : {})}
            />
          </Form.Item>
        </Form>
      </Modal>
      
      <ContentPreviewModal 
        content={previewContent}
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
      />
    </div>
  );
};

export default NovelStoryboard;