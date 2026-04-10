'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Sidebar,
  ChatContainer,
  CodeEditor,
  Preview,
  Toolbar,
  ControlsBar
} from '@/components';
import type { CodeEditorHandle } from '@/components/CodeEditor';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
}

interface Skill {
  id: string;
  title: string;
}

export default function Home() {
  const codeEditorRef = useRef<CodeEditorHandle>(null);
  const [library, setLibrary] = useState('g2');
  const [mode, setMode] = useState('tool-call');
  const [messages, setMessages] = useState<Message[]>([]);
  const [code, setCode] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [status, setStatus] = useState('就绪');
  const [statusColor, setStatusColor] = useState('var(--text-tertiary)');

  const handleSend = useCallback(
    async (query: string) => {
      // Add user message
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setLoadingText(
        mode === 'tool-call'
          ? '正在查阅文档并生成代码'
          : '正在检索 Skills 并生成代码'
      );
      setStatus('生成中');
      setStatusColor('#f59e0b');

      // Add placeholder for assistant message
      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: `<span class="loading"><span class="spinner"></span>${loadingText}</span>`
        }
      ]);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            library,
            currentCode: code || null,
            mode
          })
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: 'Generation failed' }));
          throw new Error(err.error || 'Generation failed');
        }

        const data = await res.json();
        const {
          code: newCode,
          library: lib,
          skills: loadedSkills = [],
          toolCallsCount
        } = data;

        setCode(newCode || '');
        setSkills(loadedSkills);

        const badge = `<span class="mode-badge ${mode}">${mode === 'tool-call' ? 'Tool Call' : 'BM25'}</span>`;
        const note =
          mode === 'tool-call'
            ? `工具调用 ${toolCallsCount} 次 · 加载 ${loadedSkills.length} 个 Skill`
            : `检索到 ${loadedSkills.length} 个相关 Skill`;

        const escapedCode = (newCode || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const codeBlock = escapedCode
          ? `<details class="msg-code-block"><summary>查看代码</summary><pre><code>${escapedCode}</code></pre></details>`
          : '';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  role: 'assistant',
                  content: `代码已生成 &nbsp;·&nbsp; <strong>${lib.toUpperCase()}</strong> ${badge}<br><span style="font-size:11px;color:var(--text-tertiary)">${note}</span>${codeBlock}`
                }
              : msg
          )
        );

        setStatus('就绪');
        setStatusColor('var(--green)');
      } catch (err) {
        const error = err as Error;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  role: 'error',
                  content: `<strong>生成失败</strong><br>${error.message}`
                }
              : msg
          )
        );
        setStatus('错误');
        setStatusColor('var(--red)');
      } finally {
        setIsLoading(false);
      }
    },
    [library, mode, code, loadingText]
  );

  const handleRun = useCallback(() => {
    // The Preview component auto-runs code on change
    // This is a manual trigger placeholder
    setStatus('预览已更新');
    setStatusColor('var(--green)');
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setStatus('已复制');
    setTimeout(() => setStatus('就绪'), 1500);
  }, [code]);

  const handleFormat = useCallback(() => {
    codeEditorRef.current?.format();
    setStatus('已格式化');
    setTimeout(() => setStatus('就绪'), 1500);
  }, []);

  const handleClear = useCallback(() => {
    setCode('');
    setSkills([]);
    setMessages([]);
    setStatus('就绪');
    setStatusColor('var(--text-tertiary)');
  }, []);

  const handleStatusChange = useCallback((newStatus: string, color: string) => {
    setStatus(newStatus);
    setStatusColor(color);
  }, []);

  return (
    <div className='app'>
      <Sidebar>
        <ChatContainer
          onSend={handleSend}
          isLoading={isLoading}
          loadingText={loadingText}
          messages={messages}
        >
          <ControlsBar
            library={library}
            mode={mode}
            onLibraryChange={setLibrary}
            onModeChange={setMode}
          />
        </ChatContainer>
      </Sidebar>

      <main className='main'>
        <Toolbar
          onRun={handleRun}
          onCopy={handleCopy}
          onFormat={handleFormat}
          onClear={handleClear}
          status={status}
          statusColor={statusColor}
        />

        <div className='content-area'>
          <div className='code-panel'>
            <div className='panel-header'>
              <span className='panel-header-label'>代码</span>
              {mode && (
                <span className={`panel-badge ${mode}`}>
                  {mode === 'tool-call' ? 'Tool Call' : 'BM25'}
                </span>
              )}
            </div>
            <CodeEditor ref={codeEditorRef} code={code} onChange={setCode} />
            {skills.length > 0 && (
              <div className='skills-footer'>
                <div className='skills-footer-title'>已加载 Skills</div>
                <ul className='skills-list'>
                  {skills.map((s) => (
                    <li key={s.id}>{s.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Preview code={code} onStatusChange={handleStatusChange} />
        </div>
      </main>
    </div>
  );
}
