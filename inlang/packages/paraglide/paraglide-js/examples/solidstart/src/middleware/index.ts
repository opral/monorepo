import { createMiddleware } from '@solidjs/start/middleware';

import { overwriteGetLocale } from '~/paraglide/runtime';
import { paraglideMiddleware } from '~/paraglide/server';

export default createMiddleware({
  onRequest: async ({ request }) => {
    // @ts-expect-error URLPattern is not defined
    if (!globalThis.URLPattern) {
      await import("urlpattern-polyfill");
    }

    // Skip middleware for API and server routes
    if (request.url.includes("api") || request.url.includes("_server")) return;


    return paraglideMiddleware(request, ({ request: localeRequest, locale }) => {
      request = localeRequest;
      overwriteGetLocale(() => locale);
    });
  }
});
