'use client';

interface ToolbarProps {
  onRun: () => void;
  onCopy: () => void;
  onFormat: () => void;
  onClear: () => void;
  status: string;
  statusColor: string;
}

export default function Toolbar({
  onRun,
  onCopy,
  onFormat,
  onClear,
  status,
  statusColor
}: ToolbarProps) {
  return (
    <div className='toolbar'>
      <button className='toolbar-btn primary' onClick={onRun}>
        <svg
          viewBox='0 0 16 16'
          fill='currentColor'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M5 3.5L13 8L5 12.5V3.5Z' />
        </svg>
        运行
      </button>
      <div className='toolbar-sep' />
      <button className='toolbar-btn' onClick={onCopy}>
        <svg
          viewBox='0 0 16 16'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
          xmlns='http://www.w3.org/2000/svg'
        >
          <rect x='5' y='5' width='8' height='9' rx='1.5' />
          <path d='M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v7A1.5 1.5 0 003.5 12H5' />
        </svg>
        复制
      </button>
      <button className='toolbar-btn' onClick={onFormat}>
        <svg
          viewBox='0 0 16 16'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M2 4h12M2 8h8M2 12h10' strokeLinecap='round' />
        </svg>
        格式化
      </button>
      <button className='toolbar-btn' onClick={onClear}>
        <svg
          viewBox='0 0 16 16'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M3 4h10M6 4V3h4v1M5 4l1 9h4l1-9'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
        清空
      </button>
      <div className='toolbar-spacer' />
      <div className='status-dot'>
        <span
          className='dot'
          style={{
            background: statusColor,
            boxShadow: `0 0 6px ${statusColor}`
          }}
        />
        <span>{status}</span>
      </div>
    </div>
  );
}
