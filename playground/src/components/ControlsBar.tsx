'use client';

interface ControlsBarProps {
  library: string;
  mode: string;
  onLibraryChange: (library: string) => void;
  onModeChange: (mode: string) => void;
}

export default function ControlsBar({
  library,
  mode,
  onLibraryChange,
  onModeChange
}: ControlsBarProps) {
  return (
    <div className='controls-bar'>
      <div className='seg-group'>
        <label>
          <input
            type='radio'
            name='library'
            value='g2'
            checked={library === 'g2'}
            onChange={() => onLibraryChange('g2')}
          />
          <span className='seg-label'>
            <span className='seg-dot' />
            G2
          </span>
        </label>
        <label>
          <input
            type='radio'
            name='library'
            value='g6'
            checked={library === 'g6'}
            onChange={() => onLibraryChange('g6')}
          />
          <span className='seg-label'>
            <span className='seg-dot' />
            G6
          </span>
        </label>
      </div>

      <div className='seg-group'>
        <label>
          <input
            type='radio'
            name='mode'
            value='tool-call'
            checked={mode === 'tool-call'}
            onChange={() => onModeChange('tool-call')}
          />
          <span className='seg-label'>Tool Call</span>
        </label>
        <label>
          <input
            type='radio'
            name='mode'
            value='bm25'
            checked={mode === 'bm25'}
            onChange={() => onModeChange('bm25')}
          />
          <span className='seg-label'>BM25</span>
        </label>
      </div>
    </div>
  );
}
