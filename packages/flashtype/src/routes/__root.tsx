import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: () => (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>404 — Not Found</h1>
      <p style={{ color: '#555' }}>The page you’re looking for does not exist.</p>
    </main>
  ),
});

function Root() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-6" />
          <div className="font-medium">Flashtype</div>
        </header>
        <div className="p-4">
          <Outlet />
        </div>
        {import.meta.env.DEV ? (
          <TanStackRouterDevtools position="bottom-right" />
        ) : null}
      </SidebarInset>
    </SidebarProvider>
  );
}
