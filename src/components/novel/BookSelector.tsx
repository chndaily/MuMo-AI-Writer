import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Select, message, Button, Empty } from 'antd';
import { BookOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { databaseManager } from '@/services/index';
import { Novel } from '#/novel';

const { Option } = Select;

interface BookSelectorProps {
  selectedNovelId?: string;
  onSelect: (novelId: string, novel: Novel) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  allowClear?: boolean;
  onRefresh?: () => void; // 新增刷新回调
}

interface BookSelectorRef {
  refresh: () => void;
}

const BookSelector = forwardRef<BookSelectorRef, BookSelectorProps>(({ 
  selectedNovelId, 
  onSelect, 
  placeholder = "选择要操作的小说",
  style,
  allowClear = true,
  onRefresh
}, ref) => {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 暴露刷新方法给父组件
  useImperativeHandle(ref, () => ({
    refresh: loadNovels
  }));

  useEffect(() => {
    loadNovels();
  }, []);

  const loadNovels = useCallback(async () => {
    setLoading(true);
    try {
      // 初始化数据库
      // databaseManager.initializeDatabase() 方法已移除
      // 修改为只获取当前用户的小说
      const { useMembershipStore } = await import('@/stores/membershipStore');
      const { membershipInfo } = useMembershipStore.getState();
      const data = await databaseManager.novels.getNovelsByUserId(membershipInfo.email || 'anonymous');
      setNovels(data);
    } catch (error) {
      console.error('加载小说列表失败:', error);
      message.error('加载小说列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (value: string) => {
    const novel = novels.find(n => n.id === value);
    if (novel) {
      onSelect(value, novel);
    }
  };

  const handleClear = () => {
    // 清空选择时传递空值
    onSelect('', {} as Novel);
  };

  const handleGoToNovels = () => {
    navigate('/novels');
    // 调用刷新回调（如果提供）
    onRefresh?.();
  };

  // 如果没有小说，显示提示信息
  if (!loading && novels.length === 0) {
    return (
      <div style={{
        border: '1px dashed #d9d9d9',
        borderRadius: '6px',
        padding: '16px',
        textAlign: 'center',
        backgroundColor: '#fafafa',
        ...style
      }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#999' }}>
              暂无小说，请先到创作中心创建小说
            </span>
          }
        >
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleGoToNovels}
            size="small"
          >
            去创建小说
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <Select
      value={selectedNovelId}
      placeholder={placeholder}
      onChange={handleSelect}
      onClear={allowClear ? handleClear : undefined}
      allowClear={allowClear}
      loading={loading}
      style={{ width: '100%', ...style }}
      suffixIcon={<BookOutlined />}
      showSearch
      filterOption={(input, option) => {
        // 直接使用option的value来查找小说并比较标题
        const novel = novels.find(n => n.id === option?.value);
        return novel?.title.toLowerCase().includes(input.toLowerCase()) || false;
      }}
    >
      {novels.map(novel => (
        <Option key={novel.id} value={novel.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{novel.title}</span>
            <span style={{ fontSize: '12px', color: '#999' }}>
              {novel.wordCount.toLocaleString()}字
            </span>
          </div>
        </Option>
      ))}
    </Select>
  );
});

// 为 forwardRef 组件设置 displayName
BookSelector.displayName = 'BookSelector';

export default BookSelector;
export type { BookSelectorRef };