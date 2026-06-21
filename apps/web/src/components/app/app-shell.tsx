import { NavLink, Outlet } from 'react-router-dom';
import { LogoMark } from '@/components/logo-mark';
import { cn } from '@/lib/utils';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  cn(
    'font-mono text-sm transition-colors',
    isActive ? 'text-up' : 'text-muted-foreground hover:text-foreground',
  );

// Chrome for the in-app routes (/app, /app/analytics); the landing at / renders standalone.
export function AppShell() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center gap-5 border-b bg-card px-4 py-2">
        <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <LogoMark size={18} className="text-up" />
          tick-trader
        </NavLink>
        <NavLink to="/app" end className={linkClass}>
          dashboard
        </NavLink>
        <NavLink to="/app/analytics" className={linkClass}>
          analytics
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
