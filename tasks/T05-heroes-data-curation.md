# T05 — Heroes data: roles + archetype vectors + tags

## Goal
Populate `src/data/heroes.json` with curated archetype vectors and tags for every current hero, based on current OW meta.

## Depends on
T04 (script produces skeleton)

## Files to modify
- `src/data/heroes.json`

## Meta research
For each hero determine:
1. Role (already auto-filled by script — verify correctness).
2. `archetype: { dive, brawl, poke }` floats summing to 1.0.
3. `tags`: short list of mechanical descriptors. Allowed vocabulary:
   - `hitscan`, `projectile`, `melee`, `sniper`, `flanker`, `mobile`, `immobile`, `barrier-shield`, `burst-damage`, `sustain-damage`, `aoe`, `cc`, `anti-heal`, `dive-target`, `low-mobility-support`, `mobile-support`, `pocket-support`.
   - Add new tags only if genuinely distinct; document in this file.

### Research sources (pick what's current at implementation time)
- Liquipedia OW meta page
- Top streamer / coach archetype breakdowns (Flats, Awkward, Spilo) — recent VODs
- counterpick.gg / Overbuff tier classifications
- Reddit r/CompetitiveOverwatch meta threads (recent season)
- Personal experience adjustments allowed (this is a personal tool)

### Archetype heuristics
- **Dive (1.0)**: high mobility, kills priority targets fast, weak in sustained fights — Winston, Tracer, Genji, Sombra, D.Va, Lúcio, Kiriko (partial).
- **Brawl (1.0)**: close-range sustain, shields/armor, AoE healing — Reinhardt, Junker Queen, Mauga, Brigitte, Lúcio (partial), Lifeweaver.
- **Poke (1.0)**: long-range, high burst, low mobility — Widowmaker, Hanzo, Pharah, Sigma, Ana, Zenyatta, Baptiste.
- Many heroes are split (Sigma = mostly poke, partial brawl; Sojourn = dive + poke).

## Format reminder (from T03)
```json
{
  "patch": "OW Season XX",
  "updated": "2026-MM-DD",
  "heroes": [
    {
      "id": "sojourn",
      "name": "Sojourn",
      "role": "dps",
      "portrait": "/heroes/sojourn.png",
      "archetype": { "dive": 0.5, "brawl": 0.1, "poke": 0.4 },
      "tags": ["hitscan", "mobile", "burst-damage"]
    }
  ]
}
```

## Acceptance
- Every hero in roster has archetype vector summing to 1.0 ±0.01.
- Every hero has at least 1 tag.
- No hero has all-equal placeholder `{0.34, 0.33, 0.33}` left.
- Patch label and `updated` date set to current.
- JSON validates against `Hero[]` from T03.

## Notes
- This is iterative — first pass can be rough, refined during T19 snapshot review.
- Keep file alphabetically sorted by `id` for clean diffs.
- Add a top-of-file `// meta-research-notes.md` reference if rationale gets long; otherwise inline reasoning is not required.
