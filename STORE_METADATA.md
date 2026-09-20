# Store Listing — Ready-to-Paste

Final text for App Store Connect (iOS) and Google Play Console (Android). Each section maps to one field in the store's form. Just copy/paste.

URLs assume GitHub Pages is enabled at `peckhouse/RGC` → `/docs` folder. Swap them later if you move to a custom domain.

---

## 🍎 App Store Connect — Apple

### Localization → English (U.S.)

**Name** _(30 char max — used 29)_
```
Retro Game Collection Tracker
```

**Subtitle** _(30 char max — used 28)_
```
Cart checklist & price guide
```

**Promotional Text** _(170 char max — editable without re-review)_
```
Track every cart and disc in your retro collection. See completion %, market value, and what's missing from each console — from NES to Xbox One.
```

**Keywords** _(100 char limit — used 98, comma-separated, no spaces, no words from name/subtitle)_
```
collector,catalog,backlog,inventory,database,wishlist,completion,snes,n64,ps1,gba,gamecube,vintage
```

**Description** _(4000 char max — see "Full description" below)_

### General App Information

**Category** — Primary: **Reference** · Secondary: **Entertainment**
_Lifestyle was the original pick; no competitor uses it. GAMEYE and Retro Game
Collector both sit in Reference._

**Copyright**
```
© 2026 Ludovic Prandi
```
_(edit if your registered name / legal entity differs)_

**Privacy Policy URL**
```
https://peckhouse.github.io/RGC/privacy.html
```

**Support URL**
```
https://peckhouse.github.io/RGC/
```

**Marketing URL** _(required — AdMob reads this to locate app-ads.txt)_
```
https://peckhouse.github.io/RGC/
```
_Google resolves this to the hostname `peckhouse.github.io` and fetches
`/app-ads.txt` from the domain root, served by the `peckhouse/peckhouse.github.io`
repo. Leaving this blank blocks AdMob verification and stops ads serving._

### App Privacy questionnaire answers

Data we collect, all **linked to identity**, none used for tracking:

| Category | Data | Purpose |
|---|---|---|
| Contact Info | Email | App functionality (auth) |
| User Content | Photos (avatar) | App functionality |
| Identifiers | User ID | App functionality |
| Purchases | Purchase history | App functionality (Pro verification) |
| Usage Data | Product Interaction | Analytics |

Answer "**No**" to "Used for tracking" for every item.
Answer "**Yes**" to "Linked to user" for every item.

### App Review notes _(in App Information → Notes for reviewer)_

```
RGC is a catalog app for collectors of physical retro games. No emulation, no ROMs, no online multiplayer.

Demo account (please use this to review):
  email: [create one in Supabase and paste here]
  password: [paste here]

In-app purchase testing:
- Three IAPs: Monthly $2.99, Annual $24.99, Lifetime $49.99
- Configured via RevenueCat (Apple in-app purchase under the hood)
- All purchases are testable in StoreKit sandbox mode

Account deletion: Profile tab → Danger Zone → Delete Account → type "DELETE" → confirm.

Thanks for reviewing!
```

---

## 🤖 Google Play Console — Android

### Main store listing → English (United States)

**App name** _(50 char max — used 29)_
```
Retro Game Collection Tracker
```

**Short description** _(80 char max — used 62)_
```
Catalog your physical retro game collection across 34 consoles.
```

**Full description** _(4000 char max — see "Full description" below)_

### App content / Store settings

**App category** — Entertainment _(Play has no Reference category)_
**Tags** — Hobbies & Interests, Collections

**Contact details**
- Email: `ludovic.anthony.prandi@gmail.com`
- Website: `https://peckhouse.github.io/RGC/`
- Phone: _(optional)_

**Privacy Policy URL**
```
https://peckhouse.github.io/RGC/privacy.html
```

### Data safety form answers

| Data type | Collected? | Shared? | Optional? | Encrypted in transit? | Purpose |
|---|:-:|:-:|:-:|:-:|---|
| Email address | ✓ | ✗ | ✗ | ✓ | Account management |
| Name (username) | ✓ | ✗ | ✓ | ✓ | Account management |
| Photos (avatar) | ✓ | ✗ | ✓ | ✓ | Account management |
| User IDs | ✓ | ✗ | ✗ | ✓ | App functionality, Analytics |
| Purchase history | ✓ | ✗ | ✓ | ✓ | App functionality |
| App interactions | ✓ | ✗ | ✓ | ✓ | Analytics |
| Advertising ID _(free users only)_ | ✓ | ✗ | ✗ | ✓ | Advertising |

