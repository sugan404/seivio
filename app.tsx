import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "@/hooks/use-auth";
import HomeScreen from "@/screens/HomeScreen";
import ProviderProfileScreen from "@/screens/ProviderProfileScreen";
import AuthScreen from "@/screens/AuthScreen";
import BottomNav from "@/components/BottomNav";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {user ? (
        <>
          <HomeScreen />
          <BottomNav />
        </>
      ) : (
        <AuthScreen />
      )}
    </NavigationContainer>
  );
}