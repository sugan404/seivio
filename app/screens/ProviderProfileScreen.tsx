import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useParams, useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

useEffect(() => {
    fetchProvider();
    fetchReviews();
  }, []);

  const fetchProvider = async () => {
    try {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      setProvider(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching provider:", err);
      setError("Provider not found");
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("provider_id", slug)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReviews(data || []);
      setLoadingReviews(false);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setLoadingReviews(false);
    }
  };

  if (loading) {
    return (<View style={styles.container}><ActivityIndicator size="large" /><Text>Loading provider profile...</Text></View>);
  }

  if (error) {
    return (<View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={fetchProvider}><Text>Retry</Text></TouchableOpacity></View>);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {provider?.profile_image ? (
          <Image source={{ uri: provider.profile_image }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Text style={styles.initialsText}>{provider?.business_name?.split(" ")?.map((w: string) => w[0] ?? "?")?.join("") ?? "?"}</Text>
          </View>
        )}
        <View style={styles.profileDetails}>
          <Text style={styles.businessName}>{provider?.business_name}</Text>
          <Text style={styles.ratingDisplay}>
            {provider?.rating_avg ? "★".repeat(Math.round(provider.rating_avg)) : "No ratings"}
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        {provider?.city_slug ? (<Text style={styles.locationInfo}>Location: {provider.city_slug}</Text>) : null}
        {provider?.state && (<Text style={styles.locationInfo}> {provider.state}</Text>)}\n        {provider?.category_slugs && provider.category_slugs.length > 0 && (\n          <View style={styles.categories}>\n            {provider.category_slugs.slice(0, 3).map((c: string) => (\n              <Text key={c} style={styles.categoryTag}>\n                {c.replace(/-/g, " ")}\n              </Text>\n            ))}\n            {provider.category_slugs.length > 3 && (\n              <Text style={styles.categoryTag}>\n                +{provider.category_slugs.length - 3} more\n              </Text>\n            )}\n          </View>\n        )}\n      </View>

      {provider?.description && (\n        <View style={styles.descriptionSection}>\n          <Text style={styles.sectionTitle}>Description</Text>\n          <Text style={styles.descriptionText}>{provider?.description}</Text>\n        </View>\n      )}

      {provider?.experience_years && (\n        <View style={styles.experienceSection}>\n          <Text style={styles.experienceText}> {provider.experience_years} years experience</Text>\n        </View>\n      )}

      {provider?.starting_price && (\n        <View style={styles.priceSection}>\n          <Text style={styles.priceText}>from ₹{provider.starting_price.toLocaleString("en-IN")}</Text>\n        </View>\n      )}

      {user && (\n        <View style={styles.actionsSection}>\n          <Text style={styles.sectionTitle}>Actions</Text>\n          <View style={styles.actionButtons}>\n            <TouchableOpacity style={styles.likeButton}>\n              <Text style={styles.likeText}>Like Profile</Text>\n            </TouchableOpacity>\n            <TouchableOpacity style={styles.reviewButton}>\n              <Text style={styles.reviewText}>Leave Review</Text>\n            </TouchableOpacity>\n          </View>\n        </View>\n      )}

      {provider?.banner_image && (\n        <View style={styles.banner}>\n          <Image source={{ uri: provider.banner_image }} style={styles.bannerImage} />\n        </View>\n      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    objectFit: "cover",
    marginRight: 15,
  },
  profilePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  initialsText: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 20,
  },
  profileDetails: {
    flexDirection: "column",
  },
  businessName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  ratingDisplay: {
    color: "#f59e0b",
    fontSize: 14,
    marginTop: 4,
  },
  infoSection: { marginBottom: 20 },
  locationInfo: { color: "#64748b", fontSize: 13, marginHorizontal: 4 },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 20 },
  categoryTag: {
    backgroundColor: "#f1f5f9",
    color: "#333333",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 11,
  },
  descriptionSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "500", color: "#333333", marginBottom: 6 },
  descriptionText: { color: "#333333", fontSize: 14, lineHeight: 20 },
  experienceSection: { marginBottom: 12 },
  experienceText: { color: "#64748b", fontSize: 13 },
  priceSection: { marginBottom: 12 },
  priceText: { color: "#059669", fontSize: 14, fontWeight: "500" },
  contactSection: { marginBottom: 20 },
  contactTitle: { fontSize: 16, fontWeight: "500", color: "#333333", marginBottom: 12 },
  contactOptions: { flexDirection: "row", gap: 16 },
  whatsappButton: {
    backgroundColor: "#25D366",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 2,
  },
  whatsappText: { color: "#ffffff", fontSize: 14, fontWeight: "500" },
  callButton: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 2,
  },
  callText: { color: "#333333", fontSize: 14, fontWeight: "500" },
  actionsSection: { marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  sectionTitle: { fontSize: 16, fontWeight: "500", color: "#333333", marginBottom: 12 },
  actionButtons: { flexDirection: "row", gap: 12, marginBottom: 12 },
  likeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    elevation: 2,
  },
  likeText: { color: "#333333", fontSize: 14, fontWeight: "500", textAlign: "center" },
  reviewButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    elevation: 2,
  },
  reviewText: { color: "#ffffff", fontSize: 14, fontWeight: "500", textAlign: "center" },
  banner: { marginTop: 30, height: 200, width: "100%", backgroundColor: "#f0f4f8" },
  bannerImage: { width: "100%", height: "100%", objectFit: "cover" },
});