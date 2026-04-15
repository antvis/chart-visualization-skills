'use client';

import { useEffect, useRef, useCallback } from 'react';

interface PreviewProps {
  code: string;
  onStatusChange: (status: string, color: string) => void;
}

export default function Preview({ code, onStatusChange }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<unknown>(null);
  const graphInstanceRef = useRef<unknown>(null);

  const execCode = useCallback((container: HTMLDivElement): unknown => {
    const isG6 = code.includes('@antv/g6') || code.includes('new Graph(');
    // @ts-ignore
    const lib = isG6 ? window.G6 : window.G2;

    if (!lib) {
      throw new Error(`${isG6 ? 'G6' : 'G2'} 库尚未加载，请稍后重试`);
    }

    let t = code
      .replace(/import\s*\{[^}]*\}\s*from\s*['"]@antv\/g2['"];?/g, '')
      .replace(/import\s*\{[^}]*\}\s*from\s*['"]@antv\/g6['"];?/g, '')
      .replace(/import\s+\w+\s+from\s*['"]@antv\/g2['"];?/g, '')
      .replace(/import\s+\w+\s+from\s*['"]@antv\/g6['"];?/g, '')
      .replace(/import\s*\*\s*as\s+\w+\s*from\s*['"]@antv\/g2['"];?/g, '')
      .replace(/import\s*\*\s*as\s+\w+\s*from\s*['"]@antv\/g6['"];?/g, '')
      .replace(/container:\s*['"]container['"]/g, 'container: container');

    // Rewrite the first chart/graph variable declaration so the instance is
    // captured in __inst__, making it available for cleanup on the next render.
    t = isG6
      ? t.replace(/\bconst\s+(graph\w*)\s*=\s*new\s+Graph\s*\(/, 'const $1 = __inst__ =  new Graph(')
      : t.replace(/\bconst\s+(chart\w*)\s*=\s*new\s+Chart\s*\(/, 'const $1 = __inst__ =  new Chart(');

    const exec = isG6
      ? `const { Graph } = window.G6;\nlet __inst__ = null;\n${t}\nreturn __inst__;`
      : `const { Chart } = window.G2;\nlet __inst__ = null;\n${t}\nreturn __inst__;`;

    const fn = new Function('container', exec);
    return fn(container);
  }, [code]);

  const runCode = useCallback(() => {
    if (!code.trim() || !containerRef.current) return;

    const destroy = (ref: React.MutableRefObject<unknown>) => {
      if (ref.current && typeof (ref.current as { destroy?: () => void }).destroy === 'function') {
        try { (ref.current as { destroy: () => void }).destroy(); } catch (_) { /* ignore */ }
      }
      ref.current = null;
    };
    destroy(chartInstanceRef);
    destroy(graphInstanceRef);

    const container = containerRef.current;
    container.innerHTML = '';

    try {
      const inst = execCode(container);
      // Store the captured instance so the next runCode call can destroy it
      const isG6 = code.includes('@antv/g6') || code.includes('new Graph(');
      if (isG6) graphInstanceRef.current = inst;
      else chartInstanceRef.current = inst;
      onStatusChange('预览已更新', 'var(--green)');
    } catch (e) {
      console.error(e);
      const error = e as Error;
      container.innerHTML = `<div class="error-block"><strong>运行错误</strong><br>${error.message}</div>`;
      onStatusChange('运行错误', 'var(--red)');
    }
  }, [code, execCode, onStatusChange]);

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
    <div className="preview-panel">
      <div className="panel-header">
        <span className="panel-header-label">预览</span>
      </div>
      <div className="preview-container">
        {!code.trim() && (
          <div className="preview-placeholder">
            <div className="preview-placeholder-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <p>运行代码后在此预览</p>
            <small>切换到 Code 标签编辑代码后自动触发</small>
          </div>
        )}
        <div
          ref={containerRef}
          id="container"
          style={{
            display: code.trim() ? 'block' : 'none',
            width: '100%',
            minHeight: '400px',
          }}
        />
      </div>
    </div>
  );
}
