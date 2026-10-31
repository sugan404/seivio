import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
  DocumentType,
  fetchProviderVerification,
  submitVerificationApplication,
  VerificationStage,
  type VerificationApplication,
} from "@/lib/verification";
import type { RootStackScreenProps } from "@/navigation/types";

const DOCUMENT_OPTIONS: { label: string; value: DocumentType }[] = [
  { label: "Aadhaar Card", value: "aadhaar" },
  { label: "PAN Card", value: "pan" },
  { label: "Driving License", value: "driving_license" },
  { label: "Voter ID", value: "voter_id" },
  { label: "GST Registration", value: "gst_registration" },
  { label: "Trade / MSME License", value: "trade_license" },
];

export default function VerificationScreen({
  route,
  navigation,
}: RootStackScreenProps<"Verification">) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const requestedProviderId = route.params?.providerId;

  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Application Form State
  const [stage, setStage] = useState<VerificationStage>("not_submitted");
  const [legalName, setLegalName] = useState("");
  const [docType, setDocType] = useState<DocumentType>("aadhaar");
  const [docNumber, setDocNumber] = useState("");
  const [tradeLicense, setTradeLicense] = useState("");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoading(true);
      try {
        let p: ProviderDetail | null = null;
        if (requestedProviderId) {
          p = await fetchProviderDetailBySlug(requestedProviderId);
        }
        if (!p) {
          const approved = await fetchApprovedProviders(1);
          if (approved.length > 0) {
            p = (await fetchProviderDetailBySlug(approved[0].slug)) || (approved[0] as ProviderDetail);
          }
        }
        if (mounted && p) {
          setProvider(p);
          setLegalName(p.business_name || "");

          // Check for existing verification application
          const existing = await fetchProviderVerification(p.id);
          if (existing) {
            setStage(existing.status);
            setDocType(existing.documentType);
            setDocNumber(existing.documentNumber);
            setRejectionReason(existing.rejectionReason ?? null);
          } else if ((p as any).verification_status === "verified") {
            setStage("verified");
          }
        }
      } catch (err) {
        console.error("Error loading verification status:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [requestedProviderId]);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to submit your provider verification.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("Auth") },
      ]);
      return;
    }

    if (!provider) return;

    if (!legalName.trim()) {
      setFormError("Please enter your registered legal business name.");
      return;
    }
    if (!docNumber.trim() || docNumber.trim().length < 4) {
      setFormError("Please enter a valid document identification number.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await submitVerificationApplication({
        providerId: provider.id,
        userId: user.id,
        legalBusinessName: legalName.trim(),
        documentType: docType,
        documentNumber: docNumber.trim(),
        tradeLicenseNumber: tradeLicense.trim() || null,
        documentUri: null,
      });

      setStage("submitted");
      Alert.alert(
        "Application Submitted",
        "Your verification application is now under review. We typically complete reviews within 24 hours.",
        [{ text: "OK" }]
      );
    } catch (err) {
      console.error("Verification submit error:", err);
      setFormError(
        err instanceof Error ? err.message : "Failed to submit application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={designTokens.primaryBlue} />
        <Text style={styles.loadingText}>Checking verification status…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={designTokens.mainText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Verification</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Status Banner */}
        {stage === "verified" ? (
          <View style={styles.verifiedBanner} testID="verification-status-verified">
            <Ionicons name="checkmark-circle" size={44} color="#059669" />
            <Text style={styles.verifiedTitle}>Verified Provider</Text>
            <Text style={styles.verifiedDesc}>
              Your business identity and credentials have been verified by Seivio. The blue trust
              badge is prominently displayed on your profile and search cards.
            </Text>
          </View>
        ) : stage === "submitted" || stage === "under_review" ? (
          <View style={styles.pendingBanner} testID="verification-status-submitted">
            <Ionicons name="time" size={44} color={designTokens.primaryBlue} />
            <Text style={styles.pendingTitle}>Application Under Review</Text>
            <Text style={styles.pendingDesc}>
              Your verification request has been received. Our compliance team verifies official
              documents within 24 hours. You will receive an instant notification once approved.
            </Text>
          </View>
        ) : stage === "rejected" ? (
          <View style={styles.rejectedBanner} testID="verification-status-rejected">
            <Ionicons name="alert-circle" size={44} color={designTokens.errorRed} />
            <Text style={styles.rejectedTitle}>Verification Needs Resubmission</Text>
            <Text style={styles.rejectedDesc}>
              {rejectionReason ||
                "Your document number did not match the registered business name. Please update below and resubmit."}
            </Text>
          </View>
        ) : (
          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark" size={32} color={designTokens.primaryBlue} />
            <View style={styles.infoTextCol}>
              <Text style={styles.infoTitle}>Get the Seivio Verified Badge</Text>
              <Text style={styles.infoDesc}>
                Verified providers gain up to 3x more direct customer inquiries and exclusive access
                to print-ready visiting cards and stickers.
              </Text>
            </View>
          </View>
        )}

        {/* Requirements Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verification Requirements</Text>
          <View style={styles.reqRow}>
            <Ionicons name="checkmark-done" size={18} color="#059669" />
            <Text style={styles.reqText}>Govt-recognized photo ID (Aadhaar, PAN, DL, Voter ID)</Text>
          </View>
          <View style={styles.reqRow}>
            <Ionicons name="checkmark-done" size={18} color="#059669" />
            <Text style={styles.reqText}>Active phone number matching business operations</Text>
          </View>
          <View style={styles.reqRow}>
            <Ionicons name="checkmark-done" size={18} color="#059669" />
            <Text style={styles.reqText}>Physical service area in Tamil Nadu or South India</Text>
          </View>
        </View>

        {/* Application Form */}
        {stage !== "verified" && stage !== "submitted" && stage !== "under_review" ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Submit Application</Text>

            <Text style={styles.label}>Legal Business / Individual Name</Text>
            <TextInput
              style={styles.input}
              value={legalName}
              onChangeText={setLegalName}
              placeholder="Full name as printed on ID"
              placeholderTextColor={designTokens.secondaryText}
              testID="verification-legal-name"
            />

            <Text style={styles.label}>Select Document Type</Text>
            <View style={styles.docTypeGrid}>
              {DOCUMENT_OPTIONS.map((opt) => {
                const selected = docType === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.docTypePill, selected && styles.docTypePillActive]}
                    onPress={() => setDocType(opt.value)}
                    testID={`doc-type-${opt.value}`}
                  >
                    <Text
                      style={[styles.docTypePillText, selected && styles.docTypePillTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Document ID Number</Text>
            <TextInput
              style={styles.input}
              value={docNumber}
              onChangeText={setDocNumber}
              placeholder="e.g. 1234 5678 9012 or ABCDE1234F"
              placeholderTextColor={designTokens.secondaryText}
              autoCapitalize="characters"
              testID="verification-doc-number"
            />

            <Text style={styles.label}>Trade License / GSTIN (Optional)</Text>
            <TextInput
              style={styles.input}
              value={tradeLicense}
              onChangeText={setTradeLicense}
              placeholder="Optional trade registration number"
              placeholderTextColor={designTokens.secondaryText}
              autoCapitalize="characters"
              testID="verification-trade-license"
            />

            {formError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              testID="verification-submit"
            >
              {submitting ? (
                <ActivityIndicator color={designTokens.whiteSurface} />
              ) : (
                <Text style={styles.submitText}>
                  {stage === "rejected" ? "Resubmit Application" : "Submit for Verification"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
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
  verifiedBanner: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  verifiedTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#065F46",
    marginTop: 8,
    marginBottom: 4,
  },
  verifiedDesc: {
    fontSize: 12,
    color: "#047857",
    textAlign: "center",
    lineHeight: 18,
  },
  pendingBanner: {
    backgroundColor: designTokens.lightBlueSurface,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: designTokens.darkBlue,
    marginTop: 8,
    marginBottom: 4,
  },
  pendingDesc: {
    fontSize: 12,
    color: designTokens.primaryBlue,
    textAlign: "center",
    lineHeight: 18,
  },
  rejectedBanner: {
    backgroundColor: designTokens.errorBackground,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  rejectedTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: designTokens.errorRed,
    marginTop: 8,
    marginBottom: 4,
  },
  rejectedDesc: {
    fontSize: 12,
    color: designTokens.errorRed,
    textAlign: "center",
    lineHeight: 18,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: designTokens.border,
    marginBottom: 16,
  },
  infoTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: designTokens.mainText,
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 11,
    color: designTokens.secondaryText,
    lineHeight: 16,
  },
  card: {
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: designTokens.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: designTokens.mainText,
    marginBottom: 12,
  },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reqText: {
    fontSize: 12,
    color: designTokens.mainText,
    marginLeft: 8,
    fontWeight: "500",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: designTokens.mainText,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: designTokens.paleBlueBackground,
    borderRadius: designTokens.inputRadius,
    borderWidth: 1,
    borderColor: designTokens.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: designTokens.mainText,
    marginBottom: 8,
  },
  docTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  docTypePill: {
    backgroundColor: designTokens.paleBlueBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: designTokens.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  docTypePillActive: {
    backgroundColor: designTokens.primaryBlue,
    borderColor: designTokens.primaryBlue,
  },
  docTypePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: designTokens.mainText,
  },
  docTypePillTextActive: {
    color: designTokens.whiteSurface,
  },
  errorBox: {
    backgroundColor: designTokens.errorBackground,
    borderRadius: designTokens.inputRadius,
    padding: 10,
    marginVertical: 10,
  },
  errorText: {
    color: designTokens.errorRed,
    fontSize: 12,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: designTokens.primaryBlue,
    borderRadius: designTokens.inputRadius,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: designTokens.whiteSurface,
    fontSize: 14,
    fontWeight: "700",
  },
});
