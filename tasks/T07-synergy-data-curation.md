# T07 — Synergy + anti-synergy data

## Goal
Build `src/data/synergy.json` and `src/data/antiSynergy.json` — sparse maps of known good/bad hero pairings within MY team.

## Depends on
T05

## Files to create
- `src/data/synergy.json`
- `src/data/antiSynergy.json`

## Schema (both files)
```json
{
  "scale": "-2..+2 (use positive integers; antiSynergy applied as negative in scoring)",
  "pairs": {
    "pharah:mercy": 2,
    "winston:dva": 1,
    "ana:winston": 2
  }
}
```

- Key: `"heroA:heroB"`. Lookup must try both orderings — store one canonical (sorted alphabetically by id).
- Integer `1` (mild) or `2` (strong).
- Omit neutral pairs (the default).

## Meta research

### Synergy examples (validate vs current meta)
- `dva:winston +2` — dive duo
- `pharah:mercy +2` — pocket flight
- `ana:winston +2` — anti-nade boosts dive primary
- `reinhardt:zarya +2` — shatter-into-grav synergy
- `genji:zarya +1` — grav setup for blade
- `tracer:sombra +1` — flank pressure stacking
- `kiriko:genji +1`, `kiriko:tracer +1` — TP + suzu enables dives
- `lucio:winston +2`, `lucio:dva +1` — speed enables dive
- `brigitte:reinhardt +1`, `brigitte:mauga +1` — brawl frontline
- `mercy:soldier-76 +1`, `mercy:ashe +1` — damage boost on hitscan

### Anti-synergy examples
- `widowmaker:hanzo +1` (mild base — both immobile snipers, lose tempo)
- `pharah:reaper +2` (no synergy — split altitude, no peeling)
- `tracer:bastion +1` (mobility mismatch, neither protects the other)
- `genji:zenyatta +1` if both dive — leaves backline alone (situational)
- `widowmaker:ana +1` (both immobile, easy dive targets)

Note: many anti-synergy pairs flip on certain maps — handled via `maps.json` overrides (T08).

## Acceptance
- Both files parse as valid JSON.
- All hero ids exist in `heroes.json`.
- Keys canonicalized alphabetically (e.g., `ana:winston`, not `winston:ana`).
- No duplicate keys.
- Author has 30+ synergy entries and 10+ anti-synergy entries minimum.

## Notes
- Conservative on anti-synergy — over-penalizing makes the algo recommend mirror comps.
- Reasoning module (T12) will surface these as "Strong duo:" / "Weak combination:" labels.
- Scoring module (T09) applies anti-synergy values as negative contributions.
