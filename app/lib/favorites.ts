import { supabase } from "@/integrations/supabase/client";

export async function isProviderFavorite(
  userId: string,
  providerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("provider_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("provider_id", providerId)
    .limit(1);
  if (error) throw error;
  return ((data ?? []) as { id: string }[]).length > 0;
}

export async function addFavorite(userId: string, providerId: string): Promise<void> {
  const { error } = await supabase
    .from("provider_favorites")
    .insert({ user_id: userId, provider_id: providerId });
  if (error) throw error;
}

export async function removeFavorite(userId: string, providerId: string): Promise<void> {
  const { error } = await supabase
    .from("provider_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("provider_id", providerId);
  if (error) throw error;
}
