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
            <img
              src='https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*FBLnQIAzx6cAAAAAQDAAAAgAemJ7AQ/original'
              alt='AntV Visualization Skills Playground'
              width={24}
              height={24}
            />
          </div>
          <span className='brand-name'>AntV Visualization Skills Playground</span>
        </div>
      </div>

      {children}
    </aside>
  );
}
