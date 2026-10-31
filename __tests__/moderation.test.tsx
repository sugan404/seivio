import {
  moderateText,
  moderateImage,
  normalizeText,
  createAppealPayload,
  submitModerationAppeal,
  uploadAndModerateProfileImage,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/moderation";
import { supabase } from "@/integrations/supabase/client";

describe("Trust & Safety — Text Moderation", () => {
  describe("Normalization & Bypass Detection", () => {
    it("normalizes leetspeak substitutions", () => {
      const { collapsed } = normalizeText("f00bar");
      expect(collapsed).toBe("foobar");
    });

    it("folds repeated characters", () => {
      const { collapsed } = normalizeText("baaaaaad");
      expect(collapsed).toBe("bad");
    });

    it("creates unspaced version to detect spaced out profanity", () => {
      const { unspaced } = normalizeText("s h i t");
      expect(unspaced).toBe("shit");
    });
  });

  describe("Clean / Allowed Submissions", () => {
    it("allows standard business names and descriptions", () => {
      const result = moderateText("Ravi Plumbing and Electric Works", "business_name");
      expect(result.status).toBe("approved");
      expect(result.isClean).toBe(true);
      expect(result.flaggedTerms).toHaveLength(0);
    });

    it("handles empty or whitespace-only input safely", () => {
      const result = moderateText("   ", "name");
      expect(result.status).toBe("approved");
      expect(result.isClean).toBe(true);
    });

    it("prevents false positives on legitimate trade vocabulary", () => {
      // "cock valve", "assistant", "grass", "classic", "passport"
      expect(moderateText("Expert plumber installing ballcock valve").status).toBe("approved");
      expect(moderateText("Senior Executive Assistant").status).toBe("approved");
      expect(moderateText("Lawn mower and grass cutting services").status).toBe("approved");
      expect(moderateText("Classic home interior painting").status).toBe("approved");
    });
  });

  describe("Profanity & Hate Speech Rejection", () => {
    it("rejects overt English profanity", () => {
      const result = moderateText("This guy is a fucking scammer", "review");
      expect(result.status).toBe("rejected");
      expect(result.isClean).toBe(false);
      expect(result.flaggedTerms).toContain("fucking");
      expect(result.appealsAllowed).toBe(true);
    });

    it("rejects obfuscated profanity with spaces", () => {
      const result = moderateText("You are an a s s h o l e", "general");
      expect(result.status).toBe("rejected");
      expect(result.isClean).toBe(false);
    });

    it("rejects leetspeak bypasses", () => {
      const result = moderateText("You b!tch", "general");
      expect(result.status).toBe("rejected");
      expect(result.isClean).toBe(false);
    });

    it("rejects Romanized and Tamil script abusive terms", () => {
      const result1 = moderateText("Romba thevidiya behavior", "review");
      expect(result1.status).toBe("rejected");
      expect(result1.isClean).toBe(false);

      const result2 = moderateText("தேவிடியா service", "business_name");
      expect(result2.status).toBe("rejected");
      expect(result2.isClean).toBe(false);

      const result3 = moderateText("otha waste work", "review");
      expect(result3.status).toBe("rejected");
    });

    it("rejects hate speech and slurs", () => {
      const result = moderateText("Don't hire this nigger", "review");
      expect(result.status).toBe("rejected");
      expect(result.category).toBe("hate_speech");
    });

    it("rejects excessively long names", () => {
      const longName = "A".repeat(101);
      const result = moderateText(longName, "business_name");
      expect(result.status).toBe("rejected");
      expect(result.category).toBe("length");
    });
  });

  describe("Review Flagging for Defamation Claims", () => {
    it("flags reviews containing fraud/scam allegations for manual review", () => {
      const result = moderateText(
        "He charged extra money and I felt it was a total scam",
        "review"
      );
      expect(result.status).toBe("flagged_for_review");
      expect(result.isClean).toBe(true); // Can still be submitted with review tag
      expect(result.flaggedTerms).toContain("scam");
    });
  });
});

describe("Trust & Safety — Image Moderation", () => {
  it("approves normal profile images", async () => {
    const result = await moderateImage({
      uri: "file:///photos/profile_portrait.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 1024 * 500, // 500KB
    });
    expect(result.status).toBe("approved");
    expect(result.isApproved).toBe(true);
  });

  it("rejects images exceeding size limits", async () => {
    const result = await moderateImage({
      uri: "file:///photos/huge_photo.jpg",
      fileSizeBytes: MAX_IMAGE_SIZE_BYTES + 1024,
    });
    expect(result.status).toBe("rejected");
    expect(result.isApproved).toBe(false);
    expect(result.reason).toMatch(/5MB or smaller/i);
  });

  it("rejects unsupported MIME types", async () => {
    const result = await moderateImage({
      uri: "file:///documents/profile.pdf",
      mimeType: "application/pdf",
    });
    expect(result.status).toBe("rejected");
    expect(result.isApproved).toBe(false);
    expect(result.reason).toMatch(/JPEG, PNG, or WebP/i);
  });

  it("rejects explicit content markers", async () => {
    const result = await moderateImage({
      uri: "file:///downloads/nude_photo.png",
      mimeType: "image/png",
    });
    expect(result.status).toBe("rejected");
    expect(result.isApproved).toBe(false);
    expect(result.category).toBe("explicit_nudity");
    expect(result.appealsAllowed).toBe(true);
  });

  it("handles service unavailability with safe fallback", async () => {
    const result = await moderateImage(
      {
        uri: "file:///photos/test.jpg",
        mimeType: "image/jpeg",
      },
      true // mockFailure
    );
    expect(result.status).toBe("service_unavailable");
    expect(result.isApproved).toBe(false);
  });
});

describe("Trust & Safety — Appeals Workflow", () => {
  it("creates a valid appeal payload", () => {
    const appeal = createAppealPayload(
      "img-123",
      "image",
      "flagged explicit",
      "This is my legitimate company logo with skin-toned graphics."
    );
    expect(appeal.contentId).toBe("img-123");
    expect(appeal.contentType).toBe("image");
    expect(appeal.status).toBe("pending");
    expect(appeal.userExplanation).toBeTruthy();
  });

  it("rejects empty appeal explanations", () => {
    expect(() =>
      createAppealPayload("txt-1", "text", "reason", "ok")
    ).toThrow(/at least 5 characters/i);
  });

  it("submits appeal to Supabase moderation_appeals table", async () => {
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            id: "appeal-99",
            user_id: "user-1",
            content_id: "img-123",
            content_type: "image",
            flagged_reason: "nsfw",
            user_explanation: "This is a cartoon electrician mascot.",
            status: "pending",
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    });

    jest.spyOn(supabase, "from").mockImplementation((table: string): any => {
      if (table === "moderation_appeals") {
        return { insert: mockInsert };
      }
      return {};
    });

    const appeal = await submitModerationAppeal(
      "user-1",
      "img-123",
      "image",
      "nsfw",
      "This is a cartoon electrician mascot."
    );

    expect(appeal.id).toBe("appeal-99");
    expect(appeal.status).toBe("pending");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        content_id: "img-123",
        user_id: "user-1",
      })
    );
  });
});

