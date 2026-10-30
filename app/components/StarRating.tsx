import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { designTokens } from "@/constants/designTokens";

type Props = {
  value: number;
  size?: number;
  /** When provided the control becomes interactive. */
  onChange?: (value: number) => void;
  testIDPrefix?: string;
};

export default function StarRating({
  value,
  size = 28,
  onChange,
  testIDPrefix = "star",
}: Props) {
  const interactive = typeof onChange === "function";

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          disabled={!interactive}
          onPress={() => onChange?.(star)}
          hitSlop={6}
          accessibilityRole={interactive ? "button" : "image"}
          accessibilityLabel={`${star} star${star > 1 ? "s" : ""}`}
          testID={`${testIDPrefix}-${star}`}
          style={styles.star}
        >
          <Ionicons
            name={star <= value ? "star" : "star-outline"}
            size={size}
            color={designTokens.starGold}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  star: { paddingRight: 6 },
});
