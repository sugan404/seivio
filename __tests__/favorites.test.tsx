import React from "react";

import FavoritesScreen from "@/screens/FavoritesScreen";
import { renderWithProviders, TestStack } from "./test-utils";

function renderFavorites() {
  return renderWithProviders(
    <TestStack.Screen name="Favorites" component={FavoritesScreen} />
  );
}

describe("Favorites", () => {
  it("shows the saved providers screen", async () => {
    // The Supabase test double resolves without a session, so the screen
    // renders its signed-out / empty state.
    const { findByText } = renderFavorites();

    expect(await findByText("Saved")).toBeTruthy();
  });

  it("shows an empty state when nothing has been saved", async () => {
    const { findByText } = renderFavorites();

    expect(await findByText("No saved providers yet")).toBeTruthy();
  });

  it("offers a way to browse providers from the empty state", async () => {
    const { findByText } = renderFavorites();

    expect(await findByText("Browse providers")).toBeTruthy();
  });
});
