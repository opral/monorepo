import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Flashtype</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Minimal scaffold — React 19 + Vite + TanStack Router.
      </p>
      <nav style={{ display: 'flex', gap: 12 }}>
        <Link to="/" style={{ color: '#2563eb' }}>
          Home
        </Link>
      </nav>
    </main>
  );
}
