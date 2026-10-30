import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { designTokens } from "@/constants/designTokens";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fetchApprovedProviders } from "@/lib/providers";
import type { Category, Provider } from "@/types";
import type { MainTabScreenProps } from "@/navigation/types";
import ProviderCard from "@/components/ProviderCard";

export default function HomeScreen() {
  const navigation = useNavigation<MainTabScreenProps<"Home">["navigation"]>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [categoryResult, providerResult] = await Promise.all([
        supabase.from("categories").select("slug, name").eq("status", "approved"),
        fetchApprovedProviders(20),
      ]);

      if (categoryResult.error) throw categoryResult.error;

      setCategories((categoryResult.data ?? []) as Category[]);
      setProviders(providerResult);
    } catch (err) {
      console.error("Error loading home data:", err);
      setError("We couldn't load the marketplace. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchSubmit = () => {
    const query = searchQuery.trim();
    navigation.navigate("Search", query ? { q: query } : undefined);
  };

  const openProvider = (slug: string) => {
    navigation.navigate("ProviderProfile", { slug });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={designTokens.primaryBlue} />
        <Text style={styles.centeredText}>Loading Seivio…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: 24 },
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.brand}>Seivio</Text>
        <Text style={styles.tagline}>Find. Connect. Get It Done.</Text>
        {user?.email ? (
          <Text style={styles.greeting} numberOfLines={1}>
            Signed in as {user.email}
          </Text>
        ) : null}
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={designTokens.secondaryText} />
        <TextInput
          placeholder="Search for a service or business"
          placeholderTextColor={designTokens.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
          accessibilityLabel="Search for a service or business"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery("")} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={designTokens.secondaryText} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Browse categories</Text>
      {categories.length === 0 ? (
        <Text style={styles.hintText}>Categories will appear here once available.</Text>
      ) : (
        <View style={styles.chips}>
          {categories.slice(0, 10).map((category) => (
            <TouchableOpacity
              key={category.slug}
              style={styles.chip}
              onPress={() => navigation.navigate("Search", { category: category.slug })}
              testID={`category-${category.slug}`}
            >
              <Text style={styles.chipText}>{category.name || category.slug}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Providers near you</Text>
      {providers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={40} color={designTokens.secondaryText} />
          <Text style={styles.emptyTitle}>No providers yet</Text>
          <Text style={styles.emptyText}>
            New providers will appear here as they join Seivio.
          </Text>
        </View>
      ) : (
        providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onPress={() => openProvider(provider.slug)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: designTokens.paleBlueBackground },
  content: { paddingHorizontal: 16 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: designTokens.paleBlueBackground,
  },
  centeredText: { marginTop: 12, color: designTokens.secondaryText, fontSize: designTokens.bodySmall },
  header: { marginBottom: 16 },
  brand: { fontSize: designTokens.titleLarge, fontWeight: "800", color: designTokens.primaryBlue },
  tagline: { fontSize: designTokens.bodySmall, color: designTokens.secondaryText, marginTop: 2 },
  greeting: { fontSize: 12, color: designTokens.secondaryText, marginTop: 6 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.inputRadius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: designTokens.border,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: designTokens.bodyLarge,
    color: designTokens.mainText,
    paddingVertical: 0,
  },
  sectionTitle: {
    fontSize: designTokens.bodyLarge,
    fontWeight: "700",
    color: designTokens.mainText,
    marginBottom: 12,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  chip: {
    backgroundColor: designTokens.whiteSurface,
    borderWidth: 1,
    borderColor: designTokens.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  chipText: { color: designTokens.primaryBlue, fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  hintText: { color: designTokens.secondaryText, fontSize: 13, marginBottom: 20 },
  errorBox: {
    backgroundColor: designTokens.errorBackground,
    borderRadius: designTokens.inputRadius,
    padding: 14,
    marginBottom: 20,
  },
  errorText: { color: designTokens.errorRed, fontSize: designTokens.bodySmall },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: designTokens.primaryBlue,
    borderRadius: designTokens.inputRadius,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: designTokens.whiteSurface, fontWeight: "600" },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.cardRadius,
    borderWidth: 1,
    borderColor: designTokens.border,
  },
  emptyTitle: { marginTop: 10, fontSize: designTokens.bodyLarge, fontWeight: "700", color: designTokens.mainText },
  emptyText: {
    marginTop: 4,
    color: designTokens.secondaryText,
    fontSize: designTokens.bodySmall,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
