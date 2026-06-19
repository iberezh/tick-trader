import { NavLink, Route, Routes } from 'react-router-dom';
import { AnalyticsPage } from './components/analytics/analytics-page';
import { Dashboard } from './components/app/dashboard';
import { cn } from './lib/utils';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  cn(
    'font-mono text-sm transition-colors',
    isActive ? 'text-up' : 'text-muted-foreground hover:text-foreground',
  );

export function App() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center gap-5 border-b bg-card px-4 py-2">
        <span className="font-semibold tracking-tight">tick-trader</span>
        <NavLink to="/" end className={linkClass}>
          dashboard
        </NavLink>
        <NavLink to="/analytics" className={linkClass}>
          analytics
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </div>
  );
}
