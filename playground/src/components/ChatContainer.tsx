'use client';

import { useRef, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  content: React.ReactNode;
}

interface ChatContainerProps {
  onSend: () => void;
  isLoading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  messages: Message[];
  children?: React.ReactNode;
}

export default function ChatContainer({
  onSend,
  isLoading,
  input,
  onInputChange,
  messages,
  children
}: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const query = input.trim();
    if (!query || isLoading) return;
    onSend();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <>
      <div className='chat-container' ref={containerRef}>
        <div className='message system'>
          <div className='message-content'>
            描述你想要的图表或图可视化，例如：
            <br />
            <span style={{ color: 'var(--text-tertiary)' }}>
              • "展示季度销售额的分组柱状图"
            </span>
            <br />
            <span style={{ color: 'var(--text-tertiary)' }}>
              • "用 G6 画一个力导向布局知识图谱"
            </span>
          </div>
        </div>
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className='message-content'>{msg.content}</div>
          </div>
        ))}
      </div>

      {children}

      <div className='input-area'>
        <div className='input-box'>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              onInputChange(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder='描述你的图表需求…'
            rows={2}
            disabled={isLoading}
          />
          <div className='input-footer'>
            <span className='hint-text'>Shift+Enter 换行</span>
            <button
              className='send-btn'
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <>
                  <span className='spinner' />
                  生成中…
                </>
              ) : (
                <>
                  <svg
                    viewBox='0 0 16 16'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M8 2L14 8L8 14M2 8H14'
                      stroke='currentColor'
                      strokeWidth='1.8'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                  发送
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
