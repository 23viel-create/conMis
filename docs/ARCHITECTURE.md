# Architecture

Platform: React Native (Expo SDK 57, Expo Router), TypeScript.

## Folder structure

```
src/
├── app/                    # Expo Router routes: _layout.tsx (shell), index.tsx (home),
│                           # task/[id].tsx (task detail)
├── features/               # Vertical slices; each owns its UI, hooks and state
│   ├── tasks/
│   │   ├── components/     # TaskList, TaskForm, TaskDetailScreen, NoteContent,
│   │   │                   # SizePicker, CategoryPicker
│   │   ├── hooks/          # useVisibleTasks (tasks x active timeline view)
│   │   ├── notes/          # noteMarkdown.ts (checklists, bullets, headings, bold)
│   │   ├── rescheduling.ts # Postponement rule + reschedule note text
│   │   ├── store/          # tasksSlice.ts (persisted), migrations.ts
│   │   ├── selectors.ts    # Pure, memoizable derivations over tasks
│   │   ├── taskMeta.ts     # Labels/icons for sizes and categories
│   │   └── index.ts        # Public API of the feature
│   ├── calendar/           # Timeline views (Yesterday/Today/Tomorrow/Week)
│   │   ├── components/     # TimelineNav
│   │   ├── hooks/          # useTodayKey (rolls over at midnight / on resume)
│   │   ├── store/          # calendarSlice.ts (not persisted)
│   │   └── timeline.ts     # Pure view -> date-range logic (local time, DST-safe)
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
├── lib/                    # polyfills.ts, i18n.ts, dayKey.ts, dateFormat.ts
│                           # (Gregorian + Hebrew calendar via Intl)
├── locales/                # he.ts (base, defines the keys), en.ts
├── types/
│   └── task.ts             # Domain models (shared across features)
└── theme/                  # Design tokens (colors, spacing) for StyleSheet
```

Rules: features import from each other only via their `index.ts`;
`components/ui` never imports from `features/`; selectors are pure functions
so they can be unit-tested without React.

## Data model

See `src/types/task.ts`. Tasks are planned onto days with `scheduledFor`, a
local `'YYYY-MM-DD'` day key (not a timestamp, so it never shifts across time
zones). `null` means unscheduled; such tasks appear on Today.

Each task has a notes log (`Note[]`). Notes change only through note actions
(`addNoteToTask`, `toggleNotePin`, `toggleNoteChecklistItem`), never through
`updateTask`. Moving a task to a later day via `updateTask` appends a
`kind: 'reschedule'` note with the old date (Gregorian + Hebrew) and the
reason, so postponements can be counted without parsing text.

Persisted data is versioned (`STORAGE_VERSION` in
`features/tasks/store/migrations.ts`). Any change to the saved shape bumps
the version and adds a step to `migrateTasks`, which must never throw.

## State management: Zustand

- One small store per feature (`useTasksStore`, `useCalendarStore`, later
  filters). Cross-feature derivations live in hooks that read several stores.
  This lets each store choose its own persistence (tasks: persisted;
  calendar view: not, so the app always opens on Today).
- Components subscribe to narrow selectors, so editing one task does not
  re-render the whole tree (the main weakness of Context for this app).
- Cross-filtering lives in pure selectors (`applyFilters`) combining the
  `tasks` and `filters` slices; filter state is kept separate from data so
  filters can later be synced to the URL or saved as presets.
- Tasks use `persist` with AsyncStorage (key `conmis.tasks`), a `version` +
  `migrate` for schema evolution, and `useTasksHydrated()` to gate rendering
  until saved data has loaded.
- Far less boilerplate than Redux Toolkit, while keeping devtools support.

## Styling: React Native `StyleSheet`

Chosen over NativeWind for stability: no Babel/Metro/Tailwind build layer to
keep in sync across Expo SDK upgrades, and full typing of style props. Colors
come from light/dark palettes selected with `useColorScheme()`.

## Internationalization

i18next + react-i18next. Hebrew is the base language: `locales/he.ts` defines
the keys and `en.ts` must match its shape; keys are type-checked in `t()`.
The language is detected from the device (first supported of he/en, else he).
RTL is enabled via the expo-localization plugin (`supportsRTL`); if the app
language and the device's direction disagree, `I18nManager.forceRTL` applies
the correct direction from the next launch.
