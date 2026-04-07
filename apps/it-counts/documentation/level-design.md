# Level Design

Story 1.6 centralizes the MVP level rules in [`lib/levels.ts`](../lib/levels.ts).

## Levels 1-3

| Level | Weekly XP Target | Requirements | Unlocked Abilities |
| --- | --- | --- | --- |
| 1 | None | Flexible pace during the opening month | Core XP tracking |
| 2 | None | One intentional 10-20 minute walk per week | Intentional weekly walk focus |
| 3 | 12 XP/week | Same activities, but with a higher weekly target | Higher weekly target for steady consistency |

## Progression Rules

- Level-up needs both `100 XP` and `4` fully elapsed weeks.
- OverXP is any XP above `100`.
- Pace buckets are:
  - `on-track` for `0`
  - `slightly-over` for `1-19`
  - `well-over` for `20+`

## Extensibility

- Levels are modeled as append-only data, not switch statements.
- Adding Level 4+ should only require appending another definition object.
- Persisted state stays stable because `LevelState` only stores the current level number, start date, XP, and OverXP.
