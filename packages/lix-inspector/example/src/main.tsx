import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './index.css';

// Lazy load the ProseMirror example
const ProseMirrorExample = lazy(() => import('../../examples/prosemirror-usage'));

// Create router
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/prosemirror',
    element: (
      <Suspense fallback={<div className="loading">Loading ProseMirror example...</div>}>
        <ProseMirrorExample />
      </Suspense>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);