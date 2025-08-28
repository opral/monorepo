import * as React from 'react'

export type LeftDockTab = 'files' | 'history' | null

type Ctx = {
  active: LeftDockTab
  setActive: (tab: LeftDockTab) => void
}

const LeftDockContext = React.createContext<Ctx | null>(null)

export function LeftDockProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = React.useState<LeftDockTab>(null)
  const value = React.useMemo(() => ({ active, setActive }), [active])
  return <LeftDockContext.Provider value={value}>{children}</LeftDockContext.Provider>
}

export function useLeftDock() {
  const ctx = React.useContext(LeftDockContext)
  if (!ctx) throw new Error('useLeftDock must be used within LeftDockProvider')
  return ctx
}

