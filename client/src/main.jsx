/**
 * main.jsx - the entry point: mounts React and wraps <App/> in the providers every page needs.
 * FRONTEND: top of the tree (index.html loads this file).
 * TALKS TO (backend): none.
 * HOW IT WORKS: BrowserRouter (URLs) > QueryClientProvider (react-query cache) > ToastProvider (pop-ups) > AuthProvider (who is signed in) > App.
 * TanStack Query caches responses and refetches on window focus; 400/401/403/404/429 errors are never retried.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './shared/context/AuthContext.jsx';
import { ToastProvider } from './shared/components/Toast.jsx';
import App from './App.jsx';
import './styles/app.css';

const client = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: true, retry: (n, e) => n < 2 && ![400, 401, 403, 404, 429].includes(e?.status) } } });

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={client}>
        <ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
