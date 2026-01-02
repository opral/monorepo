import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-semibold">Hello world</h1>
    </main>
  )
}
