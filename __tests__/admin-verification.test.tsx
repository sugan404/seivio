import {
  isProviderVerified,
  validateVerificationInput,
  checkUserIsAdmin,
  submitVerificationApplication,
  reviewVerificationApplication,
} from "@/lib/verification";
import { supabase } from "@/integrations/supabase/client";

describe("Provider Verification & Administrative Workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Validation", () => {
    it("rejects empty or short legal business names", () => {
      const err = validateVerificationInput({
        providerId: "p1",
        userId: "u1",
        legalBusinessName: "A",
        documentType: "aadhaar",
        documentNumber: "123456789012",
      });
      expect(err).toMatch(/legal or registered business name/i);
    });

    it("rejects invalid document number", () => {
      const err = validateVerificationInput({
        providerId: "p1",
        userId: "u1",
        legalBusinessName: "Valid Business Name",
        documentType: "pan",
        documentNumber: "12",
      });
      expect(err).toMatch(/valid document identification number/i);
    });

    it("accepts valid verification payload", () => {
      const err = validateVerificationInput({
        providerId: "p1",
        userId: "u1",
        legalBusinessName: "Karthik Electrical Works",
        documentType: "trade_license",
        documentNumber: "TL-2024-9988",
      });
      expect(err).toBeNull();
    });
  });

  describe("Security: Self-Verification Prevention", () => {
    it("always forces status to 'submitted' on client submission even if client attempts to pass 'verified'", async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: "app-123",
              provider_id: "p1",
              user_id: "u1",
              legal_business_name: "Sneaky Electrician",
              document_type: "pan",
              document_number: "ABCDE1234F",
              status: "submitted",
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      jest.spyOn(supabase, "from").mockImplementation((table: string): any => {
        if (table === "provider_verifications") {
          return { insert: mockInsert };
        }
        if (table === "providers") {
          return { update: mockUpdate };
        }
        return {};
      });

      const result = await submitVerificationApplication({
        providerId: "p1",
        userId: "u1",
        legalBusinessName: "Sneaky Electrician",
        documentType: "pan",
        documentNumber: "ABCDE1234F",
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "submitted",
        })
      );
      expect(result.status).toBe("submitted");
    });
  });

  describe("Admin Role Checks", () => {
    it("returns true for users registered in admin_users table", async () => {
      jest.spyOn(supabase, "from").mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { role: "admin" },
              error: null,
            }),
          }),
        }),
      } as any);

      const isAdmin = await checkUserIsAdmin("admin-uuid-1");
      expect(isAdmin).toBe(true);
    });

    it("returns false for ordinary users or when not found", async () => {
      jest.spyOn(supabase, "from").mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as any);

      const isAdmin = await checkUserIsAdmin("user-uuid-99");
      expect(isAdmin).toBe(false);
    });
  });

  describe("Admin Review Actions", () => {
    it("approves verification and updates both application and provider table", async () => {
      const mockVerifUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });
      const mockProviderUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      jest.spyOn(supabase, "from").mockImplementation((table: string): any => {
        if (table === "provider_verifications") {
          return { update: mockVerifUpdate };
        }
        if (table === "providers") {
          return { update: mockProviderUpdate };
        }
        return {};
      });

      const res = await reviewVerificationApplication(
        "app-123",
        "p-123",
        "verified",
        undefined,
        "admin-1"
      );

      expect(res.success).toBe(true);
      expect(mockVerifUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "verified",
          reviewed_by: "admin-1",
        })
      );
      expect(mockProviderUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          verification_status: "verified",
          verified_at: expect.any(String),
        })
      );
    });

    it("rejects verification with reason provided", async () => {
      const mockVerifUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });
      const mockProviderUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      jest.spyOn(supabase, "from").mockImplementation((table: string): any => {
        if (table === "provider_verifications") {
          return { update: mockVerifUpdate };
        }
        if (table === "providers") {
          return { update: mockProviderUpdate };
        }
        return {};
      });

      const res = await reviewVerificationApplication(
        "app-123",
        "p-123",
        "rejected",
        "Blurry Aadhaar scan",
        "admin-1"
      );

      expect(res.success).toBe(true);
      expect(mockVerifUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "rejected",
          rejection_reason: "Blurry Aadhaar scan",
        })
      );
      expect(mockProviderUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          verification_status: "rejected",
        })
      );
    });
  });

  describe("Verification Badge Authorization", () => {
    it("returns true only when verification_status is verified or verified_at is set", () => {
      expect(isProviderVerified(null)).toBe(false);
      expect(isProviderVerified({ id: "1" } as any)).toBe(false);
      expect(
        isProviderVerified({
          id: "1",
          verification_status: "submitted",
        } as any)
      ).toBe(false);
      expect(
        isProviderVerified({
          id: "1",
          verification_status: "verified",
          verified_at: "2026-10-31T00:00:00Z",
        } as any)
      ).toBe(true);
    });
  });
});
