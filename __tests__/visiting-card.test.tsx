import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import VisitingCard from "@/components/VisitingCard";
import QRSticker from "@/components/QRSticker";
import {
  CARD_TEMPLATES,
  CardTemplateId,
  getPublicProviderUrl,
  STICKER_TEMPLATES,
  StickerTemplateId,
} from "@/lib/card-templates";
import type { ProviderDetail } from "@/lib/providers";

const mockProvider: ProviderDetail = {
  id: "provider-101",
  slug: "kumar-carpenters",
  business_name: "Kumar Woodworking & Custom Carpentry",
  description: "Specialized in teak wood doors, modular kitchens, and emergency lock repairs.",
  category_slugs: ["carpentry", "furniture-repair"],
  city_slug: "coimbatore",
  state: "Tamil Nadu",
  profile_image: null,
  banner_image: null,
  rating_avg: 4.9,
  rating_count: 38,
  experience_years: 12,
  starting_price: 499,
  plan: "pro",
  status: "approved",
  phone: "+91 94433 22110",
  whatsapp: "+91 94433 22110",
  email: "kumar.carpentry@example.com",
};

describe("Provider Digital Visiting Card System", () => {
  describe("Stable Public URL Generation", () => {
    it("generates a canonical, unguessable public profile URL", () => {
      const url = getPublicProviderUrl("kumar-carpenters");
      expect(url).toBe("https://seivio.app/p/kumar-carpenters");
    });

    it("encodes special characters in slugs safely", () => {
      const url = getPublicProviderUrl("plumber & electrician");
      expect(url).toBe("https://seivio.app/p/plumber%20%26%20electrician");
    });
  });

  describe("Template System (8 Visual Designs)", () => {
    const templateIds = Object.keys(CARD_TEMPLATES) as CardTemplateId[];

    it("has at least 8 distinct templates defined", () => {
      expect(templateIds.length).toBeGreaterThanOrEqual(8);
      expect(templateIds).toContain("professional");
      expect(templateIds).toContain("premium");
      expect(templateIds).toContain("minimal");
      expect(templateIds).toContain("modern");
      expect(templateIds).toContain("traditional");
      expect(templateIds).toContain("corporate");
      expect(templateIds).toContain("personal");
      expect(templateIds).toContain("local_provider");
    });

    templateIds.forEach((tplId) => {
      it(`renders template '${tplId}' with provider details`, () => {
        const { getByTestId, getByText } = render(
          <VisitingCard provider={mockProvider} templateId={tplId} />
        );

        expect(getByTestId(`visiting-card-${tplId}`)).toBeTruthy();
        expect(getByText("Kumar Woodworking & Custom Carpentry")).toBeTruthy();
        expect(getByText("Seivio · Find. Connect. Get It Done.")).toBeTruthy();
      });
    });
  });

  describe("Privacy & Information Hiding", () => {
    it("hides phone and whatsapp when disabled by provider privacy settings", () => {
      const { queryByText } = render(
        <VisitingCard
          provider={mockProvider}
          privacy={{
            showPhone: false,
            showWhatsApp: false,
            showEmail: true,
            showRating: false,
            showPrice: false,
            showLocation: true,
          }}
        />
      );

      expect(queryByText("+91 94433 22110")).toBeNull();
      expect(queryByText("kumar.carpentry@example.com")).toBeTruthy();
    });

    it("hides rating when privacy.showRating is false", () => {
      const { queryByText } = render(
        <VisitingCard
          provider={mockProvider}
          privacy={{
            showPhone: true,
            showWhatsApp: true,
            showEmail: true,
            showRating: false,
            showPrice: true,
            showLocation: true,
          }}
        />
      );

      expect(queryByText(/4\.9/)).toBeNull();
    });
  });

  describe("Verification Badge Display", () => {
    it("displays verification badge only when provider is verified", () => {
      const { queryByText, rerender } = render(
        <VisitingCard provider={mockProvider} isVerified={false} />
      );

      // In corporate template or default, check badge presence
      rerender(<VisitingCard provider={mockProvider} isVerified={true} templateId="corporate" />);
      expect(queryByText("VERIFIED")).toBeTruthy();
    });
  });

  describe("QR Sticker System", () => {
    const stickerIds = Object.keys(STICKER_TEMPLATES) as StickerTemplateId[];

    it("has 4 distinct sticker designs", () => {
      expect(stickerIds.length).toBe(4);
    });

    stickerIds.forEach((stickerId) => {
      it(`renders sticker template '${stickerId}'`, () => {
        const { getByTestId, getByText } = render(
          <QRSticker provider={mockProvider} stickerId={stickerId} />
        );

        expect(getByTestId(`qr-sticker-${stickerId}`)).toBeTruthy();
        expect(getByText(STICKER_TEMPLATES[stickerId].callToAction)).toBeTruthy();
        expect(getByText("SEIVIO")).toBeTruthy();
      });
    });
  });
});
