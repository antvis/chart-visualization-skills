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
            value='skill'
            checked={mode === 'skill'}
            onChange={() => onModeChange('skill')}
          />
          <span className='seg-label'>Skill</span>
        </label>
        <label>
          <input
            type='radio'
            name='mode'
            value='cli'
            checked={mode === 'cli'}
            onChange={() => onModeChange('cli')}
          />
          <span className='seg-label'>CLI</span>
        </label>
      </div>
    </div>
  );
}
