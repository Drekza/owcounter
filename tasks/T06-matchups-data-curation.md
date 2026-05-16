# T06 — Pairwise matchups data

## Goal
Build `src/data/matchups.json` — sparse pairwise matchup table covering meaningful counter relationships.

## Depends on
T05 (need final hero ids)

## Files to create
- `src/data/matchups.json`

## Schema
```json
{
  "scale": "-2..+2",
  "comment": "Positive = myHero favored vs enemyHero. Missing pair = 0 (neutral).",
  "pairs": {
    "sojourn:pharah": 2,
    "winston:ana": 2,
    "reinhardt:pharah": -2
  }
}
```

- Key format: `"<myHeroId>:<enemyHeroId>"`.
- Integer in `[-2, 2]`:
  - `+2` hard counter (clear matchup win, oppressive)
  - `+1` soft favor (advantage but skill-dependent)
  - `0` neutral (omit — don't store zeros)
  - `-1` soft unfavorable
  - `-2` hard countered (oppressive against you)
- Asymmetric — `A:B = 2` does NOT imply `B:A = -2` automatically (though usually does). Store both directions when meaningful.

## Meta research
### Sources
- counterpick.gg matchup ratings
- Liquipedia hero pages — "matchups" sections where present
- coach/educational OW content (Spilo, Custa, Awkward)
- Aggregate community wisdom from r/CompetitiveOverwatch matchup threads
- Recent pro analysis if available

### Coverage target
- Don't aim for full NxN. Aim for "meaningful" pairs only.
- Per hero, expect 5–15 outgoing entries (heroes they counter + are countered by).
- Estimated total: ~400–800 entries.

### Sanity checks
- Hard counters that should be present (examples — verify against current meta):
  - `sojourn:pharah +2`, `cassidy:pharah +2`, `soldier-76:pharah +1`
  - `winston:widowmaker +2`, `winston:ana +1`, `winston:zenyatta +2`
  - `sombra:widowmaker +2`, `sombra:bastion +2`
  - `reinhardt:pharah -2`, `reinhardt:bastion +1`
  - `dva:widowmaker +2`, `dva:pharah +2`
  - `pharah:reinhardt +1`, `pharah:torbjorn +1`
  - `reaper:winston +2`, `reaper:roadhog +1`
  - `brigitte:tracer +1`, `brigitte:genji +1`, `brigitte:doomfist +1`
  - `ana:winston +1`, `ana:dva -1` (depends on team)
  - `kiriko:sombra +1` (suzu)
  - `zarya:reinhardt +1`, `zarya:dva +1`

These are illustrative — re-validate against current patch.

## Acceptance
- File parses as valid JSON.
- All hero ids reference real heroes in `heroes.json`.
- No `0` values (sparse).
- Author confidence-checked top-30 most impactful entries via spot-play.
- Snapshot tests (T19) build on this dataset.

## Notes
- Edit in passes: first pass = obvious hard counters; second pass = soft matchups during own play; third pass = peer review against current tier lists.
- Map overrides for specific matchups live in `maps.json` (T08), not here.
- This task is the single largest data effort. Allocate time accordingly.
