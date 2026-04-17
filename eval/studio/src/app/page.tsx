'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import CodeEditor, { type CodeEditorHandle } from '@/components/CodeEditor';
import Preview from '@/components/Preview';
import GridView from '@/components/GridView';
import EditModal from '@/components/EditModal';

interface EvalCase {
  id?: string;
  description: string;
  codeString: string;
}

function truncateDesc(desc: string, max = 80): string {
  const clean = desc.replace(/\n/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function generateId(): string {
  return `case-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type ViewMode = 'editor' | 'grid';

const btnBase =
  'inline-flex items-center gap-[5px] h-[30px] px-3 bg-transparent border border-border rounded-[6px] text-fg-muted text-[12px] font-medium font-[inherit] cursor-pointer transition-all duration-150 whitespace-nowrap hover:bg-hover hover:text-fg hover:border-border-focus disabled:opacity-40 disabled:cursor-not-allowed';

export default function App() {
  const codeEditorRef = useRef<CodeEditorHandle>(null);

  const [datasets, setDatasets] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState('');
  const [cases, setCases] = useState<EvalCase[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'desc' | 'code'>('desc');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [modalIdx, setModalIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/studio/datasets')
      .then((r) => r.json())
      .then((files: string[]) => {
        setDatasets(files);
        if (files.length > 0) setCurrentFile(files[0]);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!currentFile) return;
    setLoading(true);
    setSearch('');
    fetch(`/api/studio/dataset?file=${encodeURIComponent(currentFile)}`)
      .then((r) => r.json())
      .then((data: EvalCase[]) => {
        const normalized = data.map((c, i) => ({ ...c, id: c.id || `case-${i}` }));
        setCases(normalized);
        setSelectedIdx(0);
        setDirty(false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentFile]);

  const selectedCase = cases[selectedIdx] ?? null;

  const filteredCases = search.trim()
    ? cases.map((c, i) => ({ c, i })).filter(({ c }) =>
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        c.codeString.toLowerCase().includes(search.toLowerCase())
      )
    : cases.map((c, i) => ({ c, i }));

  const confirmDirty = useCallback((): boolean => {
    if (!dirty) return true;
    return window.confirm('有未保存的修改，是否放弃？');
  }, [dirty]);

  const handleFileChange = useCallback((file: string) => {
    if (!confirmDirty()) return;
    setCurrentFile(file);
  }, [confirmDirty]);

  const handleSelectCase = useCallback((realIdx: number) => {
    if (realIdx === selectedIdx) return;
    if (!confirmDirty()) return;
    setSelectedIdx(realIdx);
    setDirty(false);
  }, [confirmDirty, selectedIdx]);

  const handleEditFromGrid = useCallback((idx: number) => { setModalIdx(idx); }, []);

  const handleModalSave = useCallback((updated: EvalCase) => {
    if (modalIdx === null) return;
    setCases((prev) => prev.map((c, i) => (i === modalIdx ? { ...c, ...updated } : c)));
    setDirty(true);
  }, [modalIdx]);

  const handleDescChange = useCallback((value: string) => {
    if (!selectedCase) return;
    setCases((prev) => prev.map((c, i) => i === selectedIdx ? { ...c, description: value } : c));
    setDirty(true);
  }, [selectedCase, selectedIdx]);

  const handleCodeChange = useCallback((value: string) => {
    if (!selectedCase) return;
    setCases((prev) => prev.map((c, i) => i === selectedIdx ? { ...c, codeString: value } : c));
    setDirty(true);
  }, [selectedCase, selectedIdx]);

  const handleSave = useCallback(async () => {
    if (!currentFile || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/studio/dataset?file=${encodeURIComponent(currentFile)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cases),
      });
      if (res.ok) {
        setDirty(false);
      } else {
        const err = (await res.json()) as { error: string };
        alert(`保存失败: ${err.error}`);
      }
    } catch (e) {
      alert(`保存失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setSaving(false);
    }
  }, [cases, currentFile, saving]);

  const handleAdd = useCallback(() => {
    const newCase: EvalCase = { id: generateId(), description: '', codeString: '' };
    setCases((prev) => { const updated = [...prev, newCase]; setSelectedIdx(updated.length - 1); return updated; });
    setDirty(true);
    setActiveTab('desc');
    setViewMode('editor');
  }, []);

  const handleDelete = useCallback(() => {
    if (!selectedCase) return;
    if (!window.confirm(`确认删除第 ${selectedIdx + 1} 条 case？此操作需保存后生效。`)) return;
    setCases((prev) => { const updated = prev.filter((_, i) => i !== selectedIdx); setSelectedIdx(Math.min(selectedIdx, updated.length - 1)); return updated; });
    setDirty(true);
  }, [selectedCase, selectedIdx]);

  const handlePrev = useCallback(() => {
    if (selectedIdx <= 0) return;
    if (!confirmDirty()) return;
    setSelectedIdx((i) => i - 1);
    setDirty(false);
  }, [selectedIdx, confirmDirty]);

  const handleNext = useCallback(() => {
    if (selectedIdx >= cases.length - 1) return;
    if (!confirmDirty()) return;
    setSelectedIdx((i) => i + 1);
    setDirty(false);
  }, [selectedIdx, cases.length, confirmDirty]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (dirty && !saving) handleSave();
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      const isEditing = tag === 'TEXTAREA' || tag === 'INPUT' || (e.target as HTMLElement).closest('.monaco-editor') !== null;
      if (isEditing) return;
      if (viewMode === 'editor') {
        if (e.key === 'ArrowUp' || e.key === 'k') handlePrev();
        if (e.key === 'ArrowDown' || e.key === 'j') handleNext();
      }
      if (e.key === 'g') setViewMode((v) => (v === 'grid' ? 'editor' : 'grid'));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dirty, saving, handleSave, handlePrev, handleNext, viewMode]);

  const sep = <div className="w-px h-[22px] bg-border mx-[2px]" />;
  const tabCls = (active: boolean) =>
    `inline-flex items-center h-[28px] px-3 border-none rounded-[6px] text-[11px] font-semibold font-[inherit] uppercase tracking-[0.5px] cursor-pointer transition-all duration-150 ${
      active ? 'text-accent bg-accent-dim' : 'text-fg-subtle hover:text-fg-muted hover:bg-hover'
    }`;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="h-[52px] bg-surface border-b border-border-subtle flex items-center px-4 gap-[10px] shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 mr-2">
          <img
            src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*FBLnQIAzx6cAAAAAQDAAAAgAemJ7AQ/original"
            width="24" height="24" alt="Eval Studio Logo"
          />
          <span className="text-[14px] font-semibold text-fg tracking-[-0.3px] whitespace-nowrap">Eval Studio</span>
          <span className="text-[11px] text-fg-subtle bg-active px-[6px] py-[1px] rounded-full border border-border">评测集编辑器</span>
        </div>

        {sep}

        <Link
          href="/results"
          className="inline-flex items-center h-[28px] px-[10px] border border-border rounded-[6px] text-fg-muted text-[12px] font-medium no-underline transition-all duration-150 whitespace-nowrap hover:bg-hover hover:text-fg hover:border-border-focus"
          title="切换到结果查看器"
        >
          Results →
        </Link>

        {sep}

        <select
          className="h-[30px] px-[10px] bg-surface-subtle border border-border rounded-[6px] text-fg text-[12px] font-[inherit] cursor-pointer outline-none transition-all duration-150 min-w-[200px] focus:border-border-focus focus:shadow-[0_0_0_2px_rgba(99,102,241,0.12)]"
          value={currentFile}
          onChange={(e) => handleFileChange(e.target.value)}
          disabled={loading}
        >
          {datasets.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        <div className="relative">
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-fg-subtle pointer-events-none" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="9" r="5.5" />
            <path d="M13.5 13.5L17 17" strokeLinecap="round" />
          </svg>
          <input
            className="h-[30px] pl-[30px] pr-[10px] bg-surface-subtle border border-border rounded-[6px] text-fg text-[12px] font-[inherit] outline-none transition-all duration-150 w-[200px] focus:border-border-focus focus:shadow-[0_0_0_2px_rgba(99,102,241,0.12)] focus:w-[240px]"
            type="text"
            placeholder="搜索描述或代码…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="text-[11px] text-fg-subtle whitespace-nowrap">
          {search.trim() ? `${filteredCases.length} / ${cases.length} 条` : `共 ${cases.length} 条`}
        </span>

        <div className="flex-1" />

        {/* View mode toggle */}
        <div className="flex bg-surface-subtle border border-border rounded-[6px] overflow-hidden" title="切换视图 (g)">
          {(['editor', 'grid'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={`inline-flex items-center justify-center w-[30px] h-[30px] border-none cursor-pointer transition-all duration-150 ${viewMode === mode ? 'bg-accent-dim text-accent' : 'bg-transparent text-fg-subtle hover:text-fg hover:bg-hover'}`}
              onClick={() => setViewMode(mode)}
              title={mode === 'editor' ? '编辑视图' : '网格视图'}
            >
              {mode === 'editor' ? (
                <svg className="w-[14px] h-[14px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="5" height="12" rx="1" />
                  <rect x="9" y="2" width="5" height="7" rx="1" />
                  <rect x="9" y="11" width="5" height="3" rx="1" />
                </svg>
              ) : (
                <svg className="w-[14px] h-[14px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="5" height="5" rx="1" />
                  <rect x="9" y="2" width="5" height="5" rx="1" />
                  <rect x="2" y="9" width="5" height="5" rx="1" />
                  <rect x="9" y="9" width="5" height="5" rx="1" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {sep}

        <button className={btnBase} onClick={handleAdd} title="新增 case">
          <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 3v10M3 8h10" strokeLinecap="round" />
          </svg>
          新增
        </button>

        <button
          className={`${btnBase} hover:bg-red-dim hover:border-red/40 hover:text-red`}
          onClick={handleDelete}
          disabled={!selectedCase}
          title="删除当前 case"
        >
          <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 4h10M6 4V3h4v1M5 4v8a1 1 0 001 1h4a1 1 0 001-1V4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          删除
        </button>

        {sep}

        {/* Save button */}
        <button
          className={`inline-flex items-center gap-[5px] h-[30px] px-3 border rounded-[6px] text-[12px] font-[inherit] cursor-pointer transition-all duration-150 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed
            ${dirty   ? 'bg-amber-dim border-amber/50 text-amber font-semibold hover:bg-amber/25' : 'bg-surface-subtle text-fg-muted border-border'}
            ${saving  ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={handleSave}
          disabled={!dirty || saving}
          title="保存 (⌘S)"
        >
          <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 3a1 1 0 011-1h8l3 3v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" strokeLinejoin="round" />
            <path d="M5 2v3h6V2M5 9h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {saving ? '保存中…' : dirty ? '保存●' : '已保存'}
        </button>
      </div>

      {/* ── Grid view ── */}
      {viewMode === 'grid' && (
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="p-10 text-center text-fg-subtle text-[12px]">
              <div className="spinner mx-auto mb-2" />
              加载中…
            </div>
          ) : (
            <GridView cases={cases} filteredCases={filteredCases} selectedIdx={selectedIdx} onEdit={handleEditFromGrid} />
          )}
        </div>
      )}

      {/* ── Editor view ── */}
      {viewMode === 'editor' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Case list */}
          <div className="w-[260px] min-w-[200px] bg-surface border-r border-border-subtle flex flex-col overflow-hidden shrink-0">
            <div className="px-3 pt-[10px] pb-2 border-b border-border-subtle shrink-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.6px] text-fg-subtle">Cases</div>
            </div>
            <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
              {loading ? (
                <div className="p-6 text-center text-fg-subtle text-[12px]">
                  <div className="spinner mx-auto mb-2" />
                  加载中…
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="p-6 text-center text-fg-subtle text-[12px]">
                  {search.trim() ? '无匹配结果' : '暂无 case'}
                </div>
              ) : (
                filteredCases.map(({ c, i }) => (
                  <div
                    key={c.id || i}
                    className={`px-3 py-[10px] cursor-pointer border-b border-border-subtle transition-colors duration-100 flex flex-col gap-[3px]
                      ${i === selectedIdx ? 'bg-accent-dim border-l-[3px] border-l-accent pl-[9px]' : 'hover:bg-hover'}`}
                    onClick={() => handleSelectCase(i)}
                  >
                    <span className={`text-[10px] font-semibold font-mono ${i === selectedIdx ? 'text-accent' : 'text-fg-subtle'}`}>
                      #{i + 1}
                    </span>
                    <span className={`text-[11.5px] leading-[1.5] overflow-hidden line-clamp-2 break-all ${i === selectedIdx ? 'text-fg' : 'text-fg-muted'}`}>
                      {truncateDesc(c.description)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Middle: Editor */}
          <div className="w-[42%] min-w-[320px] flex flex-col border-r border-border-subtle bg-surface-subtle overflow-hidden">
            <div className="h-[38px] flex items-center pl-3 pr-1 border-b border-border-subtle bg-panel shrink-0 gap-[2px]">
              <button className={tabCls(activeTab === 'desc')} onClick={() => setActiveTab('desc')}>Description</button>
              <button className={tabCls(activeTab === 'code')} onClick={() => setActiveTab('code')}>Code</button>
              <div className="flex-1" />

              {cases.length > 0 && (
                <div className="flex items-center gap-[2px] mr-[6px]">
                  <button
                    className="inline-flex items-center justify-center w-6 h-6 bg-transparent border border-transparent rounded-[6px] text-fg-subtle cursor-pointer transition-all duration-150 p-0 disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:bg-hover enabled:hover:border-border enabled:hover:text-fg"
                    onClick={handlePrev}
                    disabled={selectedIdx <= 0}
                    title="上一条 (↑ / k)"
                  >
                    <svg className="w-[14px] h-[14px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="text-[11px] text-fg-subtle min-w-[48px] text-center tabular-nums px-[2px]">
                    {selectedIdx + 1} / {cases.length}
                  </span>
                  <button
                    className="inline-flex items-center justify-center w-6 h-6 bg-transparent border border-transparent rounded-[6px] text-fg-subtle cursor-pointer transition-all duration-150 p-0 disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:bg-hover enabled:hover:border-border enabled:hover:text-fg"
                    onClick={handleNext}
                    disabled={selectedIdx >= cases.length - 1}
                    title="下一条 (↓ / j)"
                  >
                    <svg className="w-[14px] h-[14px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}

              {activeTab === 'code' && selectedCase && (
                <button
                  className="inline-flex items-center gap-[5px] h-[26px] px-[10px] bg-transparent border border-border rounded-[6px] text-fg-muted text-[11px] font-medium font-[inherit] cursor-pointer transition-all duration-150 whitespace-nowrap hover:bg-hover hover:text-fg hover:border-border-focus"
                  onClick={() => codeEditorRef.current?.format()}
                  title="格式化代码"
                >
                  <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 4h12M2 8h8M2 12h10" strokeLinecap="round" />
                  </svg>
                  格式化
                </button>
              )}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {!selectedCase ? (
                <div className="flex-1 flex items-center justify-center text-fg-subtle text-[12px] flex-col gap-2">
                  <svg className="w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M8 8h8M8 12h8M8 16h4" strokeLinecap="round" />
                  </svg>
                  请选择左侧 case
                </div>
              ) : activeTab === 'desc' ? (
                <textarea
                  className="flex-1 w-full px-4 py-[14px] bg-transparent border-none outline-none resize-none text-[13px] font-[inherit] text-fg leading-[1.65] placeholder:text-fg-subtle"
                  value={selectedCase.description}
                  onChange={(e) => handleDescChange(e.target.value)}
                  placeholder="输入 case 描述（中文），可包含参考数据 JSON…"
                  spellCheck={false}
                />
              ) : (
                <CodeEditor ref={codeEditorRef} code={selectedCase.codeString} onChange={handleCodeChange} />
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex-1 flex flex-col bg-app overflow-hidden min-w-[280px]">
            <Preview code={selectedCase?.codeString ?? ''} onStatusChange={() => {}} />
          </div>
        </div>
      )}

      {/* ── Edit modal (grid mode) ── */}
      {modalIdx !== null && cases[modalIdx] && (
        <EditModal
          index={modalIdx}
          caseData={cases[modalIdx]}
          onSave={handleModalSave}
          onClose={() => setModalIdx(null)}
        />
      )}
    </div>
  );
}
