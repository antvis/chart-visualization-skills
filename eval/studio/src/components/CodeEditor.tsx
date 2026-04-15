'use client';

import { useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

export interface CodeEditorHandle {
  format: () => void;
}

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ code, onChange }, ref) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const handleMount: OnMount = useCallback((editorInstance) => {
      editorRef.current = editorInstance;
    }, []);

    const handleChange = useCallback(
      (value: string | undefined) => {
        onChange(value ?? '');
      },
      [onChange]
    );

    useImperativeHandle(ref, () => ({
      format: () => {
        editorRef.current?.getAction('editor.action.formatDocument')?.run();
      },
    }));

    return (
      <div className="code-editor">
        <MonacoEditor
          height="100%"
          language="javascript"
          theme="vs-light"
          value={code}
          onMount={handleMount}
          onChange={handleChange}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', monospace",
            lineHeight: 1.6,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            renderLineHighlight: 'none',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    );
  }
);

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;
