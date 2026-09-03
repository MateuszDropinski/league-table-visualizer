import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { leagues, type LeagueSlug } from '../data/leagues'
import type { StandingsFile } from '../types/standings'

interface Props {
  selected: LeagueSlug
  standings: StandingsFile | null
}

export function LeagueNavigation({ selected, standings }: Props) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const current = leagues.find((league) => league.slug === selected)!

  useEffect(() => {
    if (!open) return
    panel.current?.querySelector<HTMLAnchorElement>('[aria-current="page"]')?.focus()
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); button.current?.focus() }
    }
    document.addEventListener('keydown', dismiss)
    return () => document.removeEventListener('keydown', dismiss)
  }, [open])

  const close = () => { setOpen(false); button.current?.focus() }

  return <>
    <div className="fixed inset-y-0 left-0 z-30 flex w-12 flex-col items-center border-r border-slate-800 bg-slate-950 py-2 lg:hidden">
      <button ref={button} type="button" aria-label="Choose league" aria-expanded={open} aria-controls="league-navigation" onClick={() => setOpen(!open)} className="flex h-11 w-11 items-center justify-center rounded text-slate-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-emerald-400">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <span className="mt-3 text-xs font-semibold text-emerald-300" title={current.name}>{current.code}</span>
    </div>
    {open && <button type="button" aria-label="Close league navigation" tabIndex={-1} onClick={close} className="fixed inset-0 z-20 bg-black/50 lg:hidden" />}
    <aside ref={panel} id="league-navigation" aria-label="League selection and data information" onBlur={(event) => {
      if (open && !event.currentTarget.contains(event.relatedTarget as Node | null) && event.relatedTarget !== button.current) setOpen(false)
    }} className={`${open ? 'flex' : 'hidden'} fixed inset-y-0 left-12 z-30 w-56 flex-col overflow-y-auto border-r border-slate-800 bg-slate-950 px-4 py-6 lg:left-0 lg:flex lg:w-52`}>
      <p className="text-sm font-semibold tracking-tight text-slate-100">Points First<span className="text-emerald-400">.</span></p>
      <p className="mt-1 text-xs text-slate-500">Football, by the gap.</p>
      <nav aria-label="Leagues" className="mt-7 space-y-1">
        {leagues.map((league) => <a key={league.slug} href={`#${league.slug}`} aria-current={selected === league.slug ? 'page' : undefined} onClick={close} className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400 ${selected === league.slug ? 'bg-emerald-400/10 text-emerald-300' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}>
          <span aria-hidden="true" className="w-5 text-xs font-semibold opacity-70">{league.code}</span>
          {league.name}
        </a>)}
      </nav>
      {standings && <div className="mt-auto pt-8 text-xs leading-relaxed text-slate-500">
        <p className="text-slate-300">{standings.league.name} · {standings.league.season}/{String(standings.league.season + 1).slice(-2)}</p>
        <p>Checked <time dateTime={standings.checkedAt}>{new Date(`${standings.checkedAt}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</time></p>
        <p>Updated manually</p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {standings.sources.map((source, index) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="underline decoration-slate-700 underline-offset-4 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-emerald-400" aria-label={`${index === 0 ? 'Standings source' : 'Cross-check'}: ${source.name}`}>{source.name} ↗</a>)}
        </div>
        <p className="mt-4"><span className="text-amber-300">−1 / ●</span> Fewer matches played</p>
        <p className="mt-1">Select a club for its full record.</p>
      </div>}
    </aside>
  </>
}
