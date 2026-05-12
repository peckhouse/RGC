# Store Metadata — Draft

Drafts for App Store Connect (iOS) and Google Play Console (Android). Edit the wording, then copy/paste into the store dashboards.

---

## App identity (both stores)

| Field | Value | Notes |
|---|---|---|
| App name | **Retro Game Collection** | 21 chars. Fits Apple (30) and Play (50). |
| Bundle ID / Package | _(set in Xcode / Android Studio)_ | e.g. `com.peckhouse.rtgc` |
| Primary category | **Lifestyle** | Apple + Play |
| Secondary category | **Reference** | Apple only |
| Content rating | **4+ / Everyone** | No mature content |

---

## Apple — App Store Connect

### Subtitle (30 char max — pick one)
- **The collector's toolkit** _(23)_
- **Catalog your retro library** _(27)_
- **For physical game collectors** _(28)_

### Promotional text (170 char max — editable without re-review)
> Track every cart and disc in your retro collection. See completion %, market value, and what's missing from each console — from NES to Xbox One.

_(149 chars)_

### Keywords (100 char limit, comma-separated, no repeats from name/subtitle)
> `nintendo,sega,playstation,xbox,atari,snes,n64,ps1,gba,dreamcast,neogeo,collector,vintage`

_(88 chars — leaves room to swap in more terms)_

**Tips:**
- Don't repeat "retro", "game", "collection" — they're already in the name and indexed.
- Apple ignores spaces after commas, so omit them to save chars.
- Test alternates: `gameboy`, `n64`, `genesis`, `cartridge`, `completionist`, `inventory`, `library`, `tracker`.

---

## Google Play — Play Console

### Short description (80 char max — pick one)
- **Catalog your physical retro game collection across 34 consoles.** _(62)_
- **Track your retro games — completion %, market value, wishlist.** _(63)_
- **The collector's toolkit for physical retro game libraries.** _(59)_

### Tags (Play Console picks from a list — no free-form keywords)
Suggest: **Lifestyle**, **Hobbies**, **Collections**, **Reference**

---

## Full description (4000 char max — both stores, same text)

> **Retro Game Collection** is the catalog app for collectors who actually own the carts and discs. Track your library across 34 consoles, see your completion progress toward every full set, manage a wishlist, and check what your collection is worth — all in one clean, dark-themed app.
>
> Built specifically for physical game collectors. No ROMs, no emulators, no shovelware — just the real, official, physical releases for each system.
>
> **WHAT YOU CAN DO**
>
> 📚 **Catalog 34 platforms**
> Nintendo: NES, SNES, N64, GameCube, Wii, Wii U, Game Boy / GBC, GBA, Virtual Boy, DS, 3DS
> Sony: PlayStation, PS2, PS3, PSP, PS Vita
> Microsoft: Xbox, Xbox 360, Xbox One
> Sega: Master System, Mega Drive / Genesis, Saturn, Dreamcast, Game Gear
> Atari: 2600/7800, Jaguar, Lynx
> NEC: TurboGrafx-16 / PC Engine, PC Engine CD
> SNK: Neo Geo, Neo Geo CD, Neo Geo Pocket
> Bandai: WonderSwan
>
> 🎯 **Completion tracking** — See exactly how close you are to a full set on every console. Per-console progress rings, owned vs total, broken down by region.
>
> 📦 **Condition tracking** — Tag each copy as Loose, In Box, or Complete-in-Box. Own duplicates? Multi-copy support means you can log every cart in your shelf.
>
> 💵 **Real market values** — Auto-updated pricing from current eBay listings, per condition. See what your collection is worth without leaving the app.
>
> ⭐ **Wishlist with priority levels** — Save games you're hunting and rank them High / Medium / Low. Move them to your collection in one tap when you find them. _(Pro)_
>
> 🗓️ **Region-aware** — EU, NA, and JP releases are tracked separately. Own the Japanese version? It's its own row.
>
> 📖 **Rich game data** — Box art, release dates, ratings, descriptions, genres. Powered by the IGDB game database.
>
> **FREE vs PRO**
>
> Free: track up to 5 consoles, see your collection value, ads supported.
> Pro: unlimited consoles, wishlist, no ads, export.
> Subscriptions: $2.99/month or $24.99/year. One-time Lifetime: $49.99.
>
> **REFERRAL BONUS**
>
> Share your invite code from your profile. When a friend signs up using it, you both get a bonus console slot — 6 instead of 5 — for free.
>
> **WHY RTGC?**
>
> Built by collectors, for collectors. Fast, clean, dark UI. No social feeds, no popups asking you to rate the app, no scrolling carousels of stuff you don't want. Just your collection.
>
> ---
>
> Questions or feedback? Reach out at _your-support-email@example.com_

