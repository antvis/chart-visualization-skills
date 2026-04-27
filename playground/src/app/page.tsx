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
import type { PreviewHandle } from '@/components/Preview';
import Markdown from 'react-markdown';

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

export function extractCodeFromMarkdown(text: string): string {
  const m = text.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
  return m ? m[1].trim() : text.trim();
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
    if (!type) continue;

    // AI SDK v6: tool parts have type "tool-{toolName}" with state/input/output fields
    if (type.startsWith('tool-')) {
      console.log('[getToolEvents] part:', { type, state: part.state, errorText: part.errorText, hasOutput: 'output' in part });
      const toolName = type.slice(5); // strip "tool-" prefix
      const state = part.state as string | undefined;
      const id = String(part.toolCallId || `${toolName}-${index}`);

      if (state === 'output-available') {
        events.push({ id, name: toolName, status: 'result', payload: part.output ?? {} });
      } else {
        events.push({ id, name: toolName, status: 'call', payload: part.input ?? {} });
      }
    }
  }
  return events;
}

function getReadSkillsFromMessages(messages: UIMessage[]) {
  const unique = new Map<string, Skill>();

  for (const message of messages) {
    for (const rawPart of message.parts || []) {
      const part = rawPart as Record<string, unknown>;
      if (part.type !== 'tool-read_file' || part.state !== 'output-available') continue;

      const output = part.output;
      const items = Array.isArray(output) ? output : output ? [output] : [];
      for (const item of items as { path?: string }[]) {
        const id = getFileStem(item.path || '');
        if (id) unique.set(id, { id, title: id });
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
  const previewRef = useRef<PreviewHandle>(null);
  const [library, setLibrary] = useState('g2');
  const [mode, setMode] = useState<'skill' | 'cli'>('skill');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('就绪');
  const [statusColor, setStatusColor] = useState('var(--text-tertiary)');

  const bodyRef = useRef({ library, mode, currentCode: code || null });
  bodyRef.current = { library, mode, currentCode: code || null };

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: '/api/generate',
        body: () => bodyRef.current
      })
  );

  const {
    messages,
    sendMessage,
    setMessages,
    status: chatStatus,
    error: chatError
  } = useChat({
    transport,
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

          return {
            id: String(message.id),
            role: 'assistant',
            content: (
              <div>
                {toolEvents.length > 0 && (
                  <div className='tool-events'>
                    {toolEvents.map((event) => (
                      <details key={`${event.id}-${event.status}`} className={`tool-event ${event.status}`}>
                        <summary>
                          <span className='tool-event-icon'>{event.status === 'call' ? '↗' : '↙'}</span>
                          <span className='tool-event-name'>{event.name}{event.name === 'load_skill' && (event.payload as { library?: string })?.library ? ` · ${(event.payload as { library?: string }).library}` : ''}</span>
                          <span className='tool-event-status'>{event.status === 'call' ? '调用' : '完成'}</span>
                        </summary>
                        <pre className='tool-event-payload'>{truncate(event.payload, 300)}</pre>
                      </details>
                    ))}
                  </div>
                )}
                {text && <div className='markdown-body'><Markdown>{text}</Markdown></div>}
                {usage && (
                  <div className='token-usage'>
                    Tokens: in {usage.inputTokens || 0} / out{' '}
                    {usage.outputTokens || 0} / total {usage.totalTokens || 0}
                  </div>
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
    previewRef.current?.run();
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
            onModeChange={(value) => { setMode(value as 'skill' | 'cli'); setMessages([]); }}
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
                  {mode === 'skill' ? 'Skill' : 'CLI'}
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

          <Preview ref={previewRef} code={code} onStatusChange={handleStatusChange} />
        </div>
      </main>
    </div>
  );
}
