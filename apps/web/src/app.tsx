import { Route, Routes } from 'react-router-dom';
import { AnalyticsPage } from './components/analytics/analytics-page';
import { AppShell } from './components/app/app-shell';
import { AuthPage } from './components/app/auth-page';
import { Dashboard } from './components/app/dashboard';
import { ScrollToTop } from './components/app/scroll-to-top';
import { Landing } from './components/landing/landing';

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </>
  );
}
