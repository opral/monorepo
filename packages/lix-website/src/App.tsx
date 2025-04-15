import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { posthog } from 'posthog-js'

// Pages
import HomePage from './pages/Home'
import FileManagerPage from './pages/FileManager'

function App() {
  const location = useLocation()

  useEffect(() => {
    // Try to get the token from window.__ENV__ if available (for static site)
    const posthogToken = typeof window !== 'undefined' && (window as any).__ENV__?.PUBLIC_LIX_POSTHOG_TOKEN 
      ? (window as any).__ENV__.PUBLIC_LIX_POSTHOG_TOKEN 
      : import.meta.env.VITE_PUBLIC_LIX_POSTHOG_TOKEN || '';

    if (posthogToken) {
      posthog.init(posthogToken, {
        api_host: "https://eu.i.posthog.com",
        capture_performance: false,
        autocapture: {
          capture_copied_text: true,
        },
      })
    } else {
      console.info("No posthog token found")
    }
    
    return () => posthog.reset()
  }, [])

  // Track page views
  useEffect(() => {
    posthog.capture("$pageview")
  }, [location.pathname])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/file-manager" element={<FileManagerPage />} />
    </Routes>
  )
}

export default App