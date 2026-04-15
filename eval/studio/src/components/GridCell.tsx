'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface EvalCase {
  id?: string;
  description: string;
  codeString: string;
}

interface GridCellProps {
  index: number;
  caseData: EvalCase;
  isSelected: boolean;
  onEdit: () => void;
}

function execChartCode(container: HTMLDivElement, code: string): unknown {
  const isG6 = code.includes('@antv/g6') || code.includes('new Graph(');
  // @ts-ignore
  const lib = isG6 ? window.G6 : window.G2;
  if (!lib) throw new Error(`${isG6 ? 'G6' : 'G2'} 未加载`);

  let t = code
    .replace(/import\s*\{[^}]*\}\s*from\s*['"]@antv\/g2['"];?/g, '')
    .replace(/import\s*\{[^}]*\}\s*from\s*['"]@antv\/g6['"];?/g, '')
    .replace(/import\s+\w+\s+from\s*['"]@antv\/g2['"];?/g, '')
    .replace(/import\s+\w+\s+from\s*['"]@antv\/g6['"];?/g, '')
    .replace(/import\s*\*\s*as\s+\w+\s*from\s*['"]@antv\/g2['"];?/g, '')
    .replace(/import\s*\*\s*as\s+\w+\s*from\s*['"]@antv\/g6['"];?/g, '')
    .replace(/container:\s*['"]container['"]/g, 'container: container');

  // Inject __inst__ capture so the instance can be stored and destroyed later
  t = isG6
    ? t.replace(/\bconst\s+(graph\w*)\s*=\s*new\s+Graph\s*\(/, 'const $1 = __inst__ = new Graph(')
    : t.replace(/\bconst\s+(chart\w*)\s*=\s*new\s+Chart\s*\(/, 'const $1 = __inst__ = new Chart(');

  const exec = isG6
    ? `const { Graph } = window.G6;\nlet __inst__ = null;\n${t}\nreturn __inst__;`
    : `const { Chart } = window.G2;\nlet __inst__ = null;\n${t}\nreturn __inst__;`;

  return new Function('container', exec)(container);
}

type RenderState = 'idle' | 'rendering' | 'ok' | 'error';

export default function GridCell({ index, caseData, isSelected, onEdit }: GridCellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<unknown>(null);
  const [state, setState] = useState<RenderState>('idle');
  const [errMsg, setErrMsg] = useState('');
  const renderedCodeRef = useRef('');
  // Track the current render attempt so stale async callbacks don't update state
  const renderTickRef = useRef(0);

  const setError = useCallback((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    setErrMsg(msg);
    setState('error');
  }, []);

  const render = useCallback(() => {
    const container = chartRef.current;
    if (!container || !caseData.codeString.trim()) return;
    if (renderedCodeRef.current === caseData.codeString) return;

    // Destroy previous instance
    const inst = instanceRef.current as { destroy?: () => void } | null;
    if (inst?.destroy) {
      try { inst.destroy(); } catch (_) { /* ignore cleanup errors */ }
    }
    instanceRef.current = null;
    container.innerHTML = '';

    const tick = ++renderTickRef.current;
    setState('rendering');

    let result: unknown;
    try {
      result = execChartCode(container, caseData.codeString);
    } catch (e) {
      setError(e);
      return;
    }

    // G2 chart.render() returns a Promise — catch async failures
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      (result as Promise<unknown>).then(
        () => {
          if (renderTickRef.current !== tick) return;
          instanceRef.current = result;
          renderedCodeRef.current = caseData.codeString;
          setState('ok');
        },
        (e: unknown) => {
          if (renderTickRef.current !== tick) return;
          setError(e);
        }
      );
    } else {
      instanceRef.current = result;
      renderedCodeRef.current = caseData.codeString;
      setState('ok');
    }
  }, [caseData.codeString, setError]);

  // Lazy render via IntersectionObserver
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) render(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [render]);

  // Re-render when code changes (only if already rendered at least once)
  useEffect(() => {
    if (state !== 'idle') render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData.codeString]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      renderTickRef.current = -1; // invalidate any pending async callbacks
      const inst = instanceRef.current as { destroy?: () => void } | null;
      if (inst?.destroy) {
        try { inst.destroy(); } catch (_) { /* ignore */ }
      }
    };
  }, []);

  const desc = caseData.description.replace(/\n/g, ' ').trim();
  const shortDesc = desc.length > 60 ? `${desc.slice(0, 60)}…` : desc;

  return (
    <div
      ref={rootRef}
      className={`grid-cell${isSelected ? ' selected' : ''}`}
      onClick={onEdit}
      title={desc}
    >
      {/* Outer wrapper — position:relative anchor */}
      <div className="grid-cell-chart">
        {/* Chart mount point: only touched by imperative G2/G6 code, never by React */}
        <div ref={chartRef} style={{ width: '100%', height: '100%' }} />

        {/* Overlays: managed exclusively by React, positioned absolutely over the chart */}
        {(state === 'idle' || state === 'rendering') && (
          <div className="grid-cell-placeholder">
            <div className="spinner" />
          </div>
        )}
        {state === 'error' && (
          <div className="grid-cell-error">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3M8 10.5v.5" strokeLinecap="round" />
            </svg>
            <span>{errMsg}</span>
          </div>
        )}
      </div>

      <div className="grid-cell-footer">
        <span className="grid-cell-num">#{index + 1}</span>
        <span className="grid-cell-desc">{shortDesc}</span>
        <button
          className="grid-cell-edit"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="编辑此 case"
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" strokeLinejoin="round" />
          </svg>
          编辑
        </button>
      </div>
    </div>
  );
}
