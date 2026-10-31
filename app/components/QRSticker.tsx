import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { ProviderDetail } from "@/lib/providers";
import {
  getPublicProviderUrl,
  STICKER_TEMPLATES,
  StickerTemplateId,
} from "@/lib/card-templates";
import QRCodeView from "@/components/QRCodeView";

type Props = {
  provider: ProviderDetail;
  stickerId?: StickerTemplateId;
  size?: number;
};

export default function QRSticker({
  provider,
  stickerId = "scan_to_contact",
  size = 260,
}: Props) {
  const sticker = STICKER_TEMPLATES[stickerId] || STICKER_TEMPLATES.scan_to_contact;
  const qrUrl = getPublicProviderUrl(provider.slug || "provider");

  return (
    <View
      style={[
        styles.stickerContainer,
        {
          width: size,
          borderColor: sticker.accentColor,
        },
      ]}
      testID={`qr-sticker-${stickerId}`}
    >
      {/* Top Banner with Cut Guideline / Badge */}
      <View style={[styles.headerBanner, { backgroundColor: sticker.accentColor }]}>
        <Ionicons name="sparkles" size={12} color="#FFFFFF" />
        <Text style={styles.badgeText}>{sticker.badgeText.toUpperCase()}</Text>
      </View>

      <View style={styles.innerContent}>
        <Text style={[styles.ctaText, { color: sticker.accentColor }]}>
          {sticker.callToAction}
        </Text>

        <Text style={styles.providerName} numberOfLines={1}>
          {provider.business_name}
        </Text>

        <View style={styles.qrWrapper}>
          <QRCodeView
            value={qrUrl}
            size={size * 0.55}
            color="#0F172A"
            backgroundColor="#FFFFFF"
            quietZoneModules={2}
          />
        </View>

        <Text style={styles.subtext}>{sticker.subtext}</Text>

        <View style={styles.footerBranding}>
          <Text style={styles.brandTitle}>SEIVIO</Text>
          <Text style={styles.brandTagline}>Find. Connect. Get It Done.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerBanner: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginLeft: 4,
  },
  innerContent: {
    padding: 16,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 2,
  },
  providerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 12,
  },
  qrWrapper: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  subtext: {
    fontSize: 10,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  footerBranding: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
    width: "100%",
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563EB",
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 1,
  },
});
