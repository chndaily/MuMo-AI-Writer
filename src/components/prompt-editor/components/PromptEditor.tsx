import React, { useCallback, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { autocompletion } from '@codemirror/autocomplete';
import { PromptEditorProps } from '../types';
import { PromptRenderer } from '../core/PromptRenderer';
import { promptAllFunctions } from '../functions';
import { getCodeMirrorBasicSetup, createCompletionSource, createPromptLanguage } from '../extensions/codeMirrorExtensions';

const PromptEditor: React.FC<PromptEditorProps> = ({
  initialTemplate,
  onTemplateChange,
  height = '400px',
  theme = 'light'
}) => {
  const [template, setTemplate] = useState(initialTemplate || '');
  const [renderedOutput, setRenderedOutput] = useState('');

  // 将解析/渲染错误格式化为多行信息（带行列和指示符）
  const formatErrorForDisplay = (error: unknown, sourceText: string): string => {
    const err: any = error;
    const isParseError = err && typeof err === 'object' && err.name === 'ParseError' && typeof err.line === 'number' && typeof err.column === 'number';
    const baseMsg = err instanceof Error ? err.message.replace(/^Error:\s*/, '') : String(err);

    if (!isParseError) {
      return `Error: ${baseMsg}`;
    }

    const lineNum: number = err.line;
    const colNum: number = err.column;
    const lines = sourceText.split('\n');
    const lineText = lines[lineNum - 1] ?? '';
    const prefix = `${lineNum} | `;

    return `Error: ${baseMsg}\n --> template:${lineNum}:${colNum}\n   |\n${prefix}${lineText}\n   | ${' '.repeat(Math.max(colNum - 1, 0))}^`;
  };

  const handleTemplateChange = useCallback((value: string) => {
    setTemplate(value);
    onTemplateChange?.(value);
  }, [onTemplateChange]);

  const handleTemplateBlur = useCallback(() => {
    const result = PromptRenderer.checkSyntax(template);
    if (result.isValid) {
      if (renderedOutput) setRenderedOutput('');
    } else {
      setRenderedOutput(formatErrorForDisplay(result.error, template));
    }
  }, [template, renderedOutput]);

  // 使用自定义自动补全源 + 语法高亮扩展接入 CodeMirror
  const completionSource = useMemo(() => createCompletionSource(promptAllFunctions), []);
  const promptLanguageExtensions = useMemo(() => createPromptLanguage(promptAllFunctions), []);
  const extensions = useMemo(() => [
    ...promptLanguageExtensions,
    autocompletion({ override: [completionSource] })
  ], [promptLanguageExtensions, completionSource]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
        <CodeMirror
          value={template}
          onChange={handleTemplateChange}
          onBlur={handleTemplateBlur}
          height={typeof height === 'number' ? `${height}px` : height}
          theme={theme}
          extensions={extensions}
          basicSetup={getCodeMirrorBasicSetup()}
          placeholder="在这里编写你的AI提示词模板..."
        />
      </div>

      {renderedOutput && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
            {renderedOutput}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PromptEditor; 