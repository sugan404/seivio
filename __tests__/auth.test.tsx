import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";

import AuthScreen from "@/screens/AuthScreen";
import { supabase } from "@/integrations/supabase/client";
import { renderWithProviders, TestStack } from "./test-utils";

function renderAuth() {
  return renderWithProviders(<TestStack.Screen name="Auth" component={AuthScreen} />);
}

describe("Authentication", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the email and password fields on the sign in screen", async () => {
    const { findByPlaceholderText, findByText } = renderAuth();

    expect(await findByPlaceholderText("you@example.com")).toBeTruthy();
    expect(await findByPlaceholderText("Your password")).toBeTruthy();
    expect(await findByText("Sign In")).toBeTruthy();
  });

  it("validates required input before calling Supabase", async () => {
    const signInSpy = jest.spyOn(supabase.auth, "signInWithPassword");
    const { findByText, getByTestId } = renderAuth();

    const submit = await waitFor(() => getByTestId("auth-submit"));
    fireEvent.press(submit);

    expect(await findByText("Please enter your email address.")).toBeTruthy();
    expect(signInSpy).not.toHaveBeenCalled();
  });

  it("signs in with valid credentials", async () => {
    const signInSpy = jest.spyOn(supabase.auth, "signInWithPassword");
    const { findByPlaceholderText, getByTestId } = renderAuth();

    fireEvent.changeText(await findByPlaceholderText("you@example.com"), "user@example.com");
    fireEvent.changeText(await findByPlaceholderText("Your password"), "secret123");
    fireEvent.press(getByTestId("auth-submit"));

    await waitFor(() =>
      expect(signInSpy).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret123",
      })
    );
  });

  it("switches to sign up and validates password length", async () => {
    const { findByText, getByTestId, findByPlaceholderText } = renderAuth();

    fireEvent.press(await findByText("Don't have an account? Sign Up"));
    expect(await findByText("Create Account")).toBeTruthy();

    fireEvent.changeText(await findByPlaceholderText("you@example.com"), "new@example.com");
    fireEvent.changeText(await findByPlaceholderText("At least 6 characters"), "123");
    fireEvent.press(getByTestId("auth-submit"));

    expect(await findByText("Password must be at least 6 characters.")).toBeTruthy();
  });
});
