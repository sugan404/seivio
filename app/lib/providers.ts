import { supabase } from "@/integrations/supabase/client";
import type { Provider } from "@/types";

/** Columns selected across the discovery screens. */
export const PROVIDER_COLUMNS =
  "id, slug, business_name, description, category_slugs, city_slug, state, profile_image, banner_image, rating_avg, rating_count, experience_years, starting_price, plan, status";

export async function fetchApprovedProviders(limit = 20): Promise<Provider[]> {
  const { data, error } = await supabase
    .from("providers")
    .select(PROVIDER_COLUMNS)
    .eq("status", "approved")
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Provider[];
}

export async function fetchProviderBySlug(slug: string): Promise<Provider | null> {
  const { data, error } = await supabase
    .from("providers")
    .select(PROVIDER_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Provider) ?? null;
}

/**
 * Full provider record for the profile screen. Uses `select("*")` so optional
 * contact columns (phone / whatsapp / email) are returned when present without
 * failing when a deployment does not have them.
 */
export type ProviderDetail = Provider & {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
};

export async function fetchProviderDetailBySlug(
  slug: string
): Promise<ProviderDetail | null> {
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as ProviderDetail) ?? null;
}

function matchesQuery(provider: Provider, query: string): boolean {
  const haystack = [
    provider.business_name,
    (provider.category_slugs ?? []).join(" "),
    provider.city_slug,
    provider.state,
    provider.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (haystack.includes(query)) return true;

  // Token fallback so "plumber indiranagar" can still match partial words.
  const tokens = query.split(/\s+/).filter(Boolean);
  return tokens.length > 1 && tokens.some((token) => haystack.includes(token));
}

export function filterProviders(
  providers: Provider[],
  query: string,
  category?: string
): Provider[] {
  let result = providers;

  if (category) {
    const target = category.toLowerCase();
    result = result.filter((provider) =>
      (provider.category_slugs ?? []).some((slug) => slug.toLowerCase() === target)
    );
  }

  const trimmed = query.trim().toLowerCase();
  if (trimmed) {
    result = result.filter((provider) => matchesQuery(provider, trimmed));
  }

  return result;
}
