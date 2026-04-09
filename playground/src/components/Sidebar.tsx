'use client';

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  return (
    <aside className='sidebar'>
      <div className='sidebar-header'>
        <div className='brand'>
          <div className='brand-icon'>
            <svg
              viewBox='0 0 16 16'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path d='M3 12L8 4L13 12H3Z' fill='currentColor' opacity='0.9' />
              <circle cx='8' cy='4' r='1.5' fill='currentColor' />
            </svg>
          </div>
          <span className='brand-name'>AntV Copilot</span>
        </div>
      </div>

      {children}
    </aside>
  );
}
