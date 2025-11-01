import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  message, 
  Space, 
  Typography, 
  Tag, 
  Collapse,
  Spin,
  Alert
} from 'antd';
import { 
  FileTextOutlined, 
  BarChartOutlined, 
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { hybridStorageService } from '@/services/hybridStorageService';
import { getOutlineStructureSummary, getOutlineByPage, isLargeOutline } from '@/utils/largeOutlineHandler';
import { 
  getSuperLargeOutlineStructureSummary, 
  getSuperLargeOutlineByPage, 
  isSuperLargeOutline 
} from '@/utils/superLargeOutlineHandler';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface OutlineManagerProps {
  novelId: string;
}

const LargeOutlineManager: React.FC<OutlineManagerProps> = ({ novelId }) => {
  const [outlineCount, setOutlineCount] = useState<number>(0);
  const [outlineWordCount, setOutlineWordCount] = useState<number>(0);
  const [isLarge, setIsLarge] = useState<boolean>(false);
  const [isSuperLarge, setIsSuperLarge] = useState<boolean>(false);
  const [structureSummary, setStructureSummary] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [outlineContent, setOutlineContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  // 初始化加载
  useEffect(() => {
    loadOutlineInfo();
  }, [novelId]);

  // 加载大纲信息
  const loadOutlineInfo = async () => {
    try {
      setLoading(true);
      const outlines = await hybridStorageService.getOutlines(novelId);
      
      if (outlines) {
        const count = outlines.length;
        // 计算大纲总字数
        const wordCount = outlines.reduce((sum, outline) => sum + (outline.content?.length || 0), 0);
        
        setOutlineCount(count);
        setOutlineWordCount(wordCount);
        setIsLarge(isLargeOutline(count));
        setIsSuperLarge(isSuperLargeOutline(wordCount));
        
        // 如果是长大纲或超长大纲，加载结构摘要
        if (isLargeOutline(count) || isSuperLargeOutline(wordCount)) {
          loadStructureSummary();
          loadOutlinePage(1);
        }
      }
    } catch (error) {
      console.error('加载大纲信息失败:', error);
      message.error('加载大纲信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载结构摘要
  const loadStructureSummary = async () => {
    try {
      setSummaryLoading(true);
      // 根据大纲类型选择合适的摘要函数
      const summary = isSuperLarge ? 
        await getSuperLargeOutlineStructureSummary(novelId) :
        await getOutlineStructureSummary(novelId);
      setStructureSummary(summary);
    } catch (error) {
      console.error('加载结构摘要失败:', error);
      message.error('加载结构摘要失败');
    } finally {
      setSummaryLoading(false);
    }
  };

  // 加载大纲页面
  const loadOutlinePage = async (page: number) => {
    try {
      setLoading(true);
      // 根据大纲类型选择合适的分页函数
      const result = isSuperLarge ? 
        await getSuperLargeOutlineByPage(novelId, page) :
        await getOutlineByPage(novelId, page);
      setOutlineContent(result.content);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
    } catch (error) {
      console.error('加载大纲页面失败:', error);
      message.error('加载大纲页面失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理页面切换
  const handlePageChange = (page: number) => {
    loadOutlinePage(page);
  };

  // 导出大纲
  const handleExport = () => {
    message.info('导出功能开发中...');
  };

  // 导入大纲
  const handleImport = () => {
    message.info('导入功能开发中...');
  };

  if (loading && outlineCount === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>正在加载大纲信息...</div>
      </div>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <FileTextOutlined />
          <span>大纲管理器</span>
          <Tag color={isSuperLarge ? 'volcano' : isLarge ? 'red' : 'green'}>
            {isSuperLarge ? '超长大纲' : isLarge ? '长大纲' : '普通大纲'}
          </Tag>
          <Tag color="blue">{outlineCount} 项</Tag>
          <Tag color="purple">{outlineWordCount.toLocaleString()} 字</Tag>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
          <Button icon={<UploadOutlined />} onClick={handleImport}>
            导入
          </Button>
        </Space>
      }
    >
      {isLarge ? (
        <div>
          <Alert
            message={isSuperLarge ? "检测到您的大纲超长（超过18000字）" : "检测到您的大纲较长"}
            description={isSuperLarge ? 
              "为了提高系统性能和使用体验，我们已启用超长大纲管理模式，采用分层管理和摘要显示。" :
              "为了提高系统性能和使用体验，我们已启用长大纲管理模式。"}
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
          
          {/* 结构摘要 */}
          <Card 
            title={<Space><BarChartOutlined />{isSuperLarge ? '超长大纲结构摘要' : '结构摘要'}</Space>} 
            size="small"
            style={{ marginBottom: 20 }}
          >
            {summaryLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin />
                <div style={{ marginTop: 10 }}>{isSuperLarge ? '正在生成超长大纲结构摘要...' : '正在生成结构摘要...'}</div>
              </div>
            ) : (
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'monospace',
                fontSize: '12px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {structureSummary || '暂无结构摘要'}
              </pre>
            )}
          </Card>
          
          {/* 分页内容 */}
          <Card 
            title={<Space><FileTextOutlined />{isSuperLarge ? '超长大纲内容' : '大纲内容'}</Space>}
            size="small"
            extra={
              <Space>
                <Button 
                  disabled={currentPage <= 1} 
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  上一页
                </Button>
                <Text>第 {currentPage} / {totalPages} 页</Text>
                <Button 
                  disabled={currentPage >= totalPages} 
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  下一页
                </Button>
              </Space>
            }
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin />
                <div style={{ marginTop: 10 }}>{isSuperLarge ? '正在加载超长大纲内容...' : '正在加载大纲内容...'}</div>
              </div>
            ) : (
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'monospace',
                fontSize: '12px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {outlineContent || '暂无内容'}
              </pre>
            )}
          </Card>
          
          {/* 使用建议 */}
          <Card 
            title="使用建议" 
            size="small"
            style={{ marginTop: 20 }}
          >
            <ul>
              <li>{isSuperLarge ? '系统已自动启用超长大纲优化模式' : '系统已自动启用长大纲优化模式'}，确保流畅使用体验</li>
              <li>AI生成内容时会自动使用大纲摘要而非完整内容，提高响应速度</li>
              <li>您可以通过分页浏览完整的大纲内容</li>
              <li>建议定期导出大纲作为备份</li>
              {isSuperLarge && (
                <>
                  <li>超长大纲采用分层管理，建议重点关注核心卷和关键章节</li>
                  <li>可使用大纲层级摘要快速了解整体结构</li>
                </>
              )}
            </ul>
          </Card>
        </div>
      ) : (
        <div>
          <Text>您的大纲长度适中，系统将正常处理所有内容。</Text>
        </div>
      )}
    </Card>
  );
};

export default LargeOutlineManager;