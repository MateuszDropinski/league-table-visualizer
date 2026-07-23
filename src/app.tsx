import { BarChartHorizontal } from 'lucide-react'

/*
  Placeholder screen for task 01. It exists to prove three things end to end:
  Tailwind classes compile, lucide-react icons render, and the GitHub Pages
  base path serves the built assets correctly.
*/
export function App() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 p-3 text-slate-950">
          <BarChartHorizontal className="h-8 w-8" strokeWidth={2.5} />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          Points-First League Table
        </h1>
        <p className="text-sm leading-relaxed text-slate-400">
          Standings drawn on a points axis, where the distance between teams is
          the distance in points. Scaffolding is live; the layout engine lands
          next.
        </p>
      </div>
    </div>
  )
}
