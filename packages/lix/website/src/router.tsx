import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/Home';
import FileManagerPage from './pages/FileManager';

// Routes configuration
const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'file-manager',
        element: <FileManagerPage />
      }
    ]
  }
];

// Use BrowserRouter for clean URLs without the hash
export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL || '/'
});

// Export routes for reference
export { routes };