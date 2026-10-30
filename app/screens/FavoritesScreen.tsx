import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { designTokens } from "@/constants/designTokens";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PROVIDER_COLUMNS } from "@/lib/providers";
import { getInitials } from "@/components/ProviderCard";
import type { Favorite, Provider } from "@/types";
import type { MainTabScreenProps } from "@/navigation/types";

type FavoriteRow = { favorite: Favorite; provider: Provider | null };

export default function FavoritesScreen() {
  const navigation = useNavigation<MainTabScreenProps<"Favorites">["navigation"]>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [rows, setRows] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }

    setError(null);
    try {
      const { data: favorites, error: favError } = await supabase
        .from("provider_favorites")
        .select("id, user_id, provider_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (favError) throw favError;

      const favoritesList = (favorites ?? []) as Favorite[];
      if (favoritesList.length === 0) {
        setRows([]);
        return;
      }

      const providerIds = favoritesList.map((fav) => fav.provider_id);
      const { data: providers, error: providerError } = await supabase
        .from("providers")
        .select(PROVIDER_COLUMNS)
        .in("id", providerIds);

      if (providerError) throw providerError;

      const providerMap = new Map<string, Provider>(
        ((providers ?? []) as Provider[]).map((provider) => [provider.id, provider])
      );

      setRows(
        favoritesList.map((favorite) => ({
          favorite,
          provider: providerMap.get(favorite.provider_id) ?? null,
        }))
      );
    } catch (err) {
      console.error("Error loading favorites:", err);
      setError("We couldn't load your saved providers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const removeFavorite = async (providerId: string) => {
    if (!user) return;
    const previous = rows;
    setRows((current) => current.filter((row) => row.favorite.provider_id !== providerId));
    try {
      const { error: deleteError } = await supabase
        .from("provider_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("provider_id", providerId);
      if (deleteError) throw deleteError;
    } catch (err) {
      console.error("Error removing favorite:", err);
      setRows(previous);
      Alert.alert("Could not remove", "Please check your connection and try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={designTokens.primaryBlue} />
        <Text style={styles.centeredText}>Loading your saved providers…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Saved</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.favorite.id}
        contentContainerStyle={styles.list}
        refreshing={false}
        onRefresh={load}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={40} color={designTokens.secondaryText} />
            <Text style={styles.emptyTitle}>No saved providers yet</Text>
            <Text style={styles.emptyText}>
              Tap Save on a provider profile to keep it here for later.
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.browseText}>Browse providers</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const provider = item.provider;
          if (!provider) return null;
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("ProviderProfile", { slug: provider.slug })}
            >
              {provider.profile_image ? (
                <Image source={{ uri: provider.profile_image }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.initials}>{getInitials(provider.business_name)}</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {provider.business_name}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {(provider.category_slugs ?? [])
                    .slice(0, 2)
                    .map((slug) => slug.replace(/-/g, " "))
                    .join(", ") || "General services"}
                </Text>
                <Text style={styles.cardLocation} numberOfLines={1}>
                  {provider.city_slug || provider.state || "Available locally"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFavorite(item.favorite.provider_id)}
                accessibilityLabel={`Remove ${provider.business_name} from saved`}
                testID={`remove-${provider.slug}`}
              >
                <Ionicons name="heart" size={20} color={designTokens.errorRed} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: designTokens.paleBlueBackground,
  },
  centeredText: { marginTop: 12, color: designTokens.secondaryText, fontSize: designTokens.bodySmall },
  list: { paddingBottom: 24 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.cardRadius,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: designTokens.border,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  avatarPlaceholder: {
    backgroundColor: designTokens.lightBlueSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: designTokens.primaryBlue, fontWeight: "700", fontSize: 18 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: designTokens.mainText },
  cardSubtitle: { fontSize: 13, color: designTokens.secondaryText, marginTop: 2, textTransform: "capitalize" },
  cardLocation: { fontSize: 12, color: designTokens.secondaryText, marginTop: 2 },
  removeButton: { padding: 10 },
  errorBox: {
    backgroundColor: designTokens.errorBackground,
    borderRadius: designTokens.inputRadius,
    padding: 14,
    marginBottom: 16,
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
    paddingVertical: 40,
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
  browseButton: {
    marginTop: 16,
    backgroundColor: designTokens.primaryBlue,
    borderRadius: designTokens.inputRadius,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  browseText: { color: designTokens.whiteSurface, fontWeight: "600" },
});
