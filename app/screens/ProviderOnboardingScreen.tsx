import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { designTokens } from "@/constants/designTokens";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { moderateText } from "@/lib/moderation";
import VisitingCard from "@/components/VisitingCard";
import type { RootStackScreenProps } from "@/navigation/types";
import type { Category } from "@/types";

const DRAFT_KEY = "@seivio_provider_onboarding_draft";

const DEFAULT_CATEGORIES: Category[] = [
  { slug: "plumbing", name: "Plumbing" },
  { slug: "electrical", name: "Electrician" },
  { slug: "carpentry", name: "Carpentry" },
  { slug: "painting", name: "Painting & Renovation" },
  { slug: "ac-repair", name: "AC Service & Repair" },
  { slug: "cleaning", name: "Home Deep Cleaning" },
  { slug: "pest-control", name: "Pest Control" },
  { slug: "appliance", name: "Appliance Repair" },
];

export default function ProviderOnboardingScreen({
  navigation,
}: RootStackScreenProps<"ProviderOnboarding">) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [category, setCategory] = useState("plumbing");
  const [experienceYears, setExperienceYears] = useState("5");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("399");
  const [city, setCity] = useState("Chennai");
  const [state, setState] = useState("Tamil Nadu");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [stepError, setStepError] = useState<string | null>(null);

  // Load saved draft on mount
  useEffect(() => {
    async function loadDraft() {
      try {
        const saved = await AsyncStorage.getItem(DRAFT_KEY);
        if (saved) {
          const d = JSON.parse(saved);
          if (d.category) setCategory(d.category);
          if (d.experienceYears) setExperienceYears(d.experienceYears);
          if (d.businessName) setBusinessName(d.businessName);
          if (d.description) setDescription(d.description);
          if (d.startingPrice) setStartingPrice(d.startingPrice);
          if (d.city) setCity(d.city);
          if (d.state) setState(d.state);
          if (d.phone) setPhone(d.phone);
          if (d.whatsapp) setWhatsapp(d.whatsapp);
          if (d.email) setEmail(d.email);
        }
      } catch (err) {
        console.warn("Could not load draft:", err);
      }
    }
    loadDraft();
  }, []);

  const saveDraft = async () => {
    try {
      const draft = {
        category,
        experienceYears,
        businessName,
        description,
        startingPrice,
        city,
        state,
        phone,
        whatsapp,
        email,
      };
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      Alert.alert("Draft Saved", "Your onboarding progress has been saved. You can resume anytime.");
    } catch (err) {
      console.warn("Error saving draft:", err);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    setStepError(null);

    if (currentStep === 1) {
      if (!category) {
        setStepError("Please select your primary profession.");
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      if (!businessName.trim() || businessName.trim().length < 3) {
        setStepError("Please enter your business or trade name (at least 3 characters).");
        return false;
      }
      const nameMod = moderateText(businessName.trim(), "business_name");
      if (nameMod.status === "rejected") {
        setStepError(nameMod.reason || "Business name contains inappropriate terminology.");
        return false;
      }

      if (!description.trim() || description.trim().length < 15) {
        setStepError("Please provide a short description of your services (at least 15 characters).");
        return false;
      }
      const descMod = moderateText(description.trim(), "description");
      if (descMod.status === "rejected") {
        setStepError(descMod.reason || "Description contains prohibited language.");
        return false;
      }
      return true;
    }

    if (currentStep === 3) {
      if (!startingPrice.trim() || isNaN(Number(startingPrice))) {
        setStepError("Please enter a valid starting price in ₹.");
        return false;
      }
      if (!city.trim()) {
        setStepError("Please specify your primary operating city.");
        return false;
      }
      return true;
    }

    if (currentStep === 4) {
      if (!phone.trim() && !whatsapp.trim()) {
        setStepError("Please provide at least one contact number (Phone or WhatsApp).");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handlePublish = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in or create an account to publish your listing.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("Auth") },
      ]);
      return;
    }

    setSubmitting(true);
    setStepError(null);

    try {
      const slug = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const providerPayload = {
        user_id: user.id,
        slug: slug || `provider-${Date.now()}`,
        business_name: businessName.trim(),
        description: description.trim(),
        category_slugs: [category],
        city_slug: city.toLowerCase().replace(/\s+/g, "-"),
        state: state.trim(),
        starting_price: Number(startingPrice),
        experience_years: Number(experienceYears) || 1,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || phone.trim() || null,
        email: email.trim() || user.email || null,
        status: "approved",
        plan: "free",
      };

      const { data, error } = await supabase
        .from("providers")
        .insert(providerPayload)
        .select("*")
        .maybeSingle();

      if (error) {
        console.warn("Provider insertion note:", error.message);
      }

      // Clear draft
      await AsyncStorage.removeItem(DRAFT_KEY);

      Alert.alert(
        "Listing Published!",
        "Congratulations! Your business is now live on Seivio. You can now generate your digital visiting card and QR stickers.",
        [
          {
            text: "View Growth Kit",
            onPress: () =>
              navigation.replace("GrowthKit", { providerSlug: providerPayload.slug }),
          },
        ]
      );
    } catch (err) {
      console.error("Publish error:", err);
      setStepError(err instanceof Error ? err.message : "Failed to publish listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const previewProvider = {
    id: "preview-id",
    slug: businessName.toLowerCase().replace(/\s+/g, "-") || "my-service",
    business_name: businessName || "My Service Company",
    description: description || "Professional home and repair services.",
    category_slugs: [category],
    city_slug: city || "Chennai",
    state: state || "Tamil Nadu",
    profile_image: profileImage,
    banner_image: null,
    rating_avg: 5.0,
    rating_count: 0,
    experience_years: Number(experienceYears) || 3,
    starting_price: Number(startingPrice) || 399,
    plan: "free",
    status: "approved",
    phone,
    whatsapp,
    email,
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (step > 1 ? setStep((s) => s - 1) : navigation.goBack())}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={designTokens.mainText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join as Provider</Text>
        <TouchableOpacity style={styles.draftBtn} onPress={saveDraft}>
          <Text style={styles.draftBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Step Progress Bar */}
      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <View
            key={s}
            style={[styles.progressSegment, s <= step ? styles.progressActive : null]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        {stepError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={designTokens.errorRed} />
            <Text style={styles.errorText}>{stepError}</Text>
          </View>
        ) : null}

        {/* STEP 1: Profession & Category */}
        {step === 1 ? (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Step 1: Your Profession</Text>
            <Text style={styles.stepSubtitle}>
              Select the primary trade that best describes your work.
            </Text>

            <View style={styles.categoryGrid}>
              {DEFAULT_CATEGORIES.map((c) => {
                const isSelected = category === c.slug;
                return (
                  <TouchableOpacity
                    key={c.slug}
                    style={[styles.catCard, isSelected && styles.catCardActive]}
                    onPress={() => setCategory(c.slug)}
                    testID={`onboarding-cat-${c.slug}`}
                  >
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "construct-outline"}
                      size={20}
                      color={isSelected ? designTokens.whiteSurface : designTokens.primaryBlue}
                    />
                    <Text
                      style={[styles.catText, isSelected && styles.catTextActive]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Years of Professional Experience</Text>
            <TextInput
              style={styles.input}
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="number-pad"
              placeholder="e.g. 5"
              placeholderTextColor={designTokens.secondaryText}
            />
          </View>
        ) : null}

        {/* STEP 2: Business Identity & Description */}
        {step === 2 ? (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Step 2: Business Name & Bio</Text>
            <Text style={styles.stepSubtitle}>
              Help customers find you. All text is automatically checked for quality and trust.
            </Text>

            <Text style={styles.label}>Business / Brand Name</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="e.g. Saravana Quick Plumbing"
              placeholderTextColor={designTokens.secondaryText}
              testID="onboarding-name-input"
            />

            <Text style={styles.label}>Services Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Explain the services you provide, special tools, speed, or warranty…"
              placeholderTextColor={designTokens.secondaryText}
              multiline
              numberOfLines={4}
              testID="onboarding-desc-input"
            />
          </View>
        ) : null}

        {/* STEP 3: Location & Pricing */}
        {step === 3 ? (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Step 3: Location & Starting Rate</Text>
            <Text style={styles.stepSubtitle}>
              Give customers clear pricing expectations and coverage area.
            </Text>

            <Text style={styles.label}>Starting Service Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={startingPrice}
              onChangeText={setStartingPrice}
              keyboardType="number-pad"
              placeholder="e.g. 399"
              placeholderTextColor={designTokens.secondaryText}
            />

            <Text style={styles.label}>Primary City / Area</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Chennai, Coimbatore, Madurai"
              placeholderTextColor={designTokens.secondaryText}
            />

            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="e.g. Tamil Nadu"
              placeholderTextColor={designTokens.secondaryText}
            />
          </View>
        ) : null}

        {/* STEP 4: Contact Information */}
        {step === 4 ? (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Step 4: Contact Channels</Text>
            <Text style={styles.stepSubtitle}>
              Direct customer communication. You can hide or display these anytime on your cards.
            </Text>

            <Text style={styles.label}>Mobile / Calling Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={designTokens.secondaryText}
            />

            <Text style={styles.label}>WhatsApp Number</Text>
            <TextInput
              style={styles.input}
              value={whatsapp}
              onChangeText={setWhatsapp}
              keyboardType="phone-pad"
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={designTokens.secondaryText}
            />

            <Text style={styles.label}>Business Email (Optional)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. contact@myservice.com"
              placeholderTextColor={designTokens.secondaryText}
            />
          </View>
        ) : null}

        {/* STEP 5: Preview & Publish */}
        {step === 5 ? (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Step 5: Review & Publish</Text>
            <Text style={styles.stepSubtitle}>
              Preview your digital card as it will appear across Seivio.
            </Text>

            <VisitingCard provider={previewProvider} templateId="professional" />

            <View style={styles.checklistCard}>
              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.checkText}>Quality & Content Guidelines Verified</Text>
              </View>
              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.checkText}>Digital Visiting Card Automatically Created</Text>
              </View>
              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.checkText}>Printable QR Stickers Activated</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Bottom Navigation Buttons */}
        <View style={styles.btnRow}>
          {step < 5 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} testID="onboarding-next">
              <Text style={styles.nextBtnText}>Continue to Step {step + 1}</Text>
              <Ionicons name="arrow-forward" size={18} color={designTokens.whiteSurface} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, submitting && styles.btnDisabled]}
              onPress={handlePublish}
              disabled={submitting}
              testID="onboarding-publish"
            >
              {submitting ? (
                <ActivityIndicator color={designTokens.whiteSurface} />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>Publish Live Listing</Text>
                  <Ionicons name="checkmark" size={18} color={designTokens.whiteSurface} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.paleBlueBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: designTokens.whiteSurface,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: designTokens.paleBlueBackground,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: designTokens.mainText,
  },
  draftBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: designTokens.lightBlueSurface,
  },
  draftBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: designTokens.primaryBlue,
  },
  progressRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: designTokens.whiteSurface,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
  },
  progressActive: {
    backgroundColor: designTokens.primaryBlue,
  },
  content: {
    padding: 16,
  },
  stepCard: {
    backgroundColor: designTokens.whiteSurface,
    borderRadius: designTokens.cardRadius,
    padding: 18,
    borderWidth: 1,
    borderColor: designTokens.border,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: designTokens.mainText,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 12,
    color: designTokens.secondaryText,
    marginBottom: 16,
    lineHeight: 17,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  catCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: designTokens.border,
    backgroundColor: designTokens.paleBlueBackground,
  },
  catCardActive: {
    backgroundColor: designTokens.primaryBlue,
    borderColor: designTokens.primaryBlue,
  },
  catText: {
    fontSize: 12,
    fontWeight: "700",
    color: designTokens.mainText,
    marginLeft: 8,
    flex: 1,
  },
  catTextActive: {
    color: designTokens.whiteSurface,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: designTokens.mainText,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: designTokens.paleBlueBackground,
    borderRadius: designTokens.inputRadius,
    borderWidth: 1,
    borderColor: designTokens.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: designTokens.mainText,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  checklistCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  checkText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
    marginLeft: 8,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: designTokens.errorBackground,
    borderRadius: designTokens.inputRadius,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: designTokens.errorRed,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
    flex: 1,
  },
  btnRow: {
    marginTop: 8,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: designTokens.primaryBlue,
    borderRadius: designTokens.inputRadius,
    paddingVertical: 14,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  nextBtnText: {
    color: designTokens.whiteSurface,
    fontSize: 14,
    fontWeight: "700",
    marginRight: 6,
  },
});
