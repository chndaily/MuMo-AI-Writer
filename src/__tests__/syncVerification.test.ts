import { characterSyncService } from '@/services/sync/CharacterSyncService';
import { hybridStorageService } from '@/services/hybridStorageService';

// 模拟的AI生成角色内容
const mockCharacterContent = `
【角色档案】
姓名：李明轩
角色类型：主角
描述：一个年轻的武者，拥有罕见的灵根资质
性格特征：坚韧不拔，正义感强，偶尔冲动
外貌特征：身材修长，剑眉星目，左脸颊有一道细小疤痕
背景故事：出身贫寒，因一次意外觉醒了灵根
能力技能：基础剑法，灵力感知，快速学习
人际关系：师父-云游道人，好友-王大力
角色弧线：从懵懂少年成长为一代宗师

【角色档案】
姓名：王大力
角色类型：配角
描述：李明轩的好友，力大无穷但头脑简单
性格特征：忠诚可靠，直率豪爽，有些鲁莽
外貌特征：身材魁梧，肌肉发达，络腮胡须
背景故事：铁匠之子，自幼力大过人
能力技能：锻造技艺，近身格斗，负重行走
人际关系：好友-李明轩，父亲-王铁匠
角色弧线：从单纯武夫成长为锻造大师
`;

async function testCharacterSync() {
  console.log('开始测试角色同步功能...');
  
  try {
    const novelId = 'test-novel-1';
    
    // 同步角色数据
    console.log('开始同步角色数据...');
    const syncResult = await characterSyncService.syncCharacters(mockCharacterContent, novelId, {});
    console.log('角色同步结果:', syncResult);
    
    // 验证数据是否正确保存
    console.log('验证保存的数据...');
    const savedCharacters = await hybridStorageService.getWorldElements('character', novelId);
    console.log('保存的角色数量:', savedCharacters.length);
    
    if (savedCharacters.length >= 2) {
      console.log('✅ 角色同步测试通过');
      console.log('保存的角色信息:');
      savedCharacters.forEach((character: any, index: number) => {
        console.log(`  ${index + 1}. ${character.name} (${character.role})`);
        console.log(`     描述: ${character.description}`);
        console.log(`     标签: ${character.tags?.join(', ') || '无'}`);
      });
    } else {
      console.log('❌ 角色同步测试失败：保存的角色数量不足');
    }
    
    return { success: syncResult.success, characterCount: savedCharacters.length };
  } catch (error) {
    console.error('测试过程中出现错误:', error);
    return { success: false, error: error.message };
  }
}

// 运行测试
testCharacterSync().then(result => {
  console.log('测试完成:', result);
}).catch(error => {
  console.error('测试失败:', error);
});