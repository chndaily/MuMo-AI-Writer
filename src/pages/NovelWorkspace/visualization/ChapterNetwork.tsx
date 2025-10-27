import React, { useEffect, useState } from 'react';
import { Card, Spin, message, Button, Space, Select } from 'antd';
import { 
  DownloadOutlined, 
  ReloadOutlined,
  BarChartOutlined,
  TableOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useNovelIndexDBStore } from '@/stores/novelIndexDBStore';
import G6NetworkChart from './components/G6NetworkChart';

interface ChapterRelation {
  source: string;
  target: string;
  type: 'sequential' | 'reference' | 'parallel';
  strength: number;
  description: string;
}

const ChapterNetwork: React.FC = () => {
  const { novelId } = useParams();
  const { chapters, refreshChapters } = useNovelIndexDBStore();
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [viewType, setViewType] = useState<'network' | 'list'>('network');

  // 初始化数据
  useEffect(() => {
    if (novelId) {
      loadData();
    }
  }, [novelId]);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 刷新章节数据
      await refreshChapters(novelId);
      
      // 获取当前小说的章节
      const novelChapters = chapters.filter(chapter => chapter.novelId === novelId);
      
      // 按顺序排序
      novelChapters.sort((a, b) => a.order - b.order);
      
      // 构造节点数据
      const nodes = novelChapters.map(chapter => ({
        id: chapter.id,
        name: chapter.title,
        type: 'chapter',
        order: chapter.order,
        wordCount: chapter.wordCount,
        status: chapter.status,
        description: chapter.summary || chapter.content.substring(0, 100) + '...'
      }));
      
      // 构造连接数据
      const links: ChapterRelation[] = [];
      
      // 添加顺序连接（相邻章节）
      for (let i = 0; i < novelChapters.length - 1; i++) {
        links.push({
          source: novelChapters[i].id,
          target: novelChapters[i + 1].id,
          type: 'sequential',
          strength: 10,
          description: '章节顺序连接'
        });
      }
      
      // 添加引用连接（基于内容分析，这里简化处理）
      for (let i = 0; i < novelChapters.length; i++) {
        for (let j = 0; j < novelChapters.length; j++) {
          if (i !== j) {
            // 简化处理：如果有共同关键词则建立引用连接
            const chapter1 = novelChapters[i];
            const chapter2 = novelChapters[j];
            
            // 检查章节标题是否有重叠
            const title1Words = chapter1.title.split('');
            const title2Words = chapter2.title.split('');
            const commonWords = title1Words.filter(word => title2Words.includes(word));
            
            if (commonWords.length > 0) {
              links.push({
                source: chapter1.id,
                target: chapter2.id,
                type: 'reference',
                strength: commonWords.length,
                description: `引用连接: 共同关键词 ${commonWords.join(', ')}`
              });
            }
          }
        }
      }
      
      setChartData({
        nodes,
        links: links.map(link => ({
          source: link.source,
          target: link.target,
          type: link.type,
          value: link.strength,
          description: link.description
        }))
      });
    } catch (error) {
      message.error('加载数据失败');
      console.error('加载章节网络数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理节点点击
  const handleNodeClick = (node: any) => {
    message.info(`点击了章节: ${node.name}`);
  };

  // 刷新数据
  const handleRefresh = () => {
    loadData();
  };

  // 导出图表
  const handleExport = () => {
    // 这里可以实现具体的导出逻辑
    message.info('导出功能即将实现');
  };

  // 渲染列表视图
  const renderListView = () => {
    if (chartData.nodes.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          暂无章节数据
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {chartData.nodes.map((node, index) => (
          <div key={node.id} className="p-3 bg-white rounded-lg border shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{node.order}. {node.name}</span>
                <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                  {node.status}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {node.wordCount} 字
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600 line-clamp-2">
              {node.description}
            </div>
            <div className="mt-2 flex items-center">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${Math.min(100, node.wordCount / 100)}%` }}
                ></div>
              </div>
              <span className="ml-2 text-xs text-gray-500">
                进度
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card 
      title="章节关联网络" 
      extra={
        <Space>
          <Select 
            value={viewType} 
            onChange={setViewType}
            size="small"
          >
            <Select.Option value="network">
              <Space>
                <BarChartOutlined />
                网络图
              </Space>
            </Select.Option>
            <Select.Option value="list">
              <Space>
                <TableOutlined />
                列表
              </Space>
            </Select.Option>
          </Select>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            size="small"
          >
            刷新
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
            size="small"
          >
            导出
          </Button>
        </Space>
      }
    >
      <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-lg shadow-sm text-sm text-gray-600 z-10">
        章节数量: {chartData.nodes.length} | 关联数量: {chartData.links.length}
      </div>
      
      {loading ? (
        <div className="w-full h-80 flex items-center justify-center">
          <Spin tip="加载中..." />
        </div>
      ) : viewType === 'network' && chartData.nodes.length > 0 ? (
        <div className="w-full h-80 overflow-y-auto">
          <G6NetworkChart 
            data={chartData}
            onNodeClick={handleNodeClick}
            width={800}
            height={300}
            title="章节关联网络"
          />
        </div>
      ) : viewType === 'list' ? (
        <div className="w-full h-80 overflow-y-auto p-4">
          {renderListView()}
        </div>
      ) : (
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-2">暂无章节数据</div>
            <div className="text-sm text-gray-500">请先添加章节</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ChapterNetwork;