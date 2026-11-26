import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@project/components/lib/utils';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('clashbot.sidebar') === '1');
  const toggle = () => setCollapsed((c) => { localStorage.setItem('clashbot.sidebar', c ? '0' : '1'); return !c; });
  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <Topbar offset={collapsed ? 'left-0 lg:left-[72px]' : 'left-0 lg:left-64'} />
      <main className={cn('pt-16 transition-[padding] duration-200', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
