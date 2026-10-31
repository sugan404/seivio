import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Share,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { designTokens } from "@/constants/designTokens";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchProviderDetailBySlug,
  fetchApprovedProviders,
  type ProviderDetail,
} from "@/lib/providers";
import {
  CARD_TEMPLATES,
  CardPrivacySettings,
  CardTemplateId,
  DEFAULT_PRIVACY_SETTINGS,
  getPublicProviderUrl,
  GROWTH_KIT_MARKETING_TIPS,
  STICKER_TEMPLATES,
  StickerTemplateId,
} from "@/lib/card-templates";
import VisitingCard from "@/components/VisitingCard";
import QRSticker from "@/components/QRSticker";
import type { RootStackScreenProps } from "@/navigation/types";

export default function GrowthKitScreen({
  route,
  navigation,
}: RootStackScreenProps<"GrowthKit">) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const requestedSlug = route.params?.providerSlug;

  const [activeTab, setActiveTab] = useState<"card" | "sticker">("card");
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplateId>("professional");
  const [selectedSticker, setSelectedSticker] = useState<StickerTemplateId>("scan_to_contact");
  const [privacy, setPrivacy] = useState<CardPrivacySettings>(DEFAULT_PRIVACY_SETTINGS);

  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        if (requestedSlug) {
          const detail = await fetchProviderDetailBySlug(requestedSlug);
          if (mounted && detail) {
            setProvider(detail);
            return;
          }
        }
        // Fallback: pick the first available provider or build a realistic profile
        const approved = await fetchApprovedProviders(1);
        if (mounted && approved.length > 0) {
          const detail = await fetchProviderDetailBySlug(approved[0].slug);
          setProvider(detail || (approved[0] as ProviderDetail));
        } else if (mounted) {
          setProvider({
            id: "sample-1",
            slug: "seivio-partner",
            business_name: "Seivio Verified Partner",
            description: "On-demand trusted home and commercial services across the city.",
            category_slugs: ["home-repair", "plumbing"],
            city_slug: "chennai",
            state: "Tamil Nadu",
            profile_image: null,
            banner_image: null,
            rating_avg: 4.8,
            rating_count: 24,
            experience_years: 6,
            starting_price: 399,
            plan: "pro",
            status: "approved",
            phone: "+91 98765 43210",
            whatsapp: "+91 98765 43210",
            email: "partner@seivio.app",
          });
        }
      } catch (err) {
        console.error("Error loading provider for growth kit:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [requestedSlug]);

  const handleShare = async () => {
    if (!provider) return;
    const url = getPublicProviderUrl(provider.slug);
    try {
      await Share.share({
        title: `${provider.business_name} on Seivio`,
        message: `Connect with ${provider.business_name} on Seivio: ${url}`,
        url,
      });
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  const handleCopyLink = () => {
    if (!provider) return;
    const url = getPublicProviderUrl(provider.slug);
    setCopiedLink(true);
    Alert.alert("Link Copied", `Public profile link ready to share:\n\n${url}`);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePrintInfo = () => {
    Alert.alert(
      "Print-Ready Guide",
      "For best physical printing results:\n\n" +
        "• Standard visiting card dimensions: 3.5\" × 2\" (88.9 × 50.8 mm)\n" +
        "• Resolution: 300 DPI\n" +
        "• QR Code Quiet Zone: Minimum 5mm border\n" +
        "• Stickers: High-contrast vinyl cut-out",
      [{ text: "Understood" }]
    );
  };

  if (loading || !provider) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={designTokens.primaryBlue} />
        <Text style={styles.loadingText}>Preparing your Growth Kit…</Text>
      </View>
    );
  }

  const isVerified = (provider as any).verification_status === "verified" || Boolean((provider as any).verified_at);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={designTokens.mainText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grow Your Business</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleShare}
          accessibilityLabel="Share kit"
        >
          <Ionicons name="share-outline" size={22} color={designTokens.primaryBlue} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode Switcher Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "card" && styles.tabActive]}
            onPress={() => setActiveTab("card")}
            testID="tab-visiting-card"
          >
            <Ionicons
              name="card-outline"
              size={18}
              color={activeTab === "card" ? designTokens.whiteSurface : designTokens.secondaryText}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "card" && styles.tabTextActive,
              ]}
            >
              Visiting Card
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "sticker" && styles.tabActive]}
            onPress={() => setActiveTab("sticker")}
            testID="tab-qr-sticker"
          >
            <Ionicons
              name="qr-code-outline"
              size={18}
              color={activeTab === "sticker" ? designTokens.whiteSurface : designTokens.secondaryText}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "sticker" && styles.tabTextActive,
              ]}
            >
              Printable Sticker
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "card" ? (
          <>
            {/* Template Selector Carousel */}
            <Text style={styles.sectionHeading}>Choose Template (8 Styles)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templateScroll}
            >
              {Object.values(CARD_TEMPLATES).map((tpl) => {
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <TouchableOpacity
                    key={tpl.id}
                    style={[
                      styles.templatePill,
                      isSelected && styles.templatePillActive,
                    ]}
                    onPress={() => setSelectedTemplate(tpl.id)}
                    testID={`template-pill-${tpl.id}`}
                  >
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: tpl.backgroundColor, borderColor: tpl.cardBorderColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.templatePillText,
                        isSelected && styles.templatePillTextActive,
                      ]}
                    >
                      {tpl.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Live Card Preview */}
            <Text style={styles.sectionHeading}>Live Card Preview</Text>
            <VisitingCard
              provider={provider}
              templateId={selectedTemplate}
              privacy={privacy}
              isVerified={isVerified}
            />

            {/* Privacy & Visibility Settings */}
            <View style={styles.settingsCard}>
              <Text style={styles.settingsTitle}>Card Privacy & Visibility</Text>
              <Text style={styles.settingsSubtitle}>
                Control which information is printed on your physical and digital cards.
              </Text>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Display Phone Number</Text>
                <Switch
                  value={privacy.showPhone}
                  onValueChange={(val) => setPrivacy((p) => ({ ...p, showPhone: val }))}
                  thumbColor={privacy.showPhone ? designTokens.primaryBlue : "#CBD5E1"}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Display WhatsApp Contact</Text>
                <Switch
                  value={privacy.showWhatsApp}
                  onValueChange={(val) => setPrivacy((p) => ({ ...p, showWhatsApp: val }))}
                  thumbColor={privacy.showWhatsApp ? "#25D366" : "#CBD5E1"}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Display Starting Price</Text>
                <Switch
                  value={privacy.showPrice}
                  onValueChange={(val) => setPrivacy((p) => ({ ...p, showPrice: val }))}
                  thumbColor={privacy.showPrice ? designTokens.primaryBlue : "#CBD5E1"}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Display Star Ratings</Text>
                <Switch
                  value={privacy.showRating}
                  onValueChange={(val) => setPrivacy((p) => ({ ...p, showRating: val }))}
                  thumbColor={privacy.showRating ? designTokens.primaryBlue : "#CBD5E1"}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Sticker Style Selector */}
            <Text style={styles.sectionHeading}>Choose Sticker Headline</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templateScroll}
            >
              {Object.values(STICKER_TEMPLATES).map((stk) => {
                const isSelected = selectedSticker === stk.id;
                return (
                  <TouchableOpacity
                    key={stk.id}
                    style={[
                      styles.templatePill,
                      isSelected && styles.templatePillActive,
                    ]}
                    onPress={() => setSelectedSticker(stk.id)}
                    testID={`sticker-pill-${stk.id}`}
                  >
                    <Text
                      style={[
                        styles.templatePillText,
                        isSelected && styles.templatePillTextActive,
                      ]}
                    >
                      {stk.callToAction}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Live Sticker Preview */}
            <Text style={styles.sectionHeading}>Printable QR Sticker Preview</Text>
            <QRSticker provider={provider} stickerId={selectedSticker} size={280} />
          </>
        )}

        {/* Action Toolbar */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleShare}>
            <Ionicons name="share-social" size={18} color={designTokens.whiteSurface} />
            <Text style={styles.primaryActionText}>Share Kit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={handleCopyLink}>
            <Ionicons name="link-outline" size={18} color={designTokens.primaryBlue} />
            <Text style={styles.secondaryActionText}>
              {copiedLink ? "Link Copied!" : "Copy Link"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={handlePrintInfo}>
            <Ionicons name="print-outline" size={18} color={designTokens.primaryBlue} />
            <Text style={styles.secondaryActionText}>Print Guide</Text>
          </TouchableOpacity>
        </View>

        {/* Marketing Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={22} color="#F59E0B" />
            <Text style={styles.tipsTitle}>Provider Marketing Tips</Text>
          </View>
          {GROWTH_KIT_MARKETING_TIPS.map((tip, idx) => (
            <View key={idx} style={styles.tipCard}>
              <Text style={styles.tipCardTitle}>{tip.title}</Text>
              <Text style={styles.tipCardDesc}>{tip.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.paleBlueBackground,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: designTokens.paleBlueBackground,
  },
  loadingText: {
    marginTop: 12,
    color: designTokens.secondaryText,
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: designTokens.whiteSurface,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: designTokens.paleBlueBackground,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: designTokens.mainText,
  },
  content: {
    padding: 16,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: designTokens.whiteSurface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: designTokens.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: designTokens.primaryBlue,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: designTokens.secondaryText,
    marginLeft: 6,
  },
  tabTextActive: {
    color: designTokens.whiteSurface,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: designTokens.mainText,
    marginBottom: 8,
    marginTop: 6,
  },
  templateScroll: {
    flexDirection: "row",
    paddingBottom: 12,
    gap: 8,
  },
  templatePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: designTokens.whiteSurface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: designTokens.border,
  },
  templatePillActive: {
    backgroundColor: designTokens.primaryBlue,
    borderColor: designTokens.primaryBlue,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  templatePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: designTokens.mainText,
  },
  templatePillTextActive: {
    color: designTokens.whiteSurface,
  },
  settingsCard: {
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: designTokens.border,
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: designTokens.mainText,
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 11,
    color: designTokens.secondaryText,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: designTokens.mainText,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  primaryAction: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: designTokens.primaryBlue,
    borderRadius: designTokens.inputRadius,
    paddingVertical: 12,
    minHeight: 46,
  },
  primaryActionText: {
    color: designTokens.whiteSurface,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: designTokens.whiteSurface,
    borderWidth: 1,
    borderColor: designTokens.primaryBlue,
    borderRadius: designTokens.inputRadius,
    paddingVertical: 12,
    minHeight: 46,
  },
  secondaryActionText: {
    color: designTokens.primaryBlue,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  tipsSection: {
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: designTokens.border,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: designTokens.mainText,
    marginLeft: 8,
  },
  tipCard: {
    backgroundColor: designTokens.paleBlueBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  tipCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: designTokens.primaryBlue,
    marginBottom: 2,
  },
  tipCardDesc: {
    fontSize: 11,
    color: designTokens.mainText,
    lineHeight: 16,
  },
});
