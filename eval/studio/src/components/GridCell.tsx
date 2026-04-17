'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { execChartCode } from '@/lib/execChartCode';

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

type RenderState = 'idle' | 'rendering' | 'ok' | 'error';

export default function GridCell({ index, caseData, isSelected, onEdit }: GridCellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<unknown>(null);
  const [state, setState] = useState<RenderState>('idle');
  const [errMsg, setErrMsg] = useState('');
  const renderedCodeRef = useRef('');
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

    const inst = instanceRef.current as { destroy?: () => void } | null;
    if (inst?.destroy) {
      try { inst.destroy(); } catch (_) { /* ignore */ }
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

  useEffect(() => {
    if (state !== 'idle') render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData.codeString]);

  useEffect(() => {
    return () => {
      renderTickRef.current = -1;
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
      className={`bg-surface border rounded-[12px] overflow-hidden cursor-pointer transition-[box-shadow,border-color,transform] duration-150 flex flex-col group
        ${isSelected
          ? 'border-accent shadow-[0_0_0_2px_var(--color-accent-dim),0_4px_16px_rgba(99,102,241,0.15)]'
          : 'border-border hover:border-accent hover:shadow-[0_4px_16px_rgba(99,102,241,0.12)] hover:-translate-y-px'
        }`}
      onClick={onEdit}
      title={desc}
    >
      <div className="h-[220px] relative overflow-hidden bg-app border-b border-border-subtle">
        <div ref={chartRef} style={{ width: '100%', height: '100%' }} />

        {(state === 'idle' || state === 'rendering') && (
          <div className="absolute inset-0 flex items-center justify-center bg-app z-[1] pointer-events-none">
            <div className="spinner" />
          </div>
        )}
        {state === 'error' && (
          <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 p-4 bg-red-dim text-red text-[11px] text-center">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3M8 10.5v.5" strokeLinecap="round" />
            </svg>
            <span className="break-words opacity-80">{errMsg}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-[10px] bg-surface min-h-[48px]">
        <span className={`text-[10px] font-bold shrink-0 font-mono ${isSelected ? 'text-accent' : 'text-fg-subtle'}`}>
          #{index + 1}
        </span>
        <span className="flex-1 text-[11.5px] text-fg-muted leading-[1.4] overflow-hidden line-clamp-2 break-all">
          {shortDesc}
        </span>
        <button
          className="inline-flex items-center gap-1 h-[26px] px-2 bg-accent-dim border border-accent/30 rounded-[6px] text-accent text-[11px] font-medium font-[inherit] cursor-pointer transition-all duration-150 whitespace-nowrap shrink-0 opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-white hover:border-accent"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="编辑此 case"
        >
          <svg className="w-[11px] h-[11px]" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" strokeLinejoin="round" />
          </svg>
          编辑
        </button>
      </div>
    </div>
  );
}
