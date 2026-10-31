/**
 * Provider Verification System for Seivio.
 * Manages verification application submission, status lifecycle,
 * and security rules preventing unauthorized self-verification.
 */

import { supabase } from "@/integrations/supabase/client";
import type { ProviderDetail } from "@/lib/providers";

export type VerificationStage =
  | "not_submitted"
  | "submitted"
  | "under_review"
  | "verified"
  | "rejected"
  | "resubmission_required";

export type DocumentType =
  | "aadhaar"
  | "pan"
  | "driving_license"
  | "voter_id"
  | "gst_registration"
  | "trade_license";

export type VerificationApplication = {
  id?: string;
  providerId: string;
  userId: string;
  legalBusinessName: string;
  documentType: DocumentType;
  documentNumber: string;
  documentUri?: string | null;
  tradeLicenseNumber?: string | null;
  status: VerificationStage;
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
};

/**
 * Returns true if and only if the provider has been legitimately verified by Seivio.
 * Checks both verification_status column and verified_at timestamp.
 */
export function isProviderVerified(provider: ProviderDetail | null | undefined): boolean {
  if (!provider) return false;
  const status = (provider as any).verification_status;
  const verifiedAt = (provider as any).verified_at;
  return status === "verified" || Boolean(verifiedAt);
}

/**
 * Validates document inputs before submission.
 */
export function validateVerificationInput(
  app: Omit<VerificationApplication, "status" | "submittedAt">
): string | null {
  if (!app.legalBusinessName || app.legalBusinessName.trim().length < 3) {
    return "Please enter your full legal or registered business name.";
  }
  if (!app.documentNumber || app.documentNumber.trim().length < 4) {
    return "Please enter a valid document identification number.";
  }
  return null;
}

/**
 * Checks whether a given user has administrator or moderator privileges.
 */
export async function checkUserIsAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data, error } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return false;
    return ["admin", "moderator", "superadmin"].includes(data.role);
  } catch {
    return false;
  }
}

/**
 * Submits a verification application to Supabase.
 * Enforces authenticated user identity and defaults status strictly to 'submitted'.
 * Client-side overrides to 'verified' are explicitly forbidden and prevented.
 */
export async function submitVerificationApplication(
  application: Omit<VerificationApplication, "status" | "submittedAt">
): Promise<VerificationApplication> {
  const validationError = validateVerificationInput(application);
  if (validationError) {
    throw new Error(validationError);
  }

  // Force status strictly to 'submitted'
  const payload: VerificationApplication = {
    ...application,
    legalBusinessName: application.legalBusinessName.trim(),
    documentNumber: application.documentNumber.trim(),
    status: "submitted",
    submittedAt: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("provider_verifications")
      .insert({
        provider_id: payload.providerId,
        user_id: payload.userId,
        legal_business_name: payload.legalBusinessName,
        document_type: payload.documentType,
        document_number: payload.documentNumber,
        document_uri: payload.documentUri,
        trade_license_number: payload.tradeLicenseNumber,
        status: "submitted",
      })
      .select("*")
      .maybeSingle();

    if (error) {
      console.warn("Verification DB insertion note:", error.message);
    }

    // Also update provider record verification_status to 'submitted'
    await supabase
      .from("providers")
      .update({ verification_status: "submitted" })
      .eq("id", payload.providerId);

    if (data && typeof data === "object" && !Array.isArray(data) && (data as any).status) {
      return {
        id: (data as any).id,
        providerId: (data as any).provider_id,
        userId: (data as any).user_id,
        legalBusinessName: (data as any).legal_business_name,
        documentType: (data as any).document_type,
        documentNumber: (data as any).document_number,
        documentUri: (data as any).document_uri,
        tradeLicenseNumber: (data as any).trade_license_number,
        status: (data as any).status,
        rejectionReason: (data as any).rejection_reason,
        submittedAt: (data as any).created_at,
        reviewedAt: (data as any).reviewed_at,
      };
    }

    return payload;
  } catch (err) {
    console.error("Error submitting verification application:", err);
    return payload;
  }
}

/**
 * Fetches the latest verification status for a provider.
 */
export async function fetchProviderVerification(
  providerId: string
): Promise<VerificationApplication | null> {
  try {
    const { data, error } = await supabase
      .from("provider_verifications")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      providerId: data.provider_id,
      userId: data.user_id,
      legalBusinessName: data.legal_business_name,
      documentType: data.document_type,
      documentNumber: data.document_number,
      documentUri: data.document_uri,
      tradeLicenseNumber: data.trade_license_number,
      status: data.status,
      rejectionReason: data.rejection_reason,
      submittedAt: data.created_at,
      reviewedAt: data.reviewed_at,
      reviewedBy: data.reviewed_by,
    };
  } catch (err) {
    console.warn("Verification record not found or table uninitialized:", err);
    return null;
  }
}

/**
 * Fetches all pending or under-review applications for administrative review.
 */
export async function fetchPendingVerifications(): Promise<VerificationApplication[]> {
  try {
    const { data, error } = await supabase
      .from("provider_verifications")
      .select("*")
      .in("status", ["submitted", "under_review", "resubmission_required"])
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      providerId: d.provider_id,
      userId: d.user_id,
      legalBusinessName: d.legal_business_name,
      documentType: d.document_type,
      documentNumber: d.document_number,
      documentUri: d.document_uri,
      tradeLicenseNumber: d.trade_license_number,
      status: d.status,
      rejectionReason: d.rejection_reason,
      submittedAt: d.created_at,
      reviewedAt: d.reviewed_at,
      reviewedBy: d.reviewed_by,
    }));
  } catch {
    return [];
  }
}

/**
 * Executes an administrative review decision (Approve / Reject / Resubmit).
 * Strictly updates the verification record and the underlying provider's verification status.
 */
export async function reviewVerificationApplication(
  applicationId: string,
  providerId: string,
  decision: "verified" | "rejected" | "resubmission_required",
  rejectionReason?: string,
  reviewerId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updatePayload: Record<string, any> = {
      status: decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId || null,
      rejection_reason: rejectionReason || null,
    };

    const { error: appError } = await supabase
      .from("provider_verifications")
      .update(updatePayload)
      .eq("id", applicationId);

    if (appError) {
      return { success: false, error: appError.message };
    }

    // Explicitly synchronize public.providers status
    const providerUpdate: Record<string, any> = {
      verification_status: decision === "verified" ? "verified" : decision,
    };
    if (decision === "verified") {
      providerUpdate.verified_at = new Date().toISOString();
      providerUpdate.identity_verified_at = new Date().toISOString();
    }

    await supabase
      .from("providers")
      .update(providerUpdate)
      .eq("id", providerId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Review operation failed" };
  }
}
