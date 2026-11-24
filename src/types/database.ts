export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          default_currency: string;
          locale: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          default_currency?: string;
          locale?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          kind: Database["public"]["Enums"]["group_kind"];
          currency: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          kind?: Database["public"]["Enums"]["group_kind"];
          currency?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["group_role"];
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["group_role"];
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_members"]["Insert"]>;
        Relationships: [];
      };
      group_invitations: {
        Row: {
          id: string;
          group_id: string;
          email: string | null;
          token_hash: string;
          role: Database["public"]["Enums"]["group_role"];
          status: Database["public"]["Enums"]["invitation_status"];
          invited_by: string;
          accepted_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          email?: string | null;
          token_hash: string;
          role?: Database["public"]["Enums"]["group_role"];
          status?: Database["public"]["Enums"]["invitation_status"];
          invited_by: string;
          accepted_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_invitations"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          owner_id: string | null;
          group_id: string | null;
          created_by: string;
          paid_by: string | null;
          kind: Database["public"]["Enums"]["transaction_kind"];
          title: string;
          category: string;
          amount_cents: number;
          currency: string;
          notes: string | null;
          occurred_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          group_id?: string | null;
          created_by: string;
          paid_by?: string | null;
          kind: Database["public"]["Enums"]["transaction_kind"];
          title: string;
          category: string;
          amount_cents: number;
          currency?: string;
          notes?: string | null;
          occurred_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      expense_splits: {
        Row: {
          transaction_id: string;
          user_id: string;
          amount_cents: number;
          created_at: string;
        };
        Insert: {
          transaction_id: string;
          user_id: string;
          amount_cents: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expense_splits"]["Insert"]>;
        Relationships: [];
      };
      settlements: {
        Row: {
          id: string;
          group_id: string;
          payer_id: string;
          payee_id: string;
          amount_cents: number;
          currency: string;
          note: string | null;
          settled_at: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          payer_id: string;
          payee_id: string;
          amount_cents: number;
          currency?: string;
          note?: string | null;
          settled_at?: string;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settlements"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      group_member_balances: {
        Row: {
          group_id: string | null;
          user_id: string | null;
          currency: string | null;
          balance_cents: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_group_invitation: {
        Args: { p_token: string };
        Returns: string;
      };
      create_shared_expense: {
        Args: {
          p_group_id: string;
          p_title: string;
          p_category: string;
          p_amount_cents: number;
          p_paid_by: string;
          p_splits: Json;
          p_occurred_at?: string;
          p_notes?: string | null;
          p_client_id?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      group_kind: "household" | "trip" | "friends" | "other";
      group_role: "owner" | "admin" | "member";
      invitation_status: "pending" | "accepted" | "revoked" | "expired";
      transaction_kind: "income" | "expense";
    };
    CompositeTypes: Record<never, never>;
  };
};