**Other answers:**
- _"Is all of the user data collected by your app encrypted in transit?"_ → **Yes**
- _"Do you provide a way for users to request that their data be deleted?"_ → **Yes** — in-app via Profile → Danger Zone → Delete Account
- _"Has your data collection and security practices been independently verified?"_ → **No**

### Content rating questionnaire
Expected outcome: **Everyone / PEGI 3 / ESRB E**.
Answer "No" to every violence / sexuality / gambling / drugs / hate-speech / user-generated-content question.

---

## 📝 Full description (4000 char max — use for both stores)

```
Retro Game Collection is the catalog app for collectors who actually own the carts and discs. Track your library across 34 consoles, see your completion progress toward every full set, manage a wishlist, and check what your collection is worth — all in one clean, dark-themed app.

Built specifically for physical game collectors. No ROMs, no emulators, no shovelware — just the real, official, physical releases for each system.

WHAT YOU CAN DO

📚 Catalog 34 platforms
Nintendo: NES, SNES, N64, GameCube, Wii, Wii U, Game Boy / GBC, GBA, Virtual Boy, DS, 3DS
Sony: PlayStation, PS2, PS3, PSP, PS Vita
Microsoft: Xbox, Xbox 360, Xbox One
Sega: Master System, Mega Drive / Genesis, Saturn, Dreamcast, Game Gear
Atari: 2600/7800, Jaguar, Lynx
NEC: TurboGrafx-16 / PC Engine, PC Engine CD
SNK: Neo Geo, Neo Geo CD, Neo Geo Pocket
Bandai: WonderSwan

🎯 Completion tracking — See exactly how close you are to a full set on every console. Per-console progress rings, owned vs total, broken down by region.

📦 Condition tracking — Tag each copy as Loose, In Box, or Complete-in-Box. Own duplicates? Multi-copy support means you can log every cart on your shelf.

💵 Real market values — Auto-updated pricing from current eBay listings, per condition. See what your collection is worth without leaving the app.

⭐ Wishlist with priority levels — Save games you're hunting and rank them High / Medium / Low. Move them to your collection in one tap when you find them. (Pro)

🗓️ Region-aware — EU, NA, and JP releases are tracked separately. Own the Japanese version? It's its own row.

📖 Rich game data — Box art, release dates, ratings, descriptions, genres. Powered by the IGDB game database.

FREE vs PRO

Free: track up to 5 consoles, see your collection value, ads supported.
Pro: unlimited consoles, wishlist, no ads, export.
Subscriptions: $2.99/month or $24.99/year. One-time Lifetime: $49.99.

WHY RTGC?

Built by collectors, for collectors. Fast, clean, dark UI. No social feeds, no popups asking you to rate the app, no scrolling carousels of stuff you don't want. Just your collection.

---

Questions or feedback? Reach out at ludovic.anthony.prandi@gmail.com

Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://peckhouse.github.io/RGC/privacy.html
```

> **Keep the two legal links.** Guideline 3.1.2 requires functional Terms of Use and
> Privacy Policy links in the App Description for auto-renewable subscriptions.
> Keep them as bare links — the in-app locations (Paywall screen, Account → Legal)
> belong in **App Review Notes**, not in the public description.

