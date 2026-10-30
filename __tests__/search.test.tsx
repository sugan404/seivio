import React from "react";
import { fireEvent } from "@testing-library/react-native";

import SearchScreen from "@/screens/SearchScreen";
import { filterProviders } from "@/lib/providers";
import type { Provider } from "@/types";
import { renderWithProviders, TestStack } from "./test-utils";

function makeProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: "p1",
    slug: "plumber-ravi",
    business_name: "Ravi Plumbing Services",
    description: "Emergency pipe repair",
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
    ...overrides,
  };
}

function renderSearch() {
  return renderWithProviders(
    <TestStack.Screen name="Search" component={SearchScreen} />
  );
}

describe("Discovery", () => {
  it("shows the search input", async () => {
    const { findByTestId, findByText } = renderSearch();

    expect(await findByTestId("search-input")).toBeTruthy();
    expect(await findByText("Search")).toBeTruthy();
  });

  it("updates the query as the user types", async () => {
    const { findByTestId } = renderSearch();

    const input = await findByTestId("search-input");
    fireEvent.changeText(input, "plumbing");

    expect(input.props.value).toBe("plumbing");
  });
});

describe("Provider filtering", () => {
  const providers = [
    makeProvider({
      id: "a",
      slug: "ravi-plumbing",
      business_name: "Ravi Plumbing",
      category_slugs: ["plumbing"],
      city_slug: "indiranagar",
    }),
    makeProvider({
      id: "b",
      slug: "sparky-electricals",
      business_name: "Sparky Electricals",
      category_slugs: ["electrical"],
      city_slug: "jayanagar",
    }),
  ];

  it("filters providers by category", () => {
    const result = filterProviders(providers, "", "plumbing");

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("ravi-plumbing");
  });

  it("matches providers by free-text query", () => {
    const result = filterProviders(providers, "electrical", undefined);

    expect(result.map((provider) => provider.slug)).toEqual(["sparky-electricals"]);
  });

  it("returns every provider when there is no query or category", () => {
    expect(filterProviders(providers, "", undefined)).toHaveLength(2);
  });
});
