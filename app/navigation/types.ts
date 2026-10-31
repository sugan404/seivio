import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

/** Routes available on the root stack navigator. */
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProviderProfile: { slug: string };
  GrowthKit: { providerSlug?: string } | undefined;
  Verification: { providerId?: string } | undefined;
  ProviderOnboarding: undefined;
  AdminVerificationReview: undefined;
};

/** Routes available on the bottom tab navigator (the "Main" experience). */
export type MainTabParamList = {
  Home: undefined;
  Search: { category?: string; q?: string } | undefined;
  Favorites: undefined;
  Account: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/**
 * Props for a screen rendered inside the bottom tab navigator.
 * The parent stack navigation is composed in so screens can push
 * stack-level routes such as ProviderProfile.
 */
export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;
