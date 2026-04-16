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

export default function ResultDetail({
  run,
  currentIndex,
  renderResults,
  onRenderResult,
  onPrev,
  onNext,
  onRunAll,
  isRunningAll,
  onShowStats,
  onShowCompare,
}: ResultDetailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<unknown>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [renderStatus, setRenderStatus] = useState<RenderState>('pending');

  const result: EvalResult | null = run?.results[currentIndex] ?? null;
  const code = result?.generatedCode ?? '';

  // Sync editor when result changes
  useEffect(() => {
    if (editorRef.current && code !== editorRef.current.getValue()) {
      editorRef.current.setValue(code);
    }
  }, [code]);

  // Reflect cached render state when switching results
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

      // G6 uses RAF-based async rendering: even after render() resolves the canvas
      // may not be painted yet. Wait for 2 animation frames then add a safety buffer.
      const isG6 = src.includes('@antv/g6') || src.includes('new Graph(');
      await new Promise<void>((resolve) => {
        if (isG6) {
          // Wait 2 RAFs + 200ms to cover slow layouts / large graphs
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

  // Auto-run when result changes
  useEffect(() => {
    if (!code.trim()) return;
    const isG6 = code.includes('@antv/g6') || code.includes('new Graph(');
    let poll: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => {
      const check = () => {
        // @ts-ignore
        const ready = isG6 ? !!window.G6 : !!window.G2;
        if (ready) { runCode(); }
        else { poll = setTimeout(check, 200); }
      };
      check();
    }, 400);
    return () => { clearTimeout(timer); clearTimeout(poll!); };
  }, [currentIndex]); // intentionally only re-run when index changes, not on code edit

  const copyCode = () => {
    const src = editorRef.current?.getValue() ?? code;
    navigator.clipboard.writeText(src);
  };

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
  const simClass = sim >= 0.5 ? 'high' : sim >= 0.3 ? 'medium' : 'low';
  const totalVisible = run?.results.length ?? 0;

  return (
    <div className="rs-detail">
      {/* Toolbar */}
      <div className="rs-toolbar">
        <Link href="/" className="rs-btn" title="切换到数据集编辑器">← Studio</Link>
        <div className="rs-toolbar-sep" />
        <button className="rs-btn primary" onClick={() => runCode()}>▶ Run</button>
        <button
          className="rs-btn purple"
          onClick={onRunAll}
          disabled={isRunningAll || !run}
          title="Run all results sequentially"
        >
          {isRunningAll ? '⏳ Running…' : '▶▶ Run All'}
        </button>
        <button className="rs-btn" onClick={copyCode}>Copy</button>
        <button className="rs-btn green" onClick={onShowStats} disabled={!run}>Stats</button>
        <button className="rs-btn amber" onClick={onShowCompare} disabled={!run}>Compare</button>
        <button className="rs-btn red" onClick={exportBadCases} disabled={!run}>Export Bad</button>
        <div className="rs-toolbar-spacer" />
        <button className="rs-btn" onClick={onPrev} disabled={currentIndex <= 0}>◀ Prev</button>
        <span className="rs-nav-pos">{run ? `${currentIndex + 1} / ${totalVisible}` : '—'}</span>
        <button className="rs-btn" onClick={onNext} disabled={!run || currentIndex >= totalVisible - 1}>Next ▶</button>
      </div>

      {/* Content */}
      <div className="rs-content">
        {/* Code panel */}
        <div className="rs-code-panel">
          <div className="rs-panel-header">Generated Code</div>
          <div className="rs-code-editor">
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
        <div className="rs-preview-panel">
          <div className="rs-panel-header">
            Preview
            <span className={`rs-render-badge ${renderStatus}`}>
              {renderStatus === 'success' ? '✓ OK' :
               renderStatus === 'blank'   ? '◻ Blank' :
               renderStatus === 'error'   ? '✗ Error' : '⏳ Pending'}
            </span>
          </div>
          <div className="rs-preview-container">
            <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 360 }} />
          </div>

          {/* Info panel */}
          {result && (
            <div className="rs-info-panel">
              {/* Similarity bar */}
              <div className="rs-sim-bar-wrap">
                <div className="rs-sim-bar-label">
                  <span>Similarity</span>
                  <span className={`rs-sim-value ${simClass}`}>{(sim * 100).toFixed(1)}%</span>
                </div>
                <div className="rs-sim-bar-bg">
                  <div className={`rs-sim-bar-fill ${simClass}`} style={{ width: `${sim * 100}%` }} />
                </div>
              </div>

              {/* Skills */}
              {(result.loadedSkillPaths ?? []).length > 0 && (
                <div className="rs-info-row">
                  <span className="rs-info-label">Skills</span>
                  <div className="rs-tags">
                    {[...new Set((result.loadedSkillPaths ?? []).map((p) => p.split('/').pop()?.replace('.md', '') ?? p))].map((s) => (
                      <span key={s} className="rs-tag amber">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues / errors */}
              {(result.error || (result.evaluation?.hasIssues && (result.evaluation.issues ?? []).length > 0)) && (
                <div className="rs-issues">
                  {result.error && <div className="rs-issue-item err">✗ {result.error}</div>}
                  {(result.evaluation?.issues ?? []).map((issue, i) => (
                    <div key={i} className="rs-issue-item warn">⚠ {issue}</div>
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
