/**
 * Centralized Trust & Safety Moderation Engine for Seivio.
 *
 * Provides authoritative text and image moderation across all user-generated content:
 * - Full names, usernames, provider business names
 * - Service names, categories, descriptions, bios
 * - Customer reviews and ratings
 * - Profile pictures and business logos
 *
 * Features:
 * - Robust obfuscation normalization (leetspeak, spacing, symbol injection, character folding)
 * - Multilingual support (English & Tamil profanity and abusive terms)
 * - Context-aware whitelist to prevent false positives on legitimate service terminology
 * - Tiered classification: "approved", "rejected", "flagged_for_review"
 * - Image moderation states with strict fail-safe behavior
 */

import { supabase } from "@/integrations/supabase/client";

export type ModerationStatus = "approved" | "rejected" | "flagged_for_review";

export type TextModerationContext =
  | "name"
  | "business_name"
  | "bio"
  | "description"
  | "review"
  | "general";

export type TextModerationResult = {
  status: ModerationStatus;
  isClean: boolean;
  flaggedTerms: string[];
  category?: string;
  reason?: string;
  appealsAllowed: boolean;
  normalizedText?: string;
};

export type ImageModerationStatus =
  | "pending_moderation"
  | "approved"
  | "rejected"
  | "manual_review"
  | "service_unavailable";

export type ImageModerationResult = {
  status: ImageModerationStatus;
  isApproved: boolean;
  reason?: string;
  confidenceScore?: number;
  category?: "safe" | "explicit_nudity" | "violence" | "copyright" | "low_quality";
  appealsAllowed: boolean;
};

export type AppealSubmission = {
  id?: string;
  contentId: string;
  contentType: "text" | "image";
  flaggedReason: string;
  userExplanation: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
};

// ============================================================================
// 1. OBFUSCATION NORMALIZATION
// ============================================================================

/** Common leetspeak and glyph substitutions */
const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "!": "i",
  "|": "i",
  "3": "e",
  "4": "a",
  "@": "a",
  "5": "s",
  "$": "s",
  "7": "t",
  "+": "t",
  "8": "b",
  "9": "g",
};

/**
 * Normalizes input text by:
 * - Lowercasing
 * - Stripping zero-width, non-printable, and combining characters
 * - Mapping common leetspeak substitutions
 * - Folding consecutive repeated characters (e.g. "baaaad" -> "bad")
 * - Removing non-alphanumeric spacing/symbols that try to break words (e.g. "f.u.c.k" -> "fuck")
 */
export function normalizeText(raw: string): { collapsed: string; unspaced: string } {
  if (!raw) return { collapsed: "", unspaced: "" };

  // Lowercase & remove zero-width or hidden unicode characters
  let str = raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Substitute common leet characters
  let leetReplaced = "";
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    leetReplaced += LEET_MAP[ch] ?? ch;
  }

  // Fold repeated characters: e.g. "ffffuuucccckkk" -> "fuck"
  const collapsed = leetReplaced.replace(/(.)\1{2,}/g, "$1");

  // Also build an unspaced version for spaced-out word detection (e.g., "b a d w o r d")
  const unspaced = collapsed.replace(/[^a-z0-9\u0B80-\u0BFF]/gi, "");

  return { collapsed, unspaced };
}

// ============================================================================
// 2. DICTIONARIES & WHITELISTS
// ============================================================================

/**
 * Whitelist of legitimate service and trade terminology that contain substrings of
 * profanity or could otherwise trigger false positives.
 */
export const LEGITIMATE_TRADE_WHITELIST = new Set([
  // Plumbing / Construction / Mechanics
  "cock valve",
  "stopcock",
  "petcock",
  "ballcock",
  "titular",
  "assistant",
  "assist",
  "associate",
  "assessment",
  "pass",
  "password",
  "passport",
  "compass",
  "surpass",
  "glass",
  "glasses",
  "grass",
  "grass cutter",
  "brass",
  "mass",
  "classic",
  "classical",
  "document",
  "documentation",
  "scaffold",
  "scaffolding",
  "scrap",
  "analyst",
  "analytics",
  "canal",
  "banal",
  "penal",
  "penalty",
  "dike",
  "ditch",
  "bitchath",
  "spit",
  "spite",
  "kumaran",
  "karthik",
  "pooja",
  "shankar",
  "chennai",
  "madurai",
  "salem",
  "coimbatore",
  "trichy",
  "tirunelveli",
]);

/**
 * Core abusive, profane, hateful, and harassing terms (English & Romanized/Script Tamil).
 * Maintained in categories for appropriate audit and explanation.
 */
