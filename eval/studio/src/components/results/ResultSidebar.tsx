'use client';

import { useMemo } from 'react';
import type { EvalRun, EvalResult, RenderState, FilterType } from './types';

interface DatasetMeta {
  name: string;
  modified: string;
  summary: { model?: string; avgSimilarity?: number; totalTests?: number };
}

interface ResultSidebarProps {
  datasets: DatasetMeta[];
  currentFile: string;
  run: EvalRun | null;
  renderResults: Record<string, RenderState>;
  currentIndex: number;
  filter: FilterType;
  search: string;
  onFileChange: (file: string) => void;
  onFilterChange: (f: FilterType) => void;
  onSearchChange: (s: string) => void;
  onSelect: (index: number) => void;
}

function simClass(sim: number) {
  if (sim >= 0.5) return 'high';
  if (sim >= 0.3) return 'medium';
  return 'low';
}

function isBadCase(result: EvalResult, renderState?: RenderState): boolean {
  const sim = result.evaluation?.similarity ?? 0;
  return !!result.error || renderState === 'error' || renderState === 'blank' || sim < 0.3 || result.evaluation?.hasIssues;
}

const simColorCls = { high: 'text-green', medium: 'text-amber', low: 'text-red' } as const;

export default function ResultSidebar({
  datasets, currentFile, run, renderResults, currentIndex,
  filter, search, onFileChange, onFilterChange, onSearchChange, onSelect,
}: ResultSidebarProps) {
  const results = run?.results ?? [];

  const filtered = useMemo(() => {
    return results
      .map((r, i) => ({ r, i }))
      .filter(({ r, i }) => {
        const rs = renderResults[r.id ?? `test-${i}`];
        const lib = (r.library ?? 'g2').toLowerCase();
        const q = search.toLowerCase();
        const matchSearch = !q || (r.id ?? '').toLowerCase().includes(q) || (r.query ?? '').toLowerCase().includes(q) || lib.includes(q);
        let matchFilter = true;
        if (filter === 'bad')          matchFilter = isBadCase(r, rs);
        else if (filter === 'blank')        matchFilter = rs === 'blank';
        else if (filter === 'render_error') matchFilter = rs === 'error';
        else if (filter === 'g2')           matchFilter = lib === 'g2';
        else if (filter === 'g6')           matchFilter = lib === 'g6';
        return matchSearch && matchFilter;
      });
  }, [results, renderResults, filter, search]);

  const summary = run?.summary;

  return (
    <aside className="w-[320px] min-w-[280px] bg-surface border-r border-border-subtle flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-[14px] pt-[14px] pb-[10px] border-b border-border-subtle flex flex-col gap-[10px] shrink-0">
        <div className="flex items-center gap-[6px] text-[13px] font-semibold text-fg">
          <img width={24} height={24} src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*FBLnQIAzx6cAAAAAQDAAAAgAemJ7AQ/original" alt="Eval" />
          Eval Results
        </div>

        <select
          className="w-full h-[30px] px-[10px] bg-surface-subtle border border-border rounded-[6px] text-fg text-[12px] font-[inherit] cursor-pointer outline-none focus:border-border-focus"
          value={currentFile}
          onChange={(e) => onFileChange(e.target.value)}
        >
          {datasets.map((d) => {
            const label = d.name.replace(/^eval-/, '').replace(/\.json$/, '');
            const pct = d.summary?.avgSimilarity ? ` · ${(d.summary.avgSimilarity * 100).toFixed(0)}%` : '';
            return <option key={d.name} value={d.name} title={d.name}>{label}{pct}</option>;
          })}
        </select>

        {summary && (
          <div className="grid grid-cols-4 gap-[6px]">
            {[
              { label: 'Total',    value: summary.totalTests,   cls: 'text-accent' },
              { label: 'OK',       value: summary.successCount, cls: 'text-green' },
              { label: 'Avg Sim',  value: summary.avgSimilarity ? `${(summary.avgSimilarity * 100).toFixed(0)}%` : '—', cls: 'text-accent' },
              { label: 'Avg Time', value: summary.avgDuration ? `${summary.avgDuration.toFixed(0)}ms` : '—', cls: 'text-fg' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="bg-surface-subtle border border-border-subtle rounded-[6px] px-1 py-[6px] text-center">
                <div className={`text-[15px] font-semibold tabular-nums ${cls}`}>{value}</div>
                <div className="text-[10px] text-fg-subtle mt-[2px] uppercase tracking-[0.3px]">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative flex items-center">
          <svg className="absolute left-2 w-[13px] h-[13px] text-fg-subtle pointer-events-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="4" />
            <path d="M10.5 10.5L14 14" strokeLinecap="round" />
          </svg>
          <input
            className="w-full h-[30px] pl-7 pr-7 bg-surface-subtle border border-border rounded-[6px] text-fg text-[12px] font-[inherit] outline-none focus:border-border-focus"
            type="text"
            placeholder="搜索 ID、query、library…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button className="absolute right-[6px] bg-none border-none text-fg-subtle cursor-pointer text-[12px] p-[2px] leading-none hover:text-fg" onClick={() => onSearchChange('')}>
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1 items-center">
          {(['all', 'bad', 'blank', 'render_error', 'g2', 'g6'] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`px-[9px] py-[3px] border rounded-full text-[11px] font-medium font-[inherit] cursor-pointer transition-all duration-150 ${
                filter === f ? 'bg-accent text-white border-accent' : 'bg-transparent border-border text-fg-muted hover:bg-hover hover:border-border-focus'
              }`}
              onClick={() => onFilterChange(f)}
            >
              {f === 'all' ? 'All' : f === 'bad' ? 'Bad' : f === 'blank' ? 'Blank' : f === 'render_error' ? 'Error' : f.toUpperCase()}
            </button>
          ))}
          {(search || filter !== 'all') && (
            <span className="text-[11px] text-fg-subtle ml-auto">{filtered.length}/{results.length}</span>
          )}
        </div>
      </div>

      {/* Result list */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
        {filtered.map(({ r, i }) => {
          const sim = r.evaluation?.similarity ?? 0;
          const rs = renderResults[r.id ?? `test-${i}`];
          const lib = (r.library ?? 'g2').toLowerCase();
          const bad = isBadCase(r, rs);
          const active = i === currentIndex;

          return (
            <div
              key={r.id ?? i}
              className={`px-[14px] py-[10px] border-b border-border-subtle cursor-pointer transition-colors duration-100
                ${active ? 'bg-accent-dim border-l-[3px] border-l-accent pl-[11px]'
                  : bad   ? 'bg-amber-dim border-l-[3px] border-l-amber pl-[11px] hover:bg-amber-dim/80'
                  : 'hover:bg-hover'}`}
              onClick={() => onSelect(i)}
            >
              <div className="flex items-center gap-[6px] mb-1 text-[11px]">
                <span className={`px-[6px] py-[1px] rounded-full text-[10px] font-bold uppercase tracking-[0.3px] ${lib === 'g6' ? 'bg-green/12 text-green' : 'bg-accent-dim text-accent'}`}>
                  {lib.toUpperCase()}
                </span>
                <span className="text-fg-subtle">{r.id ?? `#${i + 1}`}</span>
                {rs === 'success' && <span className="font-semibold text-green" title="Render OK">✓</span>}
                {rs === 'blank'   && <span className="font-semibold text-amber" title="Blank">◻</span>}
                {rs === 'error'   && <span className="font-semibold text-red"   title="Error">✗</span>}
              </div>
              <div className="text-[12px] text-fg-muted leading-[1.45] overflow-hidden line-clamp-2 mb-[5px]">{r.query}</div>
              <div className="flex gap-2 items-center text-[11px]">
                <span className={`font-semibold ${simColorCls[simClass(sim) as keyof typeof simColorCls]}`}>{(sim * 100).toFixed(0)}%</span>
                <span className="text-fg-subtle">{r.duration ?? 0}ms</span>
                {r.error && <span className="px-[6px] py-[1px] rounded-full text-[10px] font-medium bg-red-dim text-red">✗ Error</span>}
                {!r.error && r.evaluation?.hasIssues && <span className="px-[6px] py-[1px] rounded-full text-[10px] font-medium bg-amber-dim text-amber">⚠ Issues</span>}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="px-4 py-6 text-center text-fg-subtle text-[12px]">暂无匹配结果</div>}
      </div>
    </aside>
  );
}
