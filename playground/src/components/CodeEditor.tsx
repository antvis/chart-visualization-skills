'use client';

import { useRef, useCallback } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className='code-editor'>
      <textarea
        ref={editorRef}
        className='code-textarea'
        value={code}
        onChange={handleChange}
        placeholder='// 生成的代码将显示在这里&#10;// 点击「发送」开始生成'
        spellCheck={false}
      />
    </div>
  );
}
