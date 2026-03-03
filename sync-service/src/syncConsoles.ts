import {IGDBClient} from './igdbClient';
import {supabase} from './supabaseClient';

const BATCH_SIZE = 500;
const RATE_LIMIT_DELAY_MS = 260;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Platforms that should be merged into a canonical parent.
 * Key = alias name (excluded from consoles table),
 * Value = canonical platform name (kept in consoles table).
 *
 * Games tagged with an alias ID will have their platform ID remapped
 * to the canonical ID so they appear under the right console.
 */
const PLATFORM_ALIASES: Record<string, string> = {
  // ── Nintendo DS family → Nintendo DS ──────────────────────────────
  'Nintendo DSi': 'Nintendo DS',
  'Nintendo DSi XL': 'Nintendo DS',

  // ── Nintendo 3DS family → Nintendo 3DS ───────────────────────────
  'Nintendo 2DS': 'Nintendo 3DS',
  'Nintendo 3DS XL': 'Nintendo 3DS',
  'New Nintendo 3DS': 'Nintendo 3DS',
  'New Nintendo 3DS XL': 'Nintendo 3DS',
  'New Nintendo 2DS XL': 'Nintendo 3DS',

  // ── Game Boy family → Game Boy / Game Boy Color ───────────────────
  'Game Boy Color': 'Game Boy',
  'Game Boy Pocket': 'Game Boy',
  'Game Boy Light': 'Game Boy',

  // ── Famicom → Nintendo Entertainment System ───────────────────────
  'Family Computer': 'Nintendo Entertainment System',
  'Famicom': 'Nintendo Entertainment System',

  // ── Super Famicom → Super Nintendo Entertainment System ───────────
  'Super Famicom': 'Super Nintendo Entertainment System',

  // ── TurboGrafx-16 / SuperGrafx → TurboGrafx-16/PC Engine (IGDB canonical) ─
  'TurboGrafx-16': 'TurboGrafx-16/PC Engine',
  'PC Engine SuperGrafx': 'TurboGrafx-16/PC Engine',

  // ── Sega Master System variants → Sega Master System/Mark III (IGDB canonical) ─
  'Sega Mark III': 'Sega Master System/Mark III',
  'Sega Master System': 'Sega Master System/Mark III',

  // ── Atari 7800 → Atari 2600 ──────────────────────────────────────
  'Atari 7800': 'Atari 2600',

  // ── WonderSwan Color → WonderSwan ────────────────────────────────
  'WonderSwan Color': 'WonderSwan',

  // ── Neo Geo Pocket Color → Neo Geo Pocket ────────────────────────
  'Neo Geo Pocket Color': 'Neo Geo Pocket',

  // ── Neo Geo variants → Neo Geo AES ───────────────────────────────
  // IGDB's canonical name is "Neo Geo AES" (the home console)
  'Neo Geo MVS': 'Neo Geo AES',

  // ── Xbox Series variants → Xbox Series X|S ───────────────────────
  'Xbox Series X': 'Xbox Series X|S',
  'Xbox Series S': 'Xbox Series X|S',
};

/**
 * Exact list of consoles we support, grouped by manufacturer.
 * Paired systems (e.g. "Game Boy & Game Boy Color") use PLATFORM_ALIASES above
 * so the alias is merged into the canonical entry listed here.
 *
 * Names must match IGDB exactly. Run the sync and check the "Excluded" log
 * to catch any name mismatches, then update here with the correct IGDB name.
 */
