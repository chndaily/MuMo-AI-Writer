// 运行AI模型同步测试的脚本
import { runFullAIModelTest } from './testAIModelSync';

async function main() {
  console.log('开始运行AI模型同步测试...');
  await runFullAIModelTest();
  console.log('测试完成');
}

main();