import React, { useEffect, useState, useRef } from 'react';
import { Card, Spin, message, Button, Space, Tag } from 'antd';
import { 
  DownloadOutlined, 
  ReloadOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useNovelIndexDBStore } from '@/stores/novelIndexDBStore';

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  type: 'chapter' | 'character' | 'location' | 'event' | 'history';
  description: string;
  relatedItems: string[];
}

const TimelineChart: React.FC = () => {
  const { novelId } = useParams();
  const { chapters, characters, locations, histories, refreshChapters, refreshCharacters, refreshLocations, refreshHistories } = useNovelIndexDBStore();
  const [loading, setLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

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
        refreshLocations(novelId),
        refreshHistories(novelId)
      ]);
      
      // 构造时间轴事件
      const events: TimelineEvent[] = [];
      
      // 添加章节事件
      chapters
        .filter(chapter => chapter.novelId === novelId)
        .forEach(chapter => {
          events.push({
            id: `chapter_${chapter.id}`,
            title: chapter.title,
            date: chapter.createdAt,
            type: 'chapter',
            description: chapter.summary || '章节事件',
            relatedItems: []
          });
        });
      
      // 添加角色事件
      characters
        .filter(character => character.novelId === novelId)
        .forEach(character => {
          events.push({
            id: `character_${character.id}`,
            title: `角色: ${character.name}`,
            date: character.createdAt,
            type: 'character',
            description: character.description,
            relatedItems: []
          });
        });
      
      // 添加地点事件
      locations
        .filter(location => location.novelId === novelId)
        .forEach(location => {
          events.push({
            id: `location_${location.id}`,
            title: `地点: ${location.name}`,
            date: location.createdAt,
            type: 'location',
            description: location.description,
            relatedItems: []
          });
        });
      
      // 添加历史事件
      histories
        .filter(history => history.novelId === novelId)
        .forEach(history => {
          events.push({
            id: `history_${history.id}`,
            title: `历史: ${history.name}`,
            date: history.createdAt,
            type: 'history',
            description: history.description,
            relatedItems: []
          });
        });
      
      // 按日期排序
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setTimelineEvents(events);
      setCurrentIndex(0);
    } catch (error) {
      message.error('加载数据失败');
      console.error('加载时间轴数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取当前页的事件
  const getCurrentPageEvents = () => {
    const startIndex = currentIndex * pageSize;
    return timelineEvents.slice(startIndex, startIndex + pageSize);
  };

  // 刷新数据
  const handleRefresh = () => {
    loadData();
  };

  // 导出图表
  const handleExport = () => {
    // 创建CSV数据
    const csvContent = [
      ['ID', '标题', '日期', '类型', '描述'],
      ...timelineEvents.map(event => [
        event.id,
        event.title,
        event.date,
        event.type,
        event.description
      ])
    ]
      .map(row => row.join(','))
      .join('\n');
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', '时间轴数据.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('时间轴数据已导出为CSV格式');
  };

  // 上一页
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 下一页
  const handleNext = () => {
    const maxIndex = Math.max(0, Math.ceil(timelineEvents.length / pageSize) - 1);
    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // 获取事件类型标签颜色
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'chapter': return 'blue';
      case 'character': return 'green';
      case 'location': return 'purple';
      case 'history': return 'orange';
      default: return 'default';
    }
  };

  // 获取事件类型标签文本
  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'chapter': return '章节';
      case 'character': return '角色';
      case 'location': return '地点';
      case 'history': return '历史';
      default: return '事件';
    }
  };

  const currentPageEvents = getCurrentPageEvents();

  return (
    <Card 
      title="情节发展时间轴" 
      extra={
        <Space>
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
        事件数量: {timelineEvents.length}
      </div>
      
      {loading ? (
        <div className="w-full h-80 flex items-center justify-center">
          <Spin tip="加载中..." />
        </div>
      ) : timelineEvents.length > 0 ? (
        <div className="w-full h-80 relative">
          <div 
            ref={containerRef} 
            className="w-full h-full overflow-y-auto"
          >
            <div className="relative w-full">
              {/* 时间轴线 */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
              
              {/* 时间轴事件 */}
              <div className="space-y-6 pt-4 w-full">
                {currentPageEvents.map((event, index) => (
                  <div key={event.id} className="flex items-start w-full">
                    {/* 时间点 */}
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    </div>
                    
                    {/* 事件内容 */}
                    <div className="flex-1 pb-6 w-full">
                      <div className="bg-white p-4 rounded-lg shadow-sm border w-full">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-900">{event.title}</h3>
                          <Tag color={getEventTypeColor(event.type)}>
                            {getEventTypeText(event.type)}
                          </Tag>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(event.date).toLocaleDateString('zh-CN')}
                        </p>
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 分页控制 */}
          <div className="absolute bottom-4 right-4 flex items-center space-x-2">
            <Button 
              icon={<LeftOutlined />} 
              onClick={handlePrev}
              disabled={currentIndex === 0}
              size="small"
            />
            <span className="text-sm">
              {currentIndex + 1} / {Math.max(1, Math.ceil(timelineEvents.length / pageSize))}
            </span>
            <Button 
              icon={<RightOutlined />} 
              onClick={handleNext}
              disabled={currentIndex >= Math.max(0, Math.ceil(timelineEvents.length / pageSize) - 1)}
              size="small"
            />
          </div>
        </div>
      ) : (
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-2">暂无时间轴数据</div>
            <div className="text-sm text-gray-500">请先添加章节、角色、地点或历史设定</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TimelineChart;