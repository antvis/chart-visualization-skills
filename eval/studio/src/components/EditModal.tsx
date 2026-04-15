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

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = useCallback(() => {
    onSave(draft);
    onClose();
  }, [draft, onSave, onClose]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">
            编辑 Case <span className="modal-index">#{index + 1}</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className={`eval-btn save${dirty ? ' dirty' : ''}`}
              style={{ height: 28 }}
              onClick={handleSave}
              disabled={!dirty}
            >
              保存
            </button>
            <button className="modal-close" onClick={onClose} title="关闭 (Esc)">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body: editor + preview side by side */}
        <div className="modal-body">
          {/* Left: editor */}
          <div className="modal-editor">
            <div className="eval-editor-header">
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
              <div className="eval-tab-spacer" />
              {activeTab === 'code' && (
                <button
                  className="eval-btn"
                  style={{ height: 26, padding: '0 10px', fontSize: 11 }}
                  onClick={() => codeEditorRef.current?.format()}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 4h12M2 8h8M2 12h10" strokeLinecap="round" />
                  </svg>
                  格式化
                </button>
              )}
            </div>
            <div className="eval-editor-body">
              {activeTab === 'desc' ? (
                <textarea
                  className="eval-desc-area"
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
          <div className="modal-preview">
            <Preview code={draft.codeString} onStatusChange={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}
