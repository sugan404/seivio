import React from "react";
import { render } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/hooks/use-auth";

/** Deterministic insets so SafeAreaProvider renders synchronously in tests. */
const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export const TestStack = createNativeStackNavigator<any>();

/**
 * Renders UI inside the same providers the real app uses (safe area, auth,
 * navigation) so screens can be exercised the way users see them.
 */
export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <AuthProvider>
        <NavigationContainer>
          <TestStack.Navigator screenOptions={{ headerShown: false }}>
            {ui}
          </TestStack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
