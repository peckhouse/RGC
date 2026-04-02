/**
 * Standalone console sync: syncs only the consoles table from IGDB.
 * Use this when you've changed display names, platform_type, release_year, etc.
 * without needing to re-sync all games.
 *
 * Usage:
 *   npx tsx src/syncConsolesOnly.ts
 */

import dotenv from 'dotenv';
import {IGDBClient} from './igdbClient';
import {syncConsoles} from './syncConsoles';

dotenv.config();

async function main() {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET in .env');

  const igdb = new IGDBClient(clientId, clientSecret);
  await igdb.authenticate();
  console.log('✅ IGDB authenticated\n');

  const {count} = await syncConsoles(igdb);
  console.log(`\n✅ ${count} consoles synced`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
