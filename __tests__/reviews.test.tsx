import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import ReviewModal from "@/components/ReviewModal";
import ProviderProfileScreen from "@/screens/ProviderProfileScreen";
import * as providersLib from "@/lib/providers";
import * as reviewsLib from "@/lib/reviews";
import * as favoritesLib from "@/lib/favorites";
import { averageRating, submitReview } from "@/lib/reviews";
import type { Provider, Review } from "@/types";
import { renderWithProviders, TestStack } from "./test-utils";

// Treat the visitor as an authenticated member so the profile screen exposes
// its review actions, matching the real app once a session exists.
const mockUser = { id: "user-1", email: "member@example.com" };
const mockAuthValue = {
  user: mockUser,
  session: { user: mockUser },
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
};

jest.mock("@/hooks/use-auth", () => {
  const actual = jest.requireActual("@/hooks/use-auth");
  return {
    ...actual,
    useAuth: () => mockAuthValue,
  };
});

const sampleProvider: Provider = {
  id: "provider-1",
  slug: "plumber-ravi",
  business_name: "Ravi Plumbing Services",
  description: "Emergency pipe repair across the city.",
  category_slugs: ["plumbing"],
  city_slug: "indiranagar",
  state: "Karnataka",
  profile_image: null,
  banner_image: null,
  rating_avg: 4.5,
  rating_count: 12,
  experience_years: 8,
  starting_price: 499,
  plan: "free",
  status: "approved",
};

function renderProfile() {
  return renderWithProviders(
    <TestStack.Screen
      name="ProviderProfile"
      component={ProviderProfileScreen as React.ComponentType<any>}
      initialParams={{ slug: sampleProvider.slug }}
    />
  );
}

function renderModal(onSubmit: (rating: number, text: string) => void) {
  return render(
    <ReviewModal
      visible
      providerName={sampleProvider.business_name}
      submitting={false}
      errorMessage={null}
      onCancel={jest.fn()}
      onSubmit={onSubmit}
    />
  );
}

describe("Reviews", () => {
  beforeEach(() => {
    jest.spyOn(providersLib, "fetchProviderDetailBySlug").mockResolvedValue(sampleProvider);
    jest.spyOn(reviewsLib, "fetchProviderReviews").mockResolvedValue([]);
    jest.spyOn(reviewsLib, "fetchUserReviewForProvider").mockResolvedValue(null);
    jest.spyOn(favoritesLib, "isProviderFavorite").mockResolvedValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the Write a Review action and opens the review modal", async () => {
    const { findByTestId, findByText } = renderProfile();

    fireEvent.press(await findByTestId("write-review-button"));

    expect(await findByText("Your rating")).toBeTruthy();
    expect(await findByTestId("review-text-input")).toBeTruthy();
    expect(await findByTestId("review-submit")).toBeTruthy();
  });

  it("submits a valid review through the profile screen", async () => {
    const submitSpy = jest.spyOn(reviewsLib, "submitReview").mockResolvedValue(null);
    const { findByTestId } = renderProfile();

    fireEvent.press(await findByTestId("write-review-button"));
    fireEvent.changeText(
      await findByTestId("review-text-input"),
      "Fast, friendly and very professional."
    );
    fireEvent.press(await findByTestId("review-submit"));

    await waitFor(() =>
      expect(submitSpy).toHaveBeenCalledWith({
        providerId: sampleProvider.id,
        userId: "user-1",
        rating: 5,
        text: "Fast, friendly and very professional.",
      })
    );
  });

  it("shows the empty state when a provider has no reviews", async () => {
    const { findByText } = renderProfile();

    await findByText("Ravi Plumbing Services");
    expect(
      await findByText("No reviews yet. Be the first to share your experience.")
    ).toBeTruthy();
  });
});

describe("Review modal", () => {
  it("submits the selected rating and trimmed review text", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = renderModal(onSubmit);

    fireEvent.press(getByTestId("rating-star-3"));
    fireEvent.changeText(getByTestId("review-text-input"), "  Friendly and on time.  ");
    fireEvent.press(getByTestId("review-submit"));

    expect(onSubmit).toHaveBeenCalledWith(3, "Friendly and on time.");
  });

  it("does not submit review text shorter than the minimum length", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = renderModal(onSubmit);

    fireEvent.changeText(getByTestId("review-text-input"), "too short");
    fireEvent.press(getByTestId("review-submit"));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("submitReview validation", () => {
  it("rejects ratings outside the 1–5 range", async () => {
    await expect(
      submitReview({
        providerId: "provider-1",
        userId: "user-1",
        rating: 0,
        text: "A perfectly valid length review.",
      })
    ).rejects.toThrow(/rating between 1 and 5/i);
  });

  it("rejects reviews shorter than the minimum length", async () => {
    await expect(
      submitReview({
        providerId: "provider-1",
        userId: "user-1",
        rating: 5,
        text: "short",
      })
    ).rejects.toThrow(/at least 10 characters/i);
  });
});

describe("averageRating", () => {
  function review(rating: number): Review {
    return {
      id: `review-${rating}`,
      provider_id: "provider-1",
      user_id: "user-1",
      rating,
      review_text: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: null,
    };
  }

  it("computes the mean of all ratings", () => {
    expect(averageRating([review(5), review(4)])).toBeCloseTo(4.5);
  });

  it("returns zero for an empty review list", () => {
    expect(averageRating([])).toBe(0);
  });
});
