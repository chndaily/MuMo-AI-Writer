import React, { useEffect, useRef, useState } from 'react';
import { Card, message, Spin, Select, Space, Button, Modal, Form, InputNumber } from 'antd';
import { 
  DownloadOutlined, 
  BarChartOutlined, 
  TableOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useVisualizationData } from './hooks/useVisualizationData';
import G6NetworkChart from './components/G6NetworkChart';

const { Option } = Select;

const CharacterNetwork: React.FC = () => {
  const { novelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const chartRef = useRef<HTMLDivElement>(null);
  const [viewType, setViewType] = useState<'network' | 'list'>('network');
  const { chartData, loading, error, refreshAllData, generateChartData } = useVisualizationData(novelId);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState('png');

  // 初始化图表数据
  useEffect(() => {
    if (novelId) {
      generateChartData('characters');
    }
  }, [generateChartData, novelId]);

  // 监听URL参数变化
  useEffect(() => {
    // 当location变化时，确保组件能够正确响应
    if (novelId) {
      generateChartData('characters');
    }
  }, [location, novelId, generateChartData]);

  // 处理节点点击事件
  const handleNodeClick = (node: any) => {
    message.info(`点击了: ${node.label}`);
  };

  // 处理导出
  const handleExport = (format: string) => {
    setExportFormat(format);
    setExportModalVisible(true);
  };

  // 执行导出
  const executeExport = (values: any) => {
    message.success(`已导出为${exportFormat.toUpperCase()}格式`);
    setExportModalVisible(false);
  };

  // 渲染列表视图
  const renderListView = () => {
    if (chartData.links.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          暂无角色关系数据
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {chartData.links.map((link, index) => {
          const sourceNode = chartData.nodes.find(n => n.id === link.source);
          const targetNode = chartData.nodes.find(n => n.id === link.target);
          
          if (!sourceNode || !targetNode) return null;
          
          const typeLabels: Record<string, string> = {
            'family': '家庭关系',
            'friend': '朋友关系',
            'enemy': '敌对关系',
            'colleague': '同事关系',
            'unknown': '未知关系'
          };
          
          return (
            <div key={index} className="p-3 bg-white rounded-lg border shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{sourceNode.name}</span>
                  <span className="mx-2 text-gray-400">-</span>
                  <span className="font-medium">{targetNode.name}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  link.type === 'enemy' ? 'bg-red-100 text-red-800' :
                  link.type === 'family' ? 'bg-purple-100 text-purple-800' :
                  link.type === 'friend' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {typeLabels[link.type] || link.type}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                关系强度: {link.value}/10
              </div>
              <div className="mt-1 flex items-center">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${link.value * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card 
      title="角色关系网络" 
      extra={
        <Space>
          <Select 
            value={viewType} 
            onChange={setViewType}
            size="small"
          >
            <Option value="network">
              <Space>
                <BarChartOutlined />
                网络图
              </Space>
            </Option>
            <Option value="list">
              <Space>
                <TableOutlined />
                列表
              </Space>
            </Option>
          </Select>
          <Button 
            icon={<SettingOutlined />} 
            size="small"
            onClick={() => message.info('图表配置功能')}
          />
          <Button 
            icon={<DownloadOutlined />} 
            size="small"
            onClick={() => handleExport('png')}
          >
            导出
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            size="small"
            onClick={refreshAllData}
          >
            刷新
          </Button>
        </Space>
      }
    >
      <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-lg shadow-sm text-sm text-gray-600 z-10">
        角色数量: {chartData.nodes.length} | 关系数量: {chartData.links.length}
      </div>
      <div ref={chartRef} className="w-full h-80 border rounded-lg bg-gray-50 relative overflow-hidden">
        {loading ? (
          <div className="w-full h-80 flex items-center justify-center">
            <Spin tip="加载中..." />
          </div>
        ) : viewType === 'network' && chartData.nodes.length > 0 && (
          <div className="w-full h-80 overflow-y-auto">
            <G6NetworkChart 
              data={chartData} 
              onNodeClick={handleNodeClick}
              width={800}
              height={300}
              title="角色关系网络"
            />
          </div>
        )}
        {novelId && !loading && !error && viewType === 'list' && (
          <div className="w-full h-80 overflow-y-auto p-4">
            {renderListView()}
          </div>
        )}
        {novelId && !loading && !error && viewType === 'network' && chartData.nodes.length === 0 && (
          <div className="w-full h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">暂无角色数据</div>
              <div className="text-sm text-gray-500">请先在角色管理中添加角色</div>
            </div>
          </div>
        )}
        {error && (
          <div className="w-full h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-2">数据加载失败</div>
              <div className="text-sm text-gray-500">{error}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* 导出模态框 */}
      <Modal
        title="导出图表"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={executeExport}
        >
          <Form.Item label="导出格式">
            <Select value={exportFormat} onChange={setExportFormat}>
              <Select.Option value="png">PNG 图片</Select.Option>
              <Select.Option value="svg">SVG 图片</Select.Option>
              <Select.Option value="pdf">PDF 文档</Select.Option>
              <Select.Option value="json">JSON 数据</Select.Option>
            </Select>
          </Form.Item>
          
          {exportFormat === 'png' || exportFormat === 'svg' || exportFormat === 'pdf' ? (
            <>
              <Form.Item label="图片宽度">
                <InputNumber defaultValue={800} min={200} max={2000} />
              </Form.Item>
              <Form.Item label="图片高度">
                <InputNumber defaultValue={600} min={200} max={2000} />
              </Form.Item>
            </>
          ) : null}
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                导出
              </Button>
              <Button onClick={() => setExportModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CharacterNetwork;