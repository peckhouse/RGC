/**
 * Full rebuild sync: syncs consoles then every supported platform's games.
 *
 * Run this after truncating the database to rebuild all data from scratch.
 * One IGDB authentication is shared across all platform syncs.
 *
 * Usage:
 *   npx tsx src/syncAllFromIGDB.ts              # dry-run (no DB writes)
 *   DRY_RUN=false npx tsx src/syncAllFromIGDB.ts # write to Supabase
 *
 * Truncate first (Supabase SQL editor):
 *   TRUNCATE TABLE games, consoles RESTART IDENTITY CASCADE;
 */

import dotenv from 'dotenv';
import {IGDBClient, IGDBLocalization} from './igdbClient';
import {syncConsoles} from './syncConsoles';
import {supabase} from './supabaseClient';

dotenv.config();

// ── Config ────────────────────────────────────────────────────────────────────

const DRY_RUN = process.env.DRY_RUN !== 'false';
const RATE_LIMIT_MS = 260;
const LOC_BATCH_SIZE = 100;
const PAGE_SIZE = 500;
const UPSERT_BATCH = 50;

/**
 * Every platform group to sync.
 * Single-platform entries have one ID; merged entries have two (deduped by game ID).
 *
 * ⚠️  Game Gear uses ID 35 — same as Sega Master System.
 *     Run `npm run sync-gg-igdb` in dry-run mode first to verify the correct
 *     Game Gear IGDB platform ID and update both this list and syncGameGearFromIGDB.ts.
 */
const PLATFORMS: Array<{ids: number[]; label: string}> = [
  // ── Nintendo — home ───────────────────────────────────────────────────────
  {ids: [18, 99],   label: 'NES / Famicom'},
  {ids: [19, 58],   label: 'SNES / Super Famicom'},
  {ids: [4],        label: 'Nintendo 64'},
  {ids: [21],       label: 'GameCube'},
  {ids: [5],        label: 'Wii'},
  {ids: [41],       label: 'Wii U'},

  // ── Nintendo — handheld ───────────────────────────────────────────────────
  {ids: [33, 22],   label: 'Game Boy / Game Boy Color'},
  {ids: [24],       label: 'Game Boy Advance'},
  {ids: [20],       label: 'Nintendo DS'},
  {ids: [37, 137],  label: '3DS / New 3DS'},

  // ── Sony ──────────────────────────────────────────────────────────────────
  {ids: [7],        label: 'PlayStation'},
  {ids: [8],        label: 'PlayStation 2'},
  {ids: [9],        label: 'PlayStation 3'},
  {ids: [38],       label: 'PSP'},
  {ids: [46],       label: 'PS Vita'},

  // ── Microsoft ─────────────────────────────────────────────────────────────
  {ids: [11],       label: 'Xbox'},
  {ids: [12],       label: 'Xbox 360'},
  {ids: [169, 170], label: 'Xbox Series X|S'},

  // ── Sega ──────────────────────────────────────────────────────────────────
  {ids: [35, 64],   label: 'Master System / Mark III'},
  {ids: [29],       label: 'Mega Drive / Genesis'},
  {ids: [32],       label: 'Saturn'},
  {ids: [23],       label: 'Dreamcast'},
  // ⚠️  Verify Game Gear ID — run `npm run sync-gg-igdb` dry-run first
  {ids: [35],       label: 'Game Gear'},

  // ── Atari ─────────────────────────────────────────────────────────────────
  {ids: [59, 60],   label: 'Atari 2600 / 7800'},
  {ids: [61],       label: 'Atari Lynx'},

  // ── NEC ───────────────────────────────────────────────────────────────────
  {ids: [86, 74],   label: 'TurboGrafx-16 / PC Engine'},

  // ── SNK ───────────────────────────────────────────────────────────────────
  {ids: [80],       label: 'Neo Geo'},
  {ids: [119, 120], label: 'Neo Geo Pocket / Pocket Color'},

  // ── Bandai ────────────────────────────────────────────────────────────────
  {ids: [57, 123],  label: 'WonderSwan / WonderSwan Color'},
];

// ── Types ─────────────────────────────────────────────────────────────────────

type RegionCode = 'EU' | 'NA' | 'JP';
// Region 8 = Worldwide — captured separately and used as fallback for missing EU/NA/JP
const IGDB_REGION_MAP: Record<number, RegionCode | 'WW'> = {1: 'EU', 2: 'NA', 5: 'JP', 8: 'WW'};
const BUCKET_IGDB_REGION: Record<RegionCode, number> = {EU: 1, NA: 2, JP: 5};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function pickCover(
  globalCover: string | undefined,
  localizations: IGDBLocalization[],
  targetRegionId: number,
): string | null {
  const exact = localizations.find(l => l.region === targetRegionId && l.cover?.image_id);
  if (exact?.cover?.image_id) return exact.cover.image_id;
  const any = localizations.find(l => l.cover?.image_id);
  if (any?.cover?.image_id) return any.cover.image_id;
  return globalCover ?? null;
}

// ── Per-platform sync ─────────────────────────────────────────────────────────

async function syncPlatformGames(
  igdb: IGDBClient,
  platform: {ids: number[]; label: string},
): Promise<{upserted: number; noRegion: number}> {
  const {ids, label} = platform;

  // Step 1 — fetch games, deduplicate across platform IDs
  type IGDBGame = Awaited<ReturnType<typeof igdb.fetchGamesByPlatform>>[number];
  const gameMap = new Map<number, IGDBGame>();

  for (const platformId of ids) {
    let offset = 0;
    while (true) {
      const page = await igdb.fetchGamesByPlatform(platformId, offset, PAGE_SIZE);
      for (const g of page) {
        if (!gameMap.has(g.id)) gameMap.set(g.id, g);
      }
      if (page.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
      await sleep(RATE_LIMIT_MS);
    }
  }

  const games = [...gameMap.values()];
  const gameIds = games.map(g => g.id);
  console.log(`   ${games.length} games fetched`);

  // Step 2 — fetch release dates for all platforms
  type RD = Awaited<ReturnType<typeof igdb.fetchReleaseDates>>[number];
  const rdMap = new Map<number, RD[]>();

  for (const platformId of ids) {
    for (let i = 0; i < gameIds.length; i += LOC_BATCH_SIZE) {
      const rds = await igdb.fetchReleaseDates(gameIds.slice(i, i + LOC_BATCH_SIZE), platformId);
      for (const rd of rds) {
        if (rd.game == null) continue;
        if (!rdMap.has(rd.game)) rdMap.set(rd.game, []);
        rdMap.get(rd.game)!.push(rd);
      }
      if (i + LOC_BATCH_SIZE < gameIds.length) await sleep(RATE_LIMIT_MS);
    }
  }
  console.log(`   ${rdMap.size} games have regional release dates`);

  // Step 3 — fetch localizations
  const locMap = new Map<number, IGDBLocalization[]>();
  for (let i = 0; i < gameIds.length; i += LOC_BATCH_SIZE) {
    const locs = await igdb.fetchGameLocalizations(gameIds.slice(i, i + LOC_BATCH_SIZE));
    for (const loc of locs) {
      if (!locMap.has(loc.game)) locMap.set(loc.game, []);
      locMap.get(loc.game)!.push(loc);
    }
    if (i + LOC_BATCH_SIZE < gameIds.length) await sleep(RATE_LIMIT_MS);
  }

  // Step 4 — build upsert rows
  const toUpsert: object[] = [];
  let noRegion = 0;

  for (const game of games) {
    const locs = locMap.get(game.id) ?? [];
    const developer = game.involved_companies?.find(ic => ic.developer)?.company?.name ?? null;
    const publisher = game.involved_companies?.find(ic => ic.publisher)?.company?.name ?? null;
    const maxPlayers =
      game.multiplayer_modes?.reduce((max, mm) => Math.max(max, mm.offlinemax ?? 0, mm.onlinemax ?? 0), 0) || null;

    const regionDates = new Map<RegionCode, string | null>();
    let wwDate: string | null | undefined = undefined;
    for (const rd of rdMap.get(game.id) ?? []) {
      const code = IGDB_REGION_MAP[rd.release_region ?? -1];
      if (!code) continue;
      const dateStr = rd.date ? new Date(rd.date * 1000).toISOString().split('T')[0] : null;
      if (code === 'WW') {
        if (wwDate === undefined) wwDate = dateStr;
      } else if (!regionDates.has(code)) {
        regionDates.set(code, dateStr);
      }
    }
    // Fill any missing EU/NA/JP with the worldwide date
    if (wwDate !== undefined) {
      for (const r of ['EU', 'NA', 'JP'] as RegionCode[]) {
        if (!regionDates.has(r)) regionDates.set(r, wwDate);
      }
    }

    let regionCount = 0;
    for (const [regionCode, releaseDate] of regionDates) {
      regionCount++;
      toUpsert.push({
        igdb_id:      game.id,
        region:       regionCode,
        name:         game.name,
        slug:         game.slug,
        summary:      game.summary ?? null,
        cover_url:    pickCover(game.cover?.image_id, locs, BUCKET_IGDB_REGION[regionCode]),
        release_date: releaseDate,
        rating:       game.rating != null ? Math.round(game.rating) / 10 : null,
        rating_count: game.rating_count ?? 0,
        genres:       game.genres?.map(g => g.name) ?? [],
        platforms:    game.platforms ?? ids,
        developer,
        publisher,
        screenshots:  game.screenshots?.map(s => s.image_id) ?? [],
        max_players:  maxPlayers,
        updated_at:   new Date().toISOString(),
      });
    }
    if (regionCount === 0) noRegion++;
  }

  const euCount = toUpsert.filter((e: any) => e.region === 'EU').length;
  const naCount = toUpsert.filter((e: any) => e.region === 'NA').length;
  const jpCount = toUpsert.filter((e: any) => e.region === 'JP').length;
  console.log(`   ${toUpsert.length} entries to upsert  (EU:${euCount} NA:${naCount} JP:${jpCount})  ${noRegion} with no region`);

  // Step 5 — upsert
  if (!DRY_RUN) {
    for (let i = 0; i < toUpsert.length; i += UPSERT_BATCH) {
      const batch = toUpsert.slice(i, i + UPSERT_BATCH);
      const {error} = await supabase.from('games').upsert(batch, {onConflict: 'igdb_id,region'});
      if (error) console.error(`   ❌ Batch ${Math.floor(i / UPSERT_BATCH) + 1} failed: ${error.message}`);
    }
  }

  return {upserted: toUpsert.length, noRegion};
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎮 Full IGDB → Supabase rebuild sync');
  console.log(`   Mode : ${DRY_RUN ? 'DRY RUN (set DRY_RUN=false to write)' : 'LIVE'}`);
  console.log(`   Platforms: ${PLATFORMS.length}`);
  console.log();

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET in .env');

  const igdb = new IGDBClient(clientId, clientSecret);
  await igdb.authenticate();
  console.log('✅ IGDB authenticated\n');

  // ── Step 1: Consoles ────────────────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📺 Syncing consoles...');
  const {count: consolesCount} = await syncConsoles(igdb);
  console.log(`✅ ${consolesCount} consoles synced\n`);

  if (DRY_RUN) {
    console.log('(Consoles upserted even in dry-run — syncConsoles does not check DRY_RUN)');
    console.log();
  }

  // ── Step 2: Games per platform ──────────────────────────────────────────────
  let totalUpserted = 0;
  const startTime = Date.now();

  for (let i = 0; i < PLATFORMS.length; i++) {
    const platform = PLATFORMS[i];
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🕹️  [${i + 1}/${PLATFORMS.length}] ${platform.label}`);

    const {upserted} = await syncPlatformGames(igdb, platform);
    totalUpserted += upserted;

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`   ✅ Done  (${elapsed}s elapsed)\n`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const totalDuration = Math.round((Date.now() - startTime) / 1000);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary');
  console.log(`   Consoles synced  : ${consolesCount}`);
  console.log(`   Game rows total  : ${totalUpserted}`);
  console.log(`   Duration         : ${totalDuration}s`);

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — nothing written to Supabase (games).');
    console.log('   Re-run with DRY_RUN=false to commit.\n');
  } else {
    await supabase.from('sync_metadata').upsert({
      last_sync_at: new Date().toISOString(),
      games_synced: totalUpserted,
      consoles_synced: consolesCount,
    });
    console.log('\n🏁 Done!\n');
  }
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
