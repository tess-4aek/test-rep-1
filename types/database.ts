export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          kyc_status?: boolean;
          bank_details_status?: boolean;
          bank_full_name?: string;
          bank_iban?: string;
          bank_swift_bic?: string;
          bank_name?: string;
          bank_country?: string;
          monthly_limit?: number;
          daily_limit?: number;
          monthly_limit_used?: number;
          daily_limit_used?: number;
          limit_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          kyc_status?: boolean;
          bank_details_status?: boolean;
          bank_full_name?: string;
          bank_iban?: string;
          bank_swift_bic?: string;
          bank_name?: string;
          bank_country?: string;
          monthly_limit?: number;
          daily_limit?: number;
          monthly_limit_used?: number;
          daily_limit_used?: number;
          limit_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          kyc_status?: boolean;
          bank_details_status?: boolean;
          bank_full_name?: string;
          bank_iban?: string;
          bank_swift_bic?: string;
          bank_name?: string;
          bank_country?: string;
          monthly_limit?: number;
          daily_limit?: number;
          monthly_limit_used?: number;
          daily_limit_used?: number;
          limit_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id?: string;
          usdc_amount?: number;
          eur_amount?: number;
          direction?: string;
          exchange_rate?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          usdc_amount?: number;
          eur_amount?: number;
          direction?: string;
          exchange_rate?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          usdc_amount?: number;
          eur_amount?: number;
          direction?: string;
          exchange_rate?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}