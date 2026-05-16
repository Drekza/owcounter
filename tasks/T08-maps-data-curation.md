# T08 — Maps + map overrides data

## Goal
Build `src/data/maps.json` — all current OW maps with mode + selective map-conditional matchup/anti-synergy overrides.

## Depends on
T05, T06, T07

## Files to create
- `src/data/maps.json`

## Schema
```json
{
  "modes": ["control", "escort", "hybrid", "push", "flashpoint", "clash"],
  "maps": [
    {
      "id": "circuit-royal",
      "name": "Circuit Royal",
      "mode": "escort",
      "overrides": {
        "matchups": {
          "widowmaker:reinhardt": 2
        },
        "antiSynergy": {
          "hanzo:widowmaker": 0
        }
      }
    }
  ]
}
```

- `overrides.matchups` *replaces* (not adds to) the base pairwise value for listed pairs on this map.
- `overrides.antiSynergy` *replaces* base anti-synergy value (e.g., zeroing it out — "double sniper is fine here").
- Omit `overrides` block entirely for neutral maps.

## Meta research

### Roster (current OW maps — verify at impl time)
Group by mode:
- **Control**: Antarctic Peninsula, Busan, Ilios, Lijiang Tower, Nepal, Oasis, Samoa
- **Escort**: Circuit Royal, Dorado, Havana, Junkertown, Rialto, Route 66, Shambali, Watchpoint: Gibraltar
- **Hybrid**: Blizzard World, Eichenwalde, Hollywood, King's Row, Midtown, Numbani, Paraíso
- **Push**: Colosseo, Esperança, New Queen Street, Runasapi
- **Flashpoint**: New Junk City, Suravasa
- **Clash**: Hanaoka, Throne of Anubis

### Override priorities (maps with clear bias)
- **Sniper-friendly long sightlines** → relax double-sniper anti-synergy:
  - Circuit Royal, Havana, Route 66, Dorado, Junkertown → `hanzo:widowmaker` anti-syn = 0 or -1
- **Dive-friendly tight verticality**:
  - Lijiang Tower, Nepal Sanctum, Hollywood, Eichenwalde → boost dive pairwise (e.g., `winston:widowmaker +3`, `tracer:ana +2`)
- **Brawl-friendly chokes**:
  - King's Row, Eichenwalde first point, Hanamura — boost brawl matchups
- **Pharah-friendly open vertical**:
  - Havana, Junkertown — boost `pharah:*` matchups by 1; tighten hitscan counter (Sojourn/Cassidy effectiveness drops slightly)
- **Anti-Pharah maps** (low ceiling):
  - King's Row indoors — reduce `pharah:*` boosts

### Override discipline
- Only add overrides where the map genuinely flips the matchup outcome.
- Skip "slight flavor" tweaks — keep override list manageable.

## Acceptance
- File parses as valid JSON.
- All map ids unique; modes from the enumerated list.
- Every override key references heroes in `heroes.json`.
- At least 8 maps have non-empty overrides (covering all 6 modes if possible).

## Notes
- This file evolves with map pool rotation. Update when comp pool changes.
- Don't model map *halves* (attack vs defense on Escort/Hybrid) — too granular for MVP.
