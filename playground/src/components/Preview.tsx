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

  const execCode = useCallback((container: HTMLDivElement) => {
    const isG6 = code.includes('@antv/g6') || code.includes('new Graph(');
    // @ts-ignore
    const lib = isG6 ? window.G6 : window.G2;

    if (!lib) {
      throw new Error(`${isG6 ? 'G6' : 'G2'} 库尚未加载，请稍后重试`);
    }

    // Extract all named imports before stripping — handles multi-line, aliases, `type X`
    const extractNames = (src: string, pkg: string): string[] => {
      const names: string[] = [];
      const re = new RegExp(
        `import\\s+(?:type\\s+)?\\{([^}]*)\\}\\s*from\\s*['"]${pkg}['"];?`,
        'gs'
      );
      for (const m of src.matchAll(re)) {
        m[1].split(',').forEach((token) => {
          const cleaned = token.trim().replace(/^type\s+/, '');
          const name = cleaned.split(/\s+as\s+/).pop()?.trim();
          if (name) names.push(name);
        });
      }
      return names;
    };

    const g6Names = extractNames(code, '@antv/g6');
    const g2Names = extractNames(code, '@antv/g2');

    let t = code
      .replace(/import\s*\{[^}]*\}\s*from\s*['"]@antv\/g2['"];?/g, '')
      .replace(/import\s*\{[^}]*\}\s*from\s*['"]@antv\/g6['"];?/g, '')
      .replace(/import\s+\w+\s+from\s*['"]@antv\/g2['"];?/g, '')
      .replace(/import\s+\w+\s+from\s*['"]@antv\/g6['"];?/g, '')
      .replace(/import\s*\*\s*as\s+\w+\s*from\s*['"]@antv\/g2['"];?/g, '')
      .replace(/import\s*\*\s*as\s+\w+\s*from\s*['"]@antv\/g6['"];?/g, '')
      .replace(/container:\s*['"]container['"]/g, 'container: container');

    const g6Destructure = [...new Set(['Graph', ...g6Names])].join(', ');
    const g2Destructure = [...new Set(['Chart', ...g2Names])].join(', ');

    const exec = isG6
      ? `const { ${g6Destructure} } = window.G6;\n${t}`
      : `const { ${g2Destructure} } = window.G2;\n${t}`;

    const fn = new Function('container', exec);
    fn(container);
  }, [code]);

  const runCode = useCallback(() => {
    if (!code.trim() || !containerRef.current) return;

    if (
      chartInstanceRef.current &&
      typeof (chartInstanceRef.current as { destroy: () => void }).destroy === 'function'
    ) {
      (chartInstanceRef.current as { destroy: () => void }).destroy();
    }
    if (
      graphInstanceRef.current &&
      typeof (graphInstanceRef.current as { destroy: () => void }).destroy === 'function'
    ) {
      (graphInstanceRef.current as { destroy: () => void }).destroy();
    }
    chartInstanceRef.current = null;
    graphInstanceRef.current = null;

    const container = containerRef.current;
    container.innerHTML = '';

    try {
      execCode(container);
      onStatusChange('预览已更新', 'var(--green)');
    } catch (e) {
      console.error(e);
      const error = e as Error;
      container.innerHTML = `<div class="error-block"><strong>运行错误</strong><br>${error.message}</div>`;
      onStatusChange('运行错误', 'var(--red)');
    }
  }, [code, execCode, onStatusChange]);

  // Auto-run code with debounce; poll until CDN library is ready
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
