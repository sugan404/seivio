import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ProviderOnboardingScreen from "@/screens/ProviderOnboardingScreen";
import { renderWithProviders, TestStack } from "./test-utils";

function renderOnboarding() {
  return renderWithProviders(
    <TestStack.Screen
      name="ProviderOnboarding"
      component={ProviderOnboardingScreen as React.ComponentType<any>}
    />
  );
}

describe("Provider Onboarding System", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders Step 1 with profession categories", async () => {
    const { findByText } = renderOnboarding();
    expect(await findByText("Step 1: Your Profession")).toBeTruthy();
    expect(await findByText("Plumbing")).toBeTruthy();
    expect(await findByText("Electrician")).toBeTruthy();
  });

  it("advances to Step 2 upon selecting a profession and clicking next", async () => {
    const { findByText, getByTestId } = renderOnboarding();

    fireEvent.press(await findByText("Electrician"));
    fireEvent.press(getByTestId("onboarding-next"));

    expect(await findByText("Step 2: Business Name & Bio")).toBeTruthy();
  });

  it("blocks offensive business names during Step 2 using moderation engine", async () => {
    const { findByText, getByTestId } = renderOnboarding();

    // Move to step 2
    fireEvent.press(getByTestId("onboarding-next"));
    await findByText("Step 2: Business Name & Bio");

    // Enter offensive name
    fireEvent.changeText(getByTestId("onboarding-name-input"), "This guy is a fucker");
    fireEvent.changeText(
      getByTestId("onboarding-desc-input"),
      "Legitimate plumbing and home pipe repairs."
    );
    fireEvent.press(getByTestId("onboarding-next"));

    expect(
      await findByText(/inappropriate or profane language/i)
    ).toBeTruthy();
  });

  it("allows clean business names and descriptions to proceed to Step 3", async () => {
    const { findByText, getByTestId } = renderOnboarding();

    fireEvent.press(getByTestId("onboarding-next"));
    await findByText("Step 2: Business Name & Bio");

    fireEvent.changeText(getByTestId("onboarding-name-input"), "Apex Electrical Services");
    fireEvent.changeText(
      getByTestId("onboarding-desc-input"),
      "Certified 24/7 commercial wiring, fuse repair and home lighting installation."
    );
    fireEvent.press(getByTestId("onboarding-next"));

    expect(await findByText("Step 3: Location & Starting Rate")).toBeTruthy();
  });

  it("saves onboarding draft to AsyncStorage", async () => {
    const setItemSpy = jest.spyOn(AsyncStorage, "setItem");
    const { findByText } = renderOnboarding();

    fireEvent.press(await findByText("Save"));

    expect(setItemSpy).toHaveBeenCalledWith(
      "@seivio_provider_onboarding_draft",
      expect.stringContaining("plumbing")
    );
  });
});
