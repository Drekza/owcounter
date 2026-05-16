.# Tasks — OW Counter

Granular implementation tasks derived from `spec-owcounter.md`. Each task is self-contained: goal, dependencies, files to touch, acceptance criteria.

## Order of execution

Dependencies in `Depends on:` per task. Suggested order:

1. **T01** scaffold
2. **T02** theme + shell
3. **T03** domain types
4. **T04** scrape script
5. **T05** heroes data (run script, then curate)
6. **T06** matchups data
7. **T07** synergy + anti-synergy data
8. **T08** maps data
9. **T09** scoring module
10. **T10** archetypes module
11. **T11** search module
12. **T12** reasoning module
13. **T13** hero grid component
14. **T14** enemy team picker
15. **T15** controls bar (bans + map context)
16. **T16** enemy comp panel
17. **T17** suggestion card
18. **T18** app integration (state, debounce, badges, loading)
19. **T19** tests
20. **T20** GitHub Pages deploy

## Parallelizable

- T05–T08 (data curation) and T09–T12 (logic modules) can be done in parallel by different sessions once T03 + T04 are done.
- T13–T17 (UI components) parallelizable once T03 + T02 done; mock data fine until T05–T08 ready.
- T19 (tests) per-module can start as each module lands.


Сразу уточняй все нерешенные вопросы через tool. Неизвестную информацию всегда ищи в интерненте. Используй chrome tool чтобы проверить результат.