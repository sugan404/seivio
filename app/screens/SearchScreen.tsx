import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { designTokens } from "@/constants/designTokens";
import { supabase } from "@/integrations/supabase/client";
import { fetchApprovedProviders, filterProviders } from "@/lib/providers";
import type { Category, Provider } from "@/types";
import type { MainTabScreenProps } from "@/navigation/types";
import ProviderCard from "@/components/ProviderCard";

export default function SearchScreen({ route, navigation }: MainTabScreenProps<"Search">) {
  const insets = useSafeAreaInsets();
  const initialQuery = route.params?.q ?? "";
  const initialCategory = route.params?.category;

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string | undefined>(initialCategory);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.q !== undefined) setQuery(route.params.q ?? "");
    if (route.params?.category !== undefined) setCategory(route.params.category);
  }, [route.params?.q, route.params?.category]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoryResult, providerResult] = await Promise.all([
        supabase.from("categories").select("slug, name").eq("status", "approved"),
        fetchApprovedProviders(100),
      ]);
      if (categoryResult.error) throw categoryResult.error;
      setCategories((categoryResult.data ?? []) as Category[]);
      setAllProviders(providerResult);
    } catch (err) {
      console.error("Error loading search data:", err);
      setError("Search is unavailable right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const results = useMemo(
    () => filterProviders(allProviders, query, category),
    [allProviders, query, category]
  );

  const clear = () => {
    setQuery("");
    setCategory(undefined);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Search</Text>

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={designTokens.secondaryText} />
        <TextInput
          placeholder="Search providers, services or cities"
          placeholderTextColor={designTokens.secondaryText}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          accessibilityLabel="Search providers"
          testID="search-input"
        />
        {query.length > 0 || category ? (
          <TouchableOpacity onPress={clear} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={designTokens.secondaryText} />
          </TouchableOpacity>
        ) : null}
      </View>

      {categories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <TouchableOpacity
            style={[styles.chip, !category && styles.chipActive]}
            onPress={() => setCategory(undefined)}
          >
            <Text style={[styles.chipText, !category && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((item) => {
            const active = category === item.slug;
            return (
              <TouchableOpacity
                key={item.slug}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategory(active ? undefined : item.slug)}
                testID={`filter-${item.slug}`}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item.name || item.slug}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={designTokens.primaryBlue} />
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.results}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.resultsCount}>
            {results.length} {results.length === 1 ? "provider" : "providers"} found
          </Text>

          {results.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color={designTokens.secondaryText} />
              <Text style={styles.emptyTitle}>No matches</Text>
              <Text style={styles.emptyText}>
                Try a different keyword or clear the category filter.
              </Text>
            </View>
          ) : (
            results.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onPress={() => navigation.navigate("ProviderProfile", { slug: provider.slug })}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: designTokens.paleBlueBackground, paddingHorizontal: 16 },
  title: {
    fontSize: designTokens.titleLarge,
    fontWeight: "800",
    color: designTokens.mainText,
    marginBottom: 16,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.inputRadius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: designTokens.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: designTokens.bodyLarge,
    color: designTokens.mainText,
    paddingVertical: 0,
  },
  chipRow: { paddingBottom: 12 },
  chip: {
    backgroundColor: designTokens.whiteSurface,
    borderWidth: 1,
    borderColor: designTokens.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: designTokens.primaryBlue, borderColor: designTokens.primaryBlue },
  chipText: { color: designTokens.primaryBlue, fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  chipTextActive: { color: designTokens.whiteSurface },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  results: { paddingBottom: 24 },
  resultsCount: { color: designTokens.secondaryText, fontSize: 13, marginBottom: 10 },
  errorBox: {
    backgroundColor: designTokens.errorBackground,
    borderRadius: designTokens.inputRadius,
    padding: 14,
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
