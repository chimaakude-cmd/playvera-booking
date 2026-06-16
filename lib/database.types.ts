/**
 * Supabase database types for Activora.
 *
 * Hand-maintained to match supabase/migrations/00001_activora_schema.sql
 * Regenerate after schema changes:
 *   npx supabase gen types typescript --project-id <id> > lib/database.types.ts
 */
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
      providers: {
        Row: {
          id: string;
          auth_user_id: string | null;
          name: string;
          slug: string | null;
          email: string | null;
          phone: string | null;
          location: string | null;
          stripe_account_id: string | null;
          stripe_connect_status: string;
          stripe_charges_enabled: boolean;
          stripe_payouts_enabled: boolean;
          stripe_details_submitted: boolean;
          stripe_disabled_reason: string | null;
          stripe_requirements_due: Json;
          stripe_connected_at: string | null;
          gocardless_status: string;
          gocardless_organisation_id: string | null;
          gocardless_merchant_id: string | null;
          gocardless_connected_at: string | null;
          preferred_payment_provider: string;
          payment_method_stripe_card: boolean;
          payment_method_gocardless_dd: boolean;
          payment_method_manual_invoice: boolean;
          account_status: string;
          platform_fee_percent: number;
          fee_handling: Database["public"]["Enums"]["fee_handling"];
          organisation_type: string;
          parent_provider_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          name: string;
          slug?: string | null;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          stripe_account_id?: string | null;
          stripe_connect_status?: string;
          stripe_charges_enabled?: boolean;
          stripe_payouts_enabled?: boolean;
          stripe_details_submitted?: boolean;
          stripe_disabled_reason?: string | null;
          stripe_requirements_due?: Json;
          stripe_connected_at?: string | null;
          gocardless_status?: string;
          gocardless_organisation_id?: string | null;
          gocardless_merchant_id?: string | null;
          gocardless_connected_at?: string | null;
          preferred_payment_provider?: string;
          payment_method_stripe_card?: boolean;
          payment_method_gocardless_dd?: boolean;
          payment_method_manual_invoice?: boolean;
          account_status?: string;
          platform_fee_percent?: number;
          fee_handling?: Database["public"]["Enums"]["fee_handling"];
          organisation_type?: string;
          parent_provider_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          name?: string;
          slug?: string | null;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          stripe_account_id?: string | null;
          stripe_connect_status?: string;
          stripe_charges_enabled?: boolean;
          stripe_payouts_enabled?: boolean;
          stripe_details_submitted?: boolean;
          stripe_disabled_reason?: string | null;
          stripe_requirements_due?: Json;
          stripe_connected_at?: string | null;
          gocardless_status?: string;
          gocardless_organisation_id?: string | null;
          gocardless_merchant_id?: string | null;
          gocardless_connected_at?: string | null;
          preferred_payment_provider?: string;
          payment_method_stripe_card?: boolean;
          payment_method_gocardless_dd?: boolean;
          payment_method_manual_invoice?: boolean;
          account_status?: string;
          platform_fee_percent?: number;
          fee_handling?: Database["public"]["Enums"]["fee_handling"];
          organisation_type?: string;
          parent_provider_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "providers_parent_provider_id_fkey";
            columns: ["parent_provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_venues: {
        Row: {
          id: string;
          provider_id: string;
          venue_name: string;
          address_line_1: string;
          address_line_2: string;
          town_city: string;
          postcode: string;
          location_notes: string;
          latitude: number;
          longitude: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          venue_name?: string;
          address_line_1?: string;
          address_line_2?: string;
          town_city?: string;
          postcode?: string;
          location_notes?: string;
          latitude: number;
          longitude: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          venue_name?: string;
          address_line_1?: string;
          address_line_2?: string;
          town_city?: string;
          postcode?: string;
          location_notes?: string;
          latitude?: number;
          longitude?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "provider_venues_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
      club_profiles: {
        Row: {
          id: string;
          provider_id: string;
          logo_url: string | null;
          cover_image_url: string | null;
          club_name: string;
          tagline: string;
          short_description: string;
          established_year: number | null;
          verified: boolean;
          contact: Json;
          social_links: Json;
          verification_status: Database["public"]["Enums"]["club_verification_status"];
          long_description: string;
          unique_selling_points: string;
          categories: Json;
          age_ranges: Json;
          accessibility_options: Json;
          website: string;
          instagram: string;
          facebook: string;
          tiktok: string;
          whatsapp: string;
          email: string;
          phone: string;
          branding: Json;
          customer_view: Json;
          media_gallery: Json;
          public_slug: string | null;
          meta_title: string;
          meta_description: string;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          logo_url?: string | null;
          cover_image_url?: string | null;
          club_name?: string;
          tagline?: string;
          short_description?: string;
          established_year?: number | null;
          verified?: boolean;
          contact?: Json;
          social_links?: Json;
          verification_status?: Database["public"]["Enums"]["club_verification_status"];
          long_description?: string;
          unique_selling_points?: string;
          categories?: Json;
          age_ranges?: Json;
          accessibility_options?: Json;
          website?: string;
          instagram?: string;
          facebook?: string;
          tiktok?: string;
          whatsapp?: string;
          email?: string;
          phone?: string;
          branding?: Json;
          customer_view?: Json;
          media_gallery?: Json;
          public_slug?: string | null;
          meta_title?: string;
          meta_description?: string;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          logo_url?: string | null;
          cover_image_url?: string | null;
          club_name?: string;
          tagline?: string;
          short_description?: string;
          established_year?: number | null;
          verified?: boolean;
          contact?: Json;
          social_links?: Json;
          verification_status?: Database["public"]["Enums"]["club_verification_status"];
          long_description?: string;
          unique_selling_points?: string;
          categories?: Json;
          age_ranges?: Json;
          accessibility_options?: Json;
          website?: string;
          instagram?: string;
          facebook?: string;
          tiktok?: string;
          whatsapp?: string;
          email?: string;
          phone?: string;
          branding?: Json;
          customer_view?: Json;
          media_gallery?: Json;
          public_slug?: string | null;
          meta_title?: string;
          meta_description?: string;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_profiles_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: true;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_subscriptions: {
        Row: {
          id: string;
          provider_id: string;
          plan: string;
          gocardless_customer_id: string | null;
          mandate_id: string | null;
          subscription_id: string | null;
          status: string;
          next_billing_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          plan?: string;
          gocardless_customer_id?: string | null;
          mandate_id?: string | null;
          subscription_id?: string | null;
          status?: string;
          next_billing_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          plan?: string;
          gocardless_customer_id?: string | null;
          mandate_id?: string | null;
          subscription_id?: string | null;
          status?: string;
          next_billing_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "provider_subscriptions_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: true;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
      club_team_members: {
        Row: {
          id: string;
          provider_id: string;
          auth_user_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          role: Database["public"]["Enums"]["club_team_role"];
          status: Database["public"]["Enums"]["club_team_member_status"];
          is_owner: boolean;
          last_active_at: string | null;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          auth_user_id?: string | null;
          first_name?: string;
          last_name?: string;
          email: string;
          role?: Database["public"]["Enums"]["club_team_role"];
          status?: Database["public"]["Enums"]["club_team_member_status"];
          is_owner?: boolean;
          last_active_at?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          auth_user_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string;
          role?: Database["public"]["Enums"]["club_team_role"];
          status?: Database["public"]["Enums"]["club_team_member_status"];
          is_owner?: boolean;
          last_active_at?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_team_members_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
      club_profile_locations: {
        Row: {
          id: string;
          club_profile_id: string;
          venue_name: string;
          address_line_1: string;
          address_line_2: string;
          town_city: string;
          postcode: string;
          latitude: number;
          longitude: number;
          radius_miles: number;
          is_main: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_profile_id: string;
          venue_name?: string;
          address_line_1?: string;
          address_line_2?: string;
          town_city?: string;
          postcode?: string;
          latitude?: number;
          longitude?: number;
          radius_miles?: number;
          is_main?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_profile_id?: string;
          venue_name?: string;
          address_line_1?: string;
          address_line_2?: string;
          town_city?: string;
          postcode?: string;
          latitude?: number;
          longitude?: number;
          radius_miles?: number;
          is_main?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_profile_locations_club_profile_id_fkey";
            columns: ["club_profile_id"];
            isOneToOne: false;
            referencedRelation: "club_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      parent_profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          full_name: string;
          email: string;
          phone: string;
          emergency_contact: string;
          relationship_to_child: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          full_name?: string;
          email?: string;
          phone?: string;
          emergency_contact?: string;
          relationship_to_child?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          full_name?: string;
          email?: string;
          phone?: string;
          emergency_contact?: string;
          relationship_to_child?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          parent_profile_id: string;
          full_name: string;
          date_of_birth: string;
          medical_conditions: string;
          sen_needs: string;
          allergies: string;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          medical_reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_profile_id: string;
          full_name: string;
          date_of_birth: string;
          medical_conditions?: string;
          sen_needs?: string;
          allergies?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          medical_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_profile_id?: string;
          full_name?: string;
          date_of_birth?: string;
          medical_conditions?: string;
          sen_needs?: string;
          allergies?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          medical_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "children_parent_profile_id_fkey";
            columns: ["parent_profile_id"];
            isOneToOne: false;
            referencedRelation: "parent_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          id: string;
          provider_id: string;
          session_title: string;
          description: string;
          activity_type: string;
          location: string;
          venue_name: string;
          address_line_1: string;
          address_line_2: string;
          town_city: string;
          postcode: string;
          location_notes: string;
          latitude: number | null;
          longitude: number | null;
          provider_venue_id: string | null;
          age_range: string;
          attendee_criteria: Json;
          booking_type: Database["public"]["Enums"]["session_booking_type"];
          schedule_config: Json;
          images: Json;
          parents_bring: string;
          club_provides: string;
          confirmation_email: Json;
          default_capacity: number;
          day: string;
          start_time: string;
          end_time: string;
          price: number;
          capacity: number;
          platform_fee_percent: number;
          bookings_count: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          session_title: string;
          description?: string;
          activity_type?: string;
          location?: string;
          venue_name?: string;
          address_line_1?: string;
          address_line_2?: string;
          town_city?: string;
          postcode?: string;
          location_notes?: string;
          latitude?: number | null;
          longitude?: number | null;
          provider_venue_id?: string | null;
          age_range?: string;
          attendee_criteria?: Json;
          booking_type?: Database["public"]["Enums"]["session_booking_type"];
          schedule_config?: Json;
          images?: Json;
          parents_bring?: string;
          club_provides?: string;
          confirmation_email?: Json;
          default_capacity?: number;
          day?: string;
          start_time?: string;
          end_time?: string;
          price?: number;
          capacity?: number;
          platform_fee_percent?: number;
          bookings_count?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          session_title?: string;
          description?: string;
          activity_type?: string;
          location?: string;
          venue_name?: string;
          address_line_1?: string;
          address_line_2?: string;
          town_city?: string;
          postcode?: string;
          location_notes?: string;
          latitude?: number | null;
          longitude?: number | null;
          provider_venue_id?: string | null;
          age_range?: string;
          attendee_criteria?: Json;
          booking_type?: Database["public"]["Enums"]["session_booking_type"];
          schedule_config?: Json;
          images?: Json;
          parents_bring?: string;
          club_provides?: string;
          confirmation_email?: Json;
          default_capacity?: number;
          day?: string;
          start_time?: string;
          end_time?: string;
          price?: number;
          capacity?: number;
          platform_fee_percent?: number;
          bookings_count?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
      session_dates: {
        Row: {
          id: string;
          session_id: string;
          session_date: string;
          start_time: string;
          end_time: string;
          capacity: number;
          cancelled: boolean;
          bookings_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          session_date: string;
          start_time: string;
          end_time: string;
          capacity: number;
          cancelled?: boolean;
          bookings_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          session_date?: string;
          start_time?: string;
          end_time?: string;
          capacity?: number;
          cancelled?: boolean;
          bookings_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_dates_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      tickets: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          description: string;
          ticket_type: Database["public"]["Enums"]["ticket_type"];
          price: number;
          low_spaces_trigger: boolean;
          recent_booking_flag: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          description?: string;
          ticket_type?: Database["public"]["Enums"]["ticket_type"];
          price?: number;
          low_spaces_trigger?: boolean;
          recent_booking_flag?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          description?: string;
          ticket_type?: Database["public"]["Enums"]["ticket_type"];
          price?: number;
          low_spaces_trigger?: boolean;
          recent_booking_flag?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          session_id: string;
          session_date_id: string | null;
          ticket_id: string | null;
          parent_profile_id: string | null;
          child_id: string | null;
          session_title: string;
          provider_name: string;
          day: string;
          start_time: string | null;
          end_time: string | null;
          price_paid: number;
          parent_name: string;
          email: string;
          child_name: string;
          child_age: number | null;
          emergency_contact: string;
          status: Database["public"]["Enums"]["booking_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          session_date_id?: string | null;
          ticket_id?: string | null;
          parent_profile_id?: string | null;
          child_id?: string | null;
          session_title: string;
          provider_name?: string;
          day?: string;
          start_time?: string | null;
          end_time?: string | null;
          price_paid?: number;
          parent_name: string;
          email: string;
          child_name: string;
          child_age?: number | null;
          emergency_contact?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          session_date_id?: string | null;
          ticket_id?: string | null;
          parent_profile_id?: string | null;
          child_id?: string | null;
          session_title?: string;
          provider_name?: string;
          day?: string;
          start_time?: string | null;
          end_time?: string | null;
          price_paid?: number;
          parent_name?: string;
          email?: string;
          child_name?: string;
          child_age?: number | null;
          emergency_contact?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_session_date_id_fkey";
            columns: ["session_date_id"];
            isOneToOne: false;
            referencedRelation: "session_dates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_parent_profile_id_fkey";
            columns: ["parent_profile_id"];
            isOneToOne: false;
            referencedRelation: "parent_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      session_booking_type: "individual" | "block" | "subscription";
      ticket_type:
        | "free"
        | "per_session"
        | "block_price"
        | "free_trial"
        | "subscription_placeholder";
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "refund_requested";
      fee_handling: "provider_absorbs" | "fees_on_top";
      club_verification_status:
        | "unverified"
        | "verified"
        | "premium_verified";
      club_team_role: "coach" | "administrator" | "manager" | "owner";
      club_team_member_status: "active" | "pending";
    };
    CompositeTypes: Record<string, never>;
  };
};
