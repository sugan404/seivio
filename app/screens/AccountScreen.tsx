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
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: designTokens.border,
    marginBottom: 12,
  },
  rowText: { flex: 1, marginLeft: 12, fontSize: designTokens.bodyLarge, color: designTokens.mainText, fontWeight: "600" },
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
