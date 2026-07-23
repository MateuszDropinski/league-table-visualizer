/*
  Source of truth for the mock leagues. The generator turns this into the 25
  snapshot JSON files; nothing here ships in the app bundle.

  Teams are listed in FINAL table order, so `ppg[i]` belongs to `teams[i]`. The
  listings are deliberately not alphabetical, otherwise the finished table would
  read as obviously synthetic.

  `ppg` is points per game for the full season. Multiplying by the rounds played
  at a snapshot gives that snapshot's points, which keeps totals plausible at
  every stage for free. Equal ppg values are intentional: they are how the
  shared point levels and exact ties get built.
*/

/**
 * A team that has not played every round yet, which is what puts a games in
 * hand mark on its chip. Their points come from the games they did play, so
 * they sit lower on the axis than the season says they should, which is the
 * whole reason the mark exists.
 */
export interface MissedFixtures {
  /** 1-based, matching the snapshot suffix in the file name. */
  snapshot: number
  /** Index into `teams`, so final table order. */
  team: number
  /** Rounds not played by this snapshot. */
  games: number
}

export interface MockLeague {
  id: number
  slug: string
  name: string
  country: string
  season: number
  /** What this league exists to put in front of the layout engine. */
  character: string
  /** "Full Name|Short Name", in final table order. */
  teams: string[]
  /** Season points per game, index-aligned with `teams`. */
  ppg: number[]
  /**
   * Rounds played at each of the 5 snapshots. The opener is round 3 rather
   * than round 1 because after a single round the only reachable totals are
   * 0, 1 and 3, which no points-per-game profile can land on honestly.
   */
  rounds: [number, number, number, number, number]
  /**
   * Forces every team level on a single point at snapshot 1, representing an
   * opening round where every fixture was drawn. Collapses the whole table
   * into one row, which is the emptiest axis the engine has to survive.
   */
  allSquareOpener?: boolean
  /**
   * Postponements, so the matches behind mark has something to mark. Never on
   * snapshot 5, since a finished season leaves nobody behind, and never on an
   * all square opener, which is defined by every team having played the same
   * single round.
   */
  missed?: MissedFixtures[]
}

