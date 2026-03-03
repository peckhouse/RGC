/**
 * IGDB platform sync: fetches all non-cancelled PlayStation Vita games from IGDB
 * and upserts one DB row per (game × region) for EU / NA / JP whenever IGDB
 * has a regional release date for that combination.
 *
 * Usage:
 *   npx tsx src/syncVitaFromIGDB.ts              # dry-run (no DB writes)
 *   DRY_RUN=false npx tsx src/syncVitaFromIGDB.ts # upsert to Supabase
 *   LIMIT=50 npx tsx src/syncVitaFromIGDB.ts      # process only first 50
 */

import dotenv from 'dotenv';
import {IGDBClient, IGDBLocalization} from './igdbClient';
import {supabase} from './supabaseClient';

dotenv.config();

/** PlayStation Vita IGDB platform ID */
const PLATFORM_ID = 46;

type RegionCode = 'EU' | 'NA' | 'JP';
const IGDB_REGION_MAP: Record<number, RegionCode> = {1: 'EU', 2: 'NA', 5: 'JP'};
const BUCKET_IGDB_REGION: Record<RegionCode, number> = {EU: 1, NA: 2, JP: 5};
const RATE_LIMIT_MS = 260;
const LOC_BATCH_SIZE = 100;
const DRY_RUN = process.env.DRY_RUN !== 'false';
const LIMIT = parseInt(process.env.LIMIT ?? '0', 10);

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function pickCover(globalCover: string | undefined, localizations: IGDBLocalization[], targetRegionId: number): string | null {
  const exact = localizations.find(l => l.region === targetRegionId && l.cover?.image_id);
  if (exact?.cover?.image_id) return exact.cover.image_id;
  const any = localizations.find(l => l.cover?.image_id);
  if (any?.cover?.image_id) return any.cover.image_id;
  return globalCover ?? null;
}

async function main() {
  console.log('🎮 PlayStation Vita IGDB platform sync');
  console.log(`   Mode  : ${DRY_RUN ? 'DRY RUN (set DRY_RUN=false to write)' : 'LIVE'}`);
  if (LIMIT) console.log(`   Limit : first ${LIMIT} games`);
  console.log();

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET in .env');

  const igdb = new IGDBClient(clientId, clientSecret);
  await igdb.authenticate();
  console.log('✅ IGDB authenticated\n');

  type IGDBGame = Awaited<ReturnType<typeof igdb.fetchGamesByPlatform>>[number];
  const allGames: IGDBGame[] = [];
  const pageSize = 500;
  let offset = 0;

  console.log('📥 Fetching games from IGDB...');
  while (true) {
    const page = await igdb.fetchGamesByPlatform(PLATFORM_ID, offset, pageSize);
    allGames.push(...page);
    process.stdout.write(`   ${allGames.length} games so far...\r`);
    if (page.length < pageSize || (LIMIT && allGames.length >= LIMIT)) break;
    offset += pageSize;
    await sleep(RATE_LIMIT_MS);
  }
  const games = LIMIT ? allGames.slice(0, LIMIT) : allGames;
  console.log(`\n✅ ${games.length} games fetched from IGDB\n`);

  const gameIds = games.map(g => g.id);

  type RD = Awaited<ReturnType<typeof igdb.fetchReleaseDates>>[number];
  const rdMap = new Map<number, RD[]>();

  console.log('📅 Fetching release dates...');
  for (let i = 0; i < gameIds.length; i += LOC_BATCH_SIZE) {
    const rds = await igdb.fetchReleaseDates(gameIds.slice(i, i + LOC_BATCH_SIZE), PLATFORM_ID);
    for (const rd of rds) {
      if (rd.game == null) continue;
      if (!rdMap.has(rd.game)) rdMap.set(rd.game, []);
      rdMap.get(rd.game)!.push(rd);
    }
    if (i + LOC_BATCH_SIZE < gameIds.length) await sleep(RATE_LIMIT_MS);
  }
  console.log(`✅ Release dates fetched (${rdMap.size} games have Vita dates)\n`);

  const locMap = new Map<number, IGDBLocalization[]>();
  console.log('🌍 Fetching game localizations...');
  for (let i = 0; i < gameIds.length; i += LOC_BATCH_SIZE) {
    const locs = await igdb.fetchGameLocalizations(gameIds.slice(i, i + LOC_BATCH_SIZE));
    for (const loc of locs) {
      if (!locMap.has(loc.game)) locMap.set(loc.game, []);
      locMap.get(loc.game)!.push(loc);
    }
    if (i + LOC_BATCH_SIZE < gameIds.length) await sleep(RATE_LIMIT_MS);
  }
  console.log(`✅ Localizations fetched (${locMap.size} games have localizations)\n`);

  const toUpsert: object[] = [];
  let gamesWithNoRegion = 0;

  for (const game of games) {
    const locs = locMap.get(game.id) ?? [];
    const developer = game.involved_companies?.find(ic => ic.developer)?.company?.name ?? null;
    const publisher = game.involved_companies?.find(ic => ic.publisher)?.company?.name ?? null;
    const maxPlayers = game.multiplayer_modes?.reduce((max, mm) => Math.max(max, mm.offlinemax ?? 0, mm.onlinemax ?? 0), 0) || null;
    const regionDates = new Map<RegionCode, string | null>();

    for (const rd of rdMap.get(game.id) ?? []) {
      const code = IGDB_REGION_MAP[rd.release_region ?? -1];
      if (!code || regionDates.has(code)) continue;
      regionDates.set(code, rd.date ? new Date(rd.date * 1000).toISOString().split('T')[0] : null);
    }

    let regionCount = 0;
    for (const [regionCode, releaseDate] of regionDates) {
      regionCount++;
      toUpsert.push({
        igdb_id: game.id, region: regionCode, name: game.name, slug: game.slug,
        summary: game.summary ?? null,
        cover_url: pickCover(game.cover?.image_id, locs, BUCKET_IGDB_REGION[regionCode]),
        release_date: releaseDate,
        rating: game.rating != null ? Math.round(game.rating) / 10 : null,
        rating_count: game.rating_count ?? 0,
        genres: game.genres?.map(g => g.name) ?? [],
        platforms: game.platforms ?? [PLATFORM_ID],
        developer, publisher,
        screenshots: game.screenshots?.map(s => s.image_id) ?? [],
        max_players: maxPlayers,
        updated_at: new Date().toISOString(),
      });
    }
    if (regionCount === 0) gamesWithNoRegion++;
  }

  const euCount = toUpsert.filter((e: any) => e.region === 'EU').length;
  const naCount = toUpsert.filter((e: any) => e.region === 'NA').length;
  const jpCount = toUpsert.filter((e: any) => e.region === 'JP').length;

  console.log('─────────────────────────────────────────');
  console.log('📊 Results:');
  console.log(`   Games from IGDB          : ${games.length}`);
  console.log(`   Games with no region data: ${gamesWithNoRegion}`);
  console.log(`   Entries to upsert        : ${toUpsert.length}`);
  console.log(`     EU: ${euCount}   NA: ${naCount}   JP: ${jpCount}`);

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — nothing written to Supabase.');
    console.log('   Re-run with DRY_RUN=false to commit.\n');
    return;
  }

  console.log(`\n💾 Upserting ${toUpsert.length} entries to Supabase...`);
  const BATCH = 50;
  for (let i = 0; i < toUpsert.length; i += BATCH) {
    const batch = toUpsert.slice(i, i + BATCH);
    const {error} = await supabase.from('games').upsert(batch, {onConflict: 'igdb_id,region'});
    if (error) console.error(`  ❌ Batch ${Math.floor(i / BATCH) + 1} failed: ${error.message}`);
    else console.log(`  ✅ Batch ${Math.floor(i / BATCH) + 1}: ${batch.length} entries`);
  }
  console.log('\n🏁 Done!');
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
