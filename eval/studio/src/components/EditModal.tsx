'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import CodeEditor, { type CodeEditorHandle } from './CodeEditor';
import Preview from './Preview';

interface EvalCase {
  id?: string;
  description: string;
  codeString: string;
}

interface EditModalProps {
  index: number;
  caseData: EvalCase;
  onSave: (updated: EvalCase) => void;
  onClose: () => void;
}

export default function EditModal({ index, caseData, onSave, onClose }: EditModalProps) {
  const codeEditorRef = useRef<CodeEditorHandle>(null);
  const [activeTab, setActiveTab] = useState<'desc' | 'code'>('desc');
  const [draft, setDraft] = useState<EvalCase>(caseData);
  const dirty = draft.description !== caseData.description || draft.codeString !== caseData.codeString;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = useCallback(() => { onSave(draft); onClose(); }, [draft, onSave, onClose]);
  const handleBackdrop = useCallback((e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); }, [onClose]);

  const tabCls = (active: boolean) =>
    `inline-flex items-center h-[28px] px-3 border-none rounded-[6px] text-[11px] font-semibold font-[inherit] uppercase tracking-[0.5px] cursor-pointer transition-all duration-150 ${
      active ? 'text-accent bg-accent-dim' : 'text-fg-subtle hover:text-fg-muted hover:bg-hover'
    }`;

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100] p-6 backdrop-blur-[2px]" onClick={handleBackdrop}>
      <div className="bg-surface border border-border rounded-[12px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] flex flex-col w-full max-w-[1100px] h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border-subtle shrink-0">
          <span className="text-[13px] font-semibold text-fg">
            编辑 Case <span className="text-[11px] font-medium text-fg-subtle ml-1 font-mono">#{index + 1}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              className={`inline-flex items-center gap-[5px] h-[28px] px-3 border rounded-[6px] text-[12px] font-[inherit] cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                dirty ? 'bg-amber-dim border-amber/50 text-amber font-semibold' : 'bg-surface-subtle text-fg-muted border-border'
              }`}
              onClick={handleSave}
              disabled={!dirty}
            >
              保存
            </button>
            <button
              className="inline-flex items-center justify-center w-[28px] h-[28px] bg-transparent border border-transparent rounded-[6px] text-fg-subtle cursor-pointer transition-all duration-150 p-0 hover:bg-red-dim hover:border-red/30 hover:text-red"
              onClick={onClose}
              title="关闭 (Esc)"
            >
              <svg className="w-[14px] h-[14px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: editor */}
          <div className="w-[48%] flex flex-col border-r border-border-subtle overflow-hidden">
            <div className="h-[38px] flex items-center pl-3 pr-1 border-b border-border-subtle bg-panel shrink-0 gap-[2px]">
              <button className={tabCls(activeTab === 'desc')} onClick={() => setActiveTab('desc')}>Description</button>
              <button className={tabCls(activeTab === 'code')} onClick={() => setActiveTab('code')}>Code</button>
              <div className="flex-1" />
              {activeTab === 'code' && (
                <button
                  className="inline-flex items-center gap-[5px] h-[26px] px-[10px] bg-transparent border border-border rounded-[6px] text-fg-muted text-[11px] font-medium font-[inherit] cursor-pointer transition-all duration-150 whitespace-nowrap hover:bg-hover hover:text-fg hover:border-border-focus"
                  onClick={() => codeEditorRef.current?.format()}
                >
                  <svg className="w-[13px] h-[13px] shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 4h12M2 8h8M2 12h10" strokeLinecap="round" />
                  </svg>
                  格式化
                </button>
              )}
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'desc' ? (
                <textarea
                  className="flex-1 w-full px-4 py-[14px] bg-transparent border-none outline-none resize-none text-[13px] font-[inherit] text-fg leading-[1.65] placeholder:text-fg-subtle"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="输入 case 描述…"
                  spellCheck={false}
                />
              ) : (
                <CodeEditor
                  ref={codeEditorRef}
                  code={draft.codeString}
                  onChange={(v) => setDraft((d) => ({ ...d, codeString: v }))}
                />
              )}
            </div>
          </div>

          {/* Right: preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Preview code={draft.codeString} onStatusChange={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}
