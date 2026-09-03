import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface CardOwner {
  activeId: number | null
  activate: (id: number) => void
  release: (id: number) => void
}

const TeamCardContext = createContext<CardOwner | null>(null)

/** One owner per table. A delayed close can only release its own card. */
export function TeamCardScope({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<number | null>(null)
  const activate = useCallback((id: number) => setActiveId(id), [])
  const release = useCallback((id: number) => setActiveId((current) => current === id ? null : current), [])
  const value = useMemo(() => ({ activeId, activate, release }), [activeId, activate, release])
  return <TeamCardContext.Provider value={value}>{children}</TeamCardContext.Provider>
}

export function useTeamCard() {
  const owner = useContext(TeamCardContext)
  if (!owner) throw new Error('TeamChip requires TeamCardScope')
  return owner
}
