import React, { useEffect, useRef, useState } from 'react';
import G6 from '@antv/g6';
import { Space, Select, Button, Modal, Form, InputNumber, Input, message } from 'antd';
import { 
  DownloadOutlined, 
  SettingOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  UndoOutlined 
} from '@ant-design/icons';

interface G6NetworkChartProps {
  data: {
    nodes: any[];
    links: any[];
  };
  onNodeClick?: (node: any) => void;
  width?: number;
  height?: number;
  title?: string;
}

const G6NetworkChart: React.FC<G6NetworkChartProps> = ({ 
  data, 
  onNodeClick,
  width = 800, 
  height = 600,
  title = '关系网络图'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [layoutType, setLayoutType] = useState('force');
  const [nodeSize, setNodeSize] = useState(30);
  const [linkDistance, setLinkDistance] = useState(200);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;

    // 销毁之前的图表实例
    if (graphRef.current) {
      graphRef.current.destroy();
    }

    // 注册自定义节点
    G6.registerNode('customNode', {
      draw: (cfg, group) => {
        const r = nodeSize;
        const style = cfg.style || {};
        const keyShape = group.addShape('circle', {
          attrs: {
            x: 0,
            y: 0,
            r,
            ...style,
          },
          name: 'circle-shape',
        });
        
        if (cfg.label) {
          group.addShape('text', {
            attrs: {
              text: cfg.label,
              x: 0,
              y: 0,
              textAlign: 'center',
              textBaseline: 'middle',
              fill: '#333',
              fontSize: 12,
            },
            name: 'text-shape',
          });
        }
        
        return keyShape;
      },
    });

    // 创建图实例
    const graph = new G6.Graph({
      container: containerRef.current,
      width,
      height,
      layout: getLayoutConfig(),
      defaultNode: {
        type: 'customNode',
        size: nodeSize,
        color: '#5B8FF9',
        style: {
          lineWidth: 2,
          fill: '#C6E5FF',
        },
      },
      defaultEdge: {
        style: {
          stroke: '#e2e2e2',
          lineAppendWidth: 3,
        },
        labelCfg: {
          autoRotate: true,
        },
      },
      nodeStateStyles: {
        hover: {
          fill: 'lightsteelblue',
        },
        click: {
          stroke: '#000',
          lineWidth: 3,
        },
      },
      edgeStateStyles: {
        hover: {
          stroke: 'steelblue',
        },
      },
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
      },
    });

    graphRef.current = graph;

    // 绑定事件
    graph.on('node:click', (evt) => {
      const { item } = evt;
      const nodeData = item.getModel();
      if (onNodeClick) {
        onNodeClick(nodeData);
      }
      graph.setItemState(item, 'click', true);
    });

    graph.on('node:mouseenter', (evt) => {
      const { item } = evt;
      graph.setItemState(item, 'hover', true);
    });

    graph.on('node:mouseleave', (evt) => {
      const { item } = evt;
      graph.setItemState(item, 'hover', false);
    });

    // 监听缩放事件
    graph.on('wheelzoom', (evt) => {
      setZoomLevel(graph.getZoom());
    });

    // 渲染数据
    if (data.nodes.length > 0) {
      const graphData = {
        nodes: data.nodes.map(node => ({
          id: node.id,
          label: node.name,
          type: node.type,
          ...node,
        })),
        edges: data.links.map(link => {
          // 将关系类型转换为中文显示
          let label = link.type;
          switch (link.type) {
            // 角色关系类型
            case 'family':
              label = '家庭';
              break;
            case 'friend':
              label = '朋友';
              break;
            case 'enemy':
              label = '敌对';
              break;
            case 'colleague':
              label = '同事';
              break;
            // 通用关系类型
            case 'relation':
              label = '关联';
              break;
            case 'sequential':
              label = '顺序';
              break;
            case 'reference':
              label = '引用';
              break;
            case 'unknown':
              label = '未知';
              break;
            // 主题象征关系类型
            case 'related':
              label = '相关';
              break;
            case 'opposes':
              label = '对立';
              break;
            case 'embodies':
              label = '体现';
              break;
            case 'contrasts':
              label = '对比';
              break;
            // 地点连接类型
            case 'road':
              label = '陆路';
              break;
            case 'sea':
              label = '海路';
              break;
            case 'air':
              label = '空路';
              break;
            default:
              label = link.type || '关系';
          }
          
          return {
            source: link.source,
            target: link.target,
            label: label,
            ...link,
          };
        }),
      };
      
      graph.data(graphData);
      graph.render();
    }

    // 监听窗口大小变化
    const handleResize = () => {
      if (!graph || graph.get('destroyed')) return;
      if (!containerRef.current || !containerRef.current.parentNode) return;
      graph.changeSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
  }, [data, width, height, onNodeClick, layoutType, nodeSize, linkDistance]);

  // 获取布局配置
  const getLayoutConfig = () => {
    switch (layoutType) {
      case 'force':
        return {
          type: 'force',
          preventOverlap: true,
          linkDistance: linkDistance,
          nodeStrength: 30,
          edgeStrength: 0.1,
        };
      case 'circular':
        return {
          type: 'circular',
          center: [width / 2, height / 2],
          radius: Math.min(width, height) / 3,
        };
      case 'grid':
        return {
          type: 'grid',
          rows: Math.ceil(Math.sqrt(data.nodes.length)),
          cols: Math.ceil(Math.sqrt(data.nodes.length)),
        };
      default:
        return {
          type: 'force',
          preventOverlap: true,
          linkDistance: linkDistance,
          nodeStrength: 30,
          edgeStrength: 0.1,
        };
    }
  };

  // 处理配置保存
  const handleConfigSave = (values: any) => {
    setLayoutType(values.layoutType);
    setNodeSize(values.nodeSize);
    setLinkDistance(values.linkDistance);
    setConfigModalVisible(false);
  };

  // 导出图表为PNG
  const exportAsPNG = () => {
    if (graphRef.current) {
      const canvas = graphRef.current.get('canvas');
      const imageData = canvas.cfg.el.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `${title}.png`;
      link.href = imageData;
      link.click();
      
      message.success('图表已导出为PNG格式');
    }
  };

  // 导出图表为SVG
  const exportAsSVG = () => {
    if (graphRef.current) {
      const svg = graphRef.current.saveAsSVG();
      
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `${title}.svg`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
      message.success('图表已导出为SVG格式');
    }
  };

  // 导出图表为JSON数据
  const exportAsJSON = () => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${title}.json`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    message.success('数据已导出为JSON格式');
  };

  // 放大图表
  const zoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.getZoom();
      graphRef.current.zoomTo(currentZoom * 1.2);
      setZoomLevel(currentZoom * 1.2);
    }
  };

  // 缩小图表
  const zoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.getZoom();
      graphRef.current.zoomTo(currentZoom * 0.8);
      setZoomLevel(currentZoom * 0.8);
    }
  };

  // 重置缩放
  const resetZoom = () => {
    if (graphRef.current) {
      graphRef.current.zoomTo(1);
      setZoomLevel(1);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%' }} 
        className="border rounded-lg bg-gray-50 overflow-hidden"
      />
      
      {/* 图表工具栏 */}
      <div className="absolute top-2 right-2 bg-white rounded-lg shadow-md p-2 z-10">
        <Space>
          <Button 
            icon={<SettingOutlined />} 
            onClick={() => setConfigModalVisible(true)}
            size="small"
          />
          <Button 
            icon={<ZoomInOutlined />} 
            onClick={zoomIn}
            size="small"
          />
          <Button 
            icon={<ZoomOutOutlined />} 
            onClick={zoomOut}
            size="small"
          />
          <Button 
            icon={<UndoOutlined />} 
            onClick={resetZoom}
            size="small"
          />
          <Button 
            icon={<DownloadOutlined />} 
            onClick={exportAsPNG}
            size="small"
          >
            PNG
          </Button>
          <Button 
            onClick={exportAsSVG}
            size="small"
          >
            SVG
          </Button>
          <Button 
            onClick={exportAsJSON}
            size="small"
          >
            JSON
          </Button>
        </Space>
      </div>
      
      {/* 配置模态框 */}
      <Modal
        title="图表配置"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          initialValues={{
            layoutType: layoutType,
            nodeSize: nodeSize,
            linkDistance: linkDistance,
          }}
          onFinish={handleConfigSave}
        >
          <Form.Item name="layoutType" label="布局类型">
            <Select>
              <Select.Option value="force">力导向布局</Select.Option>
              <Select.Option value="circular">环形布局</Select.Option>
              <Select.Option value="grid">网格布局</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="nodeSize" label="节点大小">
            <InputNumber min={10} max={100} />
          </Form.Item>
          
          <Form.Item name="linkDistance" label="连接线距离">
            <InputNumber min={50} max={500} />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                应用
              </Button>
              <Button onClick={() => setConfigModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default G6NetworkChart;