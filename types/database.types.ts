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
          bio: string | null;
          terms_accepted_at: string | null;
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
          bio?: string | null;
          terms_accepted_at?: string | null;
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
          bio?: string | null;
          terms_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          last_seen?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      template_tags: {
        Row: {
          template_id: string;
          tag_id: string;
        };
        Insert: {
          template_id: string;
          tag_id: string;
        };
        Update: {
          template_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "template_tags_template_id_fkey";
            columns: ["template_id"];
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "template_tags_tag_id_fkey";
            columns: ["tag_id"];
            referencedRelation: "tags";
            referencedColumns: ["id"];
          }
        ];
      };
      template_favourites: {
        Row: {
          user_id: string;
          template_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          template_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          template_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "template_favourites_template_id_fkey";
            columns: ["template_id"];
            referencedRelation: "templates";
            referencedColumns: ["id"];
          }
        ];
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          fashion_code: string;
          armor_type: "light" | "medium" | "heavy";
          image_url: string | null;
          description: string | null;
          view_count: number;
          copy_count: number;
          favourite_count: number;
          created_at: string;
          updated_at: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          fashion_code: string;
          armor_type: "light" | "medium" | "heavy";
          image_url?: string | null;
          description?: string | null;
          view_count?: number;
          copy_count?: number;
          favourite_count?: number;
          created_at?: string;
          updated_at?: string;
          active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          fashion_code?: string;
          armor_type?: "light" | "medium" | "heavy";
          image_url?: string | null;
          description?: string | null;
          view_count?: number;
          copy_count?: number;
          favourite_count?: number;
          created_at?: string;
          updated_at?: string;
          active?: boolean;
        };
        Relationships: [];
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
      increment_copy_count: {
        Args: {
          template_id: string;
        };
        Returns: unknown;
      };
      increment_view_count: {
        Args: {
          template_id: string;
        };
        Returns: unknown;
      };
      update_templates_favourite_buckets: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
  };
}