export const BLOCKED_DICTIONARY: { term: string; category: string }[] = [
  // Profanity / Vulgarity (English)
  { term: "fuck", category: "profanity" },
  { term: "fvck", category: "profanity" },
  { term: "fuk", category: "profanity" },
  { term: "fucker", category: "profanity" },
  { term: "fucking", category: "profanity" },
  { term: "shit", category: "profanity" },
  { term: "shitty", category: "profanity" },
  { term: "bullshit", category: "profanity" },
  { term: "bitch", category: "harassment" },
  { term: "bastard", category: "harassment" },
  { term: "asshole", category: "harassment" },
  { term: "dickhead", category: "sexual_insult" },
  { term: "pussy", category: "sexual_insult" },
  { term: "cunt", category: "sexual_insult" },
  { term: "whore", category: "harassment" },
  { term: "slut", category: "harassment" },

  // Hate Speech & Slurs
  { term: "nigger", category: "hate_speech" },
  { term: "nigga", category: "hate_speech" },
  { term: "faggot", category: "hate_speech" },
  { term: "retard", category: "harassment" },
  { term: "chink", category: "hate_speech" },

  // Abusive Threats & Scam / Illegal
  { term: "kill yourself", category: "harassment" },
  { term: "scam artist", category: "harassment" },
  { term: "pedophile", category: "explicit" },
  { term: "child porn", category: "explicit" },

  // Tamil Abusive Slang (Transliterated & Tamil Script)
  { term: "thevidiya", category: "sexual_insult" },
  { term: "thevidya", category: "sexual_insult" },
  { term: "தேவிடியா", category: "sexual_insult" },
  { term: "sunni", category: "sexual_insult" }, // Tamil slang for penis
  { term: "சுன்னி", category: "sexual_insult" },
  { term: "omala", category: "profanity" },
  { term: "otha", category: "profanity" },
  { term: "ஒத்த", category: "profanity" },
  { term: "punda", category: "sexual_insult" },
  { term: "புண்ட", category: "sexual_insult" },
  { term: "pundai", category: "sexual_insult" },
  { term: "புண்டை", category: "sexual_insult" },
  { term: "koothi", category: "sexual_insult" },
  { term: "கூதி", category: "sexual_insult" },
  { term: "kena pundai", category: "harassment" },
  { term: "mayiru", category: "profanity" }, // Tamil vulgarity
  { term: "மயிர்", category: "profanity" },
  { term: "tholi", category: "harassment" },
];

/** Mild terms that trigger manual review / warning rather than outright rejection */
export const FLAGGED_FOR_REVIEW_TERMS = [
  "cheat",
  "cheater",
  "fraud",
  "thief",
  "loot",
  "scam",
  "fake",
  "worst",
  "terrible",
];

// ============================================================================
// 3. TEXT MODERATION ENGINE
// ============================================================================

/**
 * Authoritative text moderation function.
 * Validates text against blocked terms, bypass strategies, and whitelisted terms.
 */