describe("Trust & Safety — Fail-Closed Image Upload Workflow", () => {
  it("rejects overt explicit images immediately without uploading", async () => {
    const res = await uploadAndModerateProfileImage({
      userId: "u-123",
      uri: "file:///photos/nsfw_nude_photo.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 1024,
    });

    expect(res.isApproved).toBe(false);
    expect(res.status).toBe("rejected");
    expect(res.category).toBe("explicit_nudity");
  });

  it("fails closed to manual_review if Edge Function returns an error or is unreachable", async () => {
    (supabase as any).storage = {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
      }),
    };
    (supabase as any).functions = {
      invoke: jest.fn().mockResolvedValue({ data: null, error: new Error("Service Timeout") }),
    };

    const res = await uploadAndModerateProfileImage({
      userId: "u-123",
      uri: "file:///photos/clean_profile.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 2048,
    });

    expect(res.isApproved).toBe(false);
    expect(res.status).toBe("manual_review");
    expect(res.appealsAllowed).toBe(true);
  });

  it("approves and returns publicUrl when Edge Function passes inspection", async () => {
    (supabase as any).storage = {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
      }),
    };
    (supabase as any).functions = {
      invoke: jest.fn().mockResolvedValue({
        data: {
          status: "approved",
          isApproved: true,
          publicUrl: "https://seivio.supabase.co/storage/v1/object/public/profile_images/safe.jpg",
        },
        error: null,
      }),
    };

    const res = await uploadAndModerateProfileImage({
      userId: "u-123",
      uri: "file:///photos/clean_profile.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 2048,
    });

    expect(res.isApproved).toBe(true);
    expect(res.status).toBe("approved");
    expect(res.publicUrl).toContain("profile_images/safe.jpg");
  });
});
