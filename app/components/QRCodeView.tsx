import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import QRCode from "qrcode";

type Props = {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  quietZoneModules?: number;
  testID?: string;
};

export default function QRCodeView({
  value,
  size = 120,
  color = "#000000",
  backgroundColor = "#FFFFFF",
  quietZoneModules = 2,
  testID = "qr-code-view",
}: Props) {
  const { matrix, moduleCount } = useMemo(() => {
    try {
      const qr = QRCode.create(value || "https://seivio.app", {
        errorCorrectionLevel: "M",
      });
      const count = qr.modules.size;
      const m: boolean[][] = [];

      for (let r = 0; r < count; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < count; c++) {
          row.push(Boolean(qr.modules.get(r, c)));
        }
        m.push(row);
      }

      return { matrix: m, moduleCount: count };
    } catch (err) {
      console.error("Failed to generate QR code matrix:", err);
      return { matrix: [], moduleCount: 0 };
    }
  }, [value]);

  if (matrix.length === 0) {
    return <View style={[styles.fallback, { width: size, height: size, backgroundColor }]} />;
  }

  const totalModules = moduleCount + quietZoneModules * 2;
  const cellSize = size / totalModules;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor,
          padding: cellSize * quietZoneModules,
        },
      ]}
      testID={testID}
      accessibilityLabel={`QR code for ${value}`}
    >
      {matrix.map((row, rIdx) => (
        <View key={`r-${rIdx}`} style={[styles.row, { height: cellSize }]}>
          {row.map((isDark, cIdx) => (
            <View
              key={`c-${cIdx}`}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: isDark ? color : backgroundColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
  },
  fallback: {
    borderRadius: 8,
  },
});
