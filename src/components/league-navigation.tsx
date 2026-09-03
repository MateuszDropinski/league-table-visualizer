import { ChevronDown, Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { leagues, type LeagueSlug } from '../data/leagues'
import { leagueAccent } from '../lib/league-accent'
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
  const accent = leagueAccent(selected)

  useEffect(() => {
    if (!open) return
    panel.current?.querySelector<HTMLAnchorElement>('[aria-current="page"]')?.focus()
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); button.current?.focus() }
    }
    const outside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false)
    }
    const wide = window.matchMedia('(min-width: 1024px)')
    const resize = () => { if (wide.matches) setOpen(false) }
    document.addEventListener('keydown', dismiss)
    document.addEventListener('pointerdown', outside)
    wide.addEventListener('change', resize)
    return () => {
      document.removeEventListener('keydown', dismiss)
      document.removeEventListener('pointerdown', outside)
      wide.removeEventListener('change', resize)
    }
  }, [open])

  const close = () => {
    setOpen(false)
    if (open) button.current?.focus()
  }

  return <>
    <button ref={button} type="button" aria-label="Choose league" aria-expanded={open} aria-controls="league-navigation" onClick={() => setOpen(!open)} className="league-picker fixed z-40 flex min-h-11 max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-lg border bg-slate-950/45 px-3 py-2.5 text-sm font-medium text-slate-100 shadow-lg shadow-black/15 hover:bg-slate-950/75 focus-visible:bg-slate-950/75 focus-visible:outline-2 focus-visible:outline-white lg:hidden" style={{ borderColor: `${accent.from}99`, backgroundImage: `linear-gradient(115deg, ${accent.from}25, transparent)` }}>
      <Menu size={17} aria-hidden="true" />
      <span className="truncate">{current.name}</span>
      <ChevronDown size={15} aria-hidden="true" className={open ? '' : 'rotate-180'} />
    </button>
    <aside ref={panel} id="league-navigation" aria-label="League selection and data information" onBlur={(event) => {
      if (open && !event.currentTarget.contains(event.relatedTarget as Node | null) && event.relatedTarget !== button.current) setOpen(false)
    }} className={`league-popover ${open ? 'flex' : 'hidden'} fixed z-40 w-72 max-w-[calc(100%-1.5rem)] flex-col overflow-y-auto overscroll-contain rounded-xl border border-slate-700 bg-slate-950 px-4 py-5 shadow-2xl shadow-black/50 lg:inset-y-0 lg:left-0 lg:right-auto lg:flex lg:max-h-none lg:w-52 lg:rounded-none lg:border-y-0 lg:border-l-0 lg:border-r-slate-800 lg:py-6 lg:shadow-none`} style={{ backgroundImage: `linear-gradient(160deg, ${accent.from}22, transparent 60%)` }}>
      <p className="text-sm font-semibold tracking-tight text-slate-100">Points First<span style={{ color: accent.to }}>.</span></p>
      <p className="mt-1 text-xs text-slate-400">Football, by the gap.</p>
      <nav aria-label="Leagues" className="mt-5 space-y-1 lg:mt-7">
        {leagues.map((league) => {
          const brand = leagueAccent(league.slug)
          const active = selected === league.slug
          return <a key={league.slug} href={`#${league.slug}`} aria-current={active ? 'page' : undefined} onClick={close} className={`flex min-h-11 items-center gap-2 rounded-md border-l-2 px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-white ${active ? 'font-semibold text-slate-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`} style={{ borderLeftColor: active ? brand.to : 'transparent', background: active ? `linear-gradient(110deg, ${brand.from}45, ${brand.to}12)` : undefined }}>
            <img src={league.logo} alt="" width={28} height={28} className={`h-7 w-7 shrink-0 object-contain ${league.logoOnLight ? 'rounded-sm bg-slate-100 p-0.5' : ''}`} />
            {league.name}
          </a>
        })}
      </nav>
      {standings && <div className="mt-5 pt-4 text-xs leading-relaxed text-slate-400 lg:mt-auto lg:pt-8">
        <p className="text-slate-300">{standings.league.name} · {standings.league.season}/{String(standings.league.season + 1).slice(-2)}</p>
        <p>Checked <time dateTime={standings.checkedAt}>{new Date(`${standings.checkedAt}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</time></p>
        <p>Updated manually</p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {standings.sources.map((source, index) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="underline decoration-slate-600 underline-offset-4 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-white" aria-label={`${index === 0 ? 'Standings source' : 'Cross-check'}: ${source.name}`}>{source.name} ↗</a>)}
        </div>
        <p className="mt-4"><span className="text-amber-300">−1 / ●</span> Fewer matches played</p>
        <p className="mt-1">Hover or tap a club for its full record.</p>
      </div>}
    </aside>
  </>
}
