/**
 * Card templates and Provider Growth Kit configuration for Seivio.
 * Defines 8 visually distinct visiting card templates and 4 QR sticker designs.
 */

import type { ProviderDetail } from "@/lib/providers";

export type CardTemplateId =
  | "professional"
  | "premium"
  | "minimal"
  | "modern"
  | "traditional"
  | "corporate"
  | "personal"
  | "local_provider";

export type CardPrivacySettings = {
  showPhone: boolean;
  showWhatsApp: boolean;
  showEmail: boolean;
  showRating: boolean;
  showPrice: boolean;
  showLocation: boolean;
};

export const DEFAULT_PRIVACY_SETTINGS: CardPrivacySettings = {
  showPhone: true,
  showWhatsApp: true,
  showEmail: true,
  showRating: true,
  showPrice: true,
  showLocation: true,
};

export type CardTemplateDef = {
  id: CardTemplateId;
  name: string;
  tagline: string;
  backgroundColor: string;
  cardBorderColor: string;
  headerColor: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  qrPosition: "bottom-right" | "side-column" | "top-right" | "centered";
  avatarShape: "circle" | "rounded-square" | "square" | "banner";
  fontHeadingStyle: "bold" | "heavy" | "serif" | "clean";
  hasFrame: boolean;
  hasBannerHeader: boolean;
};

export const CARD_TEMPLATES: Record<CardTemplateId, CardTemplateDef> = {
  professional: {
    id: "professional",
    name: "Professional",
    tagline: "Structured & Authoritative",
    backgroundColor: "#FFFFFF",
    cardBorderColor: "#1D4ED8",
    headerColor: "#172B4D",
    textColor: "#172B4D",
    mutedTextColor: "#64748B",
    accentColor: "#2563EB",
    qrPosition: "bottom-right",
    avatarShape: "rounded-square",
    fontHeadingStyle: "bold",
    hasFrame: true,
    hasBannerHeader: false,
  },
  premium: {
    id: "premium",
    name: "Royal Premium",
    tagline: "Rich Deep Blue & Gold Accents",
    backgroundColor: "#0F172A",
    cardBorderColor: "#3B82F6",
    headerColor: "#FFFFFF",
    textColor: "#F8FAFC",
    mutedTextColor: "#94A3B8",
    accentColor: "#F59E0B",
    qrPosition: "bottom-right",
    avatarShape: "circle",
    fontHeadingStyle: "heavy",
    hasFrame: true,
    hasBannerHeader: false,
  },
  minimal: {
    id: "minimal",
    name: "Minimalist",
    tagline: "Pure Whitespace & Understated Elegance",
    backgroundColor: "#FFFFFF",
    cardBorderColor: "#E2E8F0",
    headerColor: "#0F172A",
    textColor: "#334155",
    mutedTextColor: "#94A3B8",
    accentColor: "#0F172A",
    qrPosition: "side-column",
    avatarShape: "square",
    fontHeadingStyle: "clean",
    hasFrame: false,
    hasBannerHeader: false,
  },
  modern: {
    id: "modern",
    name: "Modern Creative",
    tagline: "Dynamic Pill Badges & High Contrast",
    backgroundColor: "#EFF6FF",
    cardBorderColor: "#BFDBFE",
    headerColor: "#1E40AF",
    textColor: "#1E293B",
    mutedTextColor: "#64748B",
    accentColor: "#2563EB",
    qrPosition: "bottom-right",
    avatarShape: "rounded-square",
    fontHeadingStyle: "bold",
    hasFrame: false,
    hasBannerHeader: false,
  },
  traditional: {
    id: "traditional",
    name: "Traditional Craft",
    tagline: "Framed Heritage & Trustworthy Dignity",
    backgroundColor: "#FFFDF9",
    cardBorderColor: "#D97706",
    headerColor: "#78350F",
    textColor: "#451A03",
    mutedTextColor: "#92400E",
    accentColor: "#B45309",
    qrPosition: "side-column",
    avatarShape: "circle",
    fontHeadingStyle: "serif",
    hasFrame: true,
    hasBannerHeader: false,
  },
  corporate: {
    id: "corporate",
    name: "Corporate Enterprise",
    tagline: "Top Brand Band & Formal Tabular Grid",
    backgroundColor: "#FFFFFF",
    cardBorderColor: "#CBD5E1",
    headerColor: "#FFFFFF",
    textColor: "#0F172A",
    mutedTextColor: "#475569",
    accentColor: "#1E3A8A",
    qrPosition: "bottom-right",
    avatarShape: "square",
    fontHeadingStyle: "bold",
    hasFrame: true,
    hasBannerHeader: true,
  },
  personal: {
    id: "personal",
    name: "Personal Brand",
    tagline: "Hero Portrait & Direct Creator Presence",
    backgroundColor: "#F8FAFC",
    cardBorderColor: "#E2E8F0",
    headerColor: "#0F172A",
    textColor: "#1E293B",
    mutedTextColor: "#64748B",
    accentColor: "#4F46E5",
    qrPosition: "bottom-right",
    avatarShape: "circle",
    fontHeadingStyle: "heavy",
    hasFrame: false,
    hasBannerHeader: false,
  },
  local_provider: {
    id: "local_provider",
    name: "Local Quick-Service",
    tagline: "High-Visibility Contact & Starting Rate",
    backgroundColor: "#FEFCE8",
    cardBorderColor: "#EAB308",
    headerColor: "#713F12",
    textColor: "#422006",
    mutedTextColor: "#854D0E",
    accentColor: "#CA8A04",
    qrPosition: "side-column",
    avatarShape: "rounded-square",
    fontHeadingStyle: "bold",
    hasFrame: true,
    hasBannerHeader: false,
  },
};

