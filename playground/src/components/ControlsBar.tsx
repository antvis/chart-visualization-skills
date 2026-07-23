'use client';

interface ControlsBarProps {
  library: string;
  mode: string;
  strategy: string;
  onLibraryChange: (library: string) => void;
  onModeChange: (mode: string) => void;
  onStrategyChange: (strategy: string) => void;
}

const STRATEGY_OPTIONS = [
  {
    value: 'hybrid',
    label: 'Hybrid',
    title: '混合检索：FTS + 语义向量，默认推荐'
  },
  { value: 'vector', label: 'Vector', title: '纯语义向量搜索' }
] as const;

export default function ControlsBar({
  library,
  mode,
  strategy,
  onLibraryChange,
  onModeChange,
  onStrategyChange
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
        <label>
          <input
            type='radio'
            name='library'
            value='x6'
            checked={library === 'x6'}
            onChange={() => onLibraryChange('x6')}
          />
          <span className='seg-label'>
            <span className='seg-dot' />
            X6
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

      {mode === 'cli' && (
        <div className='seg-group' title='CLI 模式下的检索策略'>
          {STRATEGY_OPTIONS.map((opt) => (
            <label key={opt.value} title={opt.title}>
              <input
                type='radio'
                name='strategy'
                value={opt.value}
                checked={strategy === opt.value}
                onChange={() => onStrategyChange(opt.value)}
              />
              <span className='seg-label'>{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
