/** Shared domain types mirroring the Supabase schema in supabase/migrations. */

export type Provider = {
  id: string;
  slug: string;
  business_name: string;
  description: string | null;
  category_slugs: string[] | null;
  city_slug: string | null;
  state: string | null;
  profile_image: string | null;
  banner_image: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  experience_years: number | null;
  starting_price: number | null;
  plan: string | null;
  status: string | null;
};

export type Review = {
  id: string;
  provider_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string | null;
};

export type Category = {
  slug: string;
  name: string;
  status?: string | null;
};

export type City = {
  slug: string;
  name: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  provider_id: string;
  created_at: string;
};

/** Minimum / maximum review text lengths enforced by the review form. */
export const REVIEW_MIN_LENGTH = 10;
export const REVIEW_MAX_LENGTH = 1000;
