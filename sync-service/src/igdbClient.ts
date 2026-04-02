import axios from 'axios';

export interface IGDBReleaseDate {
  id?: number;
  game?: number;          // IGDB game id (present when fetched from release_dates endpoint)
  date?: number;          // unix timestamp
  release_region?: number; // 1=EU, 2=NA, 5=JP … (replaces deprecated `region` field)
  platform?: number;      // IGDB platform id
}

export interface IGDBLocalization {
  id: number;
  game: number;      // IGDB game id
  region?: number;   // same enum as release_dates.region
  name?: string;     // localised title (e.g. Japanese script)
  cover?: {image_id: string};
}

interface IGDBGame {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  status?: number;   // 0=released, 6=cancelled …
  cover?: {image_id: string};
  first_release_date?: number;
  rating?: number;
  rating_count?: number;
  genres?: {name: string}[];
  platforms?: number[];
  involved_companies?: {
    company: {name: string};
    developer?: boolean;
    publisher?: boolean;
  }[];
  screenshots?: {image_id: string}[];
  keywords?: {name: string}[];
  release_dates?: IGDBReleaseDate[];
  multiplayer_modes?: {offlinemax?: number; onlinemax?: number}[];
}

interface IGDBPlatform {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  platform_logo?: {image_id: string};
  platform_family?: {name: string};
  generation?: number;
}

export class IGDBClient {
  private accessToken = '';

  constructor(
    private clientId: string,
    private clientSecret: string,
  ) {}

  async authenticate(): Promise<void> {
    const res = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`,
    );
    this.accessToken = res.data.access_token;
  }

  private headers() {
    return {
      'Client-ID': this.clientId,
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  async fetchPlatforms(offset = 0, limit = 500): Promise<IGDBPlatform[]> {
    const res = await axios.post(
      'https://api.igdb.com/v4/platforms',
      `fields id, name, slug, summary, platform_logo.image_id, platform_family.name, generation; where generation != null; limit ${limit}; offset ${offset}; sort id asc;`,
      {headers: this.headers()},
    );
    return res.data;
  }

  async fetchGames(offset = 0, limit = 500, platformIds?: number[]): Promise<IGDBGame[]> {
    const platformClause = platformIds?.length
      ? `& platforms = (${platformIds.join(',')})`
      : '';
    const res = await axios.post(
      'https://api.igdb.com/v4/games',
      `fields id, name, slug, summary, cover.image_id, first_release_date, rating, rating_count,
       genres.name, platforms, involved_companies.company.name, screenshots.image_id;
       where rating_count > 2 & version_parent = null & (category = null | category != (1,2,3,5,6,7)) ${platformClause};
       limit ${limit}; offset ${offset}; sort id asc;`,
      {headers: this.headers()},
    );
    return res.data;
  }

  /**
   * Search IGDB by game name + platform ID using IGDB's fuzzy search.
   * Returns up to `limit` candidates ranked by relevance.
   * The caller is responsible for picking the best match.
   */
  async searchGame(name: string, platformId: number, limit = 5): Promise<IGDBGame[]> {
    const escaped = name.replace(/"/g, '\\"');
    const res = await axios.post(
      'https://api.igdb.com/v4/games',
      `search "${escaped}";
       fields id, name, slug, summary, cover.image_id, first_release_date, rating, rating_count,
              genres.name, platforms, involved_companies.company.name, screenshots.image_id;
       where platforms = (${platformId}) & version_parent = null;
       limit ${limit};`,
      {headers: this.headers()},
    );
    return res.data;
  }

  /**
   * Fetch all non-cancelled games for a given platform, paginated.
   * Returns up to `limit` results starting at `offset`.
   */
  async fetchGamesByPlatform(
    platformId: number,
    offset = 0,
    limit = 500,
  ): Promise<IGDBGame[]> {
    const res = await axios.post(
      'https://api.igdb.com/v4/games',
      `fields id, name, slug, summary, status, cover.image_id,
              first_release_date,
              rating, rating_count, genres.name, platforms,
              involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
              screenshots.image_id, keywords.name,
              multiplayer_modes.offlinemax, multiplayer_modes.onlinemax;
       where platforms = (${platformId}) & version_parent = null & (status = null | status != 6);
       sort id asc;
       limit ${limit};
       offset ${offset};`,
      {headers: this.headers()},
    );
    return res.data;
  }

  /**
   * Fetch release dates for a batch of IGDB game IDs, filtered to a specific platform.
   * Returns clean integer fields — more reliable than inline release_dates expansion.
   */
  async fetchReleaseDates(
    gameIds: number[],
    platformId: number,
  ): Promise<IGDBReleaseDate[]> {
    if (!gameIds.length) return [];
    const res = await axios.post(
      'https://api.igdb.com/v4/release_dates',
      `fields id, game, date, release_region, platform;
       where game = (${gameIds.join(',')}) & platform = ${platformId};
       limit 500;`,
      {headers: this.headers()},
    );
    return res.data;
  }

  /**
   * Fetch game_localizations for a batch of IGDB game IDs.
   * Used to get region-specific cover art.
   */
  async fetchGameLocalizations(gameIds: number[]): Promise<IGDBLocalization[]> {
    if (!gameIds.length) return [];
    const res = await axios.post(
      'https://api.igdb.com/v4/game_localizations',
      `fields id, game, region, name, cover.image_id;
       where game = (${gameIds.join(',')});
       limit 500;`,
      {headers: this.headers()},
    );
    return res.data;
  }
}
