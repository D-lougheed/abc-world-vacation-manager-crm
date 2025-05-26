export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string
          timestamp: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type: string
          timestamp?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string
          timestamp?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      booking_clients: {
        Row: {
          booking_id: string
          client_id: string
        }
        Insert: {
          booking_id: string
          client_id: string
        }
        Update: {
          booking_id?: string
          client_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_clients_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_files: {
        Row: {
          booking_id: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          uploaded_at: string
        }
        Insert: {
          booking_id: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          uploaded_at?: string
        }
        Update: {
          booking_id?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_tags: {
        Row: {
          booking_id: string
          tag_id: string
        }
        Insert: {
          booking_id: string
          tag_id: string
        }
        Update: {
          booking_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_tags_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          agent_id: string
          booking_status: Database["public"]["Enums"]["booking_status"]
          commission_amount: number
          commission_rate: number
          commission_status: Database["public"]["Enums"]["commission_status"]
          cost: number
          created_at: string
          end_date: string | null
          end_time: string | null
          id: string
          is_completed: boolean
          location: string
          notes: string | null
          rating: number | null
          service_type_id: string
          start_date: string
          start_time: string | null
          trip_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          agent_id: string
          booking_status?: Database["public"]["Enums"]["booking_status"]
          commission_amount: number
          commission_rate: number
          commission_status?: Database["public"]["Enums"]["commission_status"]
          cost: number
          created_at?: string
          end_date?: string | null
          end_time?: string | null
          id?: string
          is_completed?: boolean
          location: string
          notes?: string | null
          rating?: number | null
          service_type_id: string
          start_date: string
          start_time?: string | null
          trip_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          agent_id?: string
          booking_status?: Database["public"]["Enums"]["booking_status"]
          commission_amount?: number
          commission_rate?: number
          commission_status?: Database["public"]["Enums"]["commission_status"]
          cost?: number
          created_at?: string
          end_date?: string | null
          end_time?: string | null
          id?: string
          is_completed?: boolean
          location?: string
          notes?: string | null
          rating?: number | null
          service_type_id?: string
          start_date?: string
          start_time?: string | null
          trip_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          uploaded_at: string
        }
        Insert: {
          client_id: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          uploaded_at?: string
        }
        Update: {
          client_id?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          date_created: string
          first_name: string
          id: string
          last_name: string
          last_updated: string
          notes: string | null
        }
        Insert: {
          date_created?: string
          first_name: string
          id?: string
          last_name: string
          last_updated?: string
          notes?: string | null
        }
        Update: {
          date_created?: string
          first_name?: string
          id?: string
          last_name?: string
          last_updated?: string
          notes?: string | null
        }
        Relationships: []
      }
      helpful_links: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      service_type_tags: {
        Row: {
          service_type_id: string
          tag_id: string
        }
        Insert: {
          service_type_id: string
          tag_id: string
        }
        Update: {
          service_type_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_type_tags_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_type_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      trip_clients: {
        Row: {
          client_id: string
          trip_id: string
        }
        Insert: {
          client_id: string
          trip_id: string
        }
        Update: {
          client_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_clients_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_tags: {
        Row: {
          tag_id: string
          trip_id: string
        }
        Insert: {
          tag_id: string
          trip_id: string
        }
        Update: {
          tag_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_tags_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          agent_id: string | null
          created_at: string
          description: string | null
          end_date: string
          high_priority: boolean
          id: string
          name: string
          notes: string | null
          start_date: string
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          high_priority?: boolean
          id?: string
          name: string
          notes?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          high_priority?: boolean
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_files: {
        Row: {
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          uploaded_at: string
          vendor_id: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          uploaded_at?: string
          vendor_id: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          uploaded_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_files_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_service_types: {
        Row: {
          service_type_id: string
          vendor_id: string
        }
        Insert: {
          service_type_id: string
          vendor_id: string
        }
        Update: {
          service_type_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_service_types_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_service_types_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_tags: {
        Row: {
          tag_id: string
          vendor_id: string
        }
        Insert: {
          tag_id: string
          vendor_id: string
        }
        Update: {
          tag_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_tags_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string
          commission_rate: number
          contact_person: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
          price_range: number
          rating: number | null
          service_area: string
          updated_at: string
        }
        Insert: {
          address: string
          commission_rate: number
          contact_person: string
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          price_range: number
          rating?: number | null
          service_area: string
          updated_at?: string
        }
        Update: {
          address?: string
          commission_rate?: number
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          price_range?: number
          rating?: number | null
          service_area?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role: {
        Args: { required_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
    }
    Enums: {
      booking_status: "Pending" | "Confirmed" | "Canceled"
      commission_status: "Unreceived" | "Received" | "Canceled" | "Completed"
      trip_status: "Planned" | "Ongoing" | "Completed" | "Canceled"
      user_role: "SuperAdmin" | "Admin" | "Agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: ["Pending", "Confirmed", "Canceled"],
      commission_status: ["Unreceived", "Received", "Canceled", "Completed"],
      trip_status: ["Planned", "Ongoing", "Completed", "Canceled"],
      user_role: ["SuperAdmin", "Admin", "Agent"],
    },
  },
} as const
