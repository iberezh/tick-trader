import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './components/app/dashboard';
import './globals.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Dashboard />
    </StrictMode>,
  );
}
