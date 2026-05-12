# Store Listing — Ready-to-Paste

Final text for App Store Connect (iOS) and Google Play Console (Android). Each section maps to one field in the store's form. Just copy/paste.

URLs assume GitHub Pages is enabled at `peckhouse/RGC` → `/docs` folder. Swap them later if you move to a custom domain.

---

## 🍎 App Store Connect — Apple

### Localization → English (U.S.)

**Name** _(30 char max — used 21)_
```
Retro Game Collection
```

**Subtitle** _(30 char max — used 23)_
```
The collector's toolkit
```

**Promotional Text** _(170 char max — editable without re-review)_
```
Track every cart and disc in your retro collection. See completion %, market value, and what's missing from each console — from NES to Xbox One.
```

**Keywords** _(100 char limit, comma-separated, no spaces, no words from name/subtitle)_
```
nintendo,sega,playstation,xbox,atari,snes,n64,ps1,gba,dreamcast,neogeo,collector,vintage
```

**Description** _(4000 char max — see "Full description" below)_

### General App Information

**Category** — Primary: **Lifestyle** · Secondary: **Reference**

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

**Marketing URL** _(optional — leave blank or reuse Support URL)_

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

**App name** _(50 char max — used 21)_
```
Retro Game Collection
```

**Short description** _(80 char max — used 62)_
```
Catalog your physical retro game collection across 34 consoles.
```

**Full description** _(4000 char max — see "Full description" below)_

### App content / Store settings

**App category** — Lifestyle
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

REFERRAL BONUS

Share your invite code from your profile. When a friend signs up using it, you both get a bonus console slot — 6 instead of 5 — for free.

WHY RTGC?

Built by collectors, for collectors. Fast, clean, dark UI. No social feeds, no popups asking you to rate the app, no scrolling carousels of stuff you don't want. Just your collection.

---

Questions or feedback? Reach out at ludovic.anthony.prandi@gmail.com
```

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
