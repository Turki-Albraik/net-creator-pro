export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      employees: {
        Row: {
          created_at: string
          email: string | null
          employee_id: string
          id: string
          name: string
          password: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          employee_id: string
          id?: string
          name: string
          password: string
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          employee_id?: string
          id?: string
          name?: string
          password?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      passengers: {
        Row: {
          created_at: string
          email: string | null
          email_verified: boolean
          id: string
          name: string
          password: string | null
          phone: string | null
          total_spent: number
          trips: number
          verification_token: string | null
          verification_token_expires_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_verified?: boolean
          id?: string
          name: string
          password?: string | null
          phone?: string | null
          total_spent?: number
          trips?: number
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          email_verified?: boolean
          id?: string
          name?: string
          password?: string | null
          phone?: string | null
          total_spent?: number
          trips?: number
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          booked_by: string | null
          booking_id: string
          created_at: string
          id: string
          num_tickets: number
          passenger_email: string | null
          passenger_name: string
          passenger_phone: string | null
          route_id: string
          seat_numbers: string[]
          status: string
          total_amount: number
          travel_date: string
        }
        Insert: {
          booked_by?: string | null
          booking_id: string
          created_at?: string
          id?: string
          num_tickets?: number
          passenger_email?: string | null
          passenger_name: string
          passenger_phone?: string | null
          route_id: string
          seat_numbers: string[]
          status?: string
          total_amount: number
          travel_date: string
        }
        Update: {
          booked_by?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          num_tickets?: number
          passenger_email?: string | null
          passenger_name?: string
          passenger_phone?: string | null
          route_id?: string
          seat_numbers?: string[]
          status?: string
          total_amount?: number
          travel_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "train_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      train_routes: {
        Row: {
          arrival_time: string
          created_at: string
          departure_time: string
          destination: string
          distance_km: number
          id: string
          price_per_ticket: number
          source: string
          status: string
          total_seats: number
          train_id: string
        }
        Insert: {
          arrival_time: string
          created_at?: string
          departure_time: string
          destination: string
          distance_km: number
          id?: string
          price_per_ticket: number
          source: string
          status?: string
          total_seats?: number
          train_id: string
        }
        Update: {
          arrival_time?: string
          created_at?: string
          departure_time?: string
          destination?: string
          distance_km?: number
          id?: string
          price_per_ticket?: number
          source?: string
          status?: string
          total_seats?: number
          train_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
