# 推荐模型信息汇总

## 1. 概述

在系统中存在多个地方定义了推荐模型信息，主要包括：

1. LLM配置面板中的推荐模型列表
2. 模型预设配置文件
3. 提示词库预览中的模型推荐配置

## 2. LLM配置面板中的推荐模型

文件路径：`src/pages/LLMConfig/modules/LLMConfigPanel.tsx`

推荐模型列表包含以下模型：

1. **GPT-4o** (OpenAI)
   - 模型ID: `gpt-4o`
   - 描述: OpenAI最新多模态模型，支持文本和图像输入

2. **GPT-4o Mini** (OpenAI)
   - 模型ID: `gpt-4o-mini`
   - 描述: OpenAI小型高效模型，性价比高

3. **Claude 3.5 Sonnet** (Anthropic)
   - 模型ID: `claude-3-5-sonnet-20240620`
   - 描述: Anthropic最新旗舰模型，智能和安全的平衡

4. **Gemini 1.5 Pro** (Google)
   - 模型ID: `gemini-1.5-pro`
   - 描述: Google最新多模态模型，支持长上下文

5. **DeepSeek V3** (DeepSeek)
   - 模型ID: `deepseek-ai/DeepSeek-V3`
   - 描述: DeepSeek最新旗舰模型，适用于复杂任务

6. **通义千问 Qwen2-72B** (ModelScope)
   - 模型ID: `Qwen/Qwen2-72B-Instruct`
   - 描述: 通义千问Qwen2系列的72B参数大语言模型

## 3. 模型预设配置文件

文件路径：`src/ai/modelPresets.ts`

该文件包含了各个提供商的模型预设配置，包括：

### OpenAI
- gpt-4
- gpt-4-turbo
- gpt-3.5-turbo
- gpt-4o
- gpt-4o-mini

### Anthropic
- claude-3-5-sonnet-20240620
- claude-3-opus-20240229
- claude-3-sonnet-20240229
- claude-3-haiku-20240307

### Google
- gemini-1.5-pro
- gemini-1.5-flash
- gemini-1.0-pro

### Azure OpenAI
- gpt-4
- gpt-35-turbo
- gpt-4o

### DeepSeek
- deepseek-chat
- deepseek-coder
- deepseek-ai/DeepSeek-V3
- deepseek-ai/DeepSeek-V2.5

### ModelScope
- deepseek-ai/DeepSeek-V3.1
- Qwen/Qwen2-72B-Instruct
- Qwen/Qwen2-7B-Instruct
- Qwen/Qwen2-1.5B-Instruct
- Qwen/Qwen2-0.5B-Instruct
- Qwen/Qwen1.5-110B-Chat
- baichuan-inc/Baichuan3-7B-Chat
- baichuan-inc/Baichuan3-13B-Chat

### 本地模型
- llama3
- llama3.1
- mistral
- phi-3
- gemma2

## 4. 提示词库预览中的模型推荐

文件路径：`src/components/promptLibrary/PromptLibraryPreview.tsx`

经典模型推荐配置包含以下模型：

1. **GPT-4o mini**
   - ID: `openai/gpt-4o-mini-2024-07-18`
   - 优势: 快速、经济高效
   - 用途: 通用写作、快速生成

2. **GPT-4o**
   - ID: `openai/gpt-4o-2024-05-13`
   - 优势: 强大的理解和生成能力
   - 用途: 复杂创作、深度分析

3. **Claude 3.7 Sonnet**
   - ID: `anthropic/claude-3.7-sonnet:beta`
   - 优势: 出色的上下文理解
   - 用途: 长篇创作、复杂对话

4. **Claude 3.5 Sonnet**
   - ID: `anthropic/claude-3.5-sonnet:beta`
   - 优势: 平衡的性能，良好的创意写作能力
   - 用途: 创意写作、角色对话

5. **Gemini 1.5 Pro**
   - ID: `google/gemini-pro-1.5`
   - 优势: 强大的多模态能力
   - 用途: 技术写作、逻辑分析

6. **Gemini 1.5 Flash**
   - ID: `google/gemini-flash-1.5`
   - 优势: 快速响应，良好的多语言支持
   - 用途: 快速生成、多语言内容

7. **Mistral Large**
   - ID: `mistralai/mistral-large`
   - 优势: 优秀的法语支持，良好的代码生成能力
   - 用途: 多语言写作、代码辅助

8. **Cohere Command R+**
   - ID: `cohere/command-r-plus-04-2024`
   - 优势: 强大的检索增强生成能力
   - 用途: 事实性内容、研究写作

## 5. 总结

系统中确实存在多个文件包含了推荐模型的信息，这些信息分布在不同的模块中，为用户提供模型选择的参考。主要的推荐模型信息集中在：

1. `src/pages/LLMConfig/modules/LLMConfigPanel.tsx` - LLM配置页面的推荐模型
2. `src/ai/modelPresets.ts` - 各个提供商的模型预设配置
3. `src/components/promptLibrary/PromptLibraryPreview.tsx` - 提示词库中的模型推荐