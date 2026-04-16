'use client';

import { useEffect, useRef, useCallback } from 'react';
import { execChartCode } from '@/lib/execChartCode';

interface PreviewProps {
  code: string;
  onStatusChange: (status: string, color: string) => void;
}

export default function Preview({ code, onStatusChange }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<unknown>(null);

  const runCode = useCallback(() => {
    if (!code.trim() || !containerRef.current) return;

    const inst = instanceRef.current as { destroy?: () => void } | null;
    if (inst?.destroy) {
      try {
        inst.destroy();
      } catch (_) {
        /* ignore */
      }
    }
    instanceRef.current = null;

    const container = containerRef.current;
    container.innerHTML = '';

    try {
      instanceRef.current = execChartCode(container, code);
      onStatusChange('预览已更新', 'var(--green)');
    } catch (e) {
      const error = e as Error;
      container.innerHTML = `<div class="error-block"><strong>运行错误</strong><br>${error.message}</div>`;
      onStatusChange('运行错误', 'var(--red)');
    }
  }, [code, onStatusChange]);

  useEffect(() => {
    if (!code.trim()) return;

    let pollTimer: ReturnType<typeof setTimeout>;
    const debounceTimer = setTimeout(() => {
      const isG6 = code.includes('@antv/g6') || code.includes('new Graph(');
      const check = () => {
        // @ts-ignore
        const ready = isG6 ? !!window.G6 : !!window.G2;
        if (ready) {
          runCode();
        } else {
          pollTimer = setTimeout(check, 200);
        }
      };
      check();
    }, 800);

    return () => {
      clearTimeout(debounceTimer);
      clearTimeout(pollTimer!);
    };
  }, [code, runCode]);

  return (
    <div className='preview-panel'>
      <div className='panel-header'>
        <span className='panel-header-label'>预览</span>
      </div>
      <div className='preview-container'>
        {!code.trim() && (
          <div className='preview-placeholder'>
            <div className='preview-placeholder-icon'>
              <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
              >
                <rect x='3' y='3' width='18' height='18' rx='3' />
                <path d='M3 9h18M9 21V9' />
              </svg>
            </div>
            <p>运行代码后在此预览</p>
            <small>切换到 Code 标签编辑代码后自动触发</small>
          </div>
        )}
        <div
          ref={containerRef}
          id='container'
          style={{
            display: code.trim() ? 'block' : 'none',
            width: '100%',
            minHeight: '400px'
          }}
        />
      </div>
    </div>
  );
}
