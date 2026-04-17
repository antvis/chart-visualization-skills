'use client';

import { useState, useEffect, useCallback } from 'react';
import ResultSidebar from '@/components/results/ResultSidebar';
import ResultDetail from '@/components/results/ResultDetail';
import StatsModal from '@/components/results/StatsModal';
import CompareModal from '@/components/results/CompareModal';
import type { EvalRun, RenderState, FilterType } from '@/components/results/types';

interface DatasetMeta {
  name: string;
  modified: string;
  summary: { model?: string; avgSimilarity?: number; totalTests?: number };
}

export default function ResultsPage() {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [currentFile, setCurrentFile] = useState('');
  const [run, setRun] = useState<EvalRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [renderResults, setRenderResults] = useState<Record<string, RenderState>>({});
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    fetch('/api/results')
      .then((r) => r.json())
      .then((data: { results: DatasetMeta[] }) => {
        setDatasets(data.results ?? []);
        if (data.results?.length > 0) setCurrentFile(data.results[0].name);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!currentFile) return;
    setLoading(true);
    setRun(null);
    setCurrentIndex(0);
    setRenderResults({});
    fetch(`/api/results/${currentFile}`)
      .then((r) => r.json())
      .then((data: EvalRun) => setRun(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentFile]);

  const handleFileChange = useCallback((file: string) => {
    if (file === currentFile) return;
    setCurrentFile(file);
  }, [currentFile]);

  const handleRenderResult = useCallback((id: string, state: RenderState) => {
    setRenderResults((prev) => ({ ...prev, [id]: state }));
  }, []);

  const handleRunAll = useCallback(async () => {
    if (!run || isRunningAll) return;
    setIsRunningAll(true);
    setRenderResults({});
    for (let i = 0; i < run.results.length; i++) {
      setCurrentIndex(i);
      await new Promise((r) => setTimeout(r, 1200));
    }
    setIsRunningAll(false);
  }, [run, isRunningAll]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).closest('.monaco-editor')) return;
      if (e.key === 'ArrowLeft') setCurrentIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setCurrentIndex((i) => Math.min((run?.results.length ?? 1) - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [run]);

  return (
    <div className="flex h-screen overflow-hidden">
      {loading && <div className="rs-loading-bar" />}

      <ResultSidebar
        datasets={datasets}
        currentFile={currentFile}
        run={run}
        renderResults={renderResults}
        currentIndex={currentIndex}
        filter={filter}
        search={search}
        onFileChange={handleFileChange}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
        onSelect={setCurrentIndex}
      />

      <ResultDetail
        run={run}
        currentIndex={currentIndex}
        renderResults={renderResults}
        onRenderResult={handleRenderResult}
        onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCurrentIndex((i) => Math.min((run?.results.length ?? 1) - 1, i + 1))}
        onRunAll={handleRunAll}
        isRunningAll={isRunningAll}
        onShowStats={() => setShowStats(true)}
        onShowCompare={() => setShowCompare(true)}
      />

      {showStats && run && (
        <StatsModal run={run} renderResults={renderResults} onClose={() => setShowStats(false)} />
      )}
      {showCompare && (
        <CompareModal datasets={datasets} currentFile={currentFile} onClose={() => setShowCompare(false)} />
      )}
    </div>
  );
}