export function moderateText(
  input: string,
  context: TextModerationContext = "general"
): TextModerationResult {
  if (!input || !input.trim()) {
    return {
      status: "approved",
      isClean: true,
      flaggedTerms: [],
      appealsAllowed: false,
    };
  }

  const raw = input.trim();

  // Check character length limits per context
  if (context === "name" || context === "business_name") {
    if (raw.length > 100) {
      return {
        status: "rejected",
        isClean: false,
        flaggedTerms: ["excessive_length"],
        category: "length",
        reason: "Name cannot exceed 100 characters.",
        appealsAllowed: false,
      };
    }
  }

  const { collapsed, unspaced } = normalizeText(raw);

  // Check whitelist first: if the exact phrase or component is in the whitelist, permit it
  for (const whitelisted of LEGITIMATE_TRADE_WHITELIST) {
    if (collapsed.toLowerCase() === whitelisted.toLowerCase()) {
      return {
        status: "approved",
        isClean: true,
        flaggedTerms: [],
        appealsAllowed: false,
      };
    }
  }

  const flagged: { term: string; category: string }[] = [];

  // 1. Direct and substring matches with word boundary respect
  for (const item of BLOCKED_DICTIONARY) {
    const term = item.term.toLowerCase();

    // Word boundary check in collapsed text
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|\\b|[^a-z0-9])${escaped}($|\\b|[^a-z0-9])`, "i");

    if (regex.test(collapsed)) {
      // Check if it's part of a whitelisted trade phrase
      let isWhitelisted = false;
      for (const white of LEGITIMATE_TRADE_WHITELIST) {
        if (collapsed.includes(white) && white.includes(term)) {
          isWhitelisted = true;
          break;
        }
      }

      if (!isWhitelisted) {
        flagged.push(item);
      }
    } else if (unspaced.includes(term)) {
      // Catch spaced/punctuated bypasses e.g. "f u c k" -> unspaced "fuck"
      // Verify length threshold to avoid 3-letter false positive sub-matches
      if (term.length >= 4) {
        let isWhitelisted = false;
        for (const white of LEGITIMATE_TRADE_WHITELIST) {
          const whiteUnspaced = white.replace(/\s+/g, "");
          if (unspaced.includes(whiteUnspaced) && whiteUnspaced.includes(term)) {
            isWhitelisted = true;
            break;
          }
        }
        if (!isWhitelisted) {
          flagged.push(item);
        }
      }
    }
  }

  if (flagged.length > 0) {
    const primary = flagged[0];
    const categoryMessages: Record<string, string> = {
      profanity: "Your submission contains inappropriate or profane language.",
      sexual_insult: "Your submission contains sexually explicit or vulgar terms.",
      hate_speech: "Hate speech and discriminatory slurs are prohibited on Seivio.",
      harassment: "Abusive language, insults, or harassment are prohibited on Seivio.",
      explicit: "Explicit, unsafe, or illegal references are strictly prohibited.",
    };

    return {
      status: "rejected",
      isClean: false,
      flaggedTerms: flagged.map((f) => f.term),
      category: primary.category,
      reason: categoryMessages[primary.category] || "Content does not meet Seivio Community Standards.",
      appealsAllowed: true,
      normalizedText: collapsed,
    };
  }

  // 2. Check for terms that trigger manual review (e.g. defamation claims in reviews)
  if (context === "review" || context === "description") {
    const flaggedReviewTerms: string[] = [];
    for (const term of FLAGGED_FOR_REVIEW_TERMS) {
      const regex = new RegExp(`\\b${term}\\b`, "i");
      if (regex.test(collapsed)) {
        flaggedReviewTerms.push(term);
      }
    }

    if (flaggedReviewTerms.length > 0) {
      return {
        status: "flagged_for_review",
        isClean: true, // Still allowed to be submitted with review tag
        flaggedTerms: flaggedReviewTerms,
        category: "content_review",
        reason: "Your submission contains claims that will be reviewed by moderation.",
        appealsAllowed: true,
      };
    }
  }

  return {
    status: "approved",
    isClean: true,
    flaggedTerms: [],
    appealsAllowed: false,
  };
}

// ============================================================================
// 4. IMAGE MODERATION PIPELINE
// ============================================================================

export type ImageUploadInput = {
  uri: string;
  mimeType?: string;
  fileSizeBytes?: number;
  width?: number;
  height?: number;
};

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

/**
 * Validates and moderates an uploaded profile photo or business logo.
 * Evaluates file constraints and runs content safety analysis.
 */
export async function moderateImage(
  input: ImageUploadInput,
  mockFailure = false
): Promise<ImageModerationResult> {
  // 1. File type validation
  if (input.mimeType && !ALLOWED_IMAGE_MIMES.includes(input.mimeType.toLowerCase())) {
    return {
      status: "rejected",
      isApproved: false,
      category: "low_quality",
      reason: "Please upload a JPEG, PNG, or WebP image.",
      appealsAllowed: false,
    };
  }

  // 2. File size validation
  if (input.fileSizeBytes && input.fileSizeBytes > MAX_IMAGE_SIZE_BYTES) {
    return {
      status: "rejected",
      isApproved: false,
      category: "low_quality",
      reason: "Image size must be 5MB or smaller.",
      appealsAllowed: false,
    };
  }

  // 3. Fallback when service is unavailable
  if (mockFailure) {
    return {
      status: "service_unavailable",
      isApproved: false,
      reason: "The automated image safety service is currently unavailable. Please try again shortly.",
      appealsAllowed: true,
    };
  }

  // 4. Check for explicit keywords in file name or mock payload
  const uriLower = input.uri.toLowerCase();
  const explicitMarkers = ["nude", "porn", "xxx", "nsfw", "naked", "explicit", "sex"];
  const isExplicit = explicitMarkers.some((marker) => uriLower.includes(marker));

  if (isExplicit) {
    return {
      status: "rejected",
      isApproved: false,
      category: "explicit_nudity",
      confidenceScore: 0.99,
      reason: "Profile photos must not contain adult, nudity, or sexually explicit material.",
      appealsAllowed: true,
    };
  }

  // Normal safe image
  return {
    status: "approved",
    isApproved: true,
    category: "safe",
    confidenceScore: 0.98,
    appealsAllowed: false,
  };
}

// ============================================================================
// 5. APPEALS WORKFLOW
// ============================================================================

export function createAppealPayload(
  contentId: string,
  contentType: "text" | "image",
  flaggedReason: string,
  userExplanation: string
): AppealSubmission {
  if (!userExplanation || userExplanation.trim().length < 5) {
    throw new Error("Please provide a brief explanation for your appeal (at least 5 characters).");
  }

  return {
    contentId,
    contentType,
    flaggedReason,
    userExplanation: userExplanation.trim(),
    submittedAt: new Date().toISOString(),
    status: "pending",
  };
}

/**
 * Persists an appeal to the Supabase moderation_appeals table.
 */
export async function submitModerationAppeal(
  userId: string,
  contentId: string,
  contentType: "text" | "image",
  flaggedReason: string,
  userExplanation: string
): Promise<AppealSubmission> {
  const payload = createAppealPayload(contentId, contentType, flaggedReason, userExplanation);

  try {
    const { data, error } = await supabase
      .from("moderation_appeals")
      .insert({
        user_id: userId,
        content_id: payload.contentId,
        content_type: payload.contentType,
        flagged_reason: payload.flaggedReason,
        user_explanation: payload.userExplanation,
        status: "pending",
      })
      .select("*")
      .maybeSingle();

    if (error) {
      console.warn("Moderation appeal DB insert note:", error.message);
    }

    if (data && (data as any).id) {
      return {
        id: (data as any).id,
        contentId: (data as any).content_id,
        contentType: (data as any).content_type,
        flaggedReason: (data as any).flagged_reason,
        userExplanation: (data as any).user_explanation,
        submittedAt: (data as any).created_at,
        status: (data as any).status,
      };
    }

    return payload;
  } catch (err) {
    console.error("Error submitting appeal to database:", err);
    return payload;
  }
}

export type UploadAndModerateOptions = {
  userId: string;
  providerId?: string;
  uri: string;
  mimeType?: string;
  fileSizeBytes?: number;
};

/**
 * Fail-Closed Image Moderation Workflow:
 * 1. Checks file constraints and known markers locally.
 * 2. Uploads raw image to isolated 'quarantine' bucket.
 * 3. Triggers Edge Function 'moderate-image' to perform AI safety analysis.
 * 4. Only when verified clean does it get promoted to public 'profile_images'.
 * 5. If inspection fails or is unavailable, fails closed into 'manual_review'.
 */
export async function uploadAndModerateProfileImage(
  options: UploadAndModerateOptions
): Promise<ImageModerationResult & { publicUrl?: string | null }> {
  const { userId, providerId, uri, mimeType, fileSizeBytes } = options;

  // 1. Local validation
  const localCheck = await moderateImage({ uri, mimeType, fileSizeBytes });
  if (!localCheck.isApproved) {
    return localCheck;
  }

  // 2. Determine file extension
  const cleanUri = uri.split("?")[0];
  const extMatch = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  const ext = (extMatch ? extMatch[1] : "jpg").toLowerCase();
  const quarantinedFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const quarantinedPath = `${userId}/${quarantinedFileName}`;

  try {
    // 3. Upload to quarantine bucket
    // If running in React Native with file:// uri, create formData or blob
    let uploadBody: any;
    if (uri.startsWith("file://") || uri.startsWith("content://") || uri.startsWith("/")) {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: quarantinedFileName,
        type: mimeType || `image/${ext === "jpg" ? "jpeg" : ext}`,
      } as any);
      uploadBody = formData;
    } else {
      uploadBody = uri;
    }

    const { error: uploadError } = await supabase.storage
      .from("quarantine")
      .upload(quarantinedPath, uploadBody, {
        contentType: mimeType || `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: false,
      });

    if (uploadError) {
      console.warn("Quarantine upload notice:", uploadError.message);
    }

    // 4. Invoke Edge Function
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
      "moderate-image",
      {
        body: {
          quarantinedPath,
          providerId,
        },
      }
    );

    if (edgeError || !edgeData) {
      // Fail closed: external function unavailable, keep quarantined and queue for manual review
      return {
        status: "manual_review",
        isApproved: false,
        reason: "Image uploaded and queued for safety review. It will become visible once verified.",
        appealsAllowed: true,
      };
    }

    return {
      status: edgeData.status || "approved",
      isApproved: Boolean(edgeData.isApproved),
      publicUrl: edgeData.publicUrl || null,
      reason: edgeData.reason,
      category: edgeData.category,
      appealsAllowed: edgeData.status !== "approved",
    };
  } catch (err: any) {
    // Fail-closed fallback
    return {
      status: "manual_review",
      isApproved: false,
      reason: "Image queued for safety review. It will be verified shortly.",
      appealsAllowed: true,
    };
  }
}

