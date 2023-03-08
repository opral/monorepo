The renderer directory contains the logic on how pages are being rendered, both server and client-side.

The possibility to define the render logic is one of the strengths of vite-plugin-ssr. More can be read in vite-plugin-ssr's [documentation](https://vite-plugin-ssr.com/default-page).

- [\_default.page.client.tsx](./_default.page.client.tsx)  
  Defines how a page is being rendered client-side.

- [\_default.page.server.tsx](./_default.page.server.tsx)  
  Defines how a page is being rendered server-side.

- [app.css](./app.css)  
  The global CSS of the app. Mostly used to import [Tailwind](https://tailwindcss.com/).
