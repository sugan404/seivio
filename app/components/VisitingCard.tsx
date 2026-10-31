import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { ProviderDetail } from "@/lib/providers";
import {
  CARD_TEMPLATES,
  CardPrivacySettings,
  CardTemplateId,
  DEFAULT_PRIVACY_SETTINGS,
  getPublicProviderUrl,
} from "@/lib/card-templates";
import QRCodeView from "@/components/QRCodeView";
import StarRating from "@/components/StarRating";
import { getInitials } from "@/components/ProviderCard";

type Props = {
  provider: ProviderDetail;
  templateId?: CardTemplateId;
  privacy?: CardPrivacySettings;
  isVerified?: boolean;
  scale?: number;
};

export default function VisitingCard({
  provider,
  templateId = "professional",
  privacy = DEFAULT_PRIVACY_SETTINGS,
  isVerified = false,
  scale = 1,
}: Props) {
  const tpl = CARD_TEMPLATES[templateId] || CARD_TEMPLATES.professional;
  const qrUrl = getPublicProviderUrl(provider.slug || "provider");

  const phone = provider.phone ?? provider.whatsapp ?? null;
  const whatsapp = provider.whatsapp ?? provider.phone ?? null;
  const email = provider.email ?? null;
  const location = [provider.city_slug, provider.state].filter(Boolean).join(", ");
  const profession = (provider.category_slugs ?? []).slice(0, 2).join(" · ").replace(/-/g, " ");

  const avatarRadius =
    tpl.avatarShape === "circle" ? 32 : tpl.avatarShape === "rounded-square" ? 12 : 4;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: tpl.backgroundColor,
          borderColor: tpl.cardBorderColor,
          borderWidth: tpl.hasFrame ? 2 : 1,
          transform: scale !== 1 ? [{ scale }] : undefined,
        },
      ]}
      testID={`visiting-card-${templateId}`}
    >
      {/* Optional Corporate Top Band */}
      {tpl.hasBannerHeader ? (
        <View style={[styles.corporateHeader, { backgroundColor: tpl.accentColor }]}>
          <Text style={styles.corporateBrandText}>SEIVIO VERIFIED NETWORK</Text>
          {isVerified ? (
            <View style={styles.verifiedPill}>
              <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
              <Text style={styles.verifiedPillText}>VERIFIED</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.cardBody}>
        {/* Top identity row */}
        <View style={styles.topRow}>
          <View style={styles.identityCol}>
            {provider.profile_image ? (
              <Image
                source={{ uri: provider.profile_image }}
                style={[
                  styles.avatar,
                  { borderRadius: avatarRadius, borderColor: tpl.accentColor },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarPlaceholder,
                  { borderRadius: avatarRadius, backgroundColor: tpl.accentColor + "20" },
                ]}
              >
                <Text style={[styles.initials, { color: tpl.accentColor }]}>
                  {getInitials(provider.business_name)}
                </Text>
              </View>
            )}

            <View style={styles.titleBox}>
              <View style={styles.nameRow}>
                <Text
                  style={[
                    styles.businessName,
                    { color: tpl.headerColor },
                    tpl.fontHeadingStyle === "serif" ? styles.serifFont : null,
                  ]}
                  numberOfLines={2}
                >
                  {provider.business_name}
                </Text>
                {isVerified && !tpl.hasBannerHeader ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={tpl.accentColor}
                    style={styles.checkIcon}
                  />
                ) : null}
              </View>

              {profession ? (
                <Text
                  style={[styles.profession, { color: tpl.accentColor }]}
                  numberOfLines={1}
                >
                  {profession.toUpperCase()}
                </Text>
              ) : null}
            </View>
          </View>

          {/* QR code placed in top-right or side layout */}
          {tpl.qrPosition === "top-right" || tpl.qrPosition === "side-column" ? (
            <View style={styles.sideQrContainer}>
              <QRCodeView
                value={qrUrl}
                size={70}
                color={tpl.backgroundColor === "#0F172A" ? "#0F172A" : tpl.textColor}
                backgroundColor="#FFFFFF"
                quietZoneModules={1}
              />
              <Text style={[styles.qrCaption, { color: tpl.mutedTextColor }]}>Scan to View</Text>
            </View>
          ) : null}
        </View>

        {/* Bio / Description */}
        {provider.description ? (
          <Text
            style={[styles.description, { color: tpl.mutedTextColor }]}
            numberOfLines={2}
          >
            {provider.description}
          </Text>
        ) : null}

        {/* Trust Badges / Rating / Pricing */}
        <View style={styles.metaRow}>
          {privacy.showRating && provider.rating_avg ? (
            <View style={styles.metaBadge}>
              <StarRating value={Math.round(provider.rating_avg)} size={12} />
              <Text style={[styles.metaText, { color: tpl.textColor }]}>
                {provider.rating_avg.toFixed(1)} ({provider.rating_count ?? 0})
              </Text>
            </View>
          ) : null}

          {privacy.showPrice && provider.starting_price ? (
            <View style={styles.metaBadge}>
              <Ionicons name="pricetag-outline" size={12} color={tpl.accentColor} />
              <Text style={[styles.metaText, { color: tpl.textColor }]}>
                from ₹{Number(provider.starting_price).toLocaleString("en-IN")}
              </Text>
            </View>
          ) : null}

          {privacy.showLocation && location ? (
            <View style={styles.metaBadge}>
              <Ionicons name="location-outline" size={12} color={tpl.mutedTextColor} />
              <Text style={[styles.metaText, { color: tpl.mutedTextColor }]} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: tpl.cardBorderColor }]} />

        {/* Bottom Section: Contact details and Bottom QR */}
        <View style={styles.bottomRow}>
          <View style={styles.contactList}>
            {privacy.showPhone && phone ? (
              <View style={styles.contactItem}>
                <Ionicons name="call" size={13} color={tpl.accentColor} />
                <Text style={[styles.contactText, { color: tpl.textColor }]} numberOfLines={1}>
                  {phone}
                </Text>
              </View>
            ) : null}

            {privacy.showWhatsApp && whatsapp ? (
              <View style={styles.contactItem}>
                <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
                <Text style={[styles.contactText, { color: tpl.textColor }]} numberOfLines={1}>
                  {whatsapp}
                </Text>
              </View>
            ) : null}

            {privacy.showEmail && email ? (
              <View style={styles.contactItem}>
                <Ionicons name="mail" size={13} color={tpl.mutedTextColor} />
                <Text style={[styles.contactText, { color: tpl.textColor }]} numberOfLines={1}>
                  {email}
                </Text>
              </View>
            ) : null}
          </View>

          {tpl.qrPosition === "bottom-right" ? (
            <View style={styles.bottomQrWrapper}>
              <QRCodeView
                value={qrUrl}
                size={64}
                color="#0F172A"
                backgroundColor="#FFFFFF"
                quietZoneModules={1}
              />
              <Text style={[styles.qrCaption, { color: tpl.mutedTextColor }]}>Scan to Hire</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Footer Branding */}
      <View style={[styles.cardFooter, { borderTopColor: tpl.cardBorderColor }]}>
        <Text style={[styles.footerTagline, { color: tpl.mutedTextColor }]}>
          Seivio · Find. Connect. Get It Done.
        </Text>
        <Text style={[styles.footerUrl, { color: tpl.accentColor }]}>seivio.app</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 14,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
    marginBottom: 16,
  },
  corporateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  corporateBrandText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    marginLeft: 3,
  },
  cardBody: {
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  identityCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderWidth: 1.5,
    marginRight: 12,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 18,
    fontWeight: "800",
  },
  titleBox: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  businessName: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  checkIcon: {
    marginLeft: 4,
  },
  serifFont: {
    fontFamily: "serif",
  },
  profession: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  sideQrContainer: {
    alignItems: "center",
    marginLeft: 10,
  },
  bottomQrWrapper: {
    alignItems: "center",
    marginLeft: 12,
  },
  qrCaption: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 3,
    textAlign: "center",
  },
  description: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(100, 116, 139, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  divider: {
    height: 1,
    width: "100%",
    opacity: 0.3,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactList: {
    flex: 1,
    justifyContent: "center",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerTagline: {
    fontSize: 10,
    fontWeight: "500",
  },
  footerUrl: {
    fontSize: 10,
    fontWeight: "700",
  },
});
