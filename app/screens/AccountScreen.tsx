import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { designTokens } from "@/constants/designTokens";
import { useAuth } from "@/hooks/use-auth";
import type { MainTabScreenProps } from "@/navigation/types";

export default function AccountScreen() {
  const navigation = useNavigation<MainTabScreenProps<"Account">["navigation"]>();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out of Seivio?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Account</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={26} color={designTokens.primaryBlue} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardLabel}>Signed in as</Text>
          <Text style={styles.cardValue} numberOfLines={1}>
            {user?.email ?? "Guest"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate("Favorites")}
      >
        <Ionicons name="heart-outline" size={20} color={designTokens.primaryBlue} />
        <Text style={styles.rowText}>Saved providers</Text>
        <Ionicons name="chevron-forward" size={18} color={designTokens.secondaryText} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("Search")}>
        <Ionicons name="search-outline" size={20} color={designTokens.primaryBlue} />
        <Text style={styles.rowText}>Discover providers</Text>
        <Ionicons name="chevron-forward" size={18} color={designTokens.secondaryText} />
      </TouchableOpacity>

      {/* Provider Growth & Trust Tools */}
      <TouchableOpacity
        style={styles.rowHighlight}
        onPress={() => (navigation as any).navigate("GrowthKit")}
        testID="account-growth-kit"
      >
        <Ionicons name="card" size={20} color={designTokens.primaryBlue} />
        <View style={styles.rowCol}>
          <Text style={styles.rowTextBold}>Grow Your Business</Text>
          <Text style={styles.rowSubtext}>Digital visiting card & printable QR stickers</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={designTokens.secondaryText} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => (navigation as any).navigate("Verification")}
        testID="account-verification"
      >
        <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
        <View style={styles.rowCol}>
          <Text style={styles.rowText}>Get Verified</Text>
          <Text style={styles.rowSubtext}>Apply for the official Seivio trust badge</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={designTokens.secondaryText} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => (navigation as any).navigate("ProviderOnboarding")}
        testID="account-onboarding"
      >
        <Ionicons name="briefcase-outline" size={20} color={designTokens.primaryBlue} />
        <View style={styles.rowCol}>
          <Text style={styles.rowText}>List Your Business</Text>
          <Text style={styles.rowSubtext}>Register or update your professional service listing</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={designTokens.secondaryText} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => (navigation as any).navigate("AdminVerificationReview")}
        testID="account-admin-review"
      >
        <Ionicons name="shield-half-outline" size={20} color="#7C3AED" />
        <View style={styles.rowCol}>
          <Text style={styles.rowText}>Admin Verification Center</Text>
          <Text style={styles.rowSubtext}>Inspect and approve pending provider documents</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={designTokens.secondaryText} />
      </TouchableOpacity>

      {user ? (
        <TouchableOpacity
          style={[styles.signOut, signingOut && styles.signOutDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
          testID="sign-out"
        >
          {signingOut ? (
            <ActivityIndicator color={designTokens.errorRed} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={designTokens.errorRed} />
              <Text style={styles.signOutText}>Sign out</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.signInBtn}
          onPress={() => (navigation as any).navigate("Auth")}
          testID="sign-in-btn"
        >
          <Ionicons name="log-in-outline" size={20} color={designTokens.whiteSurface} />
          <Text style={styles.signInBtnText}>Sign In / Create Account</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.footer}>Seivio · Find. Connect. Get It Done.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: designTokens.paleBlueBackground, paddingHorizontal: 16 },
  title: {
    fontSize: designTokens.titleLarge,
    fontWeight: "800",
    color: designTokens.mainText,
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: designTokens.border,
    marginBottom: 20,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: designTokens.lightBlueSurface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardBody: { flex: 1 },
  cardLabel: { fontSize: 12, color: designTokens.secondaryText },
  cardValue: { fontSize: designTokens.bodyLarge, fontWeight: "700", color: designTokens.mainText, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.inputRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: designTokens.border,
    marginBottom: 10,
  },
  rowHighlight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: designTokens.lightBlueSurface,
    borderRadius: designTokens.inputRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: designTokens.primaryBlue,
    marginBottom: 10,
  },
  rowCol: { flex: 1, marginLeft: 12 },
  rowText: { fontSize: designTokens.bodyLarge, color: designTokens.mainText, fontWeight: "600" },
  rowTextBold: { fontSize: designTokens.bodyLarge, color: designTokens.primaryBlue, fontWeight: "800" },
  rowSubtext: { fontSize: 11, color: designTokens.secondaryText, marginTop: 2 },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: designTokens.primaryBlue,
    borderRadius: designTokens.inputRadius,
    paddingVertical: 14,
    marginTop: 8,
    minHeight: 48,
  },
  signInBtnText: {
    color: designTokens.whiteSurface,
    fontWeight: "700",
    marginLeft: 8,
    fontSize: designTokens.bodyLarge,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: designTokens.errorBackground,
    borderRadius: designTokens.inputRadius,
    paddingVertical: 14,
    marginTop: 8,
    minHeight: 48,
  },
  signOutDisabled: { opacity: 0.6 },
  signOutText: { color: designTokens.errorRed, fontWeight: "700", marginLeft: 8, fontSize: designTokens.bodyLarge },
  footer: {
    marginTop: "auto",
    textAlign: "center",
    color: designTokens.secondaryText,
    fontSize: 12,
    marginBottom: 16,
  },
});
