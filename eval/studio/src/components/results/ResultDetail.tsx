'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import MonacoEditor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { execChartCode } from '@/lib/execChartCode';
import { detectBlankScreen } from '@/lib/detectBlankScreen';
import type { EvalResult, EvalRun, RenderState } from './types';

interface ResultDetailProps {
  run: EvalRun | null;
  currentIndex: number;
  renderResults: Record<string, RenderState>;
  onRenderResult: (id: string, state: RenderState) => void;
  onPrev: () => void;
  onNext: () => void;
  onRunAll: () => void;
  isRunningAll: boolean;
  onShowStats: () => void;
  onShowCompare: () => void;
}

const renderBadgeCls: Record<RenderState, string> = {
  success: 'bg-green/10 text-green',
  blank:   'bg-amber-dim text-amber',
  error:   'bg-red-dim text-red',
  pending: 'bg-active text-fg-subtle',
};

const renderBadgeLabel: Record<RenderState, string> = {
  success: '✓ OK',
  blank:   '◻ Blank',
  error:   '✗ Error',
  pending: '⏳ Pending',
};

const simColorCls = (sim: number) => sim >= 0.5 ? 'text-green' : sim >= 0.3 ? 'text-amber' : 'text-red';

const btnBase = 'inline-flex items-center gap-1 h-[28px] px-[11px] border rounded-[6px] text-[12px] font-medium font-[inherit] cursor-pointer transition-all duration-150 whitespace-nowrap disabled:opacity-35 disabled:cursor-not-allowed';

export default function ResultDetail({
  run, currentIndex, renderResults, onRenderResult,
  onPrev, onNext, onRunAll, isRunningAll, onShowStats, onShowCompare,
}: ResultDetailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<unknown>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [renderStatus, setRenderStatus] = useState<RenderState>('pending');

  const result: EvalResult | null = run?.results[currentIndex] ?? null;
  const code = result?.generatedCode ?? '';

  useEffect(() => {
    if (editorRef.current && code !== editorRef.current.getValue()) editorRef.current.setValue(code);
  }, [code]);

  useEffect(() => {
    if (!result) return;
    const cached = renderResults[result.id ?? `test-${currentIndex}`];
    setRenderStatus(cached ?? 'pending');
  }, [currentIndex, result, renderResults]);

  const runCode = useCallback(async (overrideCode?: string) => {
    const src = overrideCode ?? editorRef.current?.getValue() ?? code;
    if (!src.trim() || !containerRef.current) return;

    const inst = instanceRef.current as { destroy?: () => void } | null;
    if (inst?.destroy) { try { inst.destroy(); } catch (_) { /**/ } }
    instanceRef.current = null;

    const container = containerRef.current;
    container.innerHTML = '';
    setRenderStatus('pending');

    try {
      let instance = execChartCode(container, src);
      if (instance && typeof (instance as Promise<unknown>).then === 'function') {
        instance = await Promise.race([
          instance as Promise<unknown>,
          new Promise((_, rej) => setTimeout(() => rej(new Error('Render timeout (5s)')), 5000)),
        ]);
      }
      instanceRef.current = instance;

      const isG6 = src.includes('@antv/g6') || src.includes('new Graph(');
      await new Promise<void>((resolve) => {
        if (isG6) {
          requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 200)));
        } else {
          setTimeout(resolve, 300);
        }
      });

      const state: RenderState = detectBlankScreen(container) ? 'blank' : 'success';
      setRenderStatus(state);
      if (result) onRenderResult(result.id ?? `test-${currentIndex}`, state);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      container.innerHTML = `<div class="rs-error-block"><strong>Run Error</strong><br>${msg}</div>`;
      setRenderStatus('error');
      if (result) onRenderResult(result.id ?? `test-${currentIndex}`, 'error');
    }
  }, [code, result, currentIndex, onRenderResult]);

  useEffect(() => {
    if (!code.trim()) return;
    const isG6 = code.includes('@antv/g6') || code.includes('new Graph(');
    let poll: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => {
      const check = () => {
        // @ts-ignore
        const ready = isG6 ? !!window.G6 : !!window.G2;
        if (ready) { runCode(); } else { poll = setTimeout(check, 200); }
      };
      check();
    }, 400);
    return () => { clearTimeout(timer); clearTimeout(poll!); };
  }, [currentIndex, run?.dataset]); // eslint-disable-line react-hooks/exhaustive-deps

  const copyCode = () => { navigator.clipboard.writeText(editorRef.current?.getValue() ?? code); };

  const exportBadCases = () => {
    if (!run) return;
    const bad = run.results.filter((r, i) => {
      const rs = renderResults[r.id ?? `test-${i}`];
      const sim = r.evaluation?.similarity ?? 0;
      return !!r.error || rs === 'error' || rs === 'blank' || sim < 0.3 || r.evaluation?.hasIssues;
    });
    if (bad.length === 0) { alert('No bad cases found.'); return; }
    const blob = new Blob([JSON.stringify({ source: run.dataset, exportedAt: new Date().toISOString(), badCases: bad }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bad-cases-${run.dataset.replace('.json', '')}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sim = result?.evaluation?.similarity ?? 0;
  const simCls = sim >= 0.5 ? 'high' : sim >= 0.3 ? 'medium' : 'low';
  const totalVisible = run?.results.length ?? 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Toolbar */}
      <div className="h-11 bg-surface-subtle border-b border-border-subtle flex items-center px-3 gap-[6px] shrink-0">
        <Link href="/" className={`${btnBase} bg-transparent border-border text-fg-muted hover:bg-hover hover:text-fg hover:border-border-focus`} title="切换到数据集编辑器">← Studio</Link>
        <div className="w-px h-5 bg-border mx-[2px] shrink-0" />
        <button className={`${btnBase} bg-accent border-accent text-white hover:bg-accent-hover hover:border-accent-hover`} onClick={() => runCode()}>▶ Run</button>
        <button className={`${btnBase} bg-purple border-purple text-white hover:bg-[#9333ea] hover:border-[#9333ea] disabled:bg-border disabled:border-border disabled:text-fg-subtle`} onClick={onRunAll} disabled={isRunningAll || !run} title="Run all results sequentially">
          {isRunningAll ? '⏳ Running…' : '▶▶ Run All'}
        </button>
        <button className={`${btnBase} bg-transparent border-border text-fg-muted hover:bg-hover hover:text-fg hover:border-border-focus`} onClick={copyCode}>Copy</button>
        <button className={`${btnBase} bg-green border-green text-white hover:bg-[#16a34a] hover:border-[#16a34a]`} onClick={onShowStats} disabled={!run}>Stats</button>
        <button className={`${btnBase} bg-amber border-amber text-white hover:bg-[#d97706] hover:border-[#d97706]`} onClick={onShowCompare} disabled={!run}>Compare</button>
        <button className={`${btnBase} bg-red border-red text-white hover:bg-[#dc2626] hover:border-[#dc2626]`} onClick={exportBadCases} disabled={!run}>Export Bad</button>
        <div className="flex-1" />
        <button className={`${btnBase} bg-transparent border-border text-fg-muted hover:bg-hover hover:text-fg hover:border-border-focus`} onClick={onPrev} disabled={currentIndex <= 0}>◀ Prev</button>
        <span className="text-[11px] text-fg-subtle min-w-[48px] text-center tabular-nums">{run ? `${currentIndex + 1} / ${totalVisible}` : '—'}</span>
        <button className={`${btnBase} bg-transparent border-border text-fg-muted hover:bg-hover hover:text-fg hover:border-border-focus`} onClick={onNext} disabled={!run || currentIndex >= totalVisible - 1}>Next ▶</button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code panel */}
        <div className="w-[44%] min-w-[300px] flex flex-col border-r border-border-subtle bg-surface-subtle">
          <div className="h-9 flex items-center px-[14px] gap-2 border-b border-border-subtle bg-panel shrink-0 text-[11px] font-semibold text-fg-muted uppercase tracking-[0.6px]">
            Generated Code
          </div>
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              language="javascript"
              theme="vs-light"
              defaultValue=""
              onMount={(e) => { editorRef.current = e; if (code) e.setValue(code); }}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono','Fira Code','Monaco',monospace",
                lineHeight: 1.6,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 2,
                renderLineHighlight: 'none',
                overviewRulerLanes: 0,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>
        </div>

        {/* Preview + info */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-9 flex items-center px-[14px] gap-2 border-b border-border-subtle bg-panel shrink-0 text-[11px] font-semibold text-fg-muted uppercase tracking-[0.6px]">
            Preview
            <span className={`text-[11px] font-medium px-2 py-[2px] rounded-full ml-[6px] ${renderBadgeCls[renderStatus]}`}>
              {renderBadgeLabel[renderStatus]}
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 360 }} />
          </div>

          {/* Info panel */}
          {result && (
            <div className="border-t border-border-subtle px-[14px] py-3 bg-surface-subtle flex flex-col gap-[10px] max-h-[180px] overflow-y-auto shrink-0">
              {/* Similarity bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] text-fg-subtle">
                  <span>Similarity</span>
                  <span className={`font-semibold ${simColorCls(sim)}`}>{(sim * 100).toFixed(1)}%</span>
                </div>
                <div className="h-[6px] bg-active rounded-[3px] overflow-hidden">
                  <div
                    className={`h-full rounded-[3px] transition-[width] duration-300 ${simCls === 'high' ? 'bg-green' : simCls === 'medium' ? 'bg-amber' : 'bg-red'}`}
                    style={{ width: `${sim * 100}%` }}
                  />
                </div>
              </div>

              {/* Skills */}
              {(result.loadedSkillPaths ?? []).length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-[11px] text-fg-subtle shrink-0 pt-[2px]">Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set((result.loadedSkillPaths ?? []).map((p) => p.split('/').pop()?.replace('.md', '') ?? p))].map((s) => (
                      <span key={s} className="px-[7px] py-[1px] rounded-full text-[10px] font-medium bg-amber-dim text-amber">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues */}
              {(result.error || (result.evaluation?.hasIssues && (result.evaluation.issues ?? []).length > 0)) && (
                <div className="flex flex-col gap-1">
                  {result.error && <div className="text-[11px] py-[3px] text-red">✗ {result.error}</div>}
                  {(result.evaluation?.issues ?? []).map((issue, i) => (
                    <div key={i} className="text-[11px] py-[3px] text-amber">⚠ {issue}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
