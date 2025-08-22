import { supabase } from '../lib/supabase';

export async function handlePostAuth(router: any): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      // Navigate to a protected tab (adjust path if needed)
      router.replace('/(tabs)/history');
    }
  } catch (error) {
    console.error('Error handling post-auth:', error);
  }
}