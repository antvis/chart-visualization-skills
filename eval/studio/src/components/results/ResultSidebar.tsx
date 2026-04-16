'use client';

import { useMemo } from 'react';
import type { EvalRun, EvalResult, RenderState, FilterType } from './types';

interface DatasetMeta {
  name: string;
  modified: string;
  summary: {
    model?: string;
    avgSimilarity?: number;
    totalTests?: number;
  };
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
  return (
    !!result.error ||
    renderState === 'error' ||
    renderState === 'blank' ||
    sim < 0.3 ||
    result.evaluation?.hasIssues
  );
}

export default function ResultSidebar({
  datasets,
  currentFile,
  run,
  renderResults,
  currentIndex,
  filter,
  search,
  onFileChange,
  onFilterChange,
  onSearchChange,
  onSelect
}: ResultSidebarProps) {
  const results = run?.results ?? [];

  const filtered = useMemo(() => {
    return results
      .map((r, i) => ({ r, i }))
      .filter(({ r, i }) => {
        const rs = renderResults[r.id ?? `test-${i}`];
        const lib = (r.library ?? 'g2').toLowerCase();
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          (r.id ?? '').toLowerCase().includes(q) ||
          (r.query ?? '').toLowerCase().includes(q) ||
          lib.includes(q);
        let matchFilter = true;
        if (filter === 'bad') matchFilter = isBadCase(r, rs);
        else if (filter === 'blank') matchFilter = rs === 'blank';
        else if (filter === 'render_error') matchFilter = rs === 'error';
        else if (filter === 'g2') matchFilter = lib === 'g2';
        else if (filter === 'g6') matchFilter = lib === 'g6';
        return matchSearch && matchFilter;
      });
  }, [results, renderResults, filter, search]);

  const summary = run?.summary;

  return (
    <aside className='rs-sidebar'>
      {/* Header */}
      <div className='rs-sidebar-header'>
        <div className='rs-sidebar-title'>
          <img
            width={24}
            height={24}
            src='https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*FBLnQIAzx6cAAAAAQDAAAAgAemJ7AQ/original'
            alt='Eval'
          ></img>
          Eval Results
        </div>

        <select
          className='rs-dataset-select'
          value={currentFile}
          onChange={(e) => onFileChange(e.target.value)}
        >
          {datasets.map((d) => {
            const label = d.name.replace(/^eval-/, '').replace(/\.json$/, '');
            const pct = d.summary?.avgSimilarity
              ? ` · ${(d.summary.avgSimilarity * 100).toFixed(0)}%`
              : '';
            return (
              <option key={d.name} value={d.name} title={d.name}>
                {label}
                {pct}
              </option>
            );
          })}
        </select>

        {summary && (
          <div className='rs-stats-grid'>
            <div className='rs-stat'>
              <div className='rs-stat-value accent'>{summary.totalTests}</div>
              <div className='rs-stat-label'>Total</div>
            </div>
            <div className='rs-stat'>
              <div className='rs-stat-value green'>{summary.successCount}</div>
              <div className='rs-stat-label'>OK</div>
            </div>
            <div className='rs-stat'>
              <div className='rs-stat-value accent'>
                {summary.avgSimilarity
                  ? `${(summary.avgSimilarity * 100).toFixed(0)}%`
                  : '—'}
              </div>
              <div className='rs-stat-label'>Avg Sim</div>
            </div>
            <div className='rs-stat'>
              <div className='rs-stat-value'>
                {summary.avgDuration
                  ? `${summary.avgDuration.toFixed(0)}ms`
                  : '—'}
              </div>
              <div className='rs-stat-label'>Avg Time</div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className='rs-search-wrap'>
          <svg
            viewBox='0 0 16 16'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
          >
            <circle cx='7' cy='7' r='4' />
            <path d='M10.5 10.5L14 14' strokeLinecap='round' />
          </svg>
          <input
            type='text'
            placeholder='搜索 ID、query、library…'
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              className='rs-search-clear'
              onClick={() => onSearchChange('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className='rs-filters'>
          {(
            ['all', 'bad', 'blank', 'render_error', 'g2', 'g6'] as FilterType[]
          ).map((f) => (
            <button
              key={f}
              className={`rs-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => onFilterChange(f)}
            >
              {f === 'all'
                ? 'All'
                : f === 'bad'
                  ? 'Bad'
                  : f === 'blank'
                    ? 'Blank'
                    : f === 'render_error'
                      ? 'Error'
                      : f.toUpperCase()}
            </button>
          ))}
          {(search || filter !== 'all') && (
            <span className='rs-filter-count'>
              {filtered.length}/{results.length}
            </span>
          )}
        </div>
      </div>

      {/* Result list */}
      <div className='rs-result-list'>
        {filtered.map(({ r, i }) => {
          const sim = r.evaluation?.similarity ?? 0;
          const rs = renderResults[r.id ?? `test-${i}`];
          const lib = (r.library ?? 'g2').toLowerCase();
          const bad = isBadCase(r, rs);

          return (
            <div
              key={r.id ?? i}
              className={`rs-result-item${i === currentIndex ? ' active' : ''}${bad ? ' bad' : ''}`}
              onClick={() => onSelect(i)}
            >
              <div className='rs-result-meta'>
                <span className={`rs-lib-badge ${lib}`}>
                  {lib.toUpperCase()}
                </span>
                <span className='rs-result-id'>{r.id ?? `#${i + 1}`}</span>
                {rs === 'success' && (
                  <span className='rs-render-dot success' title='Render OK'>
                    ✓
                  </span>
                )}
                {rs === 'blank' && (
                  <span className='rs-render-dot blank' title='Blank'>
                    ◻
                  </span>
                )}
                {rs === 'error' && (
                  <span className='rs-render-dot error' title='Error'>
                    ✗
                  </span>
                )}
              </div>
              <div className='rs-result-query'>{r.query}</div>
              <div className='rs-result-foot'>
                <span className={`rs-sim ${simClass(sim)}`}>
                  {(sim * 100).toFixed(0)}%
                </span>
                <span className='rs-dur'>{r.duration ?? 0}ms</span>
                {r.error && <span className='rs-badge error'>✗ Error</span>}
                {!r.error && r.evaluation?.hasIssues && (
                  <span className='rs-badge warn'>⚠ Issues</span>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className='rs-empty'>暂无匹配结果</div>}
      </div>
    </aside>
  );
}