const ALLOWED_PLATFORMS = new Set([
  // ── Sony ──────────────────────────────────────────────────────────
  'PlayStation',            // PS1
  'PlayStation 2',
  'PlayStation 3',

  'PlayStation Portable',   // PSP
  'PlayStation Vita',

  // ── Nintendo — home ───────────────────────────────────────────────
  'Nintendo Entertainment System',        // NES / Famicom (merged via alias)
  'Super Nintendo Entertainment System',  // SNES / Super Famicom (merged via alias)
  'Nintendo 64',
  'Nintendo GameCube',
  'Wii',
  'Wii U',

  // ── Nintendo — handheld ───────────────────────────────────────────
  'Game Boy',               // Game Boy / Game Boy Color (merged via alias; display name overridden below)
  'Game Boy Advance',
  'Nintendo DS',            // DS / DSi (merged via alias)
  'Nintendo 3DS',           // 3DS / 2DS / New 3DS (merged via alias)

  // ── Microsoft ─────────────────────────────────────────────────────
  'Xbox',
  'Xbox 360',
  'Xbox Series X|S',        // Series X + Series S (merged via alias)

  // ── Sega ──────────────────────────────────────────────────────────
  'Sega Master System/Mark III', // IGDB canonical; Mark III + "Sega Master System" merged via alias
  'Sega Mega Drive/Genesis',
  'Sega Saturn',
  'Dreamcast',
  'Sega Game Gear',         // IGDB canonical name (no standalone "Game Gear" in IGDB)

  // ── Atari ─────────────────────────────────────────────────────────
  'Atari 2600',               // Atari 2600 / 7800 (merged via alias; display name overridden below)
  'Atari Lynx',

  // ── NEC ───────────────────────────────────────────────────────────
  'TurboGrafx-16/PC Engine', // IGDB canonical; TurboGrafx-16 + SuperGrafx merged via alias

  // ── SNK ───────────────────────────────────────────────────────────
  'Neo Geo AES',            // IGDB canonical; Neo Geo MVS merged via alias
  'Neo Geo Pocket',         // NGP + NGP Color (merged via alias)

  // ── Bandai ────────────────────────────────────────────────────────
  'WonderSwan',             // WonderSwan + WonderSwan Color (merged via alias)
]);

/**
 * Explicit manufacturer override per platform name.
 * IGDB's platform_family.name is sometimes null, "PlayStation" instead of "Sony",
 * or simply missing for older/niche hardware. This ensures the correct company
 * name is stored in the DB and surfaced correctly in the app's manufacturer browser.
 */
/**
 * Override the display name stored in the DB for a given IGDB platform name.
 * All internal lookups (aliases, allowlist, manufacturer) still use the IGDB name.
 */
const PLATFORM_DISPLAY_NAME: Record<string, string> = {
  // Nintendo home
  'Nintendo Entertainment System':       'Famicom / NES',
  'Super Nintendo Entertainment System': 'Super Famicom / SNES',
  'Nintendo 64':                         'N64',
  'Nintendo GameCube':                   'GameCube',
  // Nintendo handheld
  'Game Boy':     'Game Boy / Game Boy Color',
  'Nintendo DS':  'DS',
  'Nintendo 3DS': '3DS',
  // Atari
  'Atari 2600': 'Atari 2600 / 7800',
  // Sony
  'PlayStation Portable': 'PSP',
  'PlayStation Vita':     'PS Vita',
  // Sega
  'Sega Master System/Mark III': 'Mark III / Master System',
  'Sega Game Gear':          'Game Gear',
  'Sega Mega Drive/Genesis': 'Mega Drive / Genesis',
  'Sega Saturn':             'Saturn',
  // NEC
  'TurboGrafx-16/PC Engine': 'PC Engine / TurboGrafx-16',
  // SNK
  'Neo Geo AES':    'Neo Geo',
  'Neo Geo Pocket': 'Neo Geo Pocket / Pocket Color',
  // Bandai
  'WonderSwan': 'WonderSwan / WonderSwan Color',
};

const PLATFORM_MANUFACTURER: Record<string, string> = {
  // Nintendo
  'Nintendo Entertainment System': 'Nintendo',
  'Super Nintendo Entertainment System': 'Nintendo',
  'Nintendo 64': 'Nintendo',
  'Nintendo GameCube': 'Nintendo',
  'Wii': 'Nintendo',
  'Wii U': 'Nintendo',

  'Game Boy': 'Nintendo',
  'Game Boy Advance': 'Nintendo',
  'Nintendo DS': 'Nintendo',
  'Nintendo 3DS': 'Nintendo',
  // Sony
  'PlayStation': 'Sony',
  'PlayStation 2': 'Sony',
  'PlayStation 3': 'Sony',

  'PlayStation Portable': 'Sony',
  'PlayStation Vita': 'Sony',
  // Microsoft
  'Xbox': 'Microsoft',
  'Xbox 360': 'Microsoft',
  'Xbox Series X|S': 'Microsoft',
  // Sega
  'Sega Master System/Mark III': 'Sega',
  'Sega Mega Drive/Genesis': 'Sega',
  'Sega Saturn': 'Sega',
  'Dreamcast': 'Sega',
  'Sega Game Gear': 'Sega',
  // Atari
  'Atari 2600': 'Atari',
  'Atari Lynx': 'Atari',
  // NEC
  'TurboGrafx-16/PC Engine': 'NEC',
  // SNK
  'Neo Geo AES': 'SNK',
  'Neo Geo Pocket': 'SNK',
  // Bandai
  'WonderSwan': 'Bandai',
};

