import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Space, Tag, Button, message } from 'antd';
import { 
  BarChartOutlined, 
  RobotOutlined, 
  ThunderboltOutlined, 
  HistoryOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useMembershipStore } from '@/stores/membershipStore';
import { aiUsageHistoryService, AIUsageRecord, ModelUsageStat } from '@/services';

interface UsageRecord {
  key: string;
  date: string;
  type: string;
  count: number;
  model: string;
}

interface ModelUsage {
  key: string;
  model: string;
  usage: number;
  percent: number;
}

const AIStatsPage: React.FC = () => {
  const { membershipInfo } = useMembershipStore();
  const [historyData, setHistoryData] = useState<UsageRecord[]>([]);
  const [modelUsageData, setModelUsageData] = useState<ModelUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  // 添加统计数据状态
  const [stats, setStats] = useState({
    weeklyUsage: 0,
    monthlyUsage: 0,
    weeklyPercent: 0,
    monthlyPercent: 0
  });

  // 获取AI使用统计信息
  const getAIUsageInfo = () => {
    const limit = membershipInfo.aiGenerationLimit === Infinity ? 999999 : membershipInfo.aiGenerationLimit;
    const used = membershipInfo.aiGenerationUsed || 0;
    const usagePercent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    
    return {
      used: used,
      limit: membershipInfo.aiGenerationLimit === Infinity ? '无限制' : membershipInfo.aiGenerationLimit,
      percent: usagePercent
    };
  };

  const aiUsageInfo = getAIUsageInfo();

  // 获取AI使用历史数据
  const fetchAIUsageHistory = async () => {
    try {
      setLoading(true);
      
      // 获取当前用户ID
      const userId = membershipInfo.email || 'unknown';
      
      // 计算日期范围
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'all':
        default:
          startDate = new Date(2020, 0, 1); // 很早的日期，获取所有记录
          break;
      }
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // 获取AI使用历史记录
      const records = await aiUsageHistoryService.getAIUsageHistory(
        userId, 
        startDateStr, 
        endDateStr,
        100
      );
      
      // 转换为表格数据格式
      const tableData: UsageRecord[] = records.map(record => ({
        key: record.id,
        date: record.date,
        type: record.type,
        count: record.count,
        model: record.model
      }));
      
      setHistoryData(tableData);
      
      // 获取模型使用统计
      const modelStats = await aiUsageHistoryService.getModelUsageStats(
        userId, 
        startDateStr, 
        endDateStr
      );
      
      // 转换为表格数据格式
      const modelTableData: ModelUsage[] = modelStats.map((stat, index) => {
        // 计算百分比（相对于总使用次数）
        const totalUsage = modelStats.reduce((sum, s) => sum + s.totalCount, 0);
        const percent = totalUsage > 0 ? Math.round((stat.totalCount / totalUsage) * 100) : 0;
        
        return {
          key: `model-${index}`,
          model: stat.model,
          usage: stat.totalCount,
          percent
        };
      });
      
      setModelUsageData(modelTableData);
      
      // 计算统计数据
      // 计算本周使用次数
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      const weeklyRecords = records.filter(record => record.date >= weekAgoStr);
      const weeklyUsage = weeklyRecords.reduce((sum, record) => sum + record.count, 0);
      
      // 计算本月使用次数
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];
      const monthlyRecords = records.filter(record => record.date >= monthAgoStr);
      const monthlyUsage = monthlyRecords.reduce((sum, record) => sum + record.count, 0);
      
      // 计算百分比
      const weeklyPercent = membershipInfo.aiGenerationLimit > 0 ? 
        Math.min(100, (weeklyUsage / membershipInfo.aiGenerationLimit) * 100) : 0;
      const monthlyPercent = membershipInfo.aiGenerationLimit > 0 ? 
        Math.min(100, (monthlyUsage / membershipInfo.aiGenerationLimit) * 100) : 0;
      
      setStats({
        weeklyUsage,
        monthlyUsage,
        weeklyPercent,
        monthlyPercent
      });
    } catch (error) {
      console.error('获取AI使用历史数据失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIUsageHistory();
  }, [timeRange]);

  const historyColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => {
        let color = 'blue';
        if (text === '文本生成') color = 'green';
        if (text === '情节构思') color = 'purple';
        if (text === '角色设定') color = 'orange';
        if (text === '世界观构建') color = 'cyan';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '使用次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: 'AI模型',
      dataIndex: 'model',
      key: 'model',
    },
  ];

  const modelColumns = [
    {
      title: 'AI模型',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '使用次数',
      dataIndex: 'usage',
      key: 'usage',
      sorter: (a: any, b: any) => a.usage - b.usage,
    },
    {
      title: '占比',
      key: 'percent',
      render: (_: any, record: any) => (
        <Progress percent={record.percent} size="small" />
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          <BarChartOutlined style={{ marginRight: '8px' }} />
          AI使用统计详情
        </h1>
        <p style={{ color: '#666' }}>查看您的AI生成使用情况和历史记录</p>
      </div>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="今日AI生成次数"
              value={`${aiUsageInfo.used} / ${aiUsageInfo.limit}`}
              prefix={<RobotOutlined />}
            />
            <Progress 
              percent={aiUsageInfo.percent} 
              status={aiUsageInfo.percent > 90 ? 'exception' : 'normal'}
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="本周使用次数"
              value={stats.weeklyUsage}
              prefix={<ThunderboltOutlined />}
            />
            <Progress 
              percent={stats.weeklyPercent} 
              status="normal"
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="本月使用次数"
              value={stats.monthlyUsage}
              prefix={<HistoryOutlined />}
            />
            <Progress 
              percent={stats.monthlyPercent} 
              status="normal"
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="AI模型使用统计" 
        extra={
          <Space>
            <Button 
              type={timeRange === 'week' ? 'primary' : 'default'} 
              onClick={() => setTimeRange('week')}
            >
              最近一周
            </Button>
            <Button 
              type={timeRange === 'month' ? 'primary' : 'default'} 
              onClick={() => setTimeRange('month')}
            >
              最近一月
            </Button>
            <Button 
              type={timeRange === 'all' ? 'primary' : 'default'} 
              onClick={() => setTimeRange('all')}
            >
              全部
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchAIUsageHistory}>刷新</Button>
            <Button icon={<DownloadOutlined />}>导出</Button>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Table 
          dataSource={modelUsageData} 
          columns={modelColumns} 
          pagination={false}
          scroll={{ y: 240 }}
          loading={loading}
        />
      </Card>

      <Card 
        title="使用历史记录" 
        extra={
          <Space>
            <Button 
              type={timeRange === 'week' ? 'primary' : 'default'} 
              onClick={() => setTimeRange('week')}
            >
              最近一周
            </Button>
            <Button 
              type={timeRange === 'month' ? 'primary' : 'default'} 
              onClick={() => setTimeRange('month')}
            >
              最近一月
            </Button>
            <Button 
              type={timeRange === 'all' ? 'primary' : 'default'} 
              onClick={() => setTimeRange('all')}
            >
              全部
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchAIUsageHistory}>刷新</Button>
            <Button icon={<DownloadOutlined />}>导出</Button>
          </Space>
        }
      >
        <Table 
          dataSource={historyData} 
          columns={historyColumns} 
          pagination={{
            pageSize: 10,
          }}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default AIStatsPage;