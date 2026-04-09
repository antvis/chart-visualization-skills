'use client';

import { useEffect, useRef, useCallback } from 'react';
// @ts-ignore - G2 is loaded via CDN in development
// @ts-ignore - G6 is loaded via CDN in development

interface PreviewProps {
  code: string;
  onStatusChange: (status: string, color: string) => void;
}

export default function Preview({ code, onStatusChange }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<unknown>(null);
  const graphInstanceRef = useRef<unknown>(null);

  const runCode = useCallback(() => {
    if (!code.trim() || !containerRef.current) return;

    // Destroy previous instances
    if (
      chartInstanceRef.current &&
      typeof (chartInstanceRef.current as { destroy: () => void }).destroy ===
        'function'
    ) {
      (chartInstanceRef.current as { destroy: () => void }).destroy();
    }
    if (
      graphInstanceRef.current &&
      typeof (graphInstanceRef.current as { destroy: () => void }).destroy ===
        'function'
    ) {
      (graphInstanceRef.current as { destroy: () => void }).destroy();
    }
    chartInstanceRef.current = null;
    graphInstanceRef.current = null;

    const container = containerRef.current;
    container.innerHTML = '';

    try {
      let t = code
        .replace(/import\s*\{[^}]*\}\s*from\s*['"]@antv\/g2['"];?/g, '')
        .replace(/import\s*\{[^}]*\}\s*from\s*['"]@antv\/g6['"];?/g, '')
        .replace(/import\s+\w+\s+from\s*['"]@antv\/g2['"];?/g, '')
        .replace(/import\s+\w+\s+from\s*['"]@antv\/g6['"];?/g, '')
        .replace(/import\s*\*\s*as\s+\w+\s*from\s*['"]@antv\/g2['"];?/g, '')
        .replace(/import\s*\*\s*as\s+\w+\s*from\s*['"]@antv\/g6['"];?/g, '')
        .replace(/container:\s*['"]container['"]/g, 'container: container');

      const isG6 = code.includes('@antv/g6') || code.includes('new Graph(');

      // Use global G2/G6 from CDN
      // @ts-ignore
      const G2 = window.G2;
      // @ts-ignore
      const G6 = window.G6;

      const exec = isG6
        ? `const { Graph } = window.G6;\n${t}`
        : `const { Chart } = window.G2;\n${t}`;

      // Create a function and execute
      const fn = new Function('container', exec);
      fn(container);

      onStatusChange('预览已更新', 'var(--green)');
    } catch (e) {
      console.error(e);
      const error = e as Error;
      container.innerHTML = `<div class="error-block"><strong>运行错误</strong><br>${error.message}</div>`;
      onStatusChange('运行错误', 'var(--red)');
    }
  }, [code, onStatusChange]);

  // Auto-run code with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.trim()) {
        runCode();
      }
    }, 1000);

    return () => clearTimeout(timer);
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
            <small>点击「运行」或修改代码自动触发</small>
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
