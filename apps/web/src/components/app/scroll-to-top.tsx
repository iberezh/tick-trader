import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// BrowserRouter keeps the scroll position across navigations; reset to top on route change.
export function ScrollToTop() {
  const { pathname } = useLocation();
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run to scroll on every route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
