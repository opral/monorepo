import { Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { posthog } from 'posthog-js';

const Layout = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Access the global process object that was set in index.html
      const posthogToken = (window as any).process?.env?.PUBLIC_LIX_POSTHOG_TOKEN || '';

      if (posthogToken) {
        posthog.init(posthogToken, {
          api_host: "https://eu.i.posthog.com",
          capture_performance: false,
          autocapture: {
            capture_copied_text: true,
          },
        });

        // Track page views when location changes
        posthog.capture("$pageview");
      } else {
        console.info("No posthog token found");
      }

      return () => posthog.reset();
    }
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" />
        <link rel="icon" type="image/x-icon" href="/favicon.svg" />
      </Helmet>
      <div className="min-h-screen">
        <Outlet />
      </div>
    </>
  );
};

export default Layout;