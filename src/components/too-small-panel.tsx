import { MoveVertical } from 'lucide-react'

interface TooSmallPanelProps {
  league: string
}

/*
  Shown instead of the table when the container is below the Micro floor.

  A squashed table would still look like a table while lying about every
  distance in it, which is worse than not drawing one. Nothing here is stateful,
  so the moment the container grows past the floor the table is simply back.
*/
export function TooSmallPanel({ league }: TooSmallPanelProps) {
  return (
    <li className="flex h-full items-center justify-center px-6 text-center">
      <div className="max-w-xs">
        <MoveVertical className="mx-auto h-5 w-5 text-slate-600" />
        <p className="mt-3 text-sm font-semibold text-slate-200">{league}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          This screen is too short to show the distances between these teams
          honestly. A little more height and the table is back.
        </p>
      </div>
    </li>
  )
}
