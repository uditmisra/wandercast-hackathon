# Dashboard Feature — Changelog

**Date:** February 14, 2026
**Branch:** dev

---

## Summary

Added a full user dashboard at `/dashboard` with four tabs: **History**, **Stats**, **Bookmarks**, and **Suggestions**. This turns the app from a single-use tour generator into a persistent, personalized experience.

---

## Database Changes

**Migration:** `supabase/migrations/20260215_create_dashboard_tables.sql`

| Change | Details |
|--------|---------|
| `tours.interests` column (JSONB) | Stores per-tour interests. Previously only saved to `user_preferences`. |
| `places.city` column (TEXT) | Explicit city field. Previously parsed heuristically from `description`. |
| `bookmarked_places` table | `user_id`, `place_id` (FK to places), UNIQUE constraint, RLS |
| `favorited_tours` table | `user_id`, `tour_id` (FK to tours), UNIQUE constraint, RLS |

---

## Edge Functions

### New (4 functions)

| Function | Purpose |
|----------|---------|
| `get-dashboard-stats` | Computes all stats from `tours` + `places`: tour count, unique places, unique cities, listening time (est. 5 min/place), most-explored interest, consecutive-day streak, places-per-city breakdown |
| `toggle-bookmark` | Accepts `{ type: 'place' | 'tour', targetId }`. Checks if bookmark exists → inserts or deletes. Returns `{ bookmarked: boolean }` |
| `get-bookmarks` | Returns bookmarked places (with place data + parent tour title) and list of favorited tour IDs |
| `get-suggestions` | Pure computation (no AI). Gets distinct cities from user's tours, maps explored interests per city, returns unexplored interests from the available set. Sorted by most-explored city first |

### Modified (2 functions)

| Function | Change |
|----------|--------|
| `save-tour` | Now persists `interests` array on tour row + `city` on each place row |
| `get-tours` | Joins `favorited_tours` to include `isFavorited` flag per tour. Added `LIMIT 50` |

---

## Frontend — New Files (10)

### Pages
| File | Purpose |
|------|---------|
| `src/pages/Dashboard.tsx` | Main dashboard page. Uses shadcn `Tabs` for 4 sections. Header with back-to-home link. Wires up tour playback via `navigate('/', { state: { playTour } })` |

### Dashboard Components
| File | Purpose |
|------|---------|
| `src/components/dashboard/DashboardHistory.tsx` | Lists all tours, favorites sorted to top with star. Cards show title, description, place count, duration, interest badges, date, Play button |
| `src/components/dashboard/DashboardStats.tsx` | Grid of stat cards (tours, places, cities, listening time), streak with flame icon, most-explored interest, places-per-city list |
| `src/components/dashboard/DashboardBookmarks.tsx` | Two sections: favorite tours (with Play) and saved places (with inline single-place audio playback via `generate-audio`) |
| `src/components/dashboard/DashboardSuggestions.tsx` | Cards per city showing unexplored themes with interest icons. "Try This Tour" buttons navigate to home with prefilled prompt |

### Hooks
| File | Purpose |
|------|---------|
| `src/hooks/useTours.ts` | Shared React Query hook wrapping `get-tours`. Replaces manual `useEffect`/`useState` in Index.tsx. Transform logic centralized here |
| `src/hooks/useDashboardStats.ts` | React Query hook for `get-dashboard-stats`. 10-min stale time |
| `src/hooks/useBookmarks.ts` | Query for bookmarks + `useMutation` for toggle. Invalidates both `bookmarks` and `tours` caches on success. Exposes `isPlaceBookmarked()` and `isTourFavorited()` |
| `src/hooks/useSuggestions.ts` | React Query hook for `get-suggestions`. 10-min stale time |

---

## Frontend — Modified Files (5)

| File | Changes |
|------|---------|
| `src/App.tsx` | Added `/dashboard` route wrapped in `ProtectedRoute` |
| `src/pages/Index.tsx` | Refactored to use `useTours` hook (removed manual fetch). Added `useLocation` to read `location.state.playTour` (for dashboard→player nav) and `location.state.prefillPrompt` (for suggestions→chat) |
| `src/pages/HomePage.tsx` | Added "Dashboard" button in header (visible when logged in). Accepts `prefillPrompt` prop, auto-shows chat when present |
| `src/components/EnhancedAudioGuide.tsx` | Added heart bookmark button in top bar for current place. Uses `useBookmarks` hook. Filled red when bookmarked, outline when not |
| `src/components/InlineTourChat.tsx` | Accepts `prefillPrompt` prop. Auto-sends it on mount (once) using `useRef` guard |

---

## Data Flow

### Dashboard → Play Tour
```
Dashboard (click Play) → navigate('/', { state: { playTour: tour } })
  → Index.tsx reads location.state.playTour
  → Sets currentTour + switches to guide view
  → Clears state to prevent replay on refresh
```

### Suggestion → New Tour
```
Suggestions (click "Try food") → navigate('/', { state: { prefillPrompt: "Create a food tour of London" } })
  → Index.tsx reads location.state.prefillPrompt
  → HomePage auto-shows chat
  → InlineTourChat auto-sends the prompt
```

### Bookmark a Place (during tour)
```
EnhancedAudioGuide (tap heart) → toggleBookmark({ type: 'place', targetId })
  → toggle-bookmark edge function (insert or delete)
  → React Query invalidates bookmarks + tours caches
```
