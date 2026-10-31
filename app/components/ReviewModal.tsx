import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { designTokens } from "@/constants/designTokens";
import { REVIEW_MAX_LENGTH, REVIEW_MIN_LENGTH } from "@/types";
import StarRating from "@/components/StarRating";
import { moderateText } from "@/lib/moderation";

type Props = {
  visible: boolean;
  providerName: string;
  submitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (rating: number, text: string) => void;
};

export default function ReviewModal({
  visible,
  providerName,
  submitting,
  errorMessage,
  onCancel,
  onSubmit,
}: Props) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setRating(5);
      setText("");
      setLocalError(null);
    }
  }, [visible]);

  const trimmedLength = text.trim().length;
  const isValid = rating >= 1 && trimmedLength >= REVIEW_MIN_LENGTH && !submitting;

  const handleSubmit = () => {
    if (rating < 1 || rating > 5) {
      setLocalError("Please select a rating between 1 and 5 stars.");
      return;
    }
    if (trimmedLength < REVIEW_MIN_LENGTH) {
      setLocalError(`Your review must be at least ${REVIEW_MIN_LENGTH} characters.`);
      return;
    }
    const mod = moderateText(text.trim(), "review");
    if (mod.status === "rejected") {
      setLocalError(mod.reason || "Review violates community guidelines.");
      return;
    }
    setLocalError(null);
    onSubmit(rating, text.trim());
  };

  const message = localError ?? errorMessage;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Write a Review</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {providerName}
            </Text>

            <Text style={styles.label}>Your rating</Text>
            <StarRating
              value={rating}
              onChange={setRating}
              size={32}
              testIDPrefix="rating-star"
            />

            <Text style={styles.label}>Your review</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Share details about the service you received…"
              placeholderTextColor={designTokens.secondaryText}
              style={styles.textArea}
              multiline
              numberOfLines={4}
              maxLength={REVIEW_MAX_LENGTH}
              editable={!submitting}
              textAlignVertical="top"
              testID="review-text-input"
            />

            <Text
              style={[
                styles.counter,
                trimmedLength > 0 && trimmedLength < REVIEW_MIN_LENGTH
                  ? styles.counterInvalid
                  : null,
              ]}
            >
              {trimmedLength}/{REVIEW_MAX_LENGTH} characters · minimum{" "}
              {REVIEW_MIN_LENGTH}
            </Text>

            {message ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{message}</Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={submitting}
                testID="review-cancel"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton, !isValid && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={!isValid}
                testID="review-submit"
              >
                {submitting ? (
                  <ActivityIndicator color={designTokens.whiteSurface} />
                ) : (
                  <Text style={styles.submitText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(23, 43, 77, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: designTokens.whiteSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  title: { fontSize: designTokens.titleMedium, fontWeight: "800", color: designTokens.mainText },
  subtitle: { fontSize: designTokens.bodySmall, color: designTokens.secondaryText, marginTop: 2, marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: designTokens.mainText,
    marginTop: 12,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: designTokens.paleBlueBackground,
    borderRadius: designTokens.inputRadius,
    borderWidth: 1,
    borderColor: designTokens.border,
    padding: 12,
    minHeight: 110,
    fontSize: designTokens.bodyLarge,
    color: designTokens.mainText,
  },
  counter: { fontSize: 12, color: designTokens.secondaryText, marginTop: 6 },
  counterInvalid: { color: designTokens.errorRed },
  errorBox: {
    backgroundColor: designTokens.errorBackground,
    borderRadius: designTokens.inputRadius,
    padding: 12,
    marginTop: 12,
  },
  errorText: { color: designTokens.errorRed, fontSize: designTokens.bodySmall },
  actions: { flexDirection: "row", marginTop: 20, gap: 12 },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: designTokens.inputRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: designTokens.paleBlueBackground,
    borderWidth: 1,
    borderColor: designTokens.border,
  },
  cancelText: { color: designTokens.mainText, fontWeight: "600", fontSize: designTokens.bodyLarge },
  submitButton: { backgroundColor: designTokens.primaryBlue },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: designTokens.whiteSurface, fontWeight: "700", fontSize: designTokens.bodyLarge },
});
