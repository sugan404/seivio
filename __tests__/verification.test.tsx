import {
  isProviderVerified,
  validateVerificationInput,
  submitVerificationApplication,
  type VerificationApplication,
} from "@/lib/verification";
import type { ProviderDetail } from "@/lib/providers";

describe("Provider Verification System", () => {
  const verifiedProvider: ProviderDetail = {
    id: "p-verified",
    slug: "verified-pro",
    business_name: "Verified Pro Electrician",
    description: "Licensed electrician with govt contractor certificate.",
    category_slugs: ["electrical"],
    city_slug: "chennai",
    state: "Tamil Nadu",
    profile_image: null,
    banner_image: null,
    rating_avg: 4.9,
    rating_count: 50,
    experience_years: 10,
    starting_price: 500,
    plan: "pro",
    status: "approved",
    verification_status: "verified",
    verified_at: "2026-10-30T10:00:00Z",
  } as any;

  const unverifiedProvider: ProviderDetail = {
    ...verifiedProvider,
    id: "p-unverified",
    verification_status: "unverified",
    verified_at: null,
  } as any;

  describe("Verification Badge Security Rule", () => {
    it("returns true only when verification status is 'verified' or verified_at is set", () => {
      expect(isProviderVerified(verifiedProvider)).toBe(true);
      expect(isProviderVerified(unverifiedProvider)).toBe(false);
      expect(isProviderVerified(null)).toBe(false);
    });

    it("does not grant verification if status is pending or rejected", () => {
      const pending = { ...unverifiedProvider, verification_status: "submitted" } as any;
      const rejected = { ...unverifiedProvider, verification_status: "rejected" } as any;
      expect(isProviderVerified(pending)).toBe(false);
      expect(isProviderVerified(rejected)).toBe(false);
    });
  });

  describe("Input Validation", () => {
    it("rejects empty legal business names", () => {
      const err = validateVerificationInput({
        providerId: "p-1",
        userId: "u-1",
        legalBusinessName: "   ",
        documentType: "aadhaar",
        documentNumber: "1234 5678 9012",
      });
      expect(err).toMatch(/registered business name/i);
    });

    it("rejects too short document numbers", () => {
      const err = validateVerificationInput({
        providerId: "p-1",
        userId: "u-1",
        legalBusinessName: "Ravi Enterprises",
        documentType: "pan",
        documentNumber: "12",
      });
      expect(err).toMatch(/valid document identification/i);
    });

    it("approves valid verification application inputs", () => {
      const err = validateVerificationInput({
        providerId: "p-1",
        userId: "u-1",
        legalBusinessName: "Ravi Enterprises",
        documentType: "pan",
        documentNumber: "ABCDE1234F",
      });
      expect(err).toBeNull();
    });
  });

  describe("Application Submission", () => {
    it("submits verification application with default 'submitted' status", async () => {
      const result = await submitVerificationApplication({
        providerId: "p-100",
        userId: "user-100",
        legalBusinessName: "Supreme Air Conditioning",
        documentType: "gst_registration",
        documentNumber: "33AAAAA0000A1Z5",
        tradeLicenseNumber: "TL-2026-999",
      });

      expect(result.status).toBe("submitted");
      expect(result.legalBusinessName).toBe("Supreme Air Conditioning");
      expect(result.submittedAt).toBeTruthy();
    });
  });
});
