import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export default function HomeScreen() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigation();
  const [language, setLanguage] = useState("en");
  const { setItem, getItem } = useAsyncStorage();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { data: cats, error: catError } = await supabase
        .from("categories").select("slug, name").eq("status", "approved");
      const { data: cities, error: cityError } = await supabase
        .from("cities").select("slug, name");
      if (catError) throw catError;
      if (cityError) throw cityError;
      setCategoriesList(cats?.map((c: any) => c.slug) || []);
      setLoaded(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load categories");
      setLoaded(true);
    }
  };

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function loadLanguage() {
      const saved = await getItem("selectedLanguage");
      if (saved) {
        setLanguage(saved);
        i18n.changeLanguage(saved);
      }
    }
    loadLanguage();
  }, [getItem]);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setProviders([]); return; }
    performSearch(debouncedQuery);
  }, [debouncedQuery]);

  const performSearch = async (query: string) => {
    try {
      const searchLower = query.toLowerCase();
      const { data, error } = await supabase
        .from("providers").select("id, slug, business_name, description, category_slugs, city_slug, state, profile_image, rating_avg, rating_count, experience_years, starting_price, plan").eq("status", "approved");
      if (error) throw error;
      const allProviders = data || [];
      const filtered = allProviders.filter((p: any) => {
        const nameMatch = p.business_name.toLowerCase().includes(searchLower);
        const categoryMatch = (p.category_slugs || []).some((cat: string) => cat.toLowerCase().includes(searchLower));
        const cityMatch = (p.city_slug || "").toLowerCase().includes(searchLower);
        return nameMatch || categoryMatch || cityMatch;
      });
      if (filtered.length === 0 && allProviders.length > 0) {
        const fuzzyResults = allProviders.filter((p: any) => {
          const name = p.business_name.toLowerCase();
          const queryTokens = searchLower.split(" ");
          return queryTokens.some(token => name.includes(token));
        });
        setProviders(fuzzyResults.slice(0, 10));
      } else {
        setProviders(filtered.slice(0, 10));
      }
    } catch (searchError) {
      console.error("Search error:", searchError);
      setProviders([]);
      setError("Search failed. Please try again.");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    performSearch(searchQuery);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("home", { fromAuth: true });
  };
  useEffect(() => {
    async function saveLanguage() {
      await setItem("selectedLanguage", language);
    }
    saveLanguage();
  }, [language, setItem]);
if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" /><Text>Initializing...</Text></View>;
  }

  if (error) {
    return <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={fetchData}><Text>Retry</Text></TouchableOpacity></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}><Text style={styles.headerTitle}>Thozhil</Text></View>
        <View style={styles.headerRight}>
          {user ? (
            <TouchableOpacity onPress={handleLogout} style={styles.profileBtn}>
              <Text style={styles.profileText}>Profile</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigate("auth", { mode: "signup" })} style={styles.profileBtn}>
              <Text style={styles.profileText}>Sign Up</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            placeholder="Search for a service or business..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>
      {loaded && searchQuery.trim().length > 0 && (
        <View style={styles.resultsFound}>
          <Text style={styles.resultsText}>
            {providers.length} {providers.length === 1 ? "result" : "results"} found
          </Text>
        </View>
      )}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.chipsContainer}>
          {categoriesList.slice(0, 8).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={styles.categoryChip}
              onPress={() => navigate("search", { category: cat, language })}>
              <Text style={styles.categoryText}>{cat}</Text>
            </TouchableOpacity>
          ))}
          {categoriesList.length > 8 && (
            <Text style={styles.categoryMoreText}>+{categoriesList.length - 8} more</Text>
          )}
        </View>
      </View>
      <View style={styles.providerList}>
        {providers.length === 0 && loaded ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No providers found. Try different search terms or browse categories.
            </Text>
          </View>
        ) : null}
        {providers.length > 0 && (
          <View style={styles.providerGrid}>{providers.slice(0, 6).map((p) => providerCard(p))}</View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
function providerCard(p: any) {
  const rating = Number(p.rating_avg ?? 0);
  const initials = p.business_name
    .split(/\\s+/)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <View style={styles.card}>
      <View style={styles.cardImagePlaceholder}>
        <Text style={styles.initialsText}>{initials}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardBusinessName}>{p.business_name}</Text>
        <Text style={styles.cardCategory}>
          {(p.category_slugs || []).slice(0, 3).map((c: string) => c.replace(/-/g, " ")).join(", ") || "General"}
        </Text>
        <Text style={styles.cardLocation}>{p.city_slug || "Area available"}</Text>
        {rating > 0 && (
          <Text style={styles.ratingStars}>{"★".repeat(Math.round(rating))}</Text>
        )}
        {rating > 0 && (
          <Text style={styles.ratingCount}>({p.rating_count ?? 0})</Text>
        )}
        {p.starting_price && (
          <Text style={styles.startingPrice}>from ₹{p.starting_price.toLocaleString("en-IN")}</Text>
        )}
        <TouchableOpacity
          onPress={() => navigate("provider-profile", { slug: p.slug }) }
          style={styles.viewButton}
        >
          <Text style={styles.viewText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb", padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerLeft: {},
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#1a1a2e" },
  headerRight: {},
  profileBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#e2e8f0",
    borderRadius: 20,
    marginLeft: 10,
    fontSize: 12,
  },
  profileText: { color: "#333333", fontWeight: "500" },
  searchContainer: { marginBottom: 20 },
  searchInputWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#333333" },
  resultsFound: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#f0f4f8",
    borderRadius: 8,
    fontSize: 14,
    color: "#475569",
  },
  categoriesSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#333333", marginBottom: 12 },
  chipsContainer: { flexWrap: "wrap", gap: 8 },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    fontSize: 12,
  },
  categoryText: { color: "#333333" },
  categoryMoreText: { marginLeft: "auto", fontSize: 12, color: "#64748b" },
  providerList: { flex: 1 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  cardContent: { padding: 12 },
  cardBusinessName: { fontSize: 15, fontWeight: "600", color: "#1a1a2e" },
  cardCategory: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  cardLocation: { fontSize: 11, color: "#98a2b3" },
  ratingStars: { color: "#f59e0b", fontSize: 11 },
  ratingCount: { marginLeft: 3, color: "#64748b", fontSize: 10 },
  startingPrice: { color: "#059669", fontSize: 12, fontWeight: "500" },
  viewButton: {
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    marginTop: 6,
    alignItems: "center",
  },
  viewText: { color: "#333333", fontSize: 12, fontWeight: "500" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { color: "#64748b", fontSize: 16, textAlign: "center" },
});
  );
}