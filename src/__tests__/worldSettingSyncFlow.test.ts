import { eventBus } from '@/utils/eventBus';

// 模拟WorldSettingPanel组件的行为
describe('World Setting Sync Flow', () => {
  let mockLoadWorldElements: jest.Mock;
  
  beforeEach(() => {
    mockLoadWorldElements = jest.fn();
  });

  test('should reload data when sync completes', () => {
    // 模拟WorldSettingPanel组件中的useEffect逻辑
    const novelId = 'test-novel-id';
    
    // 模拟组件挂载时的初始加载
    mockLoadWorldElements();
    
    // 模拟事件监听器的设置
    const handleSyncComplete = (data: { novelId: string, type: string }) => {
      if (data.novelId === novelId) {
        mockLoadWorldElements();
      }
    };
    
    // 订阅事件
    eventBus.on('worldSettingSyncComplete', handleSyncComplete);
    
    // 模拟同步完成事件触发
    eventBus.emit('worldSettingSyncComplete', { novelId: 'test-novel-id', type: 'character' });
    
    // 验证重新加载函数被调用
    expect(mockLoadWorldElements).toHaveBeenCalledTimes(2);
    
    // 取消订阅
    eventBus.off('worldSettingSyncComplete', handleSyncComplete);
  });

  test('should not reload data for different novel', () => {
    // 模拟WorldSettingPanel组件中的useEffect逻辑
    const currentNovelId = 'current-novel-id';
    
    // 模拟组件挂载时的初始加载
    mockLoadWorldElements();
    
    // 模拟事件监听器的设置
    const handleSyncComplete = (data: { novelId: string, type: string }) => {
      if (data.novelId === currentNovelId) {
        mockLoadWorldElements();
      }
    };
    
    // 订阅事件
    eventBus.on('worldSettingSyncComplete', handleSyncComplete);
    
    // 模拟其他小说的同步完成事件触发
    eventBus.emit('worldSettingSyncComplete', { novelId: 'other-novel-id', type: 'character' });
    
    // 验证重新加载函数只被调用一次（初始加载）
    expect(mockLoadWorldElements).toHaveBeenCalledTimes(1);
    
    // 取消订阅
    eventBus.off('worldSettingSyncComplete', handleSyncComplete);
  });
});