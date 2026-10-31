import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useAuth } from "@/hooks/use-auth";
import { RootStackParamList } from "@/navigation/types";
import {
  VerificationApplication,
  fetchPendingVerifications,
  reviewVerificationApplication,
  checkUserIsAdmin,
} from "@/lib/verification";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "AdminVerificationReview">;

export default function AdminVerificationReviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<VerificationApplication | null>(null);
  const [actionType, setActionType] = useState<"reject" | "resubmit" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const adminStatus = await checkUserIsAdmin(user?.id);
      setIsAdmin(adminStatus);
      if (adminStatus) {
        const apps = await fetchPendingVerifications();
        setApplications(apps);
      }
    } catch (err) {
      console.error("Failed to load verification applications:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = (app: VerificationApplication) => {
    Alert.alert(
      "Approve Provider Verification",
      `Are you sure you want to verify "${app.legalBusinessName}"? This will grant them the Verified Provider badge on Seivio.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve & Verify",
          style: "default",
          onPress: async () => {
            setProcessing(true);
            const result = await reviewVerificationApplication(
              app.id || "",
              app.providerId,
              "verified",
              undefined,
              user?.id
            );
            setProcessing(false);
            if (result.success) {
              Alert.alert("Success", "Provider has been verified.");
              loadData();
            } else {
              Alert.alert("Error", result.error || "Failed to approve verification.");
            }
          },
        },
      ]
    );
  };

  const submitRejectionOrResubmission = async () => {
    if (!selectedApp || !actionType) return;
    if (!rejectionReason.trim()) {
      Alert.alert("Reason Required", "Please enter a specific reason for the provider.");
      return;
    }

    setProcessing(true);
    const decision = actionType === "reject" ? "rejected" : "resubmission_required";
    const result = await reviewVerificationApplication(
      selectedApp.id || "",
      selectedApp.providerId,
      decision,
      rejectionReason.trim(),
      user?.id
    );
    setProcessing(false);

    if (result.success) {
      Alert.alert(
        "Application Updated",
        `Application marked as ${decision === "rejected" ? "Rejected" : "Resubmission Required"}.`
      );
      setSelectedApp(null);
      setActionType(null);
      setRejectionReason("");
      loadData();
    } else {
      Alert.alert("Error", result.error || "Failed to update application.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#172B4D" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Review Center</Text>
        <TouchableOpacity onPress={loadData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Checking administrative permissions...</Text>
        </View>
      ) : !isAdmin ? (
        <View style={styles.centerBox}>
          <Ionicons name="shield-outline" size={56} color="#DC2626" />
          <Text style={styles.unauthorizedTitle}>Access Restricted</Text>
          <Text style={styles.unauthorizedText}>
            You do not have administrative permissions to review provider verification
            documents. Contact the Seivio Security Team if you believe this is an error.
          </Text>
          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.returnButtonText}>Return to App</Text>
          </TouchableOpacity>
        </View>
      ) : applications.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#16A34A" />
          <Text style={styles.emptyTitle}>Queue Is Clear</Text>
          <Text style={styles.emptyText}>
            No pending provider verification requests require review at this time.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionSubtitle}>
            {applications.length} Pending Application{applications.length === 1 ? "" : "s"}
          </Text>

          {applications.map((app) => (
            <View key={app.id || app.providerId} style={styles.appCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.businessName}>{app.legalBusinessName}</Text>
                  <Text style={styles.providerIdText}>Provider ID: {app.providerId}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{app.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Document Type:</Text>
                <Text style={styles.detailValue}>{app.documentType.toUpperCase()}</Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Document Number:</Text>
                <Text style={styles.detailValue}>{app.documentNumber}</Text>
              </View>

              {app.tradeLicenseNumber ? (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailLabel}>Trade License:</Text>
                  <Text style={styles.detailValue}>{app.tradeLicenseNumber}</Text>
                </View>
              ) : null}

              {app.documentUri ? (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailLabel}>Document URI:</Text>
                  <Text style={[styles.detailValue, styles.linkText]}>{app.documentUri}</Text>
                </View>
              ) : null}

              <Text style={styles.submittedAtText}>
                Submitted: {new Date(app.submittedAt).toLocaleString()}
              </Text>

              {/* Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(app)}
                  disabled={processing}
                >
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.resubmitBtn]}
                  onPress={() => {
                    setSelectedApp(app);
                    setActionType("resubmit");
                    setRejectionReason("");
                  }}
                  disabled={processing}
                >
                  <Ionicons name="repeat" size={16} color="#B45309" />
                  <Text style={styles.resubmitBtnText}>Resubmit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => {
                    setSelectedApp(app);
                    setActionType("reject");
                    setRejectionReason("");
                  }}
                  disabled={processing}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal for Reject / Resubmit Reasons */}
      <Modal visible={Boolean(actionType)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {actionType === "reject" ? "Reject Application" : "Request Resubmission"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {actionType === "reject"
                ? "Explain why this application cannot be accepted."
                : "Specify what changes or clearer documents the provider must re-upload."}
            </Text>

            <TextInput
              style={styles.reasonInput}
              multiline
              numberOfLines={4}
              placeholder="e.g. ID photo is blurry, please re-upload clear photo of Aadhaar front and back."
              placeholderTextColor="#94A3B8"
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setActionType(null);
                  setSelectedApp(null);
                }}
                disabled={processing}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  actionType === "reject" ? styles.bgDanger : styles.bgWarning,
                ]}
                onPress={submitRejectionOrResubmission}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F6FF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DCE7F5",
  },
  backButton: {
    padding: 6,
  },
  refreshButton: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#172B4D",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  unauthorizedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#172B4D",
    marginTop: 16,
  },
  unauthorizedText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  returnButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  returnButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#172B4D",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
  },
  appCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DCE7F5",
    shadowColor: "#172B4D",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#172B4D",
  },
  providerIdText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#172B4D",
  },
  linkText: {
    color: "#2563EB",
    textDecorationLine: "underline",
  },
  submittedAtText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 8,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  approveBtn: {
    backgroundColor: "#16A34A",
  },
  approveBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  resubmitBtn: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  resubmitBtnText: {
    color: "#B45309",
    fontWeight: "600",
    fontSize: 13,
  },
  rejectBtn: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  rejectBtnText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#172B4D",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 12,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#DCE7F5",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#172B4D",
    backgroundColor: "#F8FAFC",
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  modalConfirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
  },
  bgDanger: {
    backgroundColor: "#DC2626",
  },
  bgWarning: {
    backgroundColor: "#D97706",
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