export type PlatformRemap = Record<number, number>;

export async function syncConsoles(
  igdbClient: IGDBClient,
): Promise<{count: number; remap: PlatformRemap; platformIds: number[]}> {
  console.log('Fetching platforms from IGDB...');

  // Paginate through all platforms
  let offset = 0;
  const allPlatforms: {
    id: number;
    name: string;
    slug: string;
    summary?: string;
    platform_logo?: {image_id: string};
    platform_family?: {name: string};
    generation?: number;
  }[] = [];

  while (true) {
    const batch = await igdbClient.fetchPlatforms(offset, BATCH_SIZE);
    if (batch.length === 0) break;
    allPlatforms.push(...batch);
    if (batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
    await sleep(RATE_LIMIT_DELAY_MS);
  }

  console.log(`  Fetched ${allPlatforms.length} platforms from IGDB`);

  // Build name → id map from all fetched platforms
  const nameToId = new Map(allPlatforms.map(p => [p.name, p.id]));

  // Build remap: alias platform ID → canonical platform ID
  const remap: PlatformRemap = {};
  for (const [aliasName, canonicalName] of Object.entries(PLATFORM_ALIASES)) {
    const aliasId = nameToId.get(aliasName);
    const canonicalId = nameToId.get(canonicalName);
    if (aliasId !== undefined && canonicalId !== undefined) {
      remap[aliasId] = canonicalId;
      console.log(`  Merging "${aliasName}" (${aliasId}) → "${canonicalName}" (${canonicalId})`);
    }
  }

  // Step 1: remove alias platforms (they're merged into their canonical)
  const aliasNames = new Set(Object.keys(PLATFORM_ALIASES));
  const canonical = allPlatforms.filter(p => !aliasNames.has(p.name));

  // Step 2: apply allowlist — only keep the platforms we care about
  const allowed = canonical.filter(p => ALLOWED_PLATFORMS.has(p.name));

  // Log excluded platforms so name mismatches are easy to spot
  const excluded = canonical.filter(p => !ALLOWED_PLATFORMS.has(p.name));
  if (excluded.length > 0) {
    console.log(`\n  Excluded ${excluded.length} platforms not in allowlist:`);
    excluded.forEach(p => console.log(`    ✗ "${p.name}" (slug: ${p.slug})`));
  }
  // Log allowed platforms that had no match in IGDB (likely a name mismatch)
  const foundNames = new Set(allowed.map(p => p.name));
  const notFound = [...ALLOWED_PLATFORMS].filter(name => !foundNames.has(name));
  if (notFound.length > 0) {
    console.log(`\n  WARNING: ${notFound.length} allowed platform(s) NOT found in IGDB (name mismatch?):`);
    notFound.forEach(name => console.log(`    ? "${name}"`));
  }

  console.log(`\n  Keeping ${allowed.length} allowed platforms`);

  const transformed = allowed.map(p => ({
    id: p.id,
    name: PLATFORM_DISPLAY_NAME[p.name] ?? p.name,
    slug: p.slug,
    summary: p.summary ?? null,
    manufacturer: PLATFORM_MANUFACTURER[p.name] ?? p.platform_family?.name ?? null,
    release_year: null as number | null,
    logo_url: p.platform_logo?.image_id ?? null,
    updated_at: new Date().toISOString(),
  }));

  const {error} = await supabase
    .from('consoles')
    .upsert(transformed, {onConflict: 'id'});

  if (error) {
    throw new Error(`Failed to upsert consoles: ${error.message}`);
  }

  // Build the full set of IGDB platform IDs to pass to the games sync:
  // canonical allowed IDs + alias IDs whose canonical target is in the allowlist
  const canonicalAllowedIds = new Set(allowed.map(p => p.id));
  const relevantAliasIds = Object.entries(remap)
    .filter(([, canonicalId]) => canonicalAllowedIds.has(canonicalId))
    .map(([aliasId]) => Number(aliasId));
  const platformIds = [...canonicalAllowedIds, ...relevantAliasIds];

  return {count: transformed.length, remap, platformIds};
}
