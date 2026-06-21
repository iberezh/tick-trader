import { Route, Routes } from 'react-router-dom';
import { AnalyticsPage } from './components/analytics/analytics-page';
import { AppShell } from './components/app/app-shell';
import { Dashboard } from './components/app/dashboard';
import { Landing } from './components/landing/landing';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
    </Routes>
  );
}
