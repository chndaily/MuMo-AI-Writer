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
  Typography,
  Tag,
  Divider,
  Tooltip,
  Dropdown
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ThunderboltOutlined,
  DragOutlined,
  FileTextOutlined,
  DownOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { hybridStorageService } from '@/services/hybridStorageService';
import { exportService } from '@/services/exportService'; // 新增导入

import { NovelOutline } from '#/novel';
import { generateUUID } from '@/utils/uuidUtils';
import { optimizedDataSyncService } from '@/services/optimizedDataSyncService'; // 导入优化的数据同步服务

const { TextArea } = Input;
const { Text } = Typography;

interface Chapter {
  id: string;
  title: string;
  content: string; // 添加content字段
  order: number;
  totalWords: number;
  summary?: string; // 添加摘要字段
}

interface Act {
  id: string;
  title: string;
  content: string; // 添加content字段
  chapters: Chapter[];
  order: number;
  totalWords: number;
}

interface OutlineData {
  acts: Act[];
  totalWords: number;
  totalChapters: number;
}

interface OutlineBoardProps {
  aiSyncData?: any;
  novelId?: string; // 添加小说ID参数
}

const ChapterCard: React.FC<{ 
  chapter: Chapter;
  onEditChapter: (chapter: Chapter) => void;
  onDeleteChapter: (id: string) => void;
}> = ({ chapter, onEditChapter, onDeleteChapter }) => {
  return (
    <Card 
      className="chapter-card"
      title={
        <div className="chapter-header">
          <span>{chapter.title}</span>
        </div>
      }
      extra={
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => onEditChapter(chapter)}
          />
          <Popconfirm
            title="确认删除这个章节吗？"
            onConfirm={() => onDeleteChapter(chapter.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      }
      bodyStyle={{ padding: 8, height: '400px' }}
    >
      {/* 内容描述和摘要区域，上下排列，内容占60%，摘要占40% */}
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        boxSizing: 'border-box'
      }}>
        {/* 内容描述区域 - 占60%高度 */}
        <div style={{ flex: '6', minHeight: 0 }}>
          <div style={{ 
            height: '100%',
            padding: '12px', 
            backgroundColor: '#f9f9f9', 
            borderRadius: '6px',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}>
            <div style={{ 
              height: '100%', 
              overflowY: 'auto',
              paddingRight: '8px',
              boxSizing: 'border-box'
            }}>
              {chapter.content ? (
                <div dangerouslySetInnerHTML={{ __html: chapter.content.replace(/\n/g, '<br>') }} />
              ) : (
                <Text type="secondary">暂无内容</Text>
              )}
            </div>
          </div>
        </div>

        {/* 摘要区域 - 占40%高度 */}
        <div style={{ flex: '4', minHeight: 0 }}>
          <div 
            className="chapter-summary" 
            style={{ 
              height: '100%',
              padding: '12px', 
              backgroundColor: '#f0f8ff', 
              borderRadius: '6px', 
              fontSize: '13px',
              overflow: 'hidden',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              paddingRight: '8px',
              boxSizing: 'border-box'
            }}>
              <strong>摘要:</strong> {chapter.summary || '暂无摘要'}
            </div>
            {/* 字数统计放置在摘要区域的最下方 */}
            <div style={{ 
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid #d0e0f0',
              textAlign: 'right'
            }}>
              <Tag color="green">{chapter.totalWords} 字</Tag>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const ActBlock: React.FC<{ 
  act: Act;
  onEditAct: (act: Act) => void;
  onDeleteAct: (id: string) => void;
  onAddChapter: (actId: string) => void;
  onEditChapter: (chapter: Chapter) => void;
  onDeleteChapter: (id: string) => void;
}> = ({ 
  act, 
  onEditAct, 
  onDeleteAct, 
  onAddChapter, 
  onEditChapter, 
  onDeleteChapter 
}) => (
  <div className="act-block">
    <div className="act-header">
      <div className="act-title">
        <span>{act.title}</span>
        <Space>
          <Tag color="purple">{act.totalWords} 字</Tag>
          <Tag color="cyan">{act.chapters.length} 章节</Tag>
        </Space>
      </div>
      <Space>
        <Button 
          type="primary" 
          size="small"
          icon={<PlusOutlined />}
          onClick={() => onAddChapter(act.id)}
        >
          新章节
        </Button>
        <Button 
          size="small" 
          icon={<EditOutlined />}
          onClick={() => onEditAct(act)}
        />
        <Popconfirm
          title="确认删除这个卷吗？"
          onConfirm={() => onDeleteAct(act.id)}
          okText="确认"
          cancelText="取消"
        >
          <Button size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      </Space>
    </div>
    
    {act.content && (
      <div className="act-description" style={{ margin: '12px 0', padding: '12px', backgroundColor: '#f0f5ff', borderRadius: '6px' }}>
        <div dangerouslySetInnerHTML={{ __html: act.content.replace(/\n/g, '<br>') }} />
      </div>
    )}
    
    <div className="chapter-list">
      {act.chapters.map(chapter => (
        <ChapterCard
          key={chapter.id}
          chapter={chapter}
          onEditChapter={onEditChapter}
          onDeleteChapter={onDeleteChapter}
        />
      ))}
      {act.chapters.length === 0 && (
        <Card className="empty-chapter">
          <Text type="secondary">还没有章节，点击新章节开始编写</Text>
        </Card>
      )}
    </div>
  </div>
);

const OutlineBoard: React.FC<OutlineBoardProps> = ({ aiSyncData, novelId = '' }) => {
  const navigate = useNavigate();
  const [outlineData, setOutlineData] = useState<OutlineData>({
    acts: [],
    totalWords: 0,
    totalChapters: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'act' | 'chapter'>('act');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [parentId, setParentId] = useState<string>('');
  const [form] = Form.useForm();

  // 添加一个useEffect来监听自定义事件
  useEffect(() => {
    const handleOutlineUpdated = () => {
      if (novelId) {
        loadOutlineData();
      }
    };

    // 添加事件监听器
    window.addEventListener('outline-updated', handleOutlineUpdated);
    
    // 清理函数
    return () => {
      window.removeEventListener('outline-updated', handleOutlineUpdated);
    };
  }, [novelId]);

  useEffect(() => {
    if (novelId) {
      loadOutlineData();
    }
  }, [novelId]);

  // 如果没有选择小说，显示提示
  if (!novelId) {
    return (
      <div className="outline-board">
        <div className="panel-header">
          <div className="header-left">
            <h2><FileTextOutlined /> 大纲管理</h2>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px',
          color: '#8c8c8c'
        }}>
          <FileTextOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <p style={{ fontSize: '16px' }}>请先在"我的书籍"中选择一本小说</p>
          <p style={{ color: '#bfbfbf' }}>选择后即可查看和管理该小说的大纲内容</p>
        </div>
      </div>
    );
  }

  const loadOutlineData = async () => {
    try {
      const outlines = await hybridStorageService.getOutlines(novelId);
      const transformedData = transformOutlinesToHierarchy(outlines);
      setOutlineData(transformedData);
    } catch (error) {
      console.error('加载大纲数据失败:', error);
      message.error('加载大纲数据失败');
    }
  };

  // 将平面的outline数据转换为层级结构
  const transformOutlinesToHierarchy = (outlines: NovelOutline[]): OutlineData => {
    console.log('=== transformOutlinesToHierarchy 开始 ===');
    console.log('输入的outlines:', outlines);
    
    // 使用Map优化查找性能
    const outlineMap = new Map<string, NovelOutline>()
    const actMap = new Map<string, Act>()
    
    // 先建立ID到对象的映射
    outlines.forEach(outline => {
      outlineMap.set(outline.id, outline)
    })
    
    // 分类处理不同类型的outline
    const acts: Act[] = []
    const chaptersByAct = new Map<string, Chapter[]>()
    
    // 处理acts (主线大纲)
    outlines.filter(o => o.type === 'main').forEach(outline => {
      const act: Act = {
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
    outlines.filter(o => o.type === 'chapter').forEach(outline => {
      console.log('处理章节:', outline);
      // 修复：正确处理parentId，确保各种情况都被正确处理
      let parentId = outline.parentId;
      // 处理null、undefined、空字符串等情况
      if (parentId === null || parentId === undefined || parentId === '') {
        parentId = undefined;
      }
      
      const chapter: Chapter = {
        id: outline.id,
        title: outline.title,
        content: outline.content,
        order: outline.order,
        totalWords: outline.content ? outline.content.length : 0,
        summary: outline.summary // 添加摘要字段
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
          const uncategorizedAct: Act = {
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
          const uncategorizedAct: Act = {
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
      const chapters = (chaptersByAct.get(act.id) || []).sort((a, b) => a.order - b.order)
      act.chapters = chapters
      
      // 计算卷总字数
      act.totalWords = chapters.reduce((sum, chapter) => sum + chapter.totalWords, 0)
    })
    
    // 按order排序Acts
    acts.sort((a, b) => a.order - b.order)
    
    const totalWords = acts.reduce((sum, act) => sum + act.totalWords, 0)
    const totalChapters = acts.reduce((sum, act) => sum + act.chapters.length, 0)
    
    const result = {
      acts,
      totalWords,
      totalChapters
    };
    
    console.log('转换结果:', result);
    console.log('=== transformOutlinesToHierarchy 结束 ===');
    
    return result;
  };

  const handleAddAct = () => {
    setModalType('act');
    setEditingItem(null);
    setParentId('');
    form.resetFields();
    setModalVisible(true);
  };

  const handleAddChapter = (actId: string) => {
    setModalType('chapter');
    setEditingItem(null);
    setParentId(actId);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (type: 'act' | 'chapter', item: any) => {
    console.log('编辑项目:', { type, item });
    setModalType(type);
    setEditingItem(item);
    // 修复：在编辑时正确设置parentId
    const newParentId = item.parentId || '';
    console.log('设置parentId:', newParentId);
    setParentId(newParentId);
    // 设置表单字段值，将HTML标签转换为纯文本
    form.setFieldsValue({
      title: item.title,
      content: item.content ? item.content.replace(/<[^>]*>/g, '') : ''
    });
    setModalVisible(true);
  };

  const handleDelete = async (type: 'act' | 'chapter', id: string) => {
    try {
      await hybridStorageService.deleteOutline(id);
      await loadOutlineData(); // 重新加载数据
      // 触发大纲更新事件，通知其他组件大纲已更新
      window.dispatchEvent(new CustomEvent('outline-updated'));
      message.success('删除成功');
    } catch (error) {
      console.error('删除大纲失败:', error);
      message.error('删除失败');
    }
  };

  // 生成内容摘要的辅助函数
  const generateContentSummary = (content: string, maxLength: number = 100): string => {
    // 不再自动生成摘要，保持为空
    return '';
  };

  const handleSave = async (values: any) => {
    try {
      console.log('=== handleSave 开始 ===');
      console.log('输入参数:', { values, editingItem, parentId, modalType });
      const now = new Date().toISOString();
      
      // 正确处理type字段
      let outlineType: 'main' | 'chapter' | 'character' | 'world' | 'scene';
      if (modalType === 'act') {
        outlineType = 'main';
      } else if (modalType === 'chapter') {
        outlineType = 'chapter';
      } else {
        outlineType = 'world';
      }
      
      // 计算新的order值
      function calculateNewOrder(): number {
        if (editingItem) {
          return editingItem.order; // 编辑时保持原有order
        }
        
        // 新建时，计算下一个order值
        if (modalType === 'act') {
          // 对于卷，基于现有卷的数量计算
          return outlineData.acts.length + 1;
        } else if (modalType === 'chapter' && parentId) {
          // 对于章节，基于父级卷下的章节数量计算
          // 先获取同级章节
          const siblingChapters = outlineData.acts
            .find(act => act.id === parentId)?.chapters || [];
          
          // 计算新的order值，确保连续且唯一
          return siblingChapters.length > 0 
            ? Math.max(...siblingChapters.map(c => c.order || 0)) + 1 
            : 1;
        }
        return 1;
      }
      
      // 修复：确保在创建novelOutlineData对象时正确处理ID和parentId
      let novelOutlineData: NovelOutline;
      
      if (editingItem) {
        // 修复：直接从数据库获取最新的数据，而不是使用状态中的缓存数据
        console.log('从数据库获取最新数据，ID:', editingItem.id);
        const latestOutline = await hybridStorageService.getOutlines(novelId);
        const latestItem = latestOutline.find(o => o.id === editingItem.id);
        console.log('从数据库获取到的最新项目:', latestItem);
        
        if (!latestItem) {
          throw new Error('找不到要更新的项目');
        }
        
        // 使用从数据库获取的最新数据
        let newParentId = latestItem.parentId;
        // 如果是章节且parentId为空或无效，则使用当前设置的parentId
        if (modalType === 'chapter' && (newParentId === null || newParentId === undefined || newParentId === '')) {
          newParentId = parentId || undefined;
        }
        
        // 获取表单中的摘要值，如果未提供则保留原有摘要
        let summary = values.summary !== undefined ? values.summary : latestItem.summary;
        
        novelOutlineData = {
          ...latestItem,
          title: values.title,
          content: values.content || '',
          summary: summary, // 添加摘要字段
          type: outlineType,
          order: calculateNewOrder(),
          parentId: newParentId,
          lastModified: now
        };
        console.log('编辑模式 - 构造的novelOutlineData:', novelOutlineData);
      } else {
        // 新建时，创建新对象
        // 获取表单中的摘要值
        let summary = values.summary !== undefined ? values.summary : undefined;
        
        novelOutlineData = {
          id: generateUUID(),
          novelId: novelId,
          title: values.title,
          content: values.content || '',
          summary: summary, // 添加摘要字段
          type: outlineType,
          order: calculateNewOrder(),
          parentId: parentId || undefined,
          createdAt: now,
          lastModified: now
        };
        console.log('新建模式 - 构造的novelOutlineData:', novelOutlineData);
      }

      console.log('准备保存的大纲数据:', novelOutlineData);
      console.log('editingItem:', editingItem);
      console.log('parentId状态:', parentId);

      if (editingItem) {
        console.log('执行更新操作:', novelOutlineData);
        await hybridStorageService.updateOutline(novelOutlineData);
        console.log('更新操作完成');
      } else {
        console.log('执行创建操作:', novelOutlineData);
        await hybridStorageService.saveOutline(novelOutlineData);
        console.log('创建操作完成');
      }

      console.log('重新加载数据');
      await loadOutlineData(); // 重新加载数据
      console.log('数据重新加载完成');
      
      // 触发大纲更新事件，通知其他组件大纲已更新
      window.dispatchEvent(new CustomEvent('outline-updated'));
      
      setModalVisible(false);
      form.resetFields();
      message.success(editingItem ? '更新成功' : '创建成功');
      console.log('=== handleSave 结束 ===');
    } catch (error) {
      console.error('保存大纲失败:', error);
      message.error('保存失败');
    }
  }

  const calculateStats = (data: OutlineData): OutlineData => {
    let totalWords = 0;
    let totalChapters = 0;

    const newActs = data.acts.map(act => {
      let actWords = 0;
      const newChapters = act.chapters.map(chapter => {
        const chapterWords = chapter.content ? chapter.content.length : 0;
        totalChapters++;
        actWords += chapterWords;
        return { ...chapter, totalWords: chapterWords };
      });
      totalWords += actWords;
      return { ...act, chapters: newChapters, totalWords: actWords };
    });

    return {
      ...data,
      acts: newActs,
      totalWords,
      totalChapters
    };
  };

  const generateOutlineWithAI = () => {
    navigate('/ai-workspace', {
      state: {
        mode: 'outline',
        prompt: '请生成一个完整的小说大纲，包括多个卷和章节。每个章节需要包含以下关键点：内容、科幻点、冲突、伏笔、高潮、影响等要素。大纲必须采用卷式结构，每卷包含多个章节，不要包含场景层级。'
      }
    });
  };

  // 新增：导出大纲功能
  const handleExportOutline = () => {
    try {
      // 将当前的大纲数据转换为可导出的格式
      const exportData = {
        acts: outlineData.acts,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      exportService.exportAsJson(exportData, `小说大纲_${novelId}_${new Date().toISOString().slice(0, 10)}.json`);
      message.success('大纲导出成功');
    } catch (error) {
      console.error('导出大纲失败:', error);
      message.error('导出大纲失败');
    }
  };

  // 新增：导出为Markdown格式
  const handleExportOutlineAsMarkdown = () => {
    try {
      exportService.exportAsMarkdown(outlineData.acts, `小说大纲_${novelId}_${new Date().toISOString().slice(0, 10)}.md`);
      message.success('大纲导出为Markdown成功');
    } catch (error) {
      console.error('导出大纲为Markdown失败:', error);
      message.error('导出大纲为Markdown失败');
    }
  };

  // 新增：导出为TXT格式
  const handleExportOutlineAsTxt = () => {
    try {
      exportService.exportAsTxt(outlineData.acts, `小说大纲_${novelId}_${new Date().toISOString().slice(0, 10)}.txt`);
      message.success('大纲导出为TXT成功');
    } catch (error) {
      console.error('导出大纲为TXT失败:', error);
      message.error('导出大纲为TXT失败');
    }
  };

  // 新增：导出为DOCX格式
  const handleExportOutlineAsDocx = () => {
    try {
      exportService.exportAsDocx(outlineData.acts, `小说大纲_${novelId}_${new Date().toISOString().slice(0, 10)}.docx`);
      message.success('大纲导出为DOCX成功');
    } catch (error) {
      console.error('导出大纲为DOCX失败:', error);
      message.error('导出大纲为DOCX失败');
    }
  };

  // 新增：导入大纲功能
  const handleImportOutline = () => {
    // 创建文件输入元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.md,.txt';
    input.onchange = (event: any) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // 显示加载提示
      message.loading({ content: '正在导入大纲...', key: 'import', duration: 0 });

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          
          // 根据文件扩展名确定处理方式
          if (file.name.endsWith('.json')) {
            // JSON格式导入
            const importedData = JSON.parse(content);
            
            // 验证导入的数据结构
            if (!importedData.acts || !Array.isArray(importedData.acts)) {
              message.error({ content: '导入大纲失败：无效的JSON数据格式', key: 'import' });
              return;
            }
            
            // 确认是否要导入
            if (!window.confirm('导入将覆盖当前的大纲数据，是否继续？')) {
              message.destroy('import');
              return;
            }
            
            // 获取现有的所有大纲数据
            const existingOutlines = await hybridStorageService.getOutlines(novelId);
            
            // 删除现有的所有大纲数据
            for (const outline of existingOutlines) {
              await hybridStorageService.deleteOutline(outline.id);
            }
            
            // 导入新的大纲数据
            for (const act of importedData.acts) {
              // 添加卷
              const actData: NovelOutline = {
                id: generateUUID(), // 生成新的ID
                novelId: novelId,
                type: 'main',
                title: act.title,
                content: act.content || '',
                order: act.order || 0,
                parentId: undefined,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
              };
              
              await hybridStorageService.saveOutline(actData);
              
              // 添加章节
              if (act.chapters && Array.isArray(act.chapters)) {
                for (const chapter of act.chapters) {
                  // 保持摘要为undefined，不自动生成摘要
                  const summary = undefined;
                  
                  const chapterData: NovelOutline = {
                    id: generateUUID(), // 生成新的ID
                    novelId: novelId,
                    parentId: actData.id,
                    type: 'chapter',
                    title: chapter.title,
                    content: chapter.content || '',
                    summary: summary, // 添加摘要字段
                    order: chapter.order || 0,
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                  };
                  
                  await hybridStorageService.saveOutline(chapterData);
                }
              }
            }
          } else if (file.name.endsWith('.md')) {
            // Markdown格式导入
            // 这里可以添加对Markdown格式的解析逻辑
            message.warning({ content: '暂不支持Markdown格式导入，仅支持JSON格式导入', key: 'import' });
            message.destroy('import');
            return;
          } else if (file.name.endsWith('.txt')) {
            // TXT格式导入
            // 这里可以添加对TXT格式的解析逻辑
            message.warning({ content: '暂不支持TXT格式导入，仅支持JSON格式导入', key: 'import' });
            message.destroy('import');
            return;
          }
          
          // 重新加载数据
          await loadOutlineData();
          
          message.success({ content: '大纲导入成功', key: 'import' });
        } catch (error: any) {
          console.error('导入大纲失败:', error);
          message.error({ content: `导入大纲失败：${error.message || '未知错误'}`, key: 'import' });
        }
      };
      
      reader.onerror = () => {
        message.error({ content: '读取文件失败', key: 'import' });
      };
      
      reader.readAsText(file);
    };
    input.click();
  };

  // 处理AI生成的大纲内容同步
  const handleAISync = async (content: string) => {
    try {
      // 使用优化的数据同步服务解析和验证大纲内容
      // 这里我们直接使用内容同步，而不是旧的syncService
      const result = await optimizedDataSyncService.syncAllData();
      
      // 显示验证结果
      if (!result.success) {
        message.warning(`大纲同步存在问题：${result.message}`);
      }
      
      // 转换为层级结构
      const outlineData: any = {
        acts: [],
        totalWords: 0,
        totalChapters: 0
      };
      
      // 注意：这里我们不再解析content内容，因为优化的数据同步服务会处理所有数据同步
      // 我们只是显示一个成功消息
      message.success(`大纲数据已同步`);
    } catch (error) {
      console.error('AI大纲同步失败:', error);
      message.error('AI大纲同步失败，请检查内容格式');
    }
  };

  // 处理AI同步数据
  useEffect(() => {
    if (aiSyncData?.generatedContent) {
      handleAISync(aiSyncData.generatedContent);
    }
  }, [aiSyncData]);

  const getModalTitle = () => {
    const typeLabels = { act: '卷', chapter: '章节' };
    return `${editingItem ? '编辑' : '新建'}${typeLabels[modalType]}`;
  };

  return (
    <div className="outline-board">
      <div className="panel-header">
        <div className="header-left">
          <h2><FileTextOutlined /> 大纲管理</h2>
          <div className="outline-stats">
            <Tag color="purple">总字数: {outlineData.totalWords.toLocaleString()}</Tag>
            <Tag color="cyan">章节: {outlineData.totalChapters}</Tag>
          </div>
        </div>
        <Space>
          <Button 
            type="primary" 
            icon={<ThunderboltOutlined />}
            onClick={generateOutlineWithAI}
          >
            AI生成大纲
          </Button>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'import',
                  label: '导入大纲',
                  onClick: handleImportOutline
                },
                {
                  key: 'export-json',
                  label: '导出为JSON',
                  onClick: handleExportOutline
                },
                {
                  key: 'export-md',
                  label: '导出为Markdown',
                  onClick: handleExportOutlineAsMarkdown
                },
                {
                  key: 'export-txt',
                  label: '导出为TXT',
                  onClick: handleExportOutlineAsTxt
                },
                {
                  key: 'export-docx',
                  label: '导出为DOCX',
                  onClick: handleExportOutlineAsDocx
                }
              ]
            }}
          >
            <Button>
              <Space>
                导入/导出
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddAct}
            disabled={!novelId}
          >
            新建卷
          </Button>
        </Space>
      </div>

      <div className="outline-content">
        {outlineData.acts.map(act => (
          <ActBlock
            key={act.id}
            act={act}
            onEditAct={(act) => handleEdit('act', act)}
            onDeleteAct={(id) => handleDelete('act', id)}
            onAddChapter={handleAddChapter}
            onEditChapter={(chapter) => handleEdit('chapter', chapter)}
            onDeleteChapter={(id) => handleDelete('chapter', id)}
          />
        ))}

        {outlineData.acts.length === 0 && (
          <div className="empty-state">
            <FileTextOutlined style={{ fontSize: '48px', color: '#ccc' }} />
            <p>还没有大纲，开始创建你的故事结构吧！</p>
            <Space>
              <Button type="primary" onClick={handleAddAct} disabled={!novelId}>
                手动创建
              </Button>
              <Button 
                type="primary" 
                icon={<ThunderboltOutlined />}
                onClick={generateOutlineWithAI}
              >
                AI生成
              </Button>
            </Space>
          </div>
        )}
      </div>

      <Modal
        title={getModalTitle()}
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
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder={`输入${modalType === 'act' ? '卷' : '章节'}标题`} />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容描述"
            rules={[{ required: true, message: '请输入内容描述' }]}
          >
            <TextArea 
              rows={6}
              placeholder={`描述${modalType === 'act' ? '卷' : '章节'}的内容。章节内容建议包含以下关键点：
- 内容：详细描述章节的主要情节
- 科幻点：包含的科幻元素或技术设定
- 冲突：主要的矛盾冲突或挑战
- 伏笔：为后续情节埋下的线索
- 高潮：章节中的关键转折点或高潮
- 影响：对后续情节或角色发展的影响`}
              // 在编辑模式下，将HTML标签转换为纯文本显示
              {...(editingItem ? { 
                defaultValue: editingItem.content ? editingItem.content.replace(/<[^>]*>/g, '') : '' 
              } : {})}
            />
          </Form.Item>

          {/* 只有在编辑章节时才显示摘要编辑字段 */}
          {modalType === 'chapter' && (
            <Form.Item
              name="summary"
              label="章节摘要"
              rules={[{ max: 200, message: '摘要长度不能超过200字' }]}
            >
              <TextArea 
                rows={3}
                placeholder="输入章节摘要（可选，最多200字）"
                // 在编辑模式下，设置默认值为当前摘要
                {...(editingItem && editingItem.summary ? { defaultValue: editingItem.summary } : {})}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingItem ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button 
                icon={<ThunderboltOutlined />}
                onClick={() => {
                  const title = form.getFieldValue('title') || '';
                  navigate('/ai-workspace', {
                    state: {
                      mode: modalType,
                      title: title,
                      prompt: `为《${title}》生成${modalType === 'act' ? '卷' : '章节'}内容。章节内容需要包含以下关键点：内容、科幻点、冲突、伏笔、高潮、影响等要素。`
                    }
                  });
                }}
              >
                AI辅助生成
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OutlineBoard; 