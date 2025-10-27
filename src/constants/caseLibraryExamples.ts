import { CollectionMap, CollectionType, CollectionState, PromptType } from "#/promptLibrary";
import { generateUUID } from "@/utils";
import dayjs from "dayjs";

// 案例库示例数据
const caseLibraryExamples: CollectionMap<CollectionType.Prompts>[] = [
  {
    id: generateUUID({ prefix: 'example_', length: 28 }),
    type: CollectionType.Prompts,
    meta: {
      state: CollectionState.Active,
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString()
    },
    attributes: {
      type: PromptType.Other,
      name: "经典武侠桥段",
      nsfw: false,
      description: "包含经典武侠小说中的桥段和情节设计",
      messages: [
        {
          type: "system",
          text: "以下是一些经典的武侠桥段设计，可用于参考：\n\n1. 英雄救美：主角在关键时刻救下被恶人欺凌的女子\n2. 师门恩怨：因师门之间的误会而产生的冲突\n3. 复仇之路：主角为报家族血仇而踏上江湖路\n4. 武林大会：各路英雄豪杰聚集比武论剑\n5. 秘籍争夺：围绕绝世武功秘籍展开的争夺战",
          format: "aic2"
        }
      ],
      models: [],
      attachments: [
        {
          id: generateUUID({ prefix: 'attachment_', length: 28 }),
          name: "武侠经典情节.txt",
          type: "text/plain",
          size: 1024,
          content: `武侠小说经典情节设计指南

一、入门级情节
1. 初入江湖：主角初入武林，对一切都充满好奇
2. 偶得奇遇：意外获得武功秘籍或神兵利器
3. 初次交手：与小角色的第一次正式对战

二、中级情节
1. 师门学艺：在名师指导下学习上乘武功
2. 江湖历练：通过各种任务和挑战提升实力
3. 情感纠葛：与多位异性角色产生情感联系

三、高级情节
1. 武林争霸：参与武林大会或门派争斗
2. 身世之谜：揭开主角的真实身份和背景
3. 正邪对立：与大反派展开最终对决

四、情节设计要点
1. 节奏控制：张弛有度，避免过于紧张或平淡
2. 人物成长：主角在情节中不断成长和变化
3. 悬念设置：保持读者的阅读兴趣和期待`,
          uploadedAt: dayjs().toISOString()
        }
      ]
    },
    relationships: {
      owner: {
        id: "system",
        type: "users"
      }
    }
  },
  {
    id: generateUUID({ prefix: 'example_', length: 28 }),
    type: CollectionType.Prompts,
    meta: {
      state: CollectionState.Active,
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString()
    },
    attributes: {
      type: PromptType.Other,
      name: "现代都市案例",
      nsfw: false,
      description: "现代都市背景下的情节设计和人物塑造",
      messages: [
        {
          type: "system",
          text: "现代都市小说情节设计要点：\n\n1. 职场竞争：办公室政治、商业竞争等情节\n2. 都市生活：日常生活中的小确幸和烦恼\n3. 爱情故事：现代都市背景下的浪漫情感\n4. 社会问题：反映当代社会的各种现象和问题",
          format: "aic2"
        }
      ],
      models: [],
      attachments: [
        {
          id: generateUUID({ prefix: 'attachment_', length: 28 }),
          name: "都市小说创作指南.txt",
          type: "text/plain",
          size: 2048,
          content: `现代都市小说创作指南

一、背景设定
1. 城市选择：一线城市如北京、上海，或二线城市
2. 时间背景：当代或近未来
3. 社会环境：反映真实的都市生活状态

二、人物塑造
1. 主角设定：白领、创业者、艺术家等不同职业
2. 配角设计：家人、朋友、同事、对手等
3. 人物关系：复杂的人际网络和社会关系

三、情节设计
1. 职场线：工作中的挑战和机遇
2. 感情线：爱情、友情、亲情的交织
3. 成长线：主角在都市生活中的自我实现

四、主题表达
1. 现实主义：真实反映都市生活的方方面面
2. 励志元素：传递积极向上的生活态度
3. 情感共鸣：引发读者的情感共鸣和思考

五、写作技巧
1. 细节描写：通过细节展现都市生活的质感
2. 对话设计：符合人物身份和时代特征的对话
3. 节奏控制：快慢结合，张弛有度`,
          uploadedAt: dayjs().toISOString()
        }
      ]
    },
    relationships: {
      owner: {
        id: "system",
        type: "users"
      }
    }
  }
];

export default caseLibraryExamples;