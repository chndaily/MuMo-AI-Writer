import { eventBus } from '@/utils/eventBus';

// 模拟console.log以便于测试
const originalLog = console.log;
const mockLog = jest.fn();
console.log = mockLog;

describe('Sync Event System', () => {
  beforeEach(() => {
    mockLog.mockClear();
  });

  afterAll(() => {
    console.log = originalLog;
  });

  test('should trigger event when world setting sync completes', () => {
    // 创建一个模拟的事件处理函数
    const mockHandler = jest.fn();
    
    // 订阅事件
    eventBus.on('worldSettingSyncComplete', mockHandler);
    
    // 触发事件
    const eventData = { novelId: 'test-novel-id', type: 'character' };
    eventBus.emit('worldSettingSyncComplete', eventData);
    
    // 验证事件处理函数被调用
    expect(mockHandler).toHaveBeenCalledWith(eventData);
    
    // 取消订阅
    eventBus.off('worldSettingSyncComplete', mockHandler);
    
    // 再次触发事件，验证处理函数不再被调用
    eventBus.emit('worldSettingSyncComplete', eventData);
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  test('should handle multiple event handlers', () => {
    // 创建多个模拟的事件处理函数
    const mockHandler1 = jest.fn();
    const mockHandler2 = jest.fn();
    
    // 订阅事件
    eventBus.on('worldSettingSyncComplete', mockHandler1);
    eventBus.on('worldSettingSyncComplete', mockHandler2);
    
    // 触发事件
    const eventData = { novelId: 'test-novel-id', type: 'location' };
    eventBus.emit('worldSettingSyncComplete', eventData);
    
    // 验证所有事件处理函数都被调用
    expect(mockHandler1).toHaveBeenCalledWith(eventData);
    expect(mockHandler2).toHaveBeenCalledWith(eventData);
    
    // 取消订阅其中一个处理函数
    eventBus.off('worldSettingSyncComplete', mockHandler1);
    
    // 再次触发事件
    eventBus.emit('worldSettingSyncComplete', eventData);
    
    // 验证未取消订阅的处理函数被再次调用
    expect(mockHandler1).toHaveBeenCalledTimes(1);
    expect(mockHandler2).toHaveBeenCalledTimes(2);
    
    // 取消订阅剩余的处理函数
    eventBus.off('worldSettingSyncComplete', mockHandler2);
  });

  test('should handle errors in event handlers gracefully', () => {
    // 创建一个会抛出错误的事件处理函数
    const errorHandler = () => {
      throw new Error('Test error');
    };
    
    // 创建一个正常的事件处理函数
    const normalHandler = jest.fn();
    
    // 订阅事件
    eventBus.on('worldSettingSyncComplete', errorHandler);
    eventBus.on('worldSettingSyncComplete', normalHandler);
    
    // 触发事件
    const eventData = { novelId: 'test-novel-id', type: 'culture' };
    eventBus.emit('worldSettingSyncComplete', eventData);
    
    // 验证正常的处理函数被调用
    expect(normalHandler).toHaveBeenCalledWith(eventData);
    
    // 取消订阅
    eventBus.off('worldSettingSyncComplete', errorHandler);
    eventBus.off('worldSettingSyncComplete', normalHandler);
  });
});