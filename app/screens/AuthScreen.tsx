import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthScreen({ route, navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("signup"); // "signup" or "login"
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        Alert.alert("Success", "Please check your email to verify your account");
        setMode("login");
      } else {
        const { error, session } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigation.replace("home");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{mode === "signup" ? "Sign Up" : "Sign In"}</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email"
          autoCapitalize="none"
        />
        <TextInput
          placeholder={mode === "signup" ? "Password" : "Password"}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={handleAuth}>
          {loading ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text style={styles.btnText}>{mode === "signup" ? "Create Account" : "Sign In"}</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={links}>
        <Text onPress={() => setMode(mode === "signup" ? "login" : "signup")} style={switchText}>
          {mode === "signup" ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb", padding: 20 },
  header: { fontSize: 24, fontWeight: "700", color: "#1a1a2e", marginBottom: 20 },
  form: { marginBottom: 20 },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#333333",
    marginBottom: 12,
  },
  actions: { marginTop: 16 },
  btn: {
    backgroundColor: "#1a1a2e",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#ffffff", fontSize: 16, fontWeight: "500" },
  error: { backgroundColor: "#fef2f2", padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: "#ef4444", fontSize: 14 },
  links: { marginTop: 20, flexDirection: "row", justifyContent: "center" },
  switchText: { color: "#64748b", fontSize: 14 },
});