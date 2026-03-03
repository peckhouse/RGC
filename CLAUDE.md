# RTGC — Retro Game Collection App

## What this project is
Mobile app for video game collectors. Users build their own collection from a curated list of games per console, track their completion percentage toward a full set, manage a wish list, and view rich game detail pages.

## Tech Stack
- **Mobile app:** React Native 0.84 (RN CLI, not Expo), TypeScript
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Auth:** Supabase Auth (email/password)
- **Game data:** IGDB API — synced daily via cron job, never called live from the app
- **State:** Zustand (local) + TanStack React Query (server cache)
- **Navigation:** React Navigation v7 (native stack + bottom tabs)

## Repo Structure
```
rtgc/
├── .github/workflows/daily-sync.yml   ← GitHub Actions cron (runs 2 AM UTC)
├── RetroGameCollection/                ← React Native app
│   ├── App.tsx                         ← QueryClientProvider root
│   ├── src/
│   │   ├── lib/supabase.ts             ← Typed Supabase client (anon key)
│   │   ├── types/database.ts           ← TS types: Game, Console, UserCollection…
│   │   ├── navigation/AppNavigator.tsx ← Stack + Tab navigator (auth-gated)
│   │   ├── hooks/useAuth.ts            ← signIn / signUp / signOut
│   │   ├── screens/                    ← 7 placeholder screens (ready to implement)
│   │   └── components/{common,game,collection}/
│   └── ios/  ← 77 CocoaPods installed
└── sync-service/                       ← IGDB → Supabase cron job (Node/TS)
    └── src/
        ├── index.ts          ← main orchestrator
        ├── igdbClient.ts     ← IGDB API wrapper
        ├── supabaseClient.ts ← uses service_role key (server-side only)
        ├── syncConsoles.ts
        └── syncGames.ts      ← paginated upsert, 260ms delay between batches
```

## Key Architecture Decision
The app **never calls IGDB directly at runtime**. A daily GitHub Actions job syncs all game + console data into Supabase. The app only queries Supabase → no rate limits, fast queries, offline-ready.

## Supabase Schema (run this in Supabase SQL editor before first use)
Tables to create: `consoles`, `games`, `profiles`, `user_collections`, `user_wishlists`, `sync_metadata`
Full SQL is in the approved plan at: `/Users/l-prandi.q5g/.claude/plans/luminous-stirring-octopus.md`

## Freemium Model
| Feature | Free | Pro |
|---|---|---|
| Consoles tracked | 5 | Unlimited |
| Wish list | ❌ | ✅ |
| Ads (AdMob) | ✅ | ❌ |
| Export collection | ❌ | ✅ |

Pricing (based on competitor research — CLZ Games $1.99/mo, Gamery $4.99/mo, GAMEYE fully free):
- Monthly: $2.99
- Yearly: $24.99
- Lifetime: $49.99

Payment via RevenueCat (wraps Apple StoreKit + Google Play Billing). Stripe optional later for web-only Lifetime purchases.

## Current Status — Phase 2 complete, Phase 3 in progress, Phase 3.5 planned

### Phase 2 — Done
- [x] Auth: LoginScreen + AppNavigator wired to real Supabase auth state
- [x] HomeScreen dashboard (stats, recently added, CTA cards)
- [x] ConsoleListScreen (manufacturer cards) → ManufacturerScreen → GameListScreen (search, progress ring)
- [x] CollectionScreen → CollectionConsoleScreen (condition badges, progress ring)
- [x] WishlistScreen → WishlistConsoleScreen (priority cycling, move to collection)
- [x] GameDetailScreen (condition picker, multi-copy support, wishlist toggle)
- [x] `src/api/consoles.ts`, `src/api/games.ts`, `src/api/collection.ts`, `src/api/wishlist.ts`
- [x] IGDB sync filtered to physical-only (version_parent=null, category 0/8/9, no regional variants)
- [x] DB: unique constraint on user_collections dropped — multiple copies of same game allowed

### Phase 3 — Polish (in progress)
- [x] iOS LaunchScreen: dark bg (#0f172a), centered 🎮, app name + subtitle
- [x] Android cold-start dark windowBackground
- [ ] App icon — need 1024×1024 source PNG → icon.kitchen → iOS xcassets + Android mipmap
- [ ] Pull-to-refresh on list screens
- [ ] Skeleton loaders

### Phase 3.5 — Monetization & Analytics (planned)
- [ ] PostHog analytics (free plan, RN SDK)
- [ ] AdMob ads (free users only)
- [ ] RevenueCat IAP: monthly $2.99, yearly $24.99, lifetime $49.99
- [ ] Add `subscription_tier` + `subscription_expires_at` to `profiles` table
- [ ] Enforce 5-console free limit → upsell paywall

## Gotchas & Known Issues
- React Native 0.84 ships with **React 19** — `react-native-fast-image` is incompatible, use built-in `<Image>` for now
- `react-native-vector-icons` v10 is deprecated; migrate to per-family packages (e.g. `@react-native-vector-icons/material-design-icons`) before release
- Always use `LANG=en_US.UTF-8 pod install` for CocoaPods on this machine
- Always open Xcode via `.xcworkspace`, never `.xcodeproj`
- `sync-service` uses the Supabase **service_role** key (bypasses RLS). Never use this key in the mobile app — app uses anon key only.
- Run the simulator with: `cd RetroGameCollection && npm run ios`
- Run Android emulator with: `cd RetroGameCollection && npm run android`
