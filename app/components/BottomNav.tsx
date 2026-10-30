import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { designTokens } from "@/constants/designTokens";

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, IconName> = {
  Home: "home-outline",
  Search: "search-outline",
  Favorites: "heart-outline",
  Account: "person-outline",
};

const TAB_ICONS_ACTIVE: Record<string, IconName> = {
  Home: "home",
  Search: "search",
  Favorites: "heart",
  Account: "person",
};

const TAB_LABELS: Record<string, string> = {
  Home: "Home",
  Search: "Search",
  Favorites: "Saved",
  Account: "Account",
};

const BottomNav = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = TAB_LABELS[route.name] ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={label}
            testID={`tab-${route.name.toLowerCase()}`}
            activeOpacity={0.7}
            style={styles.tab}
            onPress={onPress}
          >
            <Ionicons
              name={
                focused
                  ? TAB_ICONS_ACTIVE[route.name] ?? "ellipse"
                  : TAB_ICONS[route.name] ?? "ellipse-outline"
              }
              size={24}
              color={focused ? designTokens.primaryBlue : designTokens.secondaryText}
            />
            <Text style={[styles.label, focused && styles.labelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: designTokens.whiteSurface,
    borderTopWidth: 1,
    borderTopColor: designTokens.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    marginTop: 2,
    color: designTokens.secondaryText,
  },
  labelActive: {
    color: designTokens.primaryBlue,
    fontWeight: "600",
  },
});

export default BottomNav;
