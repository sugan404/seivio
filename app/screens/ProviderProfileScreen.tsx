import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { designTokens } from "@/constants/designTokens";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchProviderDetailBySlug,
  type ProviderDetail,
} from "@/lib/providers";
import {
  addFavorite,
  isProviderFavorite,
  removeFavorite,
} from "@/lib/favorites";
import {
  averageRating,
  fetchProviderReviews,
  fetchUserReviewForProvider,
  submitReview,
} from "@/lib/reviews";
import type { Review } from "@/types";
import type { RootStackScreenProps } from "@/navigation/types";
import StarRating from "@/components/StarRating";
import ReviewModal from "@/components/ReviewModal";
import { getInitials } from "@/components/ProviderCard";

const REVIEWER_FALLBACK = "Seivio member";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProviderProfileScreen({
  route,
  navigation,
}: RootStackScreenProps<"ProviderProfile">) {
  const { slug } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [saved, setSaved] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  const [myReview, setMyReview] = useState<Review | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const userId = user?.id;

  const loadReviews = useCallback(async (providerId: string) => {
    setReviewsLoading(true);
    try {
      setReviews(await fetchProviderReviews(providerId));
    } catch (err) {
      console.error("Error loading reviews:", err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const loadFavorite = useCallback(
    async (providerId: string) => {
      if (!userId) {
        setSaved(false);
        return;
      }
      try {
        setSaved(await isProviderFavorite(userId, providerId));
      } catch (err) {
        console.error("Error checking favorite:", err);
      }
    },
    [userId]
  );

  const loadMyReview = useCallback(
    async (providerId: string) => {
      if (!userId) {
        setMyReview(null);
        return;
      }
      try {
        setMyReview(await fetchUserReviewForProvider(providerId, userId));
      } catch (err) {
        console.error("Error loading your review:", err);
      }
    },
    [userId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const detail = await fetchProviderDetailBySlug(slug);
      if (!detail) {
        setLoadError("We couldn't find this provider.");
        return;
      }
      setProvider(detail);
      await Promise.all([
        loadReviews(detail.id),
        loadFavorite(detail.id),
        loadMyReview(detail.id),
      ]);
    } catch (err) {
      console.error("Error loading provider:", err);
      setLoadError("We couldn't load this profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [slug, loadReviews, loadFavorite, loadMyReview]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert(
        "Sign in required",
        "Please sign in to save favorite providers.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign in", onPress: () => navigation.navigate("Auth") },
        ]
      );
      return;
    }
    if (!provider) return;
    const next = !saved;
    setSaved(next);
    setSavingFavorite(true);
    try {
      if (next) {
        await addFavorite(user.id, provider.id);
      } else {
        await removeFavorite(user.id, provider.id);
      }
    } catch (err) {
      console.error("Error updating favorite:", err);
      setSaved(!next);
      Alert.alert("Could not update", "Please check your connection and try again.");
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleSubmitReview = async (rating: number, text: string) => {
    if (!user || !provider) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitReview({
        providerId: provider.id,
        userId: user.id,
        rating,
        text,
      });
      setModalVisible(false);
      Alert.alert("Review submitted", "Thank you for your feedback!");
      await Promise.all([loadReviews(provider.id), loadMyReview(provider.id)]);
    } catch (err) {
      console.error("Error submitting review:", err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "We couldn't submit your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={designTokens.primaryBlue} />
        <Text style={styles.centeredText}>Loading provider…</Text>
      </View>
    );
  }

  if (loadError || !provider) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={44} color={designTokens.secondaryText} />
        <Text style={styles.errorTitle}>{loadError ?? "Provider unavailable"}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={load}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()}>
          <Text style={styles.linkButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ratingCount = reviews.length > 0 ? reviews.length : Number(provider.rating_count ?? 0);
  const ratingValue = reviews.length > 0 ? averageRating(reviews) : Number(provider.rating_avg ?? 0);

  const phone = provider.phone ?? provider.whatsapp ?? null;
  const whatsappDigits = (provider.whatsapp ?? provider.phone ?? "").replace(/[^\d]/g, "");
  const hasContact = Boolean(phone || whatsappDigits || provider.email);

  const openWhatsApp = () => {
    if (!whatsappDigits) return;
    Linking.openURL(`https://wa.me/${whatsappDigits}`).catch(() =>
      Alert.alert("Could not open WhatsApp", "Please try again.")
    );
  };

  const openDialer = () => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert("Could not open dialer", "Please try again.")
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={designTokens.mainText} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            Provider profile
          </Text>
          <View style={styles.backButton} />
        </View>

        {provider.banner_image ? (
          <Image source={{ uri: provider.banner_image }} style={styles.banner} />
        ) : null}

        <View style={styles.header}>
          {provider.profile_image ? (
            <Image source={{ uri: provider.profile_image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.initials}>{getInitials(provider.business_name)}</Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.businessName}>{provider.business_name}</Text>
            {ratingCount > 0 ? (
              <View style={styles.ratingRow}>
                <StarRating value={Math.round(ratingValue)} size={15} />
                <Text style={styles.ratingText}>
                  {ratingValue.toFixed(1)} · {ratingCount}{" "}
                  {ratingCount === 1 ? "review" : "reviews"}
                </Text>
              </View>
            ) : (
              <Text style={styles.mutedText}>No ratings yet</Text>
            )}
            <View style={styles.row}>
              <Ionicons name="location-outline" size={14} color={designTokens.secondaryText} />
              <Text style={styles.mutedText}>
                {[provider.city_slug, provider.state].filter(Boolean).join(", ") ||
                  "Available locally"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, saved && styles.actionButtonActive]}
            onPress={toggleFavorite}
            disabled={savingFavorite}
            testID="save-button"
          >
            {savingFavorite ? (
              <ActivityIndicator color={saved ? designTokens.whiteSurface : designTokens.primaryBlue} />
            ) : (
              <>
                <Ionicons
                  name={saved ? "heart" : "heart-outline"}
                  size={18}
                  color={saved ? designTokens.whiteSurface : designTokens.primaryBlue}
                />
                <Text style={[styles.actionText, saved && styles.actionTextActive]}>
                  {saved ? "Saved" : "Save"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.reviewAction]}
            onPress={() => {
              if (!user) {
                Alert.alert(
                  "Sign in required",
                  "Please sign in to leave a review.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Sign in", onPress: () => navigation.navigate("Auth") },
                  ]
                );
                return;
              }
              setSubmitError(null);
              setModalVisible(true);
            }}
            disabled={Boolean(myReview)}
            testID="write-review-button"
          >
            <Ionicons name="create-outline" size={18} color={designTokens.whiteSurface} />
            <Text style={[styles.actionText, styles.actionTextActive]}>
              {myReview ? "Reviewed" : "Write a Review"}
            </Text>
          </TouchableOpacity>
        </View>

        {myReview ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              You already reviewed this provider. Thank you for your feedback.
            </Text>
          </View>
        ) : null}

        {hasContact ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactRow}>
              {whatsappDigits ? (
                <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={18} color={designTokens.whiteSurface} />
                  <Text style={styles.contactText}>WhatsApp</Text>
                </TouchableOpacity>
              ) : null}
              {phone ? (
                <TouchableOpacity style={styles.callButton} onPress={openDialer}>
                  <Ionicons name="call-outline" size={18} color={designTokens.primaryBlue} />
                  <Text style={styles.callText}>Call</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {(provider.category_slugs ?? []).length > 0 ? (
          <View style={styles.chips}>
            {(provider.category_slugs ?? []).slice(0, 6).map((category) => (
              <View key={category} style={styles.chip}>
                <Text style={styles.chipText}>{category.replace(/-/g, " ")}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {provider.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bodyText}>{provider.description}</Text>
          </View>
        ) : null}

        <View style={styles.factRow}>
          {provider.experience_years ? (
            <View style={styles.fact}>
              <Ionicons name="ribbon-outline" size={18} color={designTokens.primaryBlue} />
              <Text style={styles.factText}>{provider.experience_years} years experience</Text>
            </View>
          ) : null}
          {provider.starting_price ? (
            <View style={styles.fact}>
              <Ionicons name="pricetag-outline" size={18} color={designTokens.successGreen} />
              <Text style={styles.factText}>
                from ₹{Number(provider.starting_price).toLocaleString("en-IN")}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Reviews {ratingCount > 0 ? `(${ratingCount})` : ""}
          </Text>

          {reviewsLoading ? (
            <ActivityIndicator color={designTokens.primaryBlue} style={styles.reviewsLoader} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color={designTokens.secondaryText} />
              <Text style={styles.emptyReviewsText}>
                No reviews yet. Be the first to share your experience.
              </Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerAvatar}>
                    <Ionicons name="person" size={16} color={designTokens.primaryBlue} />
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{REVIEWER_FALLBACK}</Text>
                    <StarRating value={review.rating} size={13} />
                  </View>
                  <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                </View>
                {review.review_text ? (
                  <Text style={styles.reviewText}>{review.review_text}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ReviewModal
        visible={modalVisible}
        providerName={provider.business_name}
        submitting={submitting}
        errorMessage={submitError}
        onCancel={() => {
          if (submitting) return;
          setModalVisible(false);
          setSubmitError(null);
        }}
        onSubmit={handleSubmitReview}
      />
    </View>
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
    padding: 24,
  },
  centeredText: { marginTop: 12, color: designTokens.secondaryText, fontSize: designTokens.bodySmall },
  errorTitle: {
    marginTop: 12,
    fontSize: designTokens.bodyLarge,
    fontWeight: "700",
    color: designTokens.mainText,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: designTokens.primaryBlue,
    borderRadius: designTokens.inputRadius,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: { color: designTokens.whiteSurface, fontWeight: "700" },
  linkButton: { marginTop: 12, padding: 8 },
  linkButtonText: { color: designTokens.primaryBlue, fontWeight: "600" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: designTokens.whiteSurface,
    borderWidth: 1,
    borderColor: designTokens.border,
  },
  topBarTitle: { fontSize: designTokens.bodyLarge, fontWeight: "700", color: designTokens.mainText },
  banner: { width: "100%", height: 150, borderRadius: designTokens.cardRadius, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatar: { width: 76, height: 76, borderRadius: 38, marginRight: 14 },
  avatarPlaceholder: {
    backgroundColor: designTokens.lightBlueSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: designTokens.primaryBlue, fontWeight: "800", fontSize: 24 },
  headerInfo: { flex: 1 },
  businessName: { fontSize: designTokens.titleMedium, fontWeight: "800", color: designTokens.mainText },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingText: { marginLeft: 6, fontSize: 13, color: designTokens.mainText, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  mutedText: { marginLeft: 4, fontSize: 13, color: designTokens.secondaryText, textTransform: "capitalize" },
  actionRow: { flexDirection: "row", marginBottom: 16 },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: designTokens.inputRadius,
    borderWidth: 1,
    borderColor: designTokens.primaryBlue,
    backgroundColor: designTokens.whiteSurface,
    marginRight: 10,
  },
  reviewAction: {
    backgroundColor: designTokens.primaryBlue,
    borderColor: designTokens.primaryBlue,
    marginRight: 0,
  },
  actionButtonActive: { backgroundColor: designTokens.primaryBlue, borderColor: designTokens.primaryBlue },
  actionText: { marginLeft: 6, color: designTokens.primaryBlue, fontWeight: "700", fontSize: 14 },
  actionTextActive: { color: designTokens.whiteSurface },
  infoBox: {
    backgroundColor: designTokens.successBackground,
    borderRadius: designTokens.inputRadius,
    padding: 12,
    marginBottom: 16,
  },
  infoText: { color: designTokens.successGreen, fontSize: designTokens.bodySmall },
  chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  chip: {
    backgroundColor: designTokens.lightBlueSurface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { color: designTokens.primaryBlue, fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  section: {
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: designTokens.border,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: designTokens.bodyLarge, fontWeight: "700", color: designTokens.mainText, marginBottom: 10 },
  bodyText: { fontSize: designTokens.bodySmall, color: designTokens.mainText, lineHeight: 21 },
  contactRow: { flexDirection: "row" },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#25D366",
    borderRadius: designTokens.inputRadius,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
    minHeight: 46,
  },
  contactText: { color: designTokens.whiteSurface, fontWeight: "700", marginLeft: 8 },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: designTokens.paleBlueBackground,
    borderWidth: 1,
    borderColor: designTokens.primaryBlue,
    borderRadius: designTokens.inputRadius,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 46,
  },
  callText: { color: designTokens.primaryBlue, fontWeight: "700", marginLeft: 8 },
  factRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.inputRadius,
    borderWidth: 1,
    borderColor: designTokens.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  factText: { marginLeft: 8, fontSize: 13, color: designTokens.mainText, fontWeight: "600" },
  reviewsLoader: { marginVertical: 12 },
  emptyReviews: { alignItems: "center", paddingVertical: 20 },
  emptyReviewsText: {
    marginTop: 8,
    fontSize: designTokens.bodySmall,
    color: designTokens.secondaryText,
    textAlign: "center",
  },
  reviewCard: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: designTokens.border },
  reviewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: designTokens.lightBlueSurface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  reviewerInfo: { flex: 1 },
  reviewerName: { fontSize: 13, fontWeight: "700", color: designTokens.mainText, marginBottom: 2 },
  reviewDate: { fontSize: 11, color: designTokens.secondaryText },
  reviewText: { fontSize: designTokens.bodySmall, color: designTokens.mainText, lineHeight: 20 },
});
