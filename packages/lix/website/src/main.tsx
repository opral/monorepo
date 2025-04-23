import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async';
import { router } from './router'
import './styles/tailwind.css'

// Get the root element
const rootElement = document.getElementById('root')!

// In both development and production, simply render the app
// Since we're not doing true SSR, just creating empty placeholders,
// we don't need to use hydrateRoot - createRoot is more appropriate
const root = createRoot(rootElement)
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </React.StrictMode>
)