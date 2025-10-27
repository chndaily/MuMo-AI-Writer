import React, { useState } from 'react';
import { Card, Button, Space, Typography, Input, Tree, message, Divider } from 'antd';
import { FileTextOutlined, PlayCircleOutlined, BranchesOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text, Title } = Typography;

// 模拟解析逻辑（与syncService中的逻辑相同）
const parseOutlineContent = (content: string) => {
  const outlines: any[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  let currentAct: any = null;
  let currentChapter: any = null;
  let actOrder = 1;
  let chapterOrder = 1;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 跳过标题行
    if (trimmedLine.startsWith('# ') && trimmedLine.includes('大纲')) {
      continue;
    }
    
    // 解析 Act (卷)
    if (trimmedLine.match(/^##\s*(Act\s*\d+|第.*?卷)[：:]/)) {
      const titleMatch = trimmedLine.match(/^##\s*(?:Act\s*\d+|第.*?卷)[：:]?\s*(.+)$/);
      const title = titleMatch ? titleMatch[1].trim() : trimmedLine.replace(/^##\s*/, '');
      
      currentAct = {
        title: title,
        content: '',
        type: 'main',
        order: actOrder++,
        parentId: undefined,
        id: `act-${actOrder}`
      };
      
      outlines.push(currentAct);
      chapterOrder = 1;
      continue;
    }
    
    // 解析 Chapter (章节)
    if (trimmedLine.match(/^###\s*(Chapter\s*\d+|第.*?章)[：:]/)) {
      const titleMatch = trimmedLine.match(/^###\s*(?:Chapter\s*\d+|第.*?章)[：:]?\s*(.+)$/);
      const title = titleMatch ? titleMatch[1].trim() : trimmedLine.replace(/^###\s*/, '');
      
      currentChapter = {
        title: title,
        content: '',
        type: 'chapter',
        order: chapterOrder++,
        parentId: currentAct?.id || '',
        id: `chapter-${actOrder}-${chapterOrder}`
      };
      
      outlines.push(currentChapter);
      continue;
    }
  }
  
  return outlines;
};

// 将解析结果转换为Tree数据结构
const convertToTreeData = (outlines: any[]) => {
  const treeData: any[] = [];
  const actMap = new Map();
  
  // 构建Acts
  outlines.filter(o => o.type === 'main').forEach(act => {
    const actNode = {
      title: `${act.title} (卷)`,
      key: act.id,
      icon: <BranchesOutlined />,
      children: []
    };
    treeData.push(actNode);
    actMap.set(act.id, actNode);
  });
  
  // 构建Chapters
  outlines.filter(o => o.type === 'chapter').forEach(chapter => {
    const chapterNode = {
      title: `${chapter.title} (章节)`,
      key: chapter.id,
      icon: <FileTextOutlined />,
      children: []
    };
    
    const parentAct = actMap.get(chapter.parentId);
    if (parentAct) {
      parentAct.children.push(chapterNode);
    }
  });
  
  return treeData;
};

const OutlineParseDemo: React.FC = () => {
  const [inputContent, setInputContent] = useState(`# 小说大纲

## Act 1：命运的启程

### Chapter 1：陌生的世界
* 内容：详细描述章节的主要情节
* 科幻点：包含的科幻元素或技术设定
* 冲突：主要的矛盾冲突或挑战
* 伏笔：为后续情节埋下的线索
* 高潮：章节中的关键转折点或高潮
* 影响：对后续情节或角色发展的影响

### Chapter 2：初识新伙伴
* 内容：详细描述章节的主要情节
* 科幻点：包含的科幻元素或技术设定
* 冲突：主要的矛盾冲突或挑战
* 伏笔：为后续情节埋下的线索
* 高潮：章节中的关键转折点或高潮
* 影响：对后续情节或角色发展的影响

## Act 2：力量的觉醒

### Chapter 3：修炼之路
* 内容：详细描述章节的主要情节
* 科幻点：包含的科幻元素或技术设定
* 冲突：主要的矛盾冲突或挑战
* 伏笔：为后续情节埋下的线索
* 高潮：章节中的关键转折点或高潮
* 影响：对后续情节或角色发展的影响`);
  
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);

  const handleParse = () => {
    try {
      const result = parseOutlineContent(inputContent);
      setParsedData(result);
      
      const tree = convertToTreeData(result);
      setTreeData(tree);
      
      message.success(`成功解析了 ${result.length} 个大纲项目`);
    } catch (error) {
      console.error('解析失败:', error);
      message.error('解析失败，请检查内容格式');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>
        <FileTextOutlined /> 大纲解析演示
      </Title>
      
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title="输入AI生成的大纲内容">
          <TextArea
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            rows={15}
            placeholder="在这里粘贴AI生成的大纲内容..."
          />
          <div style={{ marginTop: 16 }}>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleParse}>
              解析大纲结构
            </Button>
          </div>
        </Card>

        {parsedData.length > 0 && (
          <Card title={`解析结果 (共 ${parsedData.length} 项)`}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">
                层级结构预览：
              </Text>
              <Tree
                showIcon
                defaultExpandAll
                treeData={treeData}
                style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '6px' }}
              />
              
              <Divider />
              
              <Text type="secondary">详细数据：</Text>
              <div style={{ 
                backgroundColor: '#f0f0f0', 
                padding: '12px', 
                borderRadius: '6px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                <pre style={{ margin: 0, fontSize: '12px' }}>
                  {JSON.stringify(parsedData, null, 2)}
                </pre>
              </div>
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default OutlineParseDemo;