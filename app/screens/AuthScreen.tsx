import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { designTokens } from "@/constants/designTokens";
import { useAuth } from "@/hooks/use-auth";

type Mode = "signup" | "signin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!email.trim()) return "Please enter your email address.";
    if (!EMAIL_PATTERN.test(email.trim()))
      return "Please enter a valid email address.";
    if (!password) return "Please enter your password.";
    if (mode === "signup" && password.length < MIN_PASSWORD_LENGTH)
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setNotice(null);
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "signup") {
        const session = await signUp(email.trim(), password);
        if (!session) {
          setNotice("Account created. Please check your email to confirm, then sign in.");
          setMode("signin");
          setPassword("");
        }
      } else {
        await signIn(email.trim(), password);
        // Navigation to the main experience happens automatically once
        // the auth provider receives the new session.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((current) => (current === "signup" ? "signin" : "signup"));
    setError(null);
    setNotice(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>Seivio</Text>
        <Text style={styles.tagline}>Find. Connect. Get It Done.</Text>

        <View style={styles.card}>
          <Text style={styles.title}>
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "signup"
              ? "Sign up to save providers and leave reviews."
              : "Sign in to continue to Seivio."}
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="you@example.com"
            placeholderTextColor={designTokens.secondaryText}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder={
              mode === "signup"
                ? `At least ${MIN_PASSWORD_LENGTH} characters`
                : "Your password"
            }
            placeholderTextColor={designTokens.secondaryText}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            autoCapitalize="none"
            editable={!loading}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {notice ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            testID="auth-submit"
          >
            {loading ? (
              <ActivityIndicator color={designTokens.whiteSurface} />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "signup" ? "Create Account" : "Sign In"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMode} style={styles.switch} disabled={loading}>
            <Text style={styles.switchText}>
              {mode === "signup"
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: designTokens.paleBlueBackground },
  container: { flexGrow: 1, paddingHorizontal: 20 },
  brand: {
    fontSize: designTokens.titleLarge,
    fontWeight: "800",
    color: designTokens.primaryBlue,
  },
  tagline: {
    fontSize: designTokens.bodySmall,
    color: designTokens.secondaryText,
    marginTop: 4,
    marginBottom: 28,
  },
  card: {
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.cardRadius,
    padding: 20,
    borderWidth: 1,
    borderColor: designTokens.border,
  },
  title: { fontSize: designTokens.titleMedium, fontWeight: "700", color: designTokens.mainText },
  subtitle: { fontSize: designTokens.bodySmall, color: designTokens.secondaryText, marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: designTokens.mainText, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: designTokens.paleBlueBackground,
    borderRadius: designTokens.inputRadius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: designTokens.bodyLarge,
    color: designTokens.mainText,
    borderWidth: 1,
    borderColor: designTokens.border,
  },
  button: {
    backgroundColor: designTokens.primaryBlue,
    paddingVertical: 14,
    borderRadius: designTokens.inputRadius,
    alignItems: "center",
    marginTop: 20,
    minHeight: 48,
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: designTokens.whiteSurface, fontSize: designTokens.bodyLarge, fontWeight: "600" },
  switch: { marginTop: 18, alignItems: "center" },
  switchText: { color: designTokens.primaryBlue, fontSize: designTokens.bodySmall, fontWeight: "600" },
  errorBox: {
    backgroundColor: designTokens.errorBackground,
    padding: 12,
    borderRadius: designTokens.inputRadius,
    marginTop: 16,
  },
  errorText: { color: designTokens.errorRed, fontSize: designTokens.bodySmall },
  noticeBox: {
    backgroundColor: designTokens.successBackground,
    padding: 12,
    borderRadius: designTokens.inputRadius,
    marginTop: 16,
  },
  noticeText: { color: designTokens.successGreen, fontSize: designTokens.bodySmall },
});
