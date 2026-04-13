'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import {
  Sidebar,
  ChatContainer,
  CodeEditor,
  Preview,
  Toolbar,
  ControlsBar
} from '@/components';
import type { CodeEditorHandle } from '@/components/CodeEditor';
import { extractCodeFromMarkdown } from '@/libs/intent';

interface Skill {
  id: string;
  title: string;
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: React.ReactNode;
}

interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

interface ToolEvent {
  id: string;
  name: string;
  status: 'call' | 'result';
  payload: unknown;
}

function truncate(value: unknown, max = 120): string {
  const text =
    typeof value === 'string' ? value : JSON.stringify(value, null, 0) ?? '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function getFileStem(filePath: string): string {
  const segment = filePath.split('/').pop() || '';
  return segment.endsWith('.md') ? segment.slice(0, -3) : segment;
}

function getMessageText(message: {
  parts?: Array<{ type: string; text?: string }>;
  content?: string;
}): string {
  if (message.parts) {
    return message.parts
      .filter((part) => part.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join('\n')
      .trim();
  }
  return message.content || '';
}

function getToolEvents(message: UIMessage) {
  const events: ToolEvent[] = [];
  for (const [index, rawPart] of (message.parts || []).entries()) {
    const part = rawPart as Record<string, unknown>;
    const type = part.type as string | undefined;
    if (type === 'tool-call') {
      events.push({
        id: String(part.toolCallId || `${part.toolName || 'tool'}-${index}`),
        name: String(part.toolName || 'tool'),
        status: 'call',
        payload: part.args ?? {}
      });
    }
    if (type === 'tool-result') {
      events.push({
        id: String(part.toolCallId || `${part.toolName || 'tool'}-${index}`),
        name: String(part.toolName || 'tool'),
        status: 'result',
        payload: part.result ?? {}
      });
    }
    if (type === 'tool-invocation' && part.toolInvocation) {
      const invocation = part.toolInvocation as Record<string, unknown>;
      const state = invocation.state as string | undefined;
      events.push({
        id: String(
          invocation.toolCallId || `${invocation.toolName || 'tool'}-${index}`
        ),
        name: String(invocation.toolName || 'tool'),
        status: state === 'result' ? 'result' : 'call',
        payload:
          state === 'result'
            ? invocation.result ?? {}
            : invocation.args ?? invocation
      });
    }
  }
  return events;
}

function getReadSkillsFromMessages(messages: UIMessage[]) {
  const unique = new Map<string, Skill>();

  for (const message of messages) {
    for (const rawPart of message.parts || []) {
      const part = rawPart as Record<string, unknown>;
      const isReadSkills =
        (part.type === 'tool-result' || part.type === 'tool-invocation') &&
        (part.toolName === 'read_skills' ||
          (part.toolInvocation as { toolName?: string } | undefined)
            ?.toolName === 'read_skills');

      if (!isReadSkills) continue;

      const result =
        (part.result as { path?: string }[] | undefined) ||
        ((part.toolInvocation as { result?: { path?: string }[] } | undefined)
          ?.result ?? []);

      for (const item of result) {
        const fullPath = item.path || '';
        const id = getFileStem(fullPath);
        if (!id) continue;
        unique.set(id, { id, title: id });
      }
    }
  }

  return [...unique.values()];
}

function getUsage(message: UIMessage): TokenUsage | undefined {
  const metadata = message.metadata as { usage?: TokenUsage } | undefined;
  return metadata?.usage;
}

export default function Home() {
  const codeEditorRef = useRef<CodeEditorHandle>(null);
  const [library, setLibrary] = useState('g2');
  const [mode, setMode] = useState<'tool-call' | 'bm25'>('tool-call');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('就绪');
  const [statusColor, setStatusColor] = useState('var(--text-tertiary)');

  const {
    messages,
    sendMessage,
    setMessages,
    status: chatStatus,
    error: chatError
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/generate',
      body: {
        library,
        mode,
        currentCode: code || null
      }
    }),
    onFinish: ({ message }) => {
      const text = getMessageText(message);
      const nextCode = extractCodeFromMarkdown(text);
      if (nextCode) {
        setCode(nextCode);
      }
    }
  });

  const handleSend = useCallback(async () => {
    const query = input.trim();
    if (!query || chatStatus !== 'ready') return;

    setStatus('生成中');
    setStatusColor('#f59e0b');
    await sendMessage({ text: query });
    setInput('');
    setStatus('就绪');
    setStatusColor('var(--green)');
  }, [chatStatus, input, sendMessage]);

  const skills = useMemo(
    () => getReadSkillsFromMessages(messages),
    [messages]
  );

  const totalTokenUsage = useMemo(() => {
    return messages.reduce(
      (acc, message) => {
        if (message.role !== 'assistant') return acc;
        const usage = getUsage(message);
        return {
          inputTokens: acc.inputTokens + (usage?.inputTokens || 0),
          outputTokens: acc.outputTokens + (usage?.outputTokens || 0),
          totalTokens: acc.totalTokens + (usage?.totalTokens || 0)
        };
      },
      { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
    );
  }, [messages]);

  const displayMessages = useMemo<DisplayMessage[]>(() => {
    const rows: DisplayMessage[] = messages.map((message) => {
        const text = getMessageText(message as { parts?: Array<{ type: string; text?: string }>; content?: string });
        const role = message.role as 'user' | 'assistant';

        if (role === 'assistant') {
          const usage = getUsage(message);
          const toolEvents = getToolEvents(message);
          const codeBlock = extractCodeFromMarkdown(text);

          return {
            id: String(message.id),
            role: 'assistant',
            content: (
              <div>
                {text && <div>{text}</div>}
                {usage && (
                  <div className='token-usage'>
                    Tokens: in {usage.inputTokens || 0} / out{' '}
                    {usage.outputTokens || 0} / total {usage.totalTokens || 0}
                  </div>
                )}
                {toolEvents.length > 0 && (
                  <div className='tool-events'>
                    {toolEvents.map((event) => (
                      <div key={`${event.id}-${event.status}`} className='tool-event'>
                        <strong>
                          {event.status === 'call' ? '调用' : '返回'} · {event.name}
                        </strong>
                        <span>{truncate(event.payload)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {codeBlock && (
                  <details className='msg-code-block'>
                    <summary>查看代码</summary>
                    <pre>
                      <code>{codeBlock}</code>
                    </pre>
                  </details>
                )}
              </div>
            )
          };
        }

        return {
          id: String(message.id),
          role: 'user',
          content: text
        };
      });

    if (chatError) {
      rows.push({
        id: 'chat-error',
        role: 'error',
        content: (
          <>
            <strong>生成失败</strong>
            <br />
            {chatError.message}
          </>
        )
      });
    }

    return rows;
  }, [chatError, messages]);

  const handleRun = useCallback(() => {
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
    setMessages([]);
    setStatus('就绪');
    setStatusColor('var(--text-tertiary)');
  }, [setMessages]);

  const handleStatusChange = useCallback((newStatus: string, color: string) => {
    setStatus(newStatus);
    setStatusColor(color);
  }, []);

  return (
    <div className='app'>
      <Sidebar>
        <ChatContainer
          onSend={handleSend}
          isLoading={chatStatus !== 'ready'}
          input={input}
          onInputChange={setInput}
          messages={displayMessages}
        >
          <ControlsBar
            library={library}
            mode={mode}
            onLibraryChange={setLibrary}
            onModeChange={(value) => setMode(value as 'tool-call' | 'bm25')}
          />
          <div className='chat-stats'>
            <span>多轮 Token 合计: {totalTokenUsage.totalTokens}</span>
          </div>
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
