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
  model: string;
  algorithm: string;
  timestamp: string;
  total: number;
  success: number;
  avgSim: number;
  avgDur: number;
  high: number;
  med: number;
  low: number;
  issues: number;
}

function calcStats(data: EvalRun): RunStats {
  const results = data.results ?? [];
  const success = results.filter((r) => !r.error);
  const sims = success.map((r) => r.evaluation?.similarity ?? 0);
  const avgSim = sims.length > 0 ? sims.reduce((a, b) => a + b, 0) / sims.length : 0;
  const durs = success.filter((r) => r.duration).map((r) => r.duration);
  const avgDur = durs.length > 0 ? durs.reduce((a, b) => a + b, 0) / durs.length : 0;
  return {
    model: data.model ?? 'Unknown',
    algorithm: data.algorithm ?? 'N/A',
    timestamp: data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A',
    total: results.length,
    success: success.length,
    avgSim,
    avgDur,
    high: sims.filter((s) => s >= 0.5).length,
    med:  sims.filter((s) => s >= 0.3 && s < 0.5).length,
    low:  sims.filter((s) => s < 0.3).length,
    issues: results.filter((r) => r.evaluation?.hasIssues).length,
  };
}

function Delta({ a, b, pct = false, higherBetter = true }: { a: number; b: number; pct?: boolean; higherBetter?: boolean }) {
  const diff = a - b;
  if (Math.abs(pct ? diff * 100 : diff) < (pct ? 0.1 : 0.001)) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
  const better = higherBetter ? diff > 0 : diff < 0;
  const color = better ? 'var(--green)' : 'var(--red)';
  const sign = diff > 0 ? '+' : '';
  const display = pct ? `${sign}${(diff * 100).toFixed(1)}%` : `${sign}${Math.abs(diff) < 10 ? diff.toFixed(2) : diff.toFixed(0)}`;
  return <span style={{ color, fontWeight: 600 }}>{display}</span>;
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
        .map((rA) => {
          const rB = mapB.get(rA.id);
          if (!rA || !rB || rA.error || rB.error) return null;
          return { id: rA.id, simA: rA.evaluation?.similarity ?? 0, simB: rB.evaluation?.similarity ?? 0 };
        })
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

  return (
    <div className="rs-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rs-modal rs-modal-wide">
        <div className="rs-modal-header">
          <h2>Compare Runs</h2>
          <button className="rs-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="rs-modal-body">
          <div className="rs-compare-selects">
            <div>
              <label>Dataset A</label>
              <select value={fileA} onChange={(e) => setFileA(e.target.value)}>
                {datasets.map((d) => <option key={d.name} value={d.name}>{shortName(d.name)}</option>)}
              </select>
            </div>
            <div>
              <label>Dataset B</label>
              <select value={fileB} onChange={(e) => setFileB(e.target.value)}>
                {datasets.map((d) => <option key={d.name} value={d.name}>{shortName(d.name)}</option>)}
              </select>
            </div>
            <button className="rs-btn primary" onClick={runCompare} disabled={loading || !fileA || !fileB}>
              {loading ? 'Loading…' : 'Compare'}
            </button>
          </div>

          {error && <div className="rs-error-msg">{error}</div>}

          {statsA && statsB && (
            <>
              <section className="rs-modal-section">
                <h3>Side-by-Side</h3>
                <table className="rs-stats-table">
                  <thead>
                    <tr><th>Metric</th><th>A: {shortName(fileA)}</th><th>B: {shortName(fileB)}</th><th>Delta (A−B)</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Model</td><td>{statsA.model}</td><td>{statsB.model}</td><td>—</td></tr>
                    <tr><td>Algorithm</td><td>{statsA.algorithm}</td><td>{statsB.algorithm}</td><td>—</td></tr>
                    <tr><td>Total</td><td>{statsA.total}</td><td>{statsB.total}</td><td><Delta a={statsA.total} b={statsB.total} /></td></tr>
                    <tr><td>Success</td><td>{statsA.success}</td><td>{statsB.success}</td><td><Delta a={statsA.success} b={statsB.success} /></td></tr>
                    <tr><td>Avg Similarity</td><td>{(statsA.avgSim * 100).toFixed(1)}%</td><td>{(statsB.avgSim * 100).toFixed(1)}%</td><td><Delta a={statsA.avgSim} b={statsB.avgSim} pct /></td></tr>
                    <tr><td>High ≥50%</td><td>{statsA.high}</td><td>{statsB.high}</td><td><Delta a={statsA.high} b={statsB.high} /></td></tr>
                    <tr><td>Low &lt;30%</td><td>{statsA.low}</td><td>{statsB.low}</td><td><Delta a={statsA.low} b={statsB.low} higherBetter={false} /></td></tr>
                    <tr><td>Issues</td><td>{statsA.issues}</td><td>{statsB.issues}</td><td><Delta a={statsA.issues} b={statsB.issues} higherBetter={false} /></td></tr>
                    <tr><td>Avg Duration</td><td>{statsA.avgDur.toFixed(0)}ms</td><td>{statsB.avgDur.toFixed(0)}ms</td><td><Delta a={statsA.avgDur} b={statsB.avgDur} higherBetter={false} />ms</td></tr>
                  </tbody>
                </table>
              </section>

              {perCase.length > 0 && (
                <section className="rs-modal-section">
                  <h3>Top {perCase.length} Case Diffs</h3>
                  <table className="rs-stats-table">
                    <thead><tr><th>ID</th><th>A</th><th>B</th><th>Δ</th></tr></thead>
                    <tbody>
                      {perCase.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{c.id}</td>
                          <td>{(c.simA * 100).toFixed(1)}%</td>
                          <td>{(c.simB * 100).toFixed(1)}%</td>
                          <td><Delta a={c.simA} b={c.simB} pct /></td>
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
