/**
 * eBay Browse API price sync
 *
 * Fetches active Buy-It-Now listing prices for every unique game+console
 * and stores them as price_loose / price_complete / price_new / price_box_only (cents USD).
 * Also appends one row per updated game to game_price_history for trend graphs.
 *
 * Usage:
 *   EBAY_APP_ID=<id> EBAY_CERT_ID=<cert> npx tsx src/syncPrices.ts
 *
 * Rolling sync: processes up to 4,444 games per run (oldest price_updated_at first),
 * completing a full ~20,000-game cycle every ~4.5 days.
 * eBay free tier: 5,000 calls/day — this stays safely within quota.
 *
 * Requires env vars:
 *   EBAY_APP_ID        — eBay Developer App ID (Client ID)
 *   EBAY_CERT_ID       — eBay Developer Cert ID (Client Secret)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 */

import dotenv from 'dotenv';
import axios from 'axios';
import {supabase} from './supabaseClient';

dotenv.config();

const APP_ID = process.env.EBAY_APP_ID ?? '';
const CERT_ID = process.env.EBAY_CERT_ID ?? '';
const EBAY_TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const EBAY_SEARCH_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
const EBAY_SCOPE = 'https://api.ebay.com/oauth/api_scope';

const DAILY_LIMIT = 4444;  // stay within eBay free-tier 5,000 calls/day
const RATE_LIMIT_MS = 2000; // 2s between calls → ~2.5 hrs for a full 4,444-game batch

// Map verbose DB console names → shorter search terms for better eBay results
const CONSOLE_NAME_MAP: Record<string, string> = {
  'Nintendo Entertainment System': 'NES',
  'Super Nintendo Entertainment System': 'SNES',
  'Nintendo 64': 'Nintendo 64',
  'Nintendo GameCube': 'GameCube',
  'Wii': 'Wii',
  'Wii U': 'Wii U',
  'Game Boy': 'Game Boy',
  'Game Boy Color': 'Game Boy Color',
  'Game Boy Advance': 'Game Boy Advance',
  'Nintendo DS': 'Nintendo DS',
  'Nintendo 3DS': '3DS',
  'PlayStation': 'PS1',
  'PlayStation 2': 'PS2',
  'PlayStation 3': 'PS3',
  'PlayStation Portable': 'PSP',
  'PlayStation Vita': 'PS Vita',
  'Sega Master System': 'Sega Master System',
  'Sega Mega Drive / Genesis': 'Sega Genesis',
  'Sega Saturn': 'Sega Saturn',
  'Sega Dreamcast': 'Dreamcast',
  'Sega Game Gear': 'Game Gear',
  'Xbox': 'Xbox',
  'Xbox 360': 'Xbox 360',
  'Neo Geo': 'Neo Geo AES',
  'TurboGrafx-16 / PC Engine': 'TurboGrafx-16',
  'Atari 2600': 'Atari 2600',
  'Atari Lynx': 'Atari Lynx',
};

// ─── OAuth2 token management ──────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken; // still valid (with 1-min buffer)
  }
  const credentials = Buffer.from(`${APP_ID}:${CERT_ID}`).toString('base64');
  const response = await axios.post(
    EBAY_TOKEN_URL,
    `grant_type=client_credentials&scope=${encodeURIComponent(EBAY_SCOPE)}`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 15_000,
    },
  );
  cachedToken = response.data.access_token as string;
  tokenExpiresAt = now + (response.data.expires_in as number) * 1000;
  console.log('🔑 eBay token acquired (expires in', Math.round(response.data.expires_in / 60), 'min)');
  return cachedToken;
}

// ─── Condition parsing from listing title ─────────────────────────────────────

type Condition = 'loose' | 'complete' | 'new' | 'box_only';

function parseCondition(title: string): Condition {
  const t = title.toLowerCase();
  // Sealed / new first — most specific
  if (
    t.includes('factory sealed') ||
    t.includes('brand new sealed') ||
    t.includes('new sealed') ||
    (t.includes('sealed') && !t.includes('unsealed'))
  ) {
    return 'new';
  }
  // Box-only — must come before "complete" since "box" appears in both
  if (
    t.includes('box only') ||
    t.includes('box & manual') ||
    t.includes('box and manual') ||
    t.includes('box/manual') ||
    (t.includes('box') && t.includes('no game')) ||
    (t.includes('box') && t.includes('no cart'))
  ) {
    return 'box_only';
  }
  // Complete-in-box
  if (
    t.includes('complete in box') ||
    /\bcib\b/.test(t) ||
    t.includes('with box') ||
    t.includes('with manual') ||
    t.includes('complete set')
  ) {
    return 'complete';
  }
  // Explicit loose/cartridge
  if (
    t.includes('loose') ||
    t.includes('cart only') ||
    t.includes('cartridge only') ||
    t.includes('game only') ||
    t.includes('disc only')
  ) {
    return 'loose';
  }
  // Default — most eBay listings without explicit condition keywords are loose
  return 'loose';
}

// ─── Price helpers ────────────────────────────────────────────────────────────

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

type PriceResult = {
  price_loose: number | null;
  price_complete: number | null;
  price_new: number | null;
  price_box_only: number | null;
};

async function fetchPrices(gameName: string, consoleName: string): Promise<PriceResult | null> {
  const friendly = CONSOLE_NAME_MAP[consoleName] ?? consoleName;
  const token = await getToken();

  try {
    const response = await axios.get(EBAY_SEARCH_URL, {
      params: {
        q: `${gameName} ${friendly}`,
        filter: 'buyingOptions:{FIXED_PRICE}',
        limit: 20,
      },
      headers: {Authorization: `Bearer ${token}`},
      timeout: 15_000,
    });

    const items: Array<{title: string; price: {value: string; currency: string}}> =
      response.data?.itemSummaries ?? [];

    if (items.length === 0) return null;

    const buckets: Record<Condition, number[]> = {
      loose: [],
      complete: [],
      new: [],
      box_only: [],
    };

    for (const item of items) {
      if (item.price?.currency !== 'USD') continue;
      const priceCents = Math.round(parseFloat(item.price.value) * 100);
      if (priceCents <= 0) continue;
      buckets[parseCondition(item.title)].push(priceCents);
    }

    const result: PriceResult = {
      price_loose: median(buckets.loose),
      price_complete: median(buckets.complete),
      price_new: median(buckets.new),
      price_box_only: median(buckets.box_only),
    };

    const hasAny =
      result.price_loose !== null ||
      result.price_complete !== null ||
      result.price_new !== null ||
      result.price_box_only !== null;

    return hasAny ? result : null;
  } catch {
    return null;
  }
}

// ─── Main sync ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncPrices(): Promise<void> {
  if (!APP_ID || !CERT_ID) {
    console.error(
      '❌ Missing EBAY_APP_ID and/or EBAY_CERT_ID env vars.\n' +
        '   Register at https://developer.ebay.com to get credentials.',
    );
    process.exit(1);
  }

  // ── 1. Load consoles ─────────────────────────────────────────────────────
  console.log('📦 Fetching consoles from Supabase...');
  const {data: consoles, error: consoleErr} = await supabase
    .from('consoles')
    .select('id, name');
  if (consoleErr) throw consoleErr;
  const consoleMap = new Map<number, string>(
    (consoles ?? []).map(c => [c.id as number, c.name as string]),
  );

  // ── 2. Load all unique (igdb_id, console_id) pairs, stalest first ─────────
  console.log('🎮 Fetching games from Supabase (stalest price_updated_at first)...');

  // Collect one representative entry per (igdb_id, console_id), preferring NA name
  const seen = new Map<
    string,
    {igdb_id: number; console_id: number; name: string; hasNA: boolean; updatedAt: string | null}
  >();

  let page = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const {data: rows, error} = await supabase
      .from('games')
      .select('igdb_id, console_id, name, region, price_updated_at')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .order('igdb_id');
    if (error) throw error;
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      const key = `${row.igdb_id}-${row.console_id}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, {
          igdb_id: row.igdb_id as number,
          console_id: row.console_id as number,
          name: row.name as string,
          hasNA: row.region === 'NA',
          updatedAt: row.price_updated_at as string | null,
        });
      } else if (!existing.hasNA && row.region === 'NA') {
        // Prefer NA title for better eBay search match
        existing.name = row.name as string;
        existing.hasNA = true;
      }
    }

    if (rows.length < PAGE_SIZE) break;
    page++;
  }

  // Sort: never-synced (null) first, then oldest sync date
  const allGames = Array.from(seen.values()).sort((a, b) => {
    if (a.updatedAt === null && b.updatedAt === null) return 0;
    if (a.updatedAt === null) return -1;
    if (b.updatedAt === null) return 1;
    return a.updatedAt < b.updatedAt ? -1 : 1;
  });

  const toProcess = allGames.slice(0, DAILY_LIMIT);
  console.log(
    `\n🔍 Processing ${toProcess.length} of ${allGames.length} unique game+console combos` +
      ` (daily quota: ${DAILY_LIMIT})...\n`,
  );

  // ── 3. Sync prices ─────────────────────────────────────────────────────────
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const now = new Date().toISOString();

  // Collect history rows; batch-insert at the end to avoid per-game round-trips
  const historyRows: Array<{
    igdb_id: number;
    console_id: number;
    price_loose: number | null;
    price_complete: number | null;
    price_new: number | null;
    price_box_only: number | null;
    source: string;
  }> = [];

  for (let i = 0; i < toProcess.length; i++) {
    const {igdb_id, console_id, name} = toProcess[i];
    const consoleName = consoleMap.get(console_id) ?? '';

    const prices = await fetchPrices(name, consoleName);

    if (prices) {
      const {error} = await supabase
        .from('games')
        .update({
          price_loose: prices.price_loose,
          price_complete: prices.price_complete,
          price_new: prices.price_new,
          price_box_only: prices.price_box_only,
          price_updated_at: now,
        } as any)
        .eq('igdb_id', igdb_id)
        .eq('console_id', console_id);

      if (error) {
        console.error(`  ❌ DB error for "${name}":`, error.message);
        errors++;
      } else {
        updated++;
        historyRows.push({igdb_id, console_id, ...prices, source: 'ebay'});
      }
    } else {
      skipped++;
    }

    if ((i + 1) % 100 === 0 || i === toProcess.length - 1) {
      console.log(
        `  [${i + 1}/${toProcess.length}] updated: ${updated}  skipped: ${skipped}  errors: ${errors}`,
      );
    }

    await sleep(RATE_LIMIT_MS);
  }

  // ── 4. Write price history rows ────────────────────────────────────────────
  if (historyRows.length > 0) {
    console.log(`\n📈 Writing ${historyRows.length} rows to game_price_history...`);
    const BATCH_SIZE = 500;
    for (let i = 0; i < historyRows.length; i += BATCH_SIZE) {
      const {error} = await supabase
        .from('game_price_history')
        .insert(historyRows.slice(i, i + BATCH_SIZE) as any);
      if (error) console.error('  History insert error:', error.message);
    }
  }

  console.log(`\n✅ Done! Updated: ${updated} | Skipped: ${skipped} | Errors: ${errors}`);
  console.log(
    `   Remaining games for next run: ${allGames.length - toProcess.length}`,
  );
}

syncPrices().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