_(~2,950 chars — fits both stores. Edit the support email line before publishing.)_

---

## Privacy labels (App Store) / Data Safety (Play Store)

Same underlying truth, different forms. Below is the data we actually collect:

| Data type | Source | Linked to user? | Purpose | Required? |
|---|---|---|---|---|
| **Email address** | Supabase auth | Yes | App functionality (sign-in, password reset) | Yes |
| **Username** | User profile | Yes | App functionality (display name) | Optional |
| **Avatar photo** | Profile upload | Yes | App functionality (profile picture) | Optional |
| **User ID** | Supabase `auth.users.id` | Yes | App functionality (linking data to account) | Yes |
| **Purchase history** | RevenueCat | Yes | App functionality (verifying Pro status) | Yes (if user subscribes) |
| **Product interactions / app usage** | PostHog | Yes (via `distinctId = user_id`) | Analytics / product improvement | Optional |
| **Crash logs** | _Not collected_ | — | _(Skip — no Crashlytics today)_ | — |

### Apple App Privacy Questionnaire answers

In App Store Connect → App Privacy, declare:

| Category | Item | Linked to user | Used for tracking |
|---|---|---|---|
| Contact Info | Email | ✓ | ✗ |
| User Content | Photos (avatar) | ✓ | ✗ |
| Identifiers | User ID | ✓ | ✗ |
| Purchases | Purchase history | ✓ | ✗ |
| Usage Data | Product Interaction | ✓ | ✗ |

**"Used for tracking"** = data linked to identifiers across other companies' apps/sites. We don't share any of this with third parties for cross-app tracking, so all "✗".

### Google Play Data Safety form answers

For each data type above, the form asks:
1. **Is this data collected?** — Yes for the items above
2. **Is this data shared with third parties?** — No (Supabase + RevenueCat + PostHog are our processors, not third-party recipients in Play's definition; double-check Play's wording)
3. **Is this data encrypted in transit?** — **Yes** (Supabase + RevenueCat + PostHog all use HTTPS)
4. **Can users request deletion?** — See ⚠️ below
5. **Why is this data collected?** — App functionality / Analytics (PostHog only)
6. **Is this data optional?** — Email/User ID required; everything else optional

### ⚠️ Release blocker — account deletion

Both **Apple App Store Guideline 5.1.1(v)** and **Google Play policy** require apps with account creation to also offer in-app account deletion. We currently have sign-out but **no delete-account flow**. This needs to be built before submission.

Suggested scope:
- Account screen → "Delete account" button (red, in a danger section)
- Confirmation prompt
- Calls a Supabase Edge Function or RPC that:
  - Deletes rows from `user_collections`, `user_wishlists`, `profiles`
  - Calls `supabase.auth.admin.deleteUser()` (server-side, with service_role key)
- Sign user out, navigate to login

---

## Privacy Policy + ToS

Both stores require a **Privacy Policy URL**. ToS isn't strictly required but is recommended for IAP apps.

Cheapest hosting: a single HTML page on **GitHub Pages** (free). Repo can be public with just `privacy.html` and `terms.html` at the root.

I can draft both texts as the next step — let me know.

---

## Screenshots — shot list

Take these on the iOS Simulator (iPhone 15 Pro Max, 1290 × 2796) and on a real Android device or emulator (Pixel 6 Pro, 1440 × 3120). 6–8 captures total.

| # | Screen | Setup notes | Caption idea |
|---|---|---|---|
| 1 | HomeScreen | Logged in, ~25 games owned, value populated | "Track your retro collection" |
| 2 | ConsoleListScreen | Browse manufacturers | "34 consoles supported" |
| 3 | GameListScreen | NES selected, gradient cards visible, EU tab | "Browse every official release" |
| 4 | GameDetailScreen | A popular game with cover + market value visible | "Condition, price, completion" |
| 5 | CollectionConsoleScreen | A console with 10+ owned games | "Track your set progress" |
| 6 | WishlistScreen | Wishlist with priority badges | "Hunt for what's missing" _(Pro screenshot)_ |
| 7 | PaywallScreen | Yearly highlighted | "Unlock RGC Pro" |
| 8 | AccountScreen | Profile + referral code visible | "Refer a friend, get a bonus console" |

**Apple requirements:**
- 6.7" iPhone: 1290 × 2796 _(required)_
- 6.5" iPhone: 1242 × 2688 _(accepts 6.7" upscale)_
- 5.5" iPhone: 1242 × 2208 _(only required if you support iOS < 18 review)_

**Play requirements:**
- Phone: min 320px, max 3840px per side, 16:9 to 9:16
- Feature graphic: 1024 × 500 _(separate banner image, designed)_

Capture with `xcrun simctl io booted screenshot` (iOS) or Pixel emulator → File → Save screenshot (Android).
