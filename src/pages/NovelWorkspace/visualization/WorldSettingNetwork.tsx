import React, { useEffect, useRef, useState } from 'react';
import { Card, message, Spin, Tabs } from 'antd';
import { useParams } from 'react-router-dom';
import { useVisualizationData } from './hooks/useVisualizationData';

const { TabPane } = Tabs;

interface WorldSettingNetworkProps {
  settingType?: string;
}

const WorldSettingNetwork: React.FC<WorldSettingNetworkProps> = ({ settingType }) => {
  const { novelId } = useParams();
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('all');
  const { chartData, loading, error, refreshAllData, generateChartData } = useVisualizationData(novelId);

  // 初始化图表数据
  useEffect(() => {
    // 如果有传入的settingType，则使用传入的类型，否则使用activeTab
    if (settingType && settingType !== 'world-settings') {
      generateChartData('world-settings', settingType);
    } else {
      generateChartData('world-settings', activeTab);
    }
  }, [generateChartData, activeTab, settingType]);

  // 当settingType属性变化时更新activeTab
  useEffect(() => {
    if (settingType && settingType !== activeTab) {
      setActiveTab(settingType);
    }
  }, [settingType]);

  // 初始化图表
  const initChart = () => {
    if (!chartRef.current) return;
    
    // 清空容器
    chartRef.current.innerHTML = '';
    
    // 创建世界设定网络图展示
    const container = document.createElement('div');
    container.className = 'w-full h-full relative';
    
    if (error) {
      container.innerHTML = `
        <div class="w-full h-full flex items-center justify-center">
          <div class="text-center">
            <div class="text-red-500 mb-2">数据加载失败</div>
            <div class="text-sm text-gray-500">${error}</div>
          </div>
        </div>
      `;
    } else if (chartData.nodes.length === 0) {
      container.innerHTML = `
        <div class="text-center">
          <div class="text-gray-400 mb-2">暂无世界设定数据</div>
          <div class="text-sm text-gray-500">请先在世界观设定中添加相关内容</div>
        </div>
      `;
    } else {
      // 创建包含连接线和节点的容器
      const svgContainer = document.createElement('div');
      svgContainer.className = 'absolute inset-0';
      
      // 创建SVG用于绘制连接线
      if (chartData.links.length > 0) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'w-full h-full');
        svg.setAttribute('viewBox', '0 0 800 300');
        
        // 添加连接线
        chartData.links.forEach(link => {
          const sourceNode = chartData.nodes.find(n => n.id === link.source);
          const targetNode = chartData.nodes.find(n => n.id === link.target);
          
          if (sourceNode && targetNode) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', sourceNode.x?.toString() || '0');
            line.setAttribute('y1', sourceNode.y?.toString() || '0');
            line.setAttribute('x2', targetNode.x?.toString() || '0');
            line.setAttribute('y2', targetNode.y?.toString() || '0');
            line.setAttribute('stroke', '#94a3b8');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-opacity', '0.6');
            
            // 添加标题显示关系描述
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = link.description || '关系';
            line.appendChild(title);
            
            svg.appendChild(line);
          }
        });
        
        svgContainer.appendChild(svg);
      }
      
      container.appendChild(svgContainer);
      
      // 创建节点容器
      const nodesContainer = document.createElement('div');
      
      // 按类型分组显示节点
      const typeGroups: Record<string, string> = {
        'location': 'bg-green-100 border-green-300',
        'culture': 'bg-purple-100 border-purple-300',
        'technology': 'bg-cyan-100 border-cyan-300',
        'magic': 'bg-orange-100 border-orange-300',
        'history': 'bg-gray-100 border-gray-300'
      };
      
      const typeLabels: Record<string, string> = {
        'location': '地点',
        'culture': '文化',
        'technology': '科技',
        'magic': '魔法',
        'history': '历史'
      };
      
      chartData.nodes.slice(0, 20).forEach((node, index) => {
        const nodeElement = document.createElement('div');
        const typeClass = typeGroups[node.type] || 'bg-blue-100 border-blue-300';
        const x = node.x || 100 + (index % 4) * 150;
        const y = node.y || 100 + Math.floor(index / 4) * 150;
        
        nodeElement.className = `absolute w-32 h-24 rounded-lg flex flex-col items-center justify-center ${typeClass} border-2 cursor-pointer hover:opacity-80 transition-opacity`;
        // 正确计算节点居中定位 (节点宽度32px，高度24px)
        nodeElement.style.left = `${x - 16}px`;
        nodeElement.style.top = `${y - 12}px`;
        
        nodeElement.innerHTML = `
          <div class="font-semibold text-sm w-full text-center px-1">${node.name}</div>
          <div class="text-xs text-gray-600 mt-1">${typeLabels[node.type] || node.type}</div>
        `;
        nodeElement.onclick = () => {
          message.info(`点击了${typeLabels[node.type] || node.type}: ${node.name}`);
        };
        
        // 添加鼠标悬停显示详细信息
        nodeElement.title = node.description || `${typeLabels[node.type] || node.type}: ${node.name}`;
        
        nodesContainer.appendChild(nodeElement);
      });
      
      container.appendChild(nodesContainer);
    }
    
    chartRef.current.appendChild(container);
  };

  // 当数据变化时重新渲染
  useEffect(() => {
    initChart();
  }, [chartData, error]);

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // 如果从外部传入了settingType，直接显示该类型的数据，不显示Tabs
  if (settingType && settingType !== 'world-settings') {
    const title = `${getTypeLabel(settingType)}网络`;
    return (
      <Card 
        title={title} 
        extra={<a onClick={refreshAllData}>刷新</a>}
        className="h-full"
      >
        <div ref={chartRef} className="w-full h-96 border rounded-lg bg-gray-50 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
              <Spin tip="加载中..." />
            </div>
          )}
          {!novelId && !loading && (
            <div className="w-full h-full flex items-center justify-center">
              <Spin tip="加载中..." />
            </div>
          )}
        </div>
      </Card>
    );
  }

  // 否则显示带Tabs的完整版本
  return (
    <Card 
      title="世界设定网络" 
      extra={<a onClick={refreshAllData}>刷新</a>}
      className="h-full"
    >
      <Tabs defaultActiveKey="all" activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="全部" key="all" />
        <TabPane tab="地点" key="location" />
        <TabPane tab="文化" key="culture" />
        <TabPane tab="科技" key="technology" />
        <TabPane tab="魔法" key="magic" />
        <TabPane tab="历史" key="history" />
      </Tabs>
      <div ref={chartRef} className="w-full h-80 border rounded-lg bg-gray-50 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
            <Spin tip="加载中..." />
          </div>
        )}
        {!novelId && !loading && (
          <div className="w-full h-full flex items-center justify-center">
            <Spin tip="加载中..." />
          </div>
        )}
      </div>
    </Card>
  );
};

// 获取类型标签
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'location': '地点',
    'culture': '文化',
    'technology': '科技',
    'magic': '魔法',
    'history': '历史'
  };
  return labels[type] || '世界设定';
};

export default WorldSettingNetwork;