'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Load dataset list
  useEffect(() => {
    fetch('/api/studio/datasets')
      .then((r) => r.json())
      .then((files: string[]) => {
        setDatasets(files);
        if (files.length > 0) setCurrentFile(files[0]);
      })
      .catch(console.error);
  }, []);

  // Load dataset when file changes
  useEffect(() => {
    if (!currentFile) return;
    setLoading(true);
    setSearch('');
    fetch(`/api/studio/dataset?file=${encodeURIComponent(currentFile)}`)
      .then((r) => r.json())
      .then((data: EvalCase[]) => {
        const normalized = data.map((c, i) => ({
          ...c,
          id: c.id || `case-${i}`
        }));
        setCases(normalized);
        setSelectedIdx(0);
        setDirty(false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentFile]);

  const selectedCase = cases[selectedIdx] ?? null;

  const filteredCases = search.trim()
    ? cases
        .map((c, i) => ({ c, i }))
        .filter(
          ({ c }) =>
            c.description.toLowerCase().includes(search.toLowerCase()) ||
            c.codeString.toLowerCase().includes(search.toLowerCase())
        )
    : cases.map((c, i) => ({ c, i }));

  const confirmDirty = useCallback((): boolean => {
    if (!dirty) return true;
    return window.confirm('有未保存的修改，是否放弃？');
  }, [dirty]);

  const handleFileChange = useCallback(
    (file: string) => {
      if (!confirmDirty()) return;
      setCurrentFile(file);
    },
    [confirmDirty]
  );

  const handleSelectCase = useCallback(
    (realIdx: number) => {
      if (realIdx === selectedIdx) return;
      if (!confirmDirty()) return;
      setSelectedIdx(realIdx);
      setDirty(false);
    },
    [confirmDirty, selectedIdx]
  );

  // Grid → open modal
  const handleEditFromGrid = useCallback((idx: number) => {
    setModalIdx(idx);
  }, []);

  const handleModalSave = useCallback(
    (updated: EvalCase) => {
      if (modalIdx === null) return;
      setCases((prev) =>
        prev.map((c, i) => (i === modalIdx ? { ...c, ...updated } : c))
      );
      setDirty(true);
    },
    [modalIdx]
  );

  const handleDescChange = useCallback(
    (value: string) => {
      if (!selectedCase) return;
      setCases((prev) =>
        prev.map((c, i) =>
          i === selectedIdx ? { ...c, description: value } : c
        )
      );
      setDirty(true);
    },
    [selectedCase, selectedIdx]
  );

  const handleCodeChange = useCallback(
    (value: string) => {
      if (!selectedCase) return;
      setCases((prev) =>
        prev.map((c, i) =>
          i === selectedIdx ? { ...c, codeString: value } : c
        )
      );
      setDirty(true);
    },
    [selectedCase, selectedIdx]
  );

  const handleSave = useCallback(async () => {
    if (!currentFile || saving) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/studio/dataset?file=${encodeURIComponent(currentFile)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cases)
        }
      );
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
    const newCase: EvalCase = {
      id: generateId(),
      description: '',
      codeString: ''
    };
    setCases((prev) => {
      const updated = [...prev, newCase];
      setSelectedIdx(updated.length - 1);
      return updated;
    });
    setDirty(true);
    setActiveTab('desc');
    setViewMode('editor');
  }, []);

  const handleDelete = useCallback(() => {
    if (!selectedCase) return;
    if (
      !window.confirm(
        `确认删除第 ${selectedIdx + 1} 条 case？此操作需保存后生效。`
      )
    )
      return;
    setCases((prev) => {
      const updated = prev.filter((_, i) => i !== selectedIdx);
      setSelectedIdx(Math.min(selectedIdx, updated.length - 1));
      return updated;
    });
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

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (dirty && !saving) handleSave();
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      const isEditing =
        tag === 'TEXTAREA' ||
        tag === 'INPUT' ||
        (e.target as HTMLElement).closest('.monaco-editor') !== null;
      if (isEditing) return;
      if (viewMode === 'editor') {
        if (e.key === 'ArrowUp' || e.key === 'k') handlePrev();
        if (e.key === 'ArrowDown' || e.key === 'j') handleNext();
      }
      // g = toggle grid/editor
      if (e.key === 'g') setViewMode((v) => (v === 'grid' ? 'editor' : 'grid'));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dirty, saving, handleSave, handlePrev, handleNext, viewMode]);

  return (
    <div className='eval-app'>
      {/* ── Toolbar ── */}
      <div className='eval-toolbar'>
        <div className='eval-brand'>
          <img
            src='https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*FBLnQIAzx6cAAAAAQDAAAAgAemJ7AQ/original'
            width='24'
            height='24'
            alt='Eval Studio Logo'
          />
          <span className='eval-brand-name'>Eval Studio</span>
          <span className='eval-brand-tag'>评测集编辑器</span>
        </div>

        <div className='eval-toolbar-sep' />

        <select
          className='eval-file-select'
          value={currentFile}
          onChange={(e) => handleFileChange(e.target.value)}
          disabled={loading}
        >
          {datasets.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <div className='eval-search-wrap'>
          <svg
            className='eval-search-icon'
            viewBox='0 0 20 20'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
          >
            <circle cx='9' cy='9' r='5.5' />
            <path d='M13.5 13.5L17 17' strokeLinecap='round' />
          </svg>
          <input
            className='eval-search'
            type='text'
            placeholder='搜索描述或代码…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className='eval-stats'>
          {search.trim()
            ? `${filteredCases.length} / ${cases.length} 条`
            : `共 ${cases.length} 条`}
        </span>

        <div className='eval-toolbar-spacer' />

        {/* View mode toggle */}
        <div className='view-toggle' title='切换视图 (g)'>
          <button
            className={`view-toggle-btn${viewMode === 'editor' ? ' active' : ''}`}
            onClick={() => setViewMode('editor')}
            title='编辑视图'
          >
            <svg
              viewBox='0 0 16 16'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
            >
              <rect x='2' y='2' width='5' height='12' rx='1' />
              <rect x='9' y='2' width='5' height='7' rx='1' />
              <rect x='9' y='11' width='5' height='3' rx='1' />
            </svg>
          </button>
          <button
            className={`view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
            onClick={() => setViewMode('grid')}
            title='网格视图'
          >
            <svg
              viewBox='0 0 16 16'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
            >
              <rect x='2' y='2' width='5' height='5' rx='1' />
              <rect x='9' y='2' width='5' height='5' rx='1' />
              <rect x='2' y='9' width='5' height='5' rx='1' />
              <rect x='9' y='9' width='5' height='5' rx='1' />
            </svg>
          </button>
        </div>

        <div className='eval-toolbar-sep' />

        <button className='eval-btn' onClick={handleAdd} title='新增 case'>
          <svg
            viewBox='0 0 16 16'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
          >
            <path d='M8 3v10M3 8h10' strokeLinecap='round' />
          </svg>
          新增
        </button>

        <button
          className='eval-btn danger'
          onClick={handleDelete}
          disabled={!selectedCase}
          title='删除当前 case'
        >
          <svg
            viewBox='0 0 16 16'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
          >
            <path
              d='M3 4h10M6 4V3h4v1M5 4v8a1 1 0 001 1h4a1 1 0 001-1V4'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          删除
        </button>

        <div className='eval-toolbar-sep' />

        <button
          className={`eval-btn save${dirty ? ' dirty' : ''}${saving ? ' saving' : ''}`}
          onClick={handleSave}
          disabled={!dirty || saving}
          title='保存 (⌘S)'
        >
          <svg
            viewBox='0 0 16 16'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
          >
            <path
              d='M2 3a1 1 0 011-1h8l3 3v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3z'
              strokeLinejoin='round'
            />
            <path
              d='M5 2v3h6V2M5 9h6'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          {saving ? '保存中…' : dirty ? '保存●' : '已保存'}
        </button>
      </div>

      {/* ── Grid view ── */}
      {viewMode === 'grid' && (
        <div className='eval-grid-container'>
          {loading ? (
            <div className='eval-list-empty' style={{ padding: 40 }}>
              <div className='spinner' style={{ margin: '0 auto 8px' }} />
              加载中…
            </div>
          ) : (
            <GridView
              cases={cases}
              filteredCases={filteredCases}
              selectedIdx={selectedIdx}
              onEdit={handleEditFromGrid}
            />
          )}
        </div>
      )}

      {/* ── Editor view ── */}
      {viewMode === 'editor' && (
        <div className='eval-content'>
          {/* Left: Case list */}
          <div className='eval-list'>
            <div className='eval-list-header'>
              <div className='eval-list-title'>Cases</div>
            </div>
            <div className='eval-list-body'>
              {loading ? (
                <div className='eval-list-empty'>
                  <div className='spinner' style={{ margin: '0 auto 8px' }} />
                  加载中…
                </div>
              ) : filteredCases.length === 0 ? (
                <div className='eval-list-empty'>
                  {search.trim() ? '无匹配结果' : '暂无 case'}
                </div>
              ) : (
                filteredCases.map(({ c, i }) => (
                  <div
                    key={c.id || i}
                    className={`eval-case-item${i === selectedIdx ? ' selected' : ''}`}
                    onClick={() => handleSelectCase(i)}
                  >
                    <span className='eval-case-num'>#{i + 1}</span>
                    <span className='eval-case-desc'>
                      {truncateDesc(c.description)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Middle: Editor */}
          <div className='eval-editor'>
            <div className='eval-editor-header'>
              <button
                className={`eval-tab${activeTab === 'desc' ? ' active' : ''}`}
                onClick={() => setActiveTab('desc')}
              >
                Description
              </button>
              <button
                className={`eval-tab${activeTab === 'code' ? ' active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                Code
              </button>

              <div className='eval-tab-spacer' />

              {cases.length > 0 && (
                <div className='eval-nav'>
                  <button
                    className='eval-nav-btn'
                    onClick={handlePrev}
                    disabled={selectedIdx <= 0}
                    title='上一条 (↑ / k)'
                  >
                    <svg
                      viewBox='0 0 16 16'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='1.8'
                    >
                      <path
                        d='M10 12L6 8l4-4'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </button>
                  <span className='eval-nav-pos'>
                    {selectedIdx + 1} / {cases.length}
                  </span>
                  <button
                    className='eval-nav-btn'
                    onClick={handleNext}
                    disabled={selectedIdx >= cases.length - 1}
                    title='下一条 (↓ / j)'
                  >
                    <svg
                      viewBox='0 0 16 16'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='1.8'
                    >
                      <path
                        d='M6 4l4 4-4 4'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </button>
                </div>
              )}

              {activeTab === 'code' && selectedCase && (
                <button
                  className='eval-btn'
                  style={{ height: 26, padding: '0 10px', fontSize: 11 }}
                  onClick={() => codeEditorRef.current?.format()}
                  title='格式化代码'
                >
                  <svg
                    viewBox='0 0 16 16'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                  >
                    <path d='M2 4h12M2 8h8M2 12h10' strokeLinecap='round' />
                  </svg>
                  格式化
                </button>
              )}
            </div>

            <div className='eval-editor-body'>
              {!selectedCase ? (
                <div className='eval-editor-empty'>
                  <svg
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1'
                  >
                    <rect x='4' y='4' width='16' height='16' rx='2' />
                    <path d='M8 8h8M8 12h8M8 16h4' strokeLinecap='round' />
                  </svg>
                  请选择左侧 case
                </div>
              ) : activeTab === 'desc' ? (
                <textarea
                  className='eval-desc-area'
                  value={selectedCase.description}
                  onChange={(e) => handleDescChange(e.target.value)}
                  placeholder='输入 case 描述（中文），可包含参考数据 JSON…'
                  spellCheck={false}
                />
              ) : (
                <CodeEditor
                  ref={codeEditorRef}
                  code={selectedCase.codeString}
                  onChange={handleCodeChange}
                />
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className='eval-preview'>
            <Preview
              code={selectedCase?.codeString ?? ''}
              onStatusChange={() => {}}
            />
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
