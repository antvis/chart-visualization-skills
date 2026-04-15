'use client';

import GridCell from './GridCell';
import ErrorBoundary from './ErrorBoundary';

interface EvalCase {
  id?: string;
  description: string;
  codeString: string;
}

interface GridViewProps {
  cases: EvalCase[];
  filteredCases: { c: EvalCase; i: number }[];
  selectedIdx: number;
  onEdit: (idx: number) => void;
}

export default function GridView({ filteredCases, selectedIdx, onEdit }: GridViewProps) {
  if (filteredCases.length === 0) {
    return (
      <div className="grid-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
        暂无 case
      </div>
    );
  }

  return (
    <div className="grid-view">
      {filteredCases.map(({ c, i }) => (
        <ErrorBoundary key={c.id || i} index={i}>
          <GridCell
            index={i}
            caseData={c}
            isSelected={i === selectedIdx}
            onEdit={() => onEdit(i)}
          />
        </ErrorBoundary>
      ))}
    </div>
  );
}
