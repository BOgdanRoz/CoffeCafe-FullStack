// Hand-written database types for the public schema. Keep in sync with supabase/migrations.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type BlockKind = 'occupied' | 'unavailable';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; role: 'owner' | 'customer'; created_at: string };
        Insert: { id: string; display_name?: string | null; role?: 'owner' | 'customer'; created_at?: string };
        Update: { display_name?: string | null; role?: 'owner' | 'customer' };
        Relationships: [];
      };
      cafe_tables: {
        Row: { id: string; name: string; capacity: number; is_active: boolean; sort_order: number; created_at: string };
        Insert: { id?: string; name: string; capacity: number; is_active?: boolean; sort_order?: number; created_at?: string };
        Update: { name?: string; capacity?: number; is_active?: boolean; sort_order?: number };
        Relationships: [];
      };
      opening_hours: {
        Row: { weekday: number; is_closed: boolean; opens_at: string | null; closes_at: string | null };
        Insert: { weekday: number; is_closed?: boolean; opens_at?: string | null; closes_at?: string | null };
        Update: { is_closed?: boolean; opens_at?: string | null; closes_at?: string | null };
        Relationships: [];
      };
      booking_settings: {
        Row: {
          id: number;
          slot_minutes: number;
          visit_minutes: number;
          first_slot: string;
          last_slot: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          slot_minutes?: number;
          visit_minutes?: number;
          first_slot?: string;
          last_slot?: string;
          updated_at?: string;
        };
        Update: { slot_minutes?: number; visit_minutes?: number; first_slot?: string; last_slot?: string };
        Relationships: [];
      };
      table_availability_blocks: {
        Row: {
          id: string;
          table_id: string;
          block_date: string;
          starts_at: string;
          ends_at: string;
          kind: BlockKind;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          block_date: string;
          starts_at: string;
          ends_at: string;
          kind: BlockKind;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: { kind?: BlockKind; note?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_availability: { Args: { p_date: string }; Returns: Json };
      is_owner: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