_(~2,950 chars — fits both stores' 4000-char limit)_

---

## Submission checklist

### Apple
- [ ] All text fields above pasted into App Information + Localizations
- [ ] Privacy Policy URL set
- [ ] App Privacy questionnaire completed
- [ ] Screenshots uploaded (6.7" iPhone required, 1290 × 2796)
- [ ] App icon visible (already in the asset catalog ✓)
- [ ] App Review demo account created in Supabase + credentials pasted into Review notes
- [ ] Build uploaded via Xcode Organizer or Transporter
- [ ] In-App Purchase products created and submitted with the build

### Google Play
- [ ] All text fields above pasted into Main store listing
- [ ] Privacy Policy URL set
- [ ] Data safety form answers filled in
- [ ] Content rating questionnaire answered
- [ ] Phone screenshots uploaded (min 2)
- [ ] Feature graphic uploaded (1024 × 500)
- [ ] Signed AAB uploaded via Internal Testing track first

---

## 1.0.3 — shipped (approved, released)

Kept as a record of what was applied. Version metadata is locked while a version is
*Ready for Sale*, so these fields were only editable while 1.0.3 sat in
*Prepare for Submission*.

### On the App Information page — left sidebar → General → App Information
Name and Subtitle live here, **not** on the version page. Both stay greyed out
until a version exists in *Prepare for Submission*, so create 1.0.3 first.
- [ ] **Name** → `Retro Game Collection Tracker`
- [ ] **Subtitle** → `Cart checklist & price guide`
- [ ] **Category** → Primary **Reference**, Secondary **Entertainment**
      _(the one field here that is never version-locked)_

### On the 1.0.3 version page
- [ ] **Keywords** → the 98-char list above
- [ ] **Marketing URL** → `https://peckhouse.github.io/RGC/` — unblocks AdMob
- [ ] **What's New in This Version** — required, cannot be left empty:
```
Creating an account is now instant — no email confirmation step.

Improved ad privacy controls on iOS.

Stability and performance fixes.
```
- [ ] **Build** → attach build 29 (`MARKETING_VERSION` 1.0.3 / `CURRENT_PROJECT_VERSION` 29)

### Editable any time, independent of the release
- [ ] **Promotional Text** — changeable without review whenever you want

### Unchanged
Description, screenshots, Privacy Policy URL, Support URL, App Privacy answers,
copyright, review notes. Nothing below this line needs touching for 1.0.3.

---

## 1.0.4 — carrying the in-app purchases

1.0.3 is approved and live, so the products can't be attached to it any more: a
version accepts a review submission once, and a build number is consumed once. The
subscriptions need a new version and a new binary to ride on.

Already bumped in the repo: `MARKETING_VERSION` 1.0.4, `CURRENT_PROJECT_VERSION` 30.
Android is deliberately untouched (versionCode 5 / 1.0.2) — this blocker is Apple-only.

### On the 1.0.4 version page
Create it with **Apps → Retro Game Collection → `+` next to iOS App → 1.0.4**.
- [ ] **What's New in This Version** — required, cannot be left empty:
```
RGC Pro is now available — unlock unlimited consoles, the wishlist, and an ad-free app.
```
- [ ] **Build** → upload build 30 and attach it
- [ ] Name, subtitle, keywords, category and marketing URL all carry over from
      1.0.3 — nothing to re-enter

### In-App Purchases — first submission

The three products have never been approved, which is why the shipped app shows
"Plans unavailable": StoreKit returns no products, so the paywall renders its
empty state. App Store Connect refuses a standalone submission with *"Your first
auto-renewable subscription must be submitted with a new app version"* and *"must
be submitted with its subscription group"* — both mean the subscriptions cannot go
up on their own. They ride along with the 1.0.4 version, and the whole group goes
at once.

- [ ] **Subscription group** — Monetization → Subscriptions. Monthly and Annual
      must sit in one group, and the group itself needs a localized **display
      name**, or every member stays in *Missing Metadata*.
- [ ] **Each subscription** (`com.retrogamecollection.app.monthly`, `.annual`) —
      localized display name + description, price, availability, and a **review
      screenshot** (640 × 920 minimum). Both must read *Ready to Submit*; one stuck
      in *Missing Metadata* blocks the other, since the group submits as a unit.
- [ ] **Lifetime** (`com.retrogamecollection.app.lifetime`) is a non-consumable, so
      it sits outside the group — attach it to the same version submission anyway.
- [ ] **Attach to the version** — on the 1.0.4 page, *In-App Purchases and
      Subscriptions* → select all three → Add for Review. They are then reviewed
      alongside build 30.
- [ ] **One submission, five items** — App Store Connect allows a single review
      submission in progress, and everything goes in it: version 1.0.4 + build 30,
      the subscription group (its pending display name is its own reviewable item),
      Monthly, Annual, Lifetime. The group is not an alternative to its members —
      submitting it alone fails with the same error. Items split across two draft
      submissions is what blocks the submit button; consolidate into the draft that
      holds the version and delete the other.
- [ ] **Business → Agreements** — the Paid Applications Agreement must be active.
      If it lapsed, products return nothing even after approval.

For the review screenshot, run the app in the simulator (`npm run ios`) and capture
the paywall: the Run scheme points at `ios/StoreKitConfig.storekit`, so prices
render locally even while the real products are unapproved.
