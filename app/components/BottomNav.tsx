import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Icon } from "react-native";
import { useNavigation } from "@react-navigation/native";

const BottomNav = () => {
  const navigate = useNavigation();
  const [activeTab, setActiveTab] = useState("home");

  const tabRoutes = {
    home: "home",
    search: "search",
    favorites: "favorites",
    account: "account",
  };

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    navigate(tabRoutes[tab]);
  };

  return (
    <View style={styles.container}>
      {["home", "search", "favorites", "account"].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && styles.tabActive,
            {
              flex: 1,
            },
          ]}
          onPress={() => handleTabPress(tab)}
        >
          <Icon name={tab} size={24} color={activeTab === tab ? "#1a1a2e" : "#64748b"} />
          <Text style={styles.tabLabel}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    justifyContent: "space-around",
  },
  tab: {
    alignItems: "center",
    paddingVertical: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a2e",
  },
  tabLabel: { fontSize: 12, marginTop: 2 },
});

export default BottomNav;