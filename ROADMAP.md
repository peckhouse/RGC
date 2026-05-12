# RTGC Roadmap

Detailed status of each phase. See [CLAUDE.md](CLAUDE.md) for project overview, tech stack, and architecture.

---

## Phase 1 — Foundation ✅

- [x] Supabase project + tables: `consoles`, `games`, `profiles`, `user_collections`, `user_wishlists`, `sync_metadata`
- [x] Row Level Security policies
- [x] React Native 0.84 init (RN CLI, not Expo) + TypeScript
- [x] `sync-service/` Node/TS package scaffolded
- [x] IGDB OAuth client in `sync-service/src/igdbClient.ts`
- [x] GitHub Actions workflow `.github/workflows/daily-sync.yml`

---

## Phase 2 — Core App Features ✅

- [x] Supabase auth (email/password) — `useAuth.ts`, `LoginScreen.tsx`, `ForgotPasswordScreen.tsx`
- [x] `AppNavigator.tsx` — auth-gated stack + bottom tabs
- [x] HomeScreen — stats, recently added, CTA cards
- [x] ConsoleListScreen, ManufacturerScreen, GameListScreen — search + progress ring
- [x] CollectionScreen, CollectionConsoleScreen — condition badges
- [x] WishlistScreen, WishlistConsoleScreen — priority cycling, move-to-collection
- [x] GameDetailScreen — condition picker, multi-copy, wishlist toggle
- [x] API layer: `consoles.ts`, `games.ts`, `collection.ts`, `wishlist.ts`, `profile.ts`
- [x] IGDB physical-only filter (`version_parent=null`, category 0/8/9)
- [x] Multi-copy support — unique constraint on `user_collections` dropped

---

## Phase 3 — Polish ✅

- [x] iOS LaunchScreen — dark bg #0f172a + 🎮 + subtitle
- [x] Android cold-start dark windowBackground
- [x] App icon — full `AppIcon.appiconset` (40/58/60/80/87/120/180/1024) + Android `ic_launcher` mipmaps
- [x] Pull-to-refresh — Home, Collection (+Console), Wishlist (+Console), GameList
- [x] Skeleton loaders — `Skeleton.tsx` used in 7 screens

---

## Phase 3.5 — Monetization & Analytics 🟡

- [x] **PostHog** — `posthog-react-native@4.36.1` + `src/lib/analytics.ts` (events fired)
- [x] **AdMob** — `react-native-google-mobile-ads@16.0.3` + `AdBanner.tsx`
- [x] **RevenueCat IAP** — `react-native-purchases@9.10.5` + `PaywallScreen.tsx` with monthly/annual/lifetime
- [x] `useProStatus.ts` hook
- [x] `subscription_tier` + `subscription_expires_at` in `types/database.ts`
- [x] Free console limit via `useFreeConsoleLimit()` hook — 5 base, **6** when in a referral relationship (`profile.referred_by` set OR `useReferralCount() > 0`); enforced in HomeScreen + GameDetailScreen
- [x] Referral flow — code linked on sign-up via `linkReferralCode`, `get_referral_count` RPC, AccountScreen "Refer a friend" card with shareable code + Share API
- [ ] End-to-end verification — sandbox purchase, AdMob test ads, PostHog dashboard

---

## Phase 3.7 — UI/UX Redesign ✅

**Style:** dark gradient cards `#0d2525 → #0a1a35 → #06091e`, blue-glow border `rgba(99,160,255,0.5)`, borderRadius 16, lucide icons, press scale+translateX animation.

### Done
- [x] LoginScreen — animated card transitions, gradient cards
- [x] ManufacturerScreen — hero card, Home/Handheld sections sorted by `release_year`
- [x] ConsoleListScreen — console cards with logo + progress ring
- [x] GameListScreen — gradient cards, segmented region tabs, server-side pagination, debounced search
- [x] GameDetailScreen — refactored
- [x] CollectionScreen — console cards matching ConsoleList style (blue-glow border, animated press, console logo + games-owned count)
- [x] CollectionConsoleScreen — game rows matching GameListScreen design (gradient cards, blue-glow border, animated press, region + condition badges, local search); progress bar uses cumulated EU+NA+JP total
- [x] WishlistScreen — flattened (no per-console drill-down); single search-able list using GameListScreen row design with region + console + priority badges, sorted by priority then name. WishlistConsoleScreen removed. Pro gate themed (gradient card, electric-pink Star icon, brand-gradient button)
- [x] AccountScreen — gradient cards w/ blue-glow border, display-font section labels, lucide icons (Pencil/Camera/Check/LogOut), `GradientText` referral code, brand-gradient buttons (Share Invite + Upgrade + Save), themed Cancel button, themed username TextInput
- [x] HomeScreen — "Welcome back" removed, stats cards themed, free-limit driven by hook; "Recently Added" replaced with two `NavCard`s (Library → Collection, Star → Wishlist) in the gradient-card pattern
- [x] Page headers — all four (Console, Collection, Wishlist, Account) now inline logo + title, left-aligned, `lineHeight: 40` on title for vertical centering with logo
- [x] Bottom tab bar — positioning + visual polish
- [x] Modals — Add-to-Collection + Paywall (Upgrade to RGC Pro): gradient card with blue-glow border, display-font title/labels, lucide icons (Star fill for active rating), brand-gradient primary CTA; Paywall fixed `priceString`/`PURCHASE_CANCELLED_ERROR` API drift
- [x] Toast — restyled `AppToast` (gradient bg, lucide CheckCircle2/XCircle/Info icons, type-tinted border), replaced blocking `<Modal>` with `pointerEvents="box-none"` overlay so nav/buttons stay live; default visibility shortened to 1500ms, per-caller `visibilityTime` overrides stripped
- [x] Wishlist gating bug fix — free users tapping the wishlist heart on GameDetail now hit the paywall (`reason: 'wishlist', plans: 'subscriptions-only'`) instead of silently writing a row they can't see

---

## Phase 3.8 — Per-Platform Pricing ✅

- [x] `games` schema keyed on `(igdb_id, platform_id, region)`
- [x] `platform_id` (INTEGER NOT NULL) + canonical IDs via `remap`
- [x] 33 standalone sync scripts updated with `platform_id`
- [x] App queries use `.eq('platform_id', consoleId)`
- [x] `game_price_history` has `platform_id` + index
- [x] New platforms: Atari Jaguar (62), Neo Geo CD (136), PC Engine CD (150), Virtual Boy (87), Xbox One (49)
- [x] Hack/homebrew filter in `syncAllFromIGDB.ts`
- [x] `platform_type` (home/handheld) + `release_year` on consoles
- [x] Cron changed daily → monthly (1st of month)
- [x] `npm run sync-consoles` standalone script

---

## Phase 4 — Launch Readiness ⏳

- [x] **In-app account deletion** — required by App Store guideline 5.1.1(v) + Play policy. Danger-zone card on AccountScreen with red-bordered Delete button; modal requires typing `DELETE`; calls `public.delete_user_account()` RPC (SECURITY DEFINER, in `supabase/delete_account.sql`) which wipes `user_collections` / `user_wishlists` / `profiles` / `auth.users` in one transaction; client also best-effort removes the avatar from storage. **Needs: run `supabase/delete_account.sql` in Supabase SQL editor.**
- [ ] App Store metadata draft — see `STORE_METADATA.md` (description, keywords, privacy labels worksheet, screenshot shot list). Still TODO: capture screenshots, fill in Store Connect questionnaire, host privacy policy + ToS at a public URL.
- [ ] Google Play listing — short/full description in `STORE_METADATA.md`; still TODO: feature graphic, phone screenshots, Data Safety form
- [ ] TestFlight beta round
- [ ] Privacy policy + Terms of Service URLs
- [ ] RevenueCat production keys (currently sandbox)
- [ ] AdMob production ad unit IDs
- [ ] PostHog production project
- [x] `react-native-vector-icons` dropped — package was only ever used for `Ionicons.loadFont()`, no JSX used it (all icons are lucide); removed from `App.tsx` + `package.json` (also `@types/react-native-vector-icons`). Requires `npm install` + `pod install` to take effect.
- [ ] Test coverage (only default `App.test.tsx` exists today)
