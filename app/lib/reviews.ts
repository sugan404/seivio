import { supabase } from "@/integrations/supabase/client";
import type { Review } from "@/types";
import { REVIEW_MAX_LENGTH, REVIEW_MIN_LENGTH } from "@/types";

const REVIEW_COLUMNS =
  "id, provider_id, user_id, rating, review_text, created_at, updated_at";

export async function fetchProviderReviews(providerId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function fetchUserReviewForProvider(
  providerId: string,
  userId: string
): Promise<Review | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("provider_id", providerId)
    .eq("user_id", userId)
    .limit(1);
  if (error) throw error;
  const rows = (data ?? []) as Review[];
  return rows[0] ?? null;
}

export type SubmitReviewInput = {
  providerId: string;
  userId: string;
  rating: number;
  text: string;
};

/**
 * Validates and inserts a review. Row Level Security on public.reviews
 * ("Users insert review") guarantees auth.uid() = user_id on the server, so a
 * user can never submit a review under another user's identity.
 */
export async function submitReview({
  providerId,
  userId,
  rating,
  text,
}: SubmitReviewInput): Promise<Review | null> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Please select a rating between 1 and 5 stars.");
  }

  const trimmed = text.trim();
  if (trimmed.length < REVIEW_MIN_LENGTH) {
    throw new Error(`Your review must be at least ${REVIEW_MIN_LENGTH} characters.`);
  }
  if (trimmed.length > REVIEW_MAX_LENGTH) {
    throw new Error(`Your review must be ${REVIEW_MAX_LENGTH} characters or fewer.`);
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      provider_id: providerId,
      user_id: userId,
      rating,
      review_text: trimmed,
    })
    .select(REVIEW_COLUMNS)
    .single();

  if (error) throw error;
  return (data as Review) ?? null;
}

export function averageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, review) => sum + Number(review.rating ?? 0), 0);
  return total / reviews.length;
}
