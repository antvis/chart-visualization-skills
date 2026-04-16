'use client';

import type { EvalRun, RenderState } from './types';

interface StatsModalProps {
  run: EvalRun;
  renderResults: Record<string, RenderState>;
  onClose: () => void;
}

function calcRenderStats(renderResults: Record<string, RenderState>) {
  const vals = Object.values(renderResults);
  const tested = vals.length;
  const success = vals.filter((v) => v === 'success').length;
  const blanks  = vals.filter((v) => v === 'blank').length;
  const errors  = vals.filter((v) => v === 'error').length;
  return { tested, success, blanks, errors, rate: tested > 0 ? Math.round((success / tested) * 100) : 0 };
}

export default function StatsModal({ run, renderResults, onClose }: StatsModalProps) {
  const results = run.results;
  const s = run.summary;
  const rs = calcRenderStats(renderResults);

  const sims = results.filter((r) => r.evaluation?.similarity != null).map((r) => r.evaluation.similarity);
  const high   = sims.filter((v) => v >= 0.5).length;
  const medium = sims.filter((v) => v >= 0.3 && v < 0.5).length;
  const low    = sims.filter((v) => v < 0.3).length;

  const libCounts: Record<string, number> = {};
  results.forEach((r) => {
    const lib = r.library ?? 'g2';
    libCounts[lib] = (libCounts[lib] ?? 0) + 1;
  });

  const badByReason = {
    render_error: Object.values(renderResults).filter((v) => v === 'error').length,
    blank_screen:  Object.values(renderResults).filter((v) => v === 'blank').length,
    llm_error:     results.filter((r) => !!r.error).length,
    low_similarity: results.filter((r) => (r.evaluation?.similarity ?? 0) < 0.3).length,
    code_issues:   results.filter((r) => r.evaluation?.hasIssues).length,
  };

  return (
    <div className="rs-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rs-modal">
        <div className="rs-modal-header">
          <h2>Statistics Report</h2>
          <button className="rs-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="rs-modal-body">

          {/* Overview */}
          <section className="rs-modal-section">
            <h3>Overview</h3>
            <div className="rs-stats-cards">
              <StatCard label="Total" value={s.totalTests} type="info" />
              <StatCard label="Success" value={s.successCount} type={s.successCount === s.totalTests ? 'ok' : 'warn'} />
              <StatCard label="Issues" value={s.issuesCount} type={s.issuesCount === 0 ? 'ok' : 'warn'} />
              <StatCard label="Avg Sim" value={`${(s.avgSimilarity * 100).toFixed(1)}%`} type="info" />
            </div>
          </section>

          {/* Similarity */}
          <section className="rs-modal-section">
            <h3>Similarity Distribution</h3>
            <div className="rs-stats-cards">
              <StatCard label="High ≥50%" value={high} type="ok" />
              <StatCard label="Med 30-50%" value={medium} type="warn" />
              <StatCard label="Low <30%" value={low} type="err" />
              <StatCard label="High Rate" value={`${results.length > 0 ? (high / results.length * 100).toFixed(1) : 0}%`} type={high / results.length >= 0.7 ? 'ok' : 'warn'} />
            </div>
          </section>

          {/* Render */}
          {rs.tested > 0 && (
            <section className="rs-modal-section">
              <h3>Render Tests</h3>
              <div className="rs-stats-cards">
                <StatCard label="Tested" value={rs.tested} type="info" />
                <StatCard label="Success" value={rs.success} type={rs.rate >= 80 ? 'ok' : 'warn'} />
                <StatCard label="Blank" value={rs.blanks} type={rs.blanks === 0 ? 'ok' : 'warn'} />
                <StatCard label="Error" value={rs.errors} type={rs.errors === 0 ? 'ok' : 'err'} />
              </div>
            </section>
          )}

          {/* Performance */}
          <section className="rs-modal-section">
            <h3>Performance</h3>
            <div className="rs-stats-cards">
              <StatCard label="Avg Duration" value={`${s.avgDuration?.toFixed(0) ?? '—'}ms`} type="info" />
              <StatCard label="Avg Tool Calls" value={s.avgToolCalls?.toFixed(1) ?? '—'} type="info" />
              <StatCard label="Skill Hit Rate" value={s.skillHitRate != null ? `${(s.skillHitRate * 100).toFixed(0)}%` : '—'} type="info" />
              <StatCard label="Libraries" value={Object.entries(libCounts).map(([k, v]) => `${k.toUpperCase()}:${v}`).join(' / ')} type="info" />
            </div>
          </section>

          {/* Bad Cases */}
          <section className="rs-modal-section">
            <h3>Bad Cases Breakdown</h3>
            <table className="rs-stats-table">
              <thead><tr><th>Reason</th><th>Count</th></tr></thead>
              <tbody>
                <tr><td>Render Error</td><td>{badByReason.render_error}</td></tr>
                <tr><td>Blank Screen</td><td>{badByReason.blank_screen}</td></tr>
                <tr><td>LLM Error</td><td>{badByReason.llm_error}</td></tr>
                <tr><td>Low Similarity (&lt;30%)</td><td>{badByReason.low_similarity}</td></tr>
                <tr><td>Code Issues</td><td>{badByReason.code_issues}</td></tr>
              </tbody>
            </table>
          </section>

        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, type }: { label: string; value: string | number; type: 'ok' | 'warn' | 'err' | 'info' }) {
  return (
    <div className={`rs-stat-card ${type}`}>
      <div className="rs-stat-card-value">{value}</div>
      <div className="rs-stat-card-label">{label}</div>
    </div>
  );
}
