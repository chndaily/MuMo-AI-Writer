import React, { useEffect, useState } from 'react';
import { Card, Spin, message, Button, Space, Tag, Collapse } from 'antd';
import { 
  DownloadOutlined, 
  ReloadOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useNovelIndexDBStore } from '@/stores/novelIndexDBStore';
import G6NetworkChart from './components/G6NetworkChart';

const { Panel } = Collapse;

interface ThemeSymbolNode {
  id: string;
  name: string;
  type: 'theme' | 'symbol' | 'motif' | 'character' | 'location' | 'object';
  description: string;
  frequency: number;
  chapters: string[]; // 关联章节ID
}

interface ThemeSymbolLink {
  source: string;
  target: string;
  type: 'related' | 'opposes' | 'embodies' | 'contrasts';
  strength: number;
  description: string;
}

const ThemeSymbolChart: React.FC = () => {
  const { novelId } = useParams();
  const { chapters, characters, locations, refreshChapters, refreshCharacters, refreshLocations } = useNovelIndexDBStore();
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<{ nodes: ThemeSymbolNode[]; links: ThemeSymbolLink[] }>({ nodes: [], links: [] });
  const [activeKeys, setActiveKeys] = useState<string[]>(['1']);

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
      // 刷新数据
      await Promise.all([
        refreshChapters(novelId),
        refreshCharacters(novelId),
        refreshLocations(novelId)
      ]);
      
      // 获取当前小说的数据
      const novelChapters = chapters.filter(chapter => chapter.novelId === novelId);
      const novelCharacters = characters.filter(character => character.novelId === novelId);
      const novelLocations = locations.filter(location => location.novelId === novelId);
      
      // 构造节点数据
      const nodes: ThemeSymbolNode[] = [];
      
      // 添加主题节点（示例数据）
      nodes.push(
        { id: 'theme_1', name: '成长', type: 'theme', description: '主角的成长历程', frequency: 15, chapters: novelChapters.slice(0, 3).map(c => c.id) },
        { id: 'theme_2', name: '复仇', type: 'theme', description: '复仇的动机与后果', frequency: 12, chapters: novelChapters.slice(1, 4).map(c => c.id) },
        { id: 'theme_3', name: '爱情', type: 'theme', description: '爱情的力量与考验', frequency: 10, chapters: novelChapters.slice(2, 5).map(c => c.id) },
        { id: 'symbol_1', name: '红玫瑰', type: 'symbol', description: '象征爱情与激情', frequency: 8, chapters: novelChapters.slice(0, 2).map(c => c.id) },
        { id: 'symbol_2', name: '黑剑', type: 'symbol', description: '象征复仇与黑暗', frequency: 7, chapters: novelChapters.slice(1, 3).map(c => c.id) },
        { id: 'motif_1', name: '镜子', type: 'motif', description: '反映内心与真相', frequency: 6, chapters: novelChapters.slice(2, 4).map(c => c.id) }
      );
      
      // 添加角色节点
      novelCharacters.slice(0, 3).forEach((character, index) => {
        nodes.push({
          id: `character_${character.id}`,
          name: character.name,
          type: 'character',
          description: character.description,
          frequency: 5 + index,
          chapters: novelChapters.slice(index, index + 2).map(c => c.id)
        });
      });
      
      // 添加地点节点
      novelLocations.slice(0, 2).forEach((location, index) => {
        nodes.push({
          id: `location_${location.id}`,
          name: location.name,
          type: 'location',
          description: location.description,
          frequency: 4 + index,
          chapters: novelChapters.slice(index, index + 1).map(c => c.id)
        });
      });
      
      // 构造连接数据
      const links: ThemeSymbolLink[] = [
        { source: 'theme_1', target: 'theme_2', type: 'related', strength: 8, description: '成长与复仇相互关联' },
        { source: 'theme_1', target: 'theme_3', type: 'related', strength: 7, description: '成长中包含爱情元素' },
        { source: 'theme_2', target: 'symbol_2', type: 'embodies', strength: 9, description: '黑剑体现复仇主题' },
        { source: 'theme_3', target: 'symbol_1', type: 'embodies', strength: 8, description: '红玫瑰体现爱情主题' },
        { source: 'symbol_1', target: 'symbol_2', type: 'contrasts', strength: 6, description: '红玫瑰与黑剑形成对比' },
        { source: 'motif_1', target: 'theme_1', type: 'related', strength: 7, description: '镜子反映成长过程' },
        { source: 'character_1', target: 'theme_1', type: 'embodies', strength: 9, description: '主角体现成长主题' },
        { source: 'character_2', target: 'theme_2', type: 'embodies', strength: 8, description: '反派体现复仇主题' }
      ];
      
      setChartData({ nodes, links });
    } catch (error) {
      message.error('加载数据失败');
      console.error('加载主题象征数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理节点点击
  const handleNodeClick = (node: ThemeSymbolNode) => {
    message.info(`点击了${getNodeTypeName(node.type)}: ${node.name}`);
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

  // 获取节点类型名称
  const getNodeTypeName = (type: string) => {
    switch (type) {
      case 'theme': return '主题';
      case 'symbol': return '象征';
      case 'motif': return '意象';
      case 'character': return '角色';
      case 'location': return '地点';
      case 'object': return '物品';
      default: return '元素';
    }
  };

  // 获取节点类型颜色
  const getNodeTagColor = (type: string) => {
    switch (type) {
      case 'theme': return 'blue';
      case 'symbol': return 'green';
      case 'motif': return 'purple';
      case 'character': return 'orange';
      case 'location': return 'cyan';
      case 'object': return 'pink';
      default: return 'default';
    }
  };

  // 获取连接类型名称
  const getLinkTypeName = (type: string) => {
    switch (type) {
      case 'related': return '相关';
      case 'opposes': return '对立';
      case 'embodies': return '体现';
      case 'contrasts': return '对比';
      default: return '关联';
    }
  };

  return (
    <Card 
      title="主题和象征关系图" 
      extra={
        <Space>
          <Button 
            icon={<PlusOutlined />} 
            onClick={() => message.info('添加新主题/象征')}
            size="small"
          >
            添加
          </Button>
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
        元素数量: {chartData.nodes.length} | 关系数量: {chartData.links.length}
      </div>
      
      {loading ? (
        <div className="w-full h-80 flex items-center justify-center">
          <Spin tip="加载中..." />
        </div>
      ) : chartData.nodes.length > 0 ? (
        <div className="flex h-80 w-full">
          <div className="w-3/4 h-full overflow-y-auto">
            <G6NetworkChart 
              data={{
                nodes: chartData.nodes.map(node => ({
                  ...node,
                  name: node.name
                })),
                links: chartData.links.map(link => ({
                  ...link,
                  value: link.strength
                }))
              }}
              onNodeClick={handleNodeClick}
              width={600}
              height={300}
              title="主题和象征关系图"
            />
          </div>
          <div className="w-1/4 pl-4 overflow-y-auto">
            <Collapse 
              activeKey={activeKeys} 
              onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys : [keys])}
            >
              <Panel header="元素详情" key="1">
                <div className="space-y-3">
                  {chartData.nodes.map(node => (
                    <div key={node.id} className="p-2 bg-gray-50 rounded">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{node.name}</span>
                        <Tag color={getNodeTagColor(node.type)} className="text-xs">
                          {getNodeTypeName(node.type)}
                        </Tag>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {node.description}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          出现 {node.frequency} 次
                        </span>
                        <span className="text-xs text-gray-500">
                          {node.chapters.length} 个章节
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel header="关系详情" key="2">
                <div className="space-y-3">
                  {chartData.links.map((link, index) => {
                    const sourceNode = chartData.nodes.find(n => n.id === link.source);
                    const targetNode = chartData.nodes.find(n => n.id === link.target);
                    
                    return (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {sourceNode?.name} → {targetNode?.name}
                          </span>
                          <Tag color="blue" className="text-xs">
                            {getLinkTypeName(link.type)}
                          </Tag>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {link.description}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                          <div 
                            className="bg-blue-600 h-1 rounded-full" 
                            style={{ width: `${link.strength * 10}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </Collapse>
          </div>
        </div>
      ) : (
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-2">暂无主题象征数据</div>
            <div className="text-sm text-gray-500">请先添加主题或象征元素</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ThemeSymbolChart;