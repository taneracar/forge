# Forge

A strength-training app: write programs, log your sets, track nutrition, and send
workouts to the people you train with.

Expo (React Native) + Supabase. Turkish and English throughout.

---

## What it does

**Workouts.** Build a program from a 1,380-exercise catalogue, then prescribe it
properly — per-set rep ranges, RIR, rest, and free-text form notes. A pyramid
(12 / 10 / 8) is as expressible as three straight sets. Reorder by long-press,
delete by swipe.

**Sessions.** Starting a workout materialises the prescribed sets, so you fill in
weights instead of rebuilding the plan. Each set shows its target underneath the
number you actually hit, and personal records are flagged as you log them.

**Nutrition.** Calorie and macro targets are *derived*, not typed in —
Mifflin-St Jeor from your profile, adjusted for activity level and goal, so the
target follows your weight instead of going stale. Meals group into breakfast /
lunch / dinner / snack, with a week strip to move between days.

**Water, weight, reminders.** Weight uses a 7-day moving average rather than the
raw last entry, with a goal-aware trend. Reminders are local notifications — no
server involved.

**Social.** Unique usernames, user search, follows, blocking. Once two people
follow each other, either can compose a program *for* the other and send it; the
recipient accepts and it lands in their own account with the prescription intact,
credited to whoever wrote it.

---

## Stack

| | |
|---|---|
| Runtime | Expo SDK 57 · React Native 0.86 · React 19 |
| Navigation | expo-router (typed routes) |
| Styling | NativeWind 4 (Tailwind) |
| Backend | Supabase — Postgres, Auth, Row Level Security |
| Forms | react-hook-form + zod |
| Motion | Reanimated 4 · gesture-handler 3 |
| i18n | react-i18next (`tr` / `en`) |

---

## Running it

> **Expo Go will not work.** Reanimated 4 needs the New Architecture and a custom
> development build; Expo Go ships a fixed set of native modules and crashes on
> launch. `npx expo run:ios` below produces the build you need.

```bash
npm install
```

Create `.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Set up the database by running `supabase/schema.sql` from the companion repo —
[taneracar/FeelFit](https://github.com/taneracar/FeelFit) — in the Supabase SQL
editor. It's ordered by milestone and safe to run top to bottom on a fresh
project.

Then build and launch the development client:

```bash
npx expo run:ios
```

After that `npx expo start` is enough. You only need to rebuild when a native
dependency or `app.json` changes.

```bash
npm run lint
```

---

## Layout

```
src/
  app/            expo-router routes — (auth), (tabs), 27 screens
  components/     ui/ primitives + feature components
  lib/            data access and domain logic, one module per area
  locales/        tr/ and en/ translations
  constants/      design tokens mirrored from tailwind.config.js
```

Two conventions worth knowing before adding code:

**Colour and spacing live in `tailwind.config.js`.** `src/constants/colors.ts`
mirrors them for props that can't take a `className` — icon `color`, SVG fills,
`placeholderTextColor`. Change both or they drift.

**`profiles` is never readable by other users.** Row Level Security is row-level,
not column-level, and that table holds body metrics. Everything social reads
through `security definer` functions that project only public columns. Don't
relax the `profiles` select policy to make a feature easier — add a function
instead.

See [BACKLOG.md](BACKLOG.md) for what's next, and what was deliberately skipped.
