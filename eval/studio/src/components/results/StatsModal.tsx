'use client';

import type { EvalRun, RenderState } from './types';

interface StatsModalProps {
  run: EvalRun;
  renderResults: Record<string, RenderState>;
  onClose: () => void;
}

function calcRenderStats(renderResults: Record<string, RenderState>) {
  const vals = Object.values(renderResults);
  const tested  = vals.length;
  const success = vals.filter((v) => v === 'success').length;
  const blanks  = vals.filter((v) => v === 'blank').length;
  const errors  = vals.filter((v) => v === 'error').length;
  return { tested, success, blanks, errors, rate: tested > 0 ? Math.round((success / tested) * 100) : 0 };
}

type CardType = 'ok' | 'warn' | 'err' | 'info';

const cardCls: Record<CardType, string> = {
  ok:   'bg-green/8 border-green/20',
  warn: 'bg-amber-dim border-amber/30',
  err:  'bg-red-dim border-red/30',
  info: 'bg-accent-dim border-accent/30',
};
const cardValueCls: Record<CardType, string> = {
  ok:   'text-green',
  warn: 'text-amber',
  err:  'text-red',
  info: 'text-accent',
};

function StatCard({ label, value, type }: { label: string; value: string | number; type: CardType }) {
  return (
    <div className={`border rounded-[8px] p-[10px] text-center ${cardCls[type]}`}>
      <div className={`text-[20px] font-semibold ${cardValueCls[type]}`}>{value}</div>
      <div className="text-[10px] text-fg-subtle mt-[3px] uppercase tracking-[0.3px]">{label}</div>
    </div>
  );
}

export default function StatsModal({ run, renderResults, onClose }: StatsModalProps) {
  const results = run.results;
  const s = run.summary;
  const rs = calcRenderStats(renderResults);

  const sims   = results.filter((r) => r.evaluation?.similarity != null).map((r) => r.evaluation.similarity);
  const high   = sims.filter((v) => v >= 0.5).length;
  const medium = sims.filter((v) => v >= 0.3 && v < 0.5).length;
  const low    = sims.filter((v) => v < 0.3).length;

  const libCounts: Record<string, number> = {};
  results.forEach((r) => { const lib = r.library ?? 'g2'; libCounts[lib] = (libCounts[lib] ?? 0) + 1; });

  const badByReason = {
    render_error:   Object.values(renderResults).filter((v) => v === 'error').length,
    blank_screen:   Object.values(renderResults).filter((v) => v === 'blank').length,
    llm_error:      results.filter((r) => !!r.error).length,
    low_similarity: results.filter((r) => (r.evaluation?.similarity ?? 0) < 0.3).length,
    code_issues:    results.filter((r) => r.evaluation?.hasIssues).length,
  };

  const sectionCls = 'mb-5';
  const h3Cls = 'text-[12px] font-semibold text-fg mb-[10px] pb-[6px] border-b border-border-subtle uppercase tracking-[0.5px]';

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[200] p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-surface rounded-[12px] w-[90%] max-w-[720px] max-h-[88vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between px-[18px] h-12 border-b border-border-subtle shrink-0">
          <h2 className="text-[15px] font-semibold m-0">Statistics Report</h2>
          <button className="bg-transparent border-none text-[18px] cursor-pointer text-fg-subtle p-1 transition-all leading-none hover:text-fg" onClick={onClose}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-[18px] py-4 flex flex-col gap-0 [scrollbar-width:thin]">

          <section className={sectionCls}>
            <h3 className={h3Cls}>Overview</h3>
            <div className="grid grid-cols-4 gap-[10px]">
              <StatCard label="Total"   value={s.totalTests}  type="info" />
              <StatCard label="Success" value={s.successCount} type={s.successCount === s.totalTests ? 'ok' : 'warn'} />
              <StatCard label="Issues"  value={s.issuesCount}  type={s.issuesCount === 0 ? 'ok' : 'warn'} />
              <StatCard label="Avg Sim" value={`${(s.avgSimilarity * 100).toFixed(1)}%`} type="info" />
            </div>
          </section>

          <section className={sectionCls}>
            <h3 className={h3Cls}>Similarity Distribution</h3>
            <div className="grid grid-cols-4 gap-[10px]">
              <StatCard label="High ≥50%"  value={high}   type="ok" />
              <StatCard label="Med 30-50%" value={medium} type="warn" />
              <StatCard label="Low <30%"   value={low}    type="err" />
              <StatCard label="High Rate"  value={`${results.length > 0 ? (high / results.length * 100).toFixed(1) : 0}%`} type={high / results.length >= 0.7 ? 'ok' : 'warn'} />
            </div>
          </section>

          {rs.tested > 0 && (
            <section className={sectionCls}>
              <h3 className={h3Cls}>Render Tests</h3>
              <div className="grid grid-cols-4 gap-[10px]">
                <StatCard label="Tested"  value={rs.tested}  type="info" />
                <StatCard label="Success" value={rs.success} type={rs.rate >= 80 ? 'ok' : 'warn'} />
                <StatCard label="Blank"   value={rs.blanks}  type={rs.blanks === 0 ? 'ok' : 'warn'} />
                <StatCard label="Error"   value={rs.errors}  type={rs.errors === 0 ? 'ok' : 'err'} />
              </div>
            </section>
          )}

          <section className={sectionCls}>
            <h3 className={h3Cls}>Performance</h3>
            <div className="grid grid-cols-4 gap-[10px]">
              <StatCard label="Avg Duration"  value={`${s.avgDuration?.toFixed(0) ?? '—'}ms`}   type="info" />
              <StatCard label="Avg Tool Calls" value={s.avgToolCalls?.toFixed(1) ?? '—'}         type="info" />
              <StatCard label="Skill Hit Rate" value={s.skillHitRate != null ? `${(s.skillHitRate * 100).toFixed(0)}%` : '—'} type="info" />
              <StatCard label="Libraries" value={Object.entries(libCounts).map(([k, v]) => `${k.toUpperCase()}:${v}`).join(' / ')} type="info" />
            </div>
          </section>

          <section className={sectionCls}>
            <h3 className={h3Cls}>Bad Cases Breakdown</h3>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left border-b border-border-subtle bg-surface-subtle font-semibold text-[12px] text-fg">Reason</th>
                  <th className="px-3 py-2 text-left border-b border-border-subtle bg-surface-subtle font-semibold text-[12px] text-fg">Count</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Render Error',        badByReason.render_error],
                  ['Blank Screen',        badByReason.blank_screen],
                  ['LLM Error',           badByReason.llm_error],
                  ['Low Similarity (<30%)', badByReason.low_similarity],
                  ['Code Issues',         badByReason.code_issues],
                ].map(([label, count]) => (
                  <tr key={String(label)} className="hover:bg-hover">
                    <td className="px-3 py-2 border-b border-border-subtle">{label}</td>
                    <td className="px-3 py-2 border-b border-border-subtle">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
