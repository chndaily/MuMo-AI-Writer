import { hybridStorageService } from '@/services/hybridStorageService';
import { Location } from '#/novel';

// 测试地点类型字段修复
async function testLocationTypeFix() {
  console.log('开始测试地点类型字段修复...');
  
  try {
    // 创建测试地点数据
    const testLocation: any = {
      id: 'test-location-001',
      novelId: 'test-novel-001',
      name: '测试地点',
      description: '这是一个测试地点',
      type: 'location', // 保持为'location'
      locationType: '古代城市', // 具体的地点类型描述
      importance: '重要',
      geography: '位于山谷中',
      culture: '多元文化融合',
      politics: '民主制度',
      economy: '以农业为主',
      tags: ['城市', '古代', '测试'],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    console.log('测试数据:', testLocation);
    
    // 保存测试地点
    console.log('保存测试地点...');
    await hybridStorageService.saveWorldElement(testLocation, 'location');
    
    // 重新加载数据
    console.log('重新加载数据...');
    const locations = await hybridStorageService.getWorldElements('location', 'test-novel-001');
    
    console.log('加载到的地点数据:', locations);
    
    // 验证地点类型字段是否正确保存和加载
    const savedLocation = locations.find((loc: any) => loc.id === testLocation.id);
    if (savedLocation) {
      console.log('保存的地点数据:', savedLocation);
      
      // 验证type字段是否为'location'
      if (savedLocation.type === 'location') {
        console.log('✓ type字段正确设置为location');
      } else {
        console.error('✗ type字段错误:', savedLocation.type);
      }
      
      // 验证locationType字段是否正确保存
      if (savedLocation.locationType === '古代城市') {
        console.log('✓ locationType字段正确保存');
      } else {
        console.error('✗ locationType字段错误:', savedLocation.locationType);
      }
      
      // 验证其他字段是否正确保存
      if (savedLocation.name === '测试地点') {
        console.log('✓ name字段正确保存');
      } else {
        console.error('✗ name字段错误:', savedLocation.name);
      }
    } else {
      console.error('未找到保存的测试地点');
    }
    
    console.log('测试完成');
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 运行测试
testLocationTypeFix();