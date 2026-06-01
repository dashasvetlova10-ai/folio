export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      entries: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          content: string;
          mood: string | null;
          date: string;
          images: Array<{ url: string; size: string }>;
          blocks: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          content?: string;
          mood?: string | null;
          date: string;
          images?: Array<{ url: string; size: string }>;
          blocks?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          content?: string;
          mood?: string | null;
          date?: string;
          images?: Array<{ url: string; size: string }>;
          blocks?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: { id: string; user_id: string; title: string; messages: Json; created_at: string; updated_at: string; };
        Insert: { id?: string; user_id: string; title: string; messages?: Json; created_at?: string; updated_at?: string; };
        Update: { title?: string; messages?: Json; updated_at?: string; };
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          type: string;
          start_date: string;
          end_date: string;
          cover_color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          type?: string;
          start_date: string;
          end_date: string;
          cover_color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          type?: string;
          start_date?: string;
          end_date?: string;
          cover_color?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Entry = Database["public"]["Tables"]["entries"]["Row"];
export type EntryInsert = Database["public"]["Tables"]["entries"]["Insert"];
export type EntryUpdate = Database["public"]["Tables"]["entries"]["Update"];

export type Collection = Database["public"]["Tables"]["collections"]["Row"];
export type CollectionInsert = Database["public"]["Tables"]["collections"]["Insert"];