export const MOCK_LEAGUES: MockLeague[] = [
  {
    id: 9001,
    slug: 'albion-league',
    name: 'Albion League',
    country: 'Albion',
    season: 2025,
    character: 'Runaway leader opening a double digit gap over a flat pack',
    teams: [
      'Kingsmere United|Kingsmere',
      'Thornbury City|Thornbury',
      'Ashford Rovers|Ashford',
      'Millbrook City|Millbrook',
      'Greystone Wanderers|Greystone',
      'Fenwick Rangers|Fenwick',
      'Dunmore City|Dunmore',
      'Westhaven Rangers|Westhaven',
      'Harlow Albion|Harlow',
      'Oakhaven FC|Oakhaven',
      'Bramley Town|Bramley',
      'Northgate Rovers|Northgate',
      'Calderwood United|Calderwood',
      'Pemberton Athletic|Pemberton',
      'Larkhall Town|Larkhall',
      'Stonefield Wanderers|Stonefield',
      'Eastvale Athletic|Eastvale',
      'Redmarsh Town|Redmarsh',
      'Ironbridge FC|Ironbridge',
      'Quarrydale United|Quarrydale',
    ],
    // 2.55 over 38 rounds is 97 points against 78 for second: a 19 point gap,
    // which is the single tallest gap anywhere in the mock set.
    ppg: [
      2.55, 2.05, 1.97, 1.92, 1.79, 1.71, 1.63, 1.5, 1.42, 1.37, 1.32, 1.29,
      1.24, 1.18, 1.13, 1.05, 0.97, 0.87, 0.74, 0.58,
    ],
    rounds: [3, 10, 19, 29, 38],
    // The runaway leader is two games light, which is the case the mark exists
    // for: the double digit lead below them is smaller than the axis makes it
    // look, and nothing else on screen would say so.
    missed: [
      { snapshot: 4, team: 0, games: 2 },
      { snapshot: 4, team: 9, games: 1 },
    ],
  },
  {
    id: 9002,
    slug: 'iberia-primera',
    name: 'Iberia Primera',
    country: 'Iberia',
    season: 2025,
    character: 'Two team title race stranded far above a tight chasing pack',
    teams: [
      'Real Solano|Solano',
      'Atlético Miravel|Miravel',
      'CD Puerto Nuevo|Puerto Nuevo',
      'Sporting Valdera|Valdera',
      'Deportivo Alanjo|Alanjo',
      'UD Cabrera|Cabrera',
      'CF Espadilla|Espadilla',
      'Real Torrelena|Torrelena',
      'Racing Montenar|Montenar',
      'CD Vallehermoso|Vallehermoso',
      'UD Peñalba|Peñalba',
      'Atlético Sabinar|Sabinar',
      'CF Marbelia|Marbelia',
      'Sporting Ondara|Ondara',
      'Real Cuéllaris|Cuéllaris',
      'CD Aguamar|Aguamar',
      'Racing Olivenza|Olivenza',
      'Deportivo Sierrablanca|Sierrablanca',
      'UD Ribamar|Ribamar',
      'CF Nuevaluz|Nuevaluz',
    ],
    // The top two land on 93 and 92, third on 70: a 22 point chasm below a
    // one point title race, so a huge gap and a near tie must render together.
    ppg: [
      2.45, 2.42, 1.85, 1.82, 1.79, 1.74, 1.66, 1.58, 1.5, 1.45, 1.4, 1.34,
      1.29, 1.24, 1.18, 1.11, 1.03, 0.95, 0.84, 0.66,
    ],
    rounds: [3, 10, 19, 29, 38],
    // One of the two teams in the title race, so a near tie has to be read with
    // a caveat, and one near the foot with two games missing.
    missed: [
      { snapshot: 3, team: 1, games: 1 },
      { snapshot: 3, team: 17, games: 2 },
    ],
  },
  {
    id: 9003,
    slug: 'rheinland-liga',
    name: 'Rheinland Liga',
    country: 'Rheinland',
    season: 2025,
    character: 'Dense mid-table cluster stacking several shared point levels',
    teams: [
      'SV Rheinfeld|Rheinfeld',
      'Eintracht Falkenberg|Falkenberg',
      'FC Adlerberg|Adlerberg',
      'VfB Morgenstern|Morgenstern',
      'TSV Königsbach|Königsbach',
      'SC Wolkenstein|Wolkenstein',
      'VfL Hammerthal|Hammerthal',
      'FC Steinbrück|Steinbrück',
      'SV Lindenau|Lindenau',
      'SC Nordhelm|Nordhelm',
      'TSV Auental|Auental',
      'FC Drachenfels|Drachenfels',
      'SV Kaltenbrunn|Kaltenbrunn',
      'VfL Sonnenheim|Sonnenheim',
      'SC Eisenhorst|Eisenhorst',
      'FC Grünwalde|Grünwalde',
      'TSV Silbersee|Silbersee',
      'SV Ostmark|Ostmark',
    ],
    // Over 34 rounds the middle eight land on 50, 50, 50, 49, 49, 49, 48, 48:
    // three occupied levels in a row with no gap at all between them.
    ppg: [
      2.32, 2.03, 1.85, 1.62, 1.47, 1.47, 1.47, 1.44, 1.44, 1.44, 1.41, 1.41,
      1.26, 1.15, 1.03, 0.91, 0.76, 0.59,
    ],
    rounds: [3, 9, 17, 26, 34],
    // Two teams from the mid-table cluster, so the mark has to work on a row
    // shared by several teams rather than only on a row of its own.
    missed: [
      { snapshot: 2, team: 5, games: 1 },
      { snapshot: 2, team: 6, games: 1 },
    ],
  },
  {
    id: 9004,
    slug: 'vistula-ekstraliga',
    name: 'Vistula Ekstraliga',
    country: 'Vistula',
    season: 2025,
    character: 'Relegation scrap with four teams dead level at the bottom',
    teams: [
      'Polonia Zamostowo|Polonia Z.',
      'Górnik Węglowice|Górnik W.',
      'Lechia Jaworzec|Lechia J.',
      'Pogoń Mierzeja|Pogoń M.',
      'Stal Rudniki|Stal R.',
      'Orzeł Bielawiec|Orzeł B.',
      'Zagłębie Karbowo|Zagłębie K.',
      'Odra Głogowiec|Odra G.',
      'Korona Sandomierka|Korona S.',
      'Motor Przemyślany|Motor P.',
      'Warta Nadrzecze|Warta N.',
      'Piast Grodzisko|Piast G.',
      'Ruch Kamienna Wola|Ruch K.',
      'Granit Skalnica|Granit S.',
      'Iskra Nowogród|Iskra N.',
      'Burza Podleśna|Burza P.',
      'Sokół Wysoczyzna|Sokół W.',
      'Naprzód Bystrzyca|Naprzód B.',
    ],
    // The bottom four share one ppg, so they sit on the same total at every
    // snapshot: a four team chip row that has to wrap at the foot of the axis.
    ppg: [
      2.15, 1.94, 1.82, 1.68, 1.56, 1.47, 1.38, 1.29, 1.21, 1.15, 1.09, 1.03,
      0.97, 0.91, 0.85, 0.85, 0.85, 0.85,
    ],
    rounds: [3, 9, 17, 26, 34],
    // Kept clear of the bottom four, whose shared total is what this league is
    // here to exercise and must not be broken up by a postponement.
    missed: [{ snapshot: 3, team: 8, games: 1 }],
  },
  {
    id: 9005,
    slug: 'nordic-serien',
    name: 'Nordic Serien',
    country: 'Norden',
    season: 2025,
    character: 'Every team level after an all draw opening round, tight all season',
    teams: [
      'Nordfjell FK|Nordfjell',
      'Bjørnvik IF|Bjørnvik',
      'Storhamn BK|Storhamn',
      'Fjellstad FK|Fjellstad',
      'Lyngdal IF|Lyngdal',
      'Havnvik BK|Havnvik',
      'Solberg IF|Solberg',
      'Granholm FK|Granholm',
      'Tindeby BK|Tindeby',
      'Skogheim IF|Skogheim',
      'Vestfoss FK|Vestfoss',
      'Ålvik BK|Ålvik',
      'Myrland IF|Myrland',
      'Kvitnes FK|Kvitnes',
      'Bergholt BK|Bergholt',
      'Sundvang IF|Sundvang',
      'Elvedal FK|Elvedal',
      'Nordlys BK|Nordlys',
      'Steinvik IF|Steinvik',
      'Trollhaug FK|Trollhaug',
    ],
    // A deliberately narrow spread: 73 down to 40, no gap wider than 3 points.
    // The opposite stress case to Albion, and the one most likely to run out
    // of vertical room because almost every level is occupied.
    ppg: [
      1.92, 1.87, 1.82, 1.79, 1.74, 1.71, 1.66, 1.63, 1.58, 1.53, 1.5, 1.45,
      1.42, 1.37, 1.32, 1.29, 1.24, 1.18, 1.13, 1.05,
    ],
    rounds: [1, 10, 19, 29, 38],
    allSquareOpener: true,
    // Three games light, the widest the mark has to count to, on the team at
    // the foot of the narrowest table in the set.
    missed: [{ snapshot: 2, team: 19, games: 3 }],
  },
]

/** Labels are shown in the dev switcher, dates drive the "updated X ago" copy. */
export const SNAPSHOT_LABELS = ['1/5', '2/5', '3/5', '4/5', '5/5'] as const

/**
 * Fixed so regenerating produces byte identical files and never churns git.
 * They describe a past season, so the relative time copy will read in months
 * rather than minutes while developing against mocks.
 */
export const SNAPSHOT_DATES = [
  '2025-08-24T18:45:00.000Z',
  '2025-10-26T18:45:00.000Z',
  '2025-12-21T18:45:00.000Z',
  '2026-03-15T18:45:00.000Z',
  '2026-05-24T16:00:00.000Z',
] as const
