/**
 * Placeholder Database types for Supabase.
 * Replace with: supabase gen types typescript --project-id xxx > types/database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          discord_id: string | null;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          email: string | null;
          gw2_api_key: string | null;
          gw2_account_name: string | null;
          gw2_account_name_public: boolean;
          username_manually_set: boolean;
          created_at: string;
          updated_at: string;
          last_seen: string;
        };
        Insert: {
          id: string;
          discord_id?: string | null;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          gw2_api_key?: string | null;
          gw2_account_name?: string | null;
          gw2_account_name_public?: boolean;
          username_manually_set?: boolean;
          created_at?: string;
          updated_at?: string;
          last_seen?: string;
        };
        Update: {
          id?: string;
          discord_id?: string | null;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          gw2_api_key?: string | null;
          gw2_account_name?: string | null;
          gw2_account_name_public?: boolean;
          username_manually_set?: boolean;
          created_at?: string;
          updated_at?: string;
          last_seen?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      username_exists: {
        Args: {
          check_username: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
