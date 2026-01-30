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
          id: string
          created_at: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      income_verifications: {
        Row: {
          id: string
          session_id: string | null
          user_id: string | null
          individual_name: string
          individual_email: string
          verification_token: string
          status: 'pending' | 'in_progress' | 'completed' | 'expired' | 'failed' | 'canceled'
          plaid_access_token: string | null
          plaid_item_id: string | null
          report_data: Json | null
          raw_plaid_data: Json | null
          created_at: string
          updated_at: string
          expires_at: string
          completed_at: string | null
          requested_by_name: string | null
          requested_by_email: string | null
          purpose: string | null
          retention_expires_at: string | null
          request_id: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          user_id?: string | null
          individual_name: string
          individual_email: string
          verification_token?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'expired' | 'failed' | 'canceled'
          plaid_access_token?: string | null
          plaid_item_id?: string | null
          report_data?: Json | null
          raw_plaid_data?: Json | null
          created_at?: string
          updated_at?: string
          expires_at?: string
          completed_at?: string | null
          requested_by_name?: string | null
          requested_by_email?: string | null
          purpose?: string | null
          retention_expires_at?: string | null
          request_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          user_id?: string | null
          individual_name?: string
          individual_email?: string
          verification_token?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'expired' | 'failed' | 'canceled'
          plaid_access_token?: string | null
          plaid_item_id?: string | null
          report_data?: Json | null
          raw_plaid_data?: Json | null
          created_at?: string
          updated_at?: string
          expires_at?: string
          completed_at?: string | null
          requested_by_name?: string | null
          requested_by_email?: string | null
          purpose?: string | null
          retention_expires_at?: string | null
          request_id?: string | null
        }
        Relationships: []
      }
      meter_events: {
        Row: {
          id: string
          user_id: string
          verification_id: string
          stripe_event_id: string | null
          meter_id: string | null
          event_name: string
          value: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          verification_id: string
          stripe_event_id?: string | null
          meter_id?: string | null
          event_name?: string
          value?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          verification_id?: string
          stripe_event_id?: string | null
          meter_id?: string | null
          event_name?: string
          value?: number
          created_at?: string
        }
        Relationships: []
      }
      one_time_payments: {
        Row: {
          id: string
          user_id: string
          stripe_checkout_session_id: string
          stripe_payment_intent_id: string | null
          amount: number
          status: 'pending' | 'completed' | 'failed'
          verification_id: string | null
          created_at: string
          completed_at: string | null
          used_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          stripe_checkout_session_id: string
          stripe_payment_intent_id?: string | null
          amount: number
          status: 'pending' | 'completed' | 'failed'
          verification_id?: string | null
          created_at?: string
          completed_at?: string | null
          used_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          stripe_checkout_session_id?: string
          stripe_payment_intent_id?: string | null
          amount?: number
          status?: 'pending' | 'completed' | 'failed'
          verification_id?: string | null
          created_at?: string
          completed_at?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          id: string
          stripe_customer_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          stripe_customer_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stripe_customer_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_usage_price_id: string | null
          status: string
          plan_tier: 'starter' | 'pro' | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_usage_price_id?: string | null
          status: string
          plan_tier?: 'starter' | 'pro' | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_usage_price_id?: string | null
          status?: string
          plan_tier?: 'starter' | 'pro' | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      teller_webhook_events: {
        Row: {
          id: string
          event_id: string
          event_type: string
          enrollment_id: string | null
          account_id: string | null
          event_data: Json
          full_payload: Json
          received_at: string
          event_timestamp: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          event_type: string
          enrollment_id?: string | null
          account_id?: string | null
          event_data: Json
          full_payload: Json
          received_at?: string
          event_timestamp?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          event_type?: string
          enrollment_id?: string | null
          account_id?: string | null
          event_data?: Json
          full_payload?: Json
          received_at?: string
          event_timestamp?: string | null
          created_at?: string
        }
        Relationships: []
      }
      usage_ledger: {
        Row: {
          id: string
          user_id: string
          verification_id: string
          source: 'subscription' | 'payg'
          stripe_subscription_id: string | null
          one_time_payment_id: string | null
          period_start: string | null
          period_end: string | null
          reversed_at: string | null
          reversal_reason: string | null
          reversal_metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          verification_id: string
          source: 'subscription' | 'payg'
          stripe_subscription_id?: string | null
          one_time_payment_id?: string | null
          period_start?: string | null
          period_end?: string | null
          reversed_at?: string | null
          reversal_reason?: string | null
          reversal_metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          verification_id?: string
          source?: 'subscription' | 'payg'
          stripe_subscription_id?: string | null
          one_time_payment_id?: string | null
          period_start?: string | null
          period_end?: string | null
          reversed_at?: string | null
          reversal_reason?: string | null
          reversal_metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          company_name: string | null
          first_name: string | null
          last_name: string | null
          industry: string | null
          ref: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          company_name?: string | null
          first_name?: string | null
          last_name?: string | null
          industry?: string | null
          ref?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          company_name?: string | null
          first_name?: string | null
          last_name?: string | null
          industry?: string | null
          ref?: string | null
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      verification_status: 'pending' | 'in_progress' | 'completed' | 'expired' | 'failed' | 'canceled'
      usage_source: 'subscription' | 'payg'
    }
  }
}

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never
