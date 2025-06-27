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
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          plan: 'free' | 'starter' | 'pro' | 'enterprise'
          credits_total: number
          credits_used: number
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          credits_total?: number
          credits_used?: number
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'starter' | 'pro' | 'enterprise'
          credits_total?: number
          credits_used?: number
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      generation_sessions: {
        Row: {
          id: string
          user_id: string
          session_name: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          credits_used: number
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_name?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          credits_used?: number
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_name?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          credits_used?: number
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      generated_images: {
        Row: {
          id: string
          session_id: string
          user_id: string
          filename: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          prompt_text: string | null
          prompt_index: number | null
          platform: string | null
          size: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          filename: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          prompt_text?: string | null
          prompt_index?: number | null
          platform?: string | null
          size?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          filename?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          prompt_text?: string | null
          prompt_index?: number | null
          platform?: string | null
          size?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          action: string
          credits_used: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          action: string
          credits_used: number
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          action?: string
          credits_used?: number
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      user_statistics: {
        Row: {
          user_id: string
          username: string | null
          plan: 'free' | 'starter' | 'pro' | 'enterprise'
          credits_total: number
          credits_used: number
          credits_remaining: number
          total_sessions: number
          total_images_generated: number
          total_products_scanned: number
        }
      }
    }
    Functions: {
      check_user_credits: {
        Args: {
          user_id: string
          required_credits: number
        }
        Returns: boolean
      }
    }
    Enums: {
      user_plan: 'free' | 'starter' | 'pro' | 'enterprise'
      generation_status: 'pending' | 'processing' | 'completed' | 'failed'
    }
  }
}