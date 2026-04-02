// Supabase generated types — update this file by running:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts

export interface Database {
  public: {
    Tables: {
      consoles: {
        Row: Console;
        Insert: Omit<Console, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Console, 'id'>>;
        Relationships: [];
      };
      games: {
        Row: Game;
        Insert: Omit<Game, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Game, 'id'>>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
        Relationships: [];
      };
      user_collections: {
        Row: UserCollection;
        Insert: {
          user_id: string;
          game_id: number;
          console_id: number;
          acquired_date?: string;
          condition?: UserCollection['condition'];
          notes?: string | null;
        };
        Update: Partial<Omit<UserCollection, 'id'>>;
        Relationships: [];
      };
      user_wishlists: {
        Row: UserWishlist;
        Insert: Omit<UserWishlist, 'id' | 'created_at'>;
        Update: Partial<Omit<UserWishlist, 'id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface Console {
  id: number;
  name: string;
  slug: string;
  summary: string | null;
  manufacturer: string | null;
  platform_type: 'home' | 'handheld' | null;
  release_year: number | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Game {
  /** Serial DB primary key (unique per region variant). */
  id: number;
  /** IGDB game ID — shared across EU/NA/JP rows for the same game. */
  igdb_id: number;
  /** IGDB platform ID — identifies which console this row belongs to. */
  platform_id: number;
  /** Regional variant: one row per region that has an IGDB release date. */
  region: 'EU' | 'NA' | 'JP';
  name: string;
  slug: string;
  summary: string | null;
  /** Region-specific cover art image_id (IGDB). */
  cover_url: string | null;
  /** Region-specific release date. */
  release_date: string | null;
  rating: number | null;
  rating_count: number;
  genres: string[];
  platforms: number[];
  developer: string | null;
  publisher: string | null;
  screenshots: string[];
  max_players: number | null;
  /** Market price for loose copy (cents USD). NULL until price sync runs. */
  price_loose: number | null;
  /** Market price for complete-in-box copy (cents USD). NULL until price sync runs. */
  price_complete: number | null;
  /** Market price for sealed/new copy (cents USD). NULL until price sync runs. */
  price_new: number | null;
  /** Market price for box-only copy (cents USD). NULL until price sync runs. */
  price_box_only: number | null;
  /** When prices were last synced from eBay. */
  price_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'lifetime';
  subscription_expires_at: string | null;
  subscription_platform: 'ios' | 'android' | null;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
}

export interface UserCollection {
  id: string;
  user_id: string;
  game_id: number;
  console_id: number;
  acquired_date: string;
  condition: 'loose' | 'inbox' | 'complete' | null;
  notes: string | null;
  created_at: string;
}

export interface UserWishlist {
  id: string;
  user_id: string;
  game_id: number;
  console_id: number;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
}
