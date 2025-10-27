import React, { useMemo, useState } from 'react';
import { GlobalContext, PromptFunction } from '../types';
import PromptEditor from './PromptEditor';
import { promptAllFunctions } from '../functions';
import usePromptRenderer from '../usePromptRenderer';

const PromptEditorDemo: React.FC = () => {
  const [globalContext] = useState<GlobalContext>({
    message: '这是一个测试消息，用于演示编辑器功能。支持中英文混合内容。',
    pov: 'first-person',
    textBefore: '主人公缓慢地走在黑暗的走廊里，每一步都让心跳加速。',
    textAfter: '走廊尽头的门吱呀一声打开，露出了一个神秘的身影。',
    story: {
      summary: '一个关于侦探调查闹鬼豪宅的惊悚推理故事。',
      genre: 'Mystery/Thriller',
      wordCount: 15000
    },
    author: 'AI Assistant',
    scene: {
      location: '维多利亚时代的豪宅',
      time: '午夜时分',
      weather: '暴风雨夜'
    }
  });

  const [template, setTemplate] = useState('');
  const [renderedResult, setRenderedResult] = useState('');
  const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>('light');
  const handleRender = usePromptRenderer(globalContext);

  const customFunctions: Record<string, PromptFunction> = {
    authorInfo: {
      name: 'authorInfo',
      type: 'utility',
      description: '获取作者信息',
      returnType: 'string',
      execute: (context) => `作者：${context.globalContext.author || '未知'}`
    }
  };

  const insertFunction = (funcText: string) => {
    const insertText = `{${funcText}}`;
    setTemplate(prev => prev + insertText);
  };

  const onPromptChange = (template: string) => {
    try {
      setTemplate(template);
      setRenderedResult(handleRender(template));
    } catch (error: unknown) {
      setRenderedResult(error instanceof Error ? error.message : String(error));
    }
  };

  const availableFunctions: PromptFunction[] = Object.values(promptAllFunctions);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                CodeMirror 提示词编辑器演示
              </h1>
              <p className="text-gray-600">
                基于 @uiw/react-codemirror 的专业提示词编辑解决方案
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setEditorTheme(prev => prev === 'light' ? 'dark' : 'light')}
                className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
              >
                {editorTheme === 'light' ? '🌙' : '☀️'} 切换主题
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden my-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <h1 className="text-2xl font-bold mb-2">CodeMirror 提示词编辑器</h1>
          <p className="opacity-90">基于 @uiw/react-codemirror 的专业编辑体验</p>
        </div>

        <div className="flex h-[600px]">
          <div className="flex-1 p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">📝 模板编辑</h3>
            <div className="h-[90%] border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-500">
              <PromptEditor
                initialTemplate={template}
                customFunctions={customFunctions}
                onTemplateChange={onPromptChange}
                height="500px"
                theme={editorTheme}
              />
            </div>
          </div>

          <div className="w-80 bg-gray-50 p-6 border-l border-gray-200 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🔧 函数库</h3>
            {['single', 'multi', 'condition', 'utility'].map(type => {
              const funcs = availableFunctions.filter(f => f.type === type);
              if (funcs.length === 0) return null;

              const typeNames: Record<string, string> = {
                single: '单字函数',
                multi: '多字函数',
                condition: '条件函数',
                utility: '工具函数'
              };

              return (
                <div key={type} className="mb-6">
                  <h4 className="text-blue-600 font-medium mb-3">{typeNames[type]}</h4>
                  {funcs.map((func, index) => {
                    const hasParams = func.params && func.params.length > 0;
                    const paramStr = hasParams
                      ? `(${func.params?.map(p => p.required !== false ? p.name : `[${p.name}]`).join(', ')})`
                      : ['message', 'pov', 'storySoFar', 'hasTextAfter', 'hasTextBefore'].includes(func.name)
                        ? ''
                        : '()';

                    return (
                      <div
                        key={index}
                        className="bg-white p-3 mb-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        onClick={() => insertFunction(func.name + paramStr)}
                      >
                        <div className="font-mono text-sm font-semibold text-gray-800">
                          {func.name}{paramStr}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{func.description}</div>
                        {func.params && (
                          <div className="text-xs text-blue-600 mt-1">
                            参数: {func.params.map(p => `${p.name}:${p.type}`).join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <div className="mt-6">
              <h4 className="text-blue-600 font-medium mb-3">快捷操作</h4>
              <div className="space-y-2">
                <button
                  onClick={() => insertFunction('#if condition')}
                  className="w-full px-3 py-2 text-left bg-white border border-gray-200 rounded hover:bg-blue-50 text-sm"
                >
                  插入条件语句
                </button>
                <button
                  onClick={() => insertFunction('include("path")')}
                  className="w-full px-3 py-2 text-left bg-white border border-gray-200 rounded hover:bg-blue-50 text-sm"
                >
                  插入包含语句
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🎯 渲染输出</h3>
            <div className="flex space-x-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                onClick={() => navigator.clipboard.writeText(renderedResult)}
              >
                复制渲染结果
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                onClick={() => navigator.clipboard.writeText(template)}
              >
                复制模板
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-60 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
              {renderedResult}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptEditorDemo; 