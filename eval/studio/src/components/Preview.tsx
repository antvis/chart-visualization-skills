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
      try { inst.destroy(); } catch (_) { /* ignore */ }
    }
    instanceRef.current = null;

    const container = containerRef.current;
    container.innerHTML = '';

    try {
      instanceRef.current = execChartCode(container, code);
      onStatusChange('预览已更新', 'var(--color-green)');
    } catch (e) {
      const error = e as Error;
      container.innerHTML = `<div class="error-block"><strong>运行错误</strong><br>${error.message}</div>`;
      onStatusChange('运行错误', 'var(--color-red)');
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
    <div className="flex-1 flex flex-col bg-app">
      <div className="h-[38px] flex items-center px-[14px] gap-2 border-b border-border-subtle bg-panel shrink-0">
        <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-[0.6px]">预览</span>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-auto p-6">
        {!code.trim() && (
          <div className="text-center text-fg-subtle">
            <div className="w-14 h-14 mx-auto mb-[14px] border-2 border-dashed border-border rounded-[12px] flex items-center justify-center">
              <svg className="w-6 h-6 text-fg-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <p className="text-[13px] mb-1 text-fg-muted">运行代码后在此预览</p>
            <small className="text-[11px] text-fg-subtle">切换到 Code 标签编辑代码后自动触发</small>
          </div>
        )}
        <div
          ref={containerRef}
          id="container"
          style={{ display: code.trim() ? 'block' : 'none', width: '100%', minHeight: '400px' }}
        />
      </div>
    </div>
  );
}