export type StickerTemplateId =
  | "scan_to_contact"
  | "find_me_on_seivio"
  | "view_my_services"
  | "book_provider";

export type StickerTemplateDef = {
  id: StickerTemplateId;
  callToAction: string;
  subtext: string;
  accentColor: string;
  badgeText: string;
};

export const STICKER_TEMPLATES: Record<StickerTemplateId, StickerTemplateDef> = {
  scan_to_contact: {
    id: "scan_to_contact",
    callToAction: "Scan to Contact",
    subtext: "Call, WhatsApp & verified profile directly on Seivio",
    accentColor: "#2563EB",
    badgeText: "Instant Connect",
  },
  find_me_on_seivio: {
    id: "find_me_on_seivio",
    callToAction: "Find Me on Seivio",
    subtext: "Verified local services marketplace",
    accentColor: "#1D4ED8",
    badgeText: "Verified Provider",
  },
  view_my_services: {
    id: "view_my_services",
    callToAction: "View My Services & Rates",
    subtext: "Transparent pricing, service photos & reviews",
    accentColor: "#059669",
    badgeText: "Full Price List",
  },
  book_provider: {
    id: "book_provider",
    callToAction: "Book This Provider",
    subtext: "Quick response & direct communication",
    accentColor: "#7C3AED",
    badgeText: "Top Rated",
  },
};

/**
 * Returns a stable, canonical public URL for a provider profile.
 * Structure: https://seivio.app/p/{slug}
 */
export function getPublicProviderUrl(slug: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_SEIVIO_WEB_URL || "https://seivio.app";
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanSlug = encodeURIComponent(slug.trim());
  return `${cleanBase}/p/${cleanSlug}`;
}

/** Marketing advice for local service providers */
export const GROWTH_KIT_MARKETING_TIPS = [
  {
    title: "Stick QR Stickers on Invoices & Vehicles",
    description:
      "Paste your QR sticker on work vans, billing invoices, or your service tools so happy customers can scan and save you immediately.",
  },
  {
    title: "Set Your Card as WhatsApp Business DP / Story",
    description:
      "Save your digital card as an image and share it on WhatsApp status every Monday to remind contacts of your active availability.",
  },
  {
    title: "Collect Verified Reviews Right After a Job",
    description:
      "Right after completing a successful repair or service, ask the customer to scan your card and leave a 5-star review.",
  },
  {
    title: "Hand Out Cards at Community Centers & Societies",
    description:
      "Print your card in standard visiting-card size (3.5 × 2 inches) and leave them with apartment managers and building security.",
  },
];
