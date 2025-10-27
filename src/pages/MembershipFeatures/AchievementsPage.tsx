import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Badge,
  Space,
  Tag,
  Timeline,
  Button,
  Divider,
  message
} from 'antd';
import {
  TrophyOutlined,
  BookOutlined,
  EditOutlined,
  RocketOutlined,
  StarOutlined,
  FireOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useMembershipStore } from '@/stores/membershipStore';
import achievementService, { Achievement, Activity } from '@/services/achievementService';

// 获取图标组件
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'BookOutlined': return <BookOutlined />;
    case 'EditOutlined': return <EditOutlined />;
    case 'RocketOutlined': return <RocketOutlined />;
    case 'StarOutlined': return <StarOutlined />;
    case 'FireOutlined': return <FireOutlined />;
    case 'CrownOutlined': return <CrownOutlined />;
    case 'RobotOutlined': return <RobotOutlined />;
    default: return <TrophyOutlined />;
  }
};

const AchievementsPage: React.FC = () => {
  const { membershipInfo } = useMembershipStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取成就数据
  const fetchAchievements = async () => {
    try {
      setLoading(true);
      
      // 获取真实成就数据
      const realAchievements = await achievementService.checkAchievements();
      const userId = membershipInfo.email || 'unknown';
      const realActivities = await achievementService.getRecentActivities(userId);
      
      setAchievements(realAchievements);
      setRecentActivities(realActivities);
    } catch (error) {
      console.error('获取成就数据失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  // 计算用户等级和进度
  const calculateUserLevel = (totalPoints: number) => {
    // 定义等级阈值
    const levelThresholds = [
      { name: '新手创作者', minPoints: 0, maxPoints: 99 },
      { name: '入门创作者', minPoints: 100, maxPoints: 299 },
      { name: '进阶创作者', minPoints: 300, maxPoints: 599 },
      { name: '专家创作者', minPoints: 600, maxPoints: 999 },
      { name: '大师创作者', minPoints: 1000, maxPoints: 1999 },
      { name: '宗师创作者', minPoints: 2000, maxPoints: Infinity }
    ];
    
    // 找到当前等级
    const currentLevel = levelThresholds.find(level => 
      totalPoints >= level.minPoints && totalPoints <= level.maxPoints
    ) || levelThresholds[0];
    
    // 找到下一等级
    const currentLevelIndex = levelThresholds.findIndex(level => 
      level.name === currentLevel.name
    );
    const nextLevel = currentLevelIndex < levelThresholds.length - 1 
      ? levelThresholds[currentLevelIndex + 1] 
      : null;
    
    // 计算到下一等级的进度
    let progressToNext = 0;
    if (nextLevel) {
      const currentLevelRange = currentLevel.maxPoints - currentLevel.minPoints;
      const pointsInCurrentLevel = totalPoints - currentLevel.minPoints;
      progressToNext = currentLevelRange > 0 
        ? Math.min(100, Math.max(0, (pointsInCurrentLevel / currentLevelRange) * 100))
        : 0;
    }
    
    return {
      currentLevel: currentLevel.name,
      nextLevel: nextLevel ? nextLevel.name : '最高等级',
      progressToNext
    };
  };

  // 统计数据
  const stats = {
    totalPoints: achievements.filter(a => a.achieved).reduce((sum, a) => sum + a.points, 0),
    achievedCount: achievements.filter(a => a.achieved).length,
    totalCount: achievements.length
  };
  
  // 计算用户等级信息
  const userLevelInfo = calculateUserLevel(stats.totalPoints);

  // 获取等级颜色
  const getLevelColor = (level: string) => {
    switch (level) {
      case '入门': return 'default';
      case '进阶': return 'blue';
      case '专家': return 'gold';
      case '大师': return 'orange';
      case '宗师': return 'red';
      default: return 'default';
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          <TrophyOutlined style={{ marginRight: '8px' }} />
          创作成就系统
        </h1>
        <p style={{ color: '#666' }}>追踪您的创作历程和获得的成就</p>
      </div>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总成就点数"
              value={stats.totalPoints}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成成就"
              value={`${stats.achievedCount} / ${stats.totalCount}`}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="当前等级"
              value={userLevelInfo.currentLevel}
              prefix={<CrownOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="下一等级"
              value={userLevelInfo.nextLevel}
              prefix={<RocketOutlined />}
            />
            <Progress 
              percent={userLevelInfo.progressToNext} 
              size="small" 
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={16}>
          <Card title="成就列表">
            <Row gutter={[16, 16]}>
              {achievements.map(achievement => (
                <Col span={12} key={achievement.id}>
                  <Badge.Ribbon 
                    text={achievement.level} 
                    color={getLevelColor(achievement.level)}
                  >
                    <Card
                      size="small"
                      style={{
                        height: '100%',
                        opacity: achievement.achieved ? 1 : 0.6,
                        border: achievement.achieved ? '1px solid #1890ff' : '1px solid #f0f0f0'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          fontSize: '24px',
                          marginRight: '12px',
                          color: achievement.achieved ? '#1890ff' : '#ccc'
                        }}>
                          {getIconComponent(achievement.icon)}
                        </div>
                        <div>
                          <div style={{ 
                            fontWeight: 'bold',
                            color: achievement.achieved ? '#000' : '#999'
                          }}>
                            {achievement.title}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#999' 
                          }}>
                            {achievement.description}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Tag color="blue">{achievement.points} 点</Tag>
                        {achievement.achieved ? (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#52c41a' 
                          }}>
                            <CheckCircleOutlined /> {achievement.date}
                          </div>
                        ) : (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#999' 
                          }}>
                            <ClockCircleOutlined /> 未达成
                          </div>
                        )}
                      </div>
                    </Card>
                  </Badge.Ribbon>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="近期活动">
            <Timeline
              items={recentActivities.map(activity => ({
                key: activity.id,
                dot: getIconComponent(activity.icon),
                children: (
                  <>
                    <div style={{ fontWeight: 'bold' }}>{activity.title}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {activity.description}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      {activity.time}
                    </div>
                  </>
                )
              }))}
            />
          </Card>
          
          <Card title="操作" style={{ marginTop: '24px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<DownloadOutlined />}>导出成就</Button>
              <Button block icon={<ShareAltOutlined />}>分享成就</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AchievementsPage;