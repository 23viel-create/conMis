# Architecture

Platform: React Native (Expo), TypeScript.

## Folder structure

```
src/
├── app/                    # App shell (Expo): providers, navigation, root layout
├── features/               # Vertical slices; each owns its UI, hooks and state
│   ├── tasks/
│   │   ├── components/     # TaskList, TaskCard, TaskForm, ...
│   │   ├── hooks/          # useTaskActions, useTask(id), ...
│   │   ├── store/          # tasksSlice.ts (Zustand slice)
│   │   ├── selectors.ts    # Pure, memoizable derivations over tasks
│   │   └── index.ts        # Public API of the feature
│   ├── filters/            # Cross-filtering: filter state + filter UI
│   │   ├── components/
│   │   ├── store/          # filtersSlice.ts
│   │   └── selectors.ts    # applyFilters(tasks, filters)
│   └── reflection/         # History, stats, self-reflection views
│       ├── components/
│       └── selectors.ts    # completion streaks, per-category/size stats
├── components/
│   └── ui/                 # Feature-agnostic primitives: Button, Chip, Sheet
├── store/
│   ├── index.ts            # Root store composing feature slices + persist
│   └── migrations.ts       # Versioned migrations for persisted state
├── services/
│   └── storage.ts          # Persistence adapter (AsyncStorage now, API later)
├── lib/                    # Generic helpers: dates, ids
├── types/
│   └── task.ts             # Domain models (shared across features)
└── theme/                  # Design tokens (colors, spacing) for StyleSheet
```

Rules: features import from each other only via their `index.ts`;
`components/ui` never imports from `features/`; selectors are pure functions
so they can be unit-tested without React.

## Data model

See `src/types/task.ts`.

## State management: Zustand

- One store composed of slices (`tasks`, `filters`, later `ui`/`reflection`).
- Components subscribe to narrow selectors, so editing one task does not
  re-render the whole tree (the main weakness of Context for this app).
- Cross-filtering lives in pure selectors (`applyFilters`) combining the
  `tasks` and `filters` slices; filter state is kept separate from data so
  filters can later be synced to the URL or saved as presets.
- `persist` middleware with a `version` + `migrate` handles schema evolution.
- Far less boilerplate than Redux Toolkit, while keeping devtools support.

## Styling: React Native `StyleSheet`

Chosen over NativeWind for stability: no Babel/Metro/Tailwind build layer to
keep in sync across Expo SDK upgrades, and full typing of style props. Colors
come from light/dark palettes selected with `useColorScheme()`.
