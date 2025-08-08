// Re-export Order interface from supabase for consistency
export type { Order } from '@/lib/supabase';

export interface OrderDetailsParams {
  orderId?: string;
  isExistingOrder?: string; // String because route params are always strings
}