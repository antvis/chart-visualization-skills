'use client';

import { useState } from 'react';
import type { EvalRun } from './types';

interface DatasetMeta {
  name: string;
  summary: { model?: string; avgSimilarity?: number };
}

interface CompareModalProps {
  datasets: DatasetMeta[];
  currentFile: string;
  onClose: () => void;
}

interface RunStats {
  model: string; algorithm: string; timestamp: string;
  total: number; success: number; avgSim: number; avgDur: number;
  high: number; med: number; low: number; issues: number;
}

function calcStats(data: EvalRun): RunStats {
  const results = data.results ?? [];
  const success = results.filter((r) => !r.error);
  const sims = success.map((r) => r.evaluation?.similarity ?? 0);
  const avgSim = sims.length > 0 ? sims.reduce((a, b) => a + b, 0) / sims.length : 0;
  const durs = success.filter((r) => r.duration).map((r) => r.duration);
  const avgDur = durs.length > 0 ? durs.reduce((a, b) => a + b, 0) / durs.length : 0;
  return {
    model: data.model ?? 'Unknown', algorithm: data.algorithm ?? 'N/A',
    timestamp: data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A',
    total: results.length, success: success.length, avgSim, avgDur,
    high: sims.filter((s) => s >= 0.5).length,
    med:  sims.filter((s) => s >= 0.3 && s < 0.5).length,
    low:  sims.filter((s) => s < 0.3).length,
    issues: results.filter((r) => r.evaluation?.hasIssues).length,
  };
}

function Delta({ a, b, pct = false, higherBetter = true }: { a: number; b: number; pct?: boolean; higherBetter?: boolean }) {
  const diff = a - b;
  if (Math.abs(pct ? diff * 100 : diff) < (pct ? 0.1 : 0.001)) return <span className="text-fg-subtle">—</span>;
  const better = higherBetter ? diff > 0 : diff < 0;
  const sign = diff > 0 ? '+' : '';
  const display = pct ? `${sign}${(diff * 100).toFixed(1)}%` : `${sign}${Math.abs(diff) < 10 ? diff.toFixed(2) : diff.toFixed(0)}`;
  return <span className={`font-semibold ${better ? 'text-green' : 'text-red'}`}>{display}</span>;
}

export default function CompareModal({ datasets, currentFile, onClose }: CompareModalProps) {
  const [fileA, setFileA] = useState(currentFile);
  const [fileB, setFileB] = useState(datasets.find((d) => d.name !== currentFile)?.name ?? '');
  const [statsA, setStatsA] = useState<RunStats | null>(null);
  const [statsB, setStatsB] = useState<RunStats | null>(null);
  const [perCase, setPerCase] = useState<{ id: string; simA: number; simB: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runCompare() {
    if (!fileA || !fileB) return;
    setLoading(true);
    setError('');
    try {
      const [dA, dB]: [EvalRun, EvalRun] = await Promise.all([
        fetch(`/api/results/${fileA}`).then((r) => r.json()),
        fetch(`/api/results/${fileB}`).then((r) => r.json()),
      ]);
      setStatsA(calcStats(dA));
      setStatsB(calcStats(dB));
      const mapB = new Map((dB.results ?? []).map((r) => [r.id, r]));
      const cases = (dA.results ?? [])
        .map((rA) => { const rB = mapB.get(rA.id); if (!rA || !rB || rA.error || rB.error) return null; return { id: rA.id, simA: rA.evaluation?.similarity ?? 0, simB: rB.evaluation?.similarity ?? 0 }; })
        .filter(Boolean)
        .sort((a, b) => Math.abs(b!.simA - b!.simB) - Math.abs(a!.simA - a!.simB))
        .slice(0, 15) as { id: string; simA: number; simB: number }[];
      setPerCase(cases);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const shortName = (f: string) => f.replace(/^eval-/, '').replace(/\.json$/, '');

  const selectCls = 'h-[30px] px-[10px] border border-border rounded-[6px] text-[12px] min-w-[200px] bg-surface text-fg font-[inherit] outline-none focus:border-border-focus';
  const thCls = 'px-3 py-2 text-left border-b border-border-subtle bg-surface-subtle font-semibold text-[12px] text-fg';
  const tdCls = 'px-3 py-2 border-b border-border-subtle';
  const h3Cls = 'text-[12px] font-semibold text-fg mb-[10px] pb-[6px] border-b border-border-subtle uppercase tracking-[0.5px]';

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[200] p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface rounded-[12px] w-[90%] max-w-[960px] max-h-[88vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between px-[18px] h-12 border-b border-border-subtle shrink-0">
          <h2 className="text-[15px] font-semibold m-0">Compare Runs</h2>
          <button className="bg-transparent border-none text-[18px] cursor-pointer text-fg-subtle p-1 transition-all leading-none hover:text-fg" onClick={onClose}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-[18px] py-4 flex flex-col gap-0 [scrollbar-width:thin]">

          <div className="flex gap-3 items-end mb-4 flex-wrap">
            <div>
              <label className="block text-[11px] text-fg-subtle mb-1">Dataset A</label>
              <select className={selectCls} value={fileA} onChange={(e) => setFileA(e.target.value)}>
                {datasets.map((d) => <option key={d.name} value={d.name}>{shortName(d.name)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-fg-subtle mb-1">Dataset B</label>
              <select className={selectCls} value={fileB} onChange={(e) => setFileB(e.target.value)}>
                {datasets.map((d) => <option key={d.name} value={d.name}>{shortName(d.name)}</option>)}
              </select>
            </div>
            <button
              className="inline-flex items-center gap-1 h-[30px] px-[11px] bg-accent border border-accent rounded-[6px] text-white text-[12px] font-medium font-[inherit] cursor-pointer transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-accent-hover hover:border-accent-hover"
              onClick={runCompare}
              disabled={loading || !fileA || !fileB}
            >
              {loading ? 'Loading…' : 'Compare'}
            </button>
          </div>

          {error && (
            <div className="px-[14px] py-[10px] bg-red-dim border border-red/25 rounded-[8px] text-red text-[12px] mb-3">{error}</div>
          )}

          {statsA && statsB && (
            <>
              <section className="mb-5">
                <h3 className={h3Cls}>Side-by-Side</h3>
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      <th className={thCls}>Metric</th>
                      <th className={thCls}>A: {shortName(fileA)}</th>
                      <th className={thCls}>B: {shortName(fileB)}</th>
                      <th className={thCls}>Delta (A−B)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Model',      statsA.model,   statsB.model,   null],
                      ['Algorithm',  statsA.algorithm, statsB.algorithm, null],
                      ['Total',      statsA.total,   statsB.total,   <Delta a={statsA.total}   b={statsB.total} />],
                      ['Success',    statsA.success, statsB.success, <Delta a={statsA.success} b={statsB.success} />],
                      ['Avg Similarity', `${(statsA.avgSim*100).toFixed(1)}%`, `${(statsB.avgSim*100).toFixed(1)}%`, <Delta a={statsA.avgSim} b={statsB.avgSim} pct />],
                      ['High ≥50%',  statsA.high,    statsB.high,    <Delta a={statsA.high}    b={statsB.high} />],
                      ['Low <30%',   statsA.low,     statsB.low,     <Delta a={statsA.low}     b={statsB.low} higherBetter={false} />],
                      ['Issues',     statsA.issues,  statsB.issues,  <Delta a={statsA.issues}  b={statsB.issues} higherBetter={false} />],
                      ['Avg Duration', `${statsA.avgDur.toFixed(0)}ms`, `${statsB.avgDur.toFixed(0)}ms`, <><Delta a={statsA.avgDur} b={statsB.avgDur} higherBetter={false} />ms</>],
                    ].map(([label, a, b, delta]) => (
                      <tr key={String(label)} className="hover:bg-hover">
                        <td className={tdCls}>{label}</td>
                        <td className={tdCls}>{a as string}</td>
                        <td className={tdCls}>{b as string}</td>
                        <td className={tdCls}>{delta ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {perCase.length > 0 && (
                <section className="mb-5">
                  <h3 className={h3Cls}>Top {perCase.length} Case Diffs</h3>
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr>
                        <th className={thCls}>ID</th>
                        <th className={thCls}>A</th>
                        <th className={thCls}>B</th>
                        <th className={thCls}>Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perCase.map((c) => (
                        <tr key={c.id} className="hover:bg-hover">
                          <td className={`${tdCls} text-[11px] text-fg-subtle`}>{c.id}</td>
                          <td className={tdCls}>{(c.simA * 100).toFixed(1)}%</td>
                          <td className={tdCls}>{(c.simB * 100).toFixed(1)}%</td>
                          <td className={tdCls}><Delta a={c.simA} b={c.simB} pct /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
