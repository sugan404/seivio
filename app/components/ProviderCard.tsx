import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { designTokens } from "@/constants/designTokens";
import type { Provider } from "@/types";

export function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}

type Props = {
  provider: Provider;
  onPress: () => void;
};

export default function ProviderCard({ provider, onPress }: Props) {
  const rating = Number(provider.rating_avg ?? 0);
  const reviewCount = Number(provider.rating_count ?? 0);
  const categories = (provider.category_slugs ?? [])
    .slice(0, 3)
    .map((slug) => slug.replace(/-/g, " "))
    .join(", ");
  const location = provider.city_slug || provider.state || "Available locally";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`View ${provider.business_name}`}
      testID={`provider-card-${provider.slug}`}
    >
      {provider.profile_image ? (
        <Image source={{ uri: provider.profile_image }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.initials}>{getInitials(provider.business_name)}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {provider.business_name}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {categories || "General services"}
        </Text>

        <View style={styles.row}>
          <Ionicons name="location-outline" size={13} color={designTokens.secondaryText} />
          <Text style={styles.location} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <View style={styles.row}>
          {rating > 0 ? (
            <>
              <Ionicons name="star" size={13} color={designTokens.starGold} />
              <Text style={styles.ratingText}>
                {rating.toFixed(1)} ({reviewCount})
              </Text>
            </>
          ) : (
            <Text style={styles.noRating}>No ratings yet</Text>
          )}

          {provider.starting_price ? (
            <Text style={styles.price}>
              from ₹{Number(provider.starting_price).toLocaleString("en-IN")}
            </Text>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={designTokens.border} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: designTokens.lightBlueSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: designTokens.primaryBlue, fontWeight: "700", fontSize: 18 },
  info: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  name: { fontSize: 16, fontWeight: "700", color: designTokens.mainText },
  category: { fontSize: 13, color: designTokens.secondaryText, marginTop: 2 },
  location: { fontSize: 12, color: designTokens.secondaryText, marginLeft: 3 },
  ratingText: { fontSize: 12, color: designTokens.mainText, marginLeft: 3, fontWeight: "600" },
  noRating: { fontSize: 12, color: designTokens.secondaryText },
  price: {
    fontSize: 12,
    color: designTokens.successGreen,
    fontWeight: "600",
    marginLeft: 10,
  },
});
