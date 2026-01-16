import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";
import { Feather as Icon } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { subscriptionService } from "@/services/subscription";
import { USE_MOCK_PAYMENTS } from "@/services/subscription/config";
import { useAuthStore } from "@/store/auth-store";

// Define SubscriptionPlan type locally - mapped from RevenueCat packages
interface SubscriptionPlan {
  id: string;
  rcPackage?: any; // The actual RevenueCat package object
  identifier: string;
  priceString: string;
  title: string;
  description?: string;
  features: string[];
  bestValue: boolean;
  label: string;
}
import { useSubscriptionStore } from "@/store/subscription-store.js";
import { useRouter } from "expo-router";

interface SubscriptionScreenProps {
  onSubscribed: () => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
  programPreview?: any;
  onCancel?: () => void; // New prop for handling cancel with X button
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  onSubscribed,
  onSkip,
  showSkipOption = false,
  programPreview,
  onCancel,
}) => {
  const router = useRouter();
  const {
    isResubscription,
    getSubscriptionCount,
    refreshSubscriptionStatus,
    hasActiveSubscription,
    isTrialActive,
    getDaysUntilExpiry,
  } = useSubscriptionStore();
  const { restoreFromCloud } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string>(""); // Will be set when plans load
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCancelledWithTimeLeft, setIsCancelledWithTimeLeft] = useState(false);
  const [showCloudRestoreModal, setShowCloudRestoreModal] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState("");
  const [isRestoringCloud, setIsRestoringCloud] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Check if user has active subscription to show X button
  const userHasActiveSubscription = hasActiveSubscription();

  // Load plans from RevenueCat
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setIsLoadingPlans(true);
        const paywallOptions = await subscriptionService.getPaywallOptions();
        setPlans(paywallOptions);
        // Default to the "best value" plan (annual) or first plan
        if (paywallOptions.length > 0) {
          const bestValuePlan = paywallOptions.find((p) => p.bestValue);
          const defaultPlan = bestValuePlan || paywallOptions[0];
          setSelectedPlan(defaultPlan.id);
          console.log(
            "✅ Default plan set to:",
            defaultPlan.id,
            defaultPlan.title
          );
        }
      } catch (error) {
        console.error("Error loading plans:", error);
        Alert.alert(
          "Error",
          "Failed to load subscription plans. Please try again."
        );
      } finally {
        setIsLoadingPlans(false);
      }
    };

    loadPlans();
  }, []);

  // Note: Trial eligibility is now handled by RevenueCat packages

  // Check if user has cancelled subscription with time remaining
  useEffect(() => {
    const checkCancelledStatus = async () => {
      try {
        // Note: Cancellation detection with RevenueCat should use subscription status
        const daysLeft = getDaysUntilExpiry();

        // Show X button if has time remaining (expiring soon)
        setIsCancelledWithTimeLeft(
          daysLeft !== null && daysLeft > 0 && daysLeft <= 7
        );
      } catch (error) {
        console.error("Error checking cancelled status:", error);
        setIsCancelledWithTimeLeft(false);
      }
    };

    checkCancelledStatus();
  }, [getDaysUntilExpiry]);

  const handleCancel = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (onCancel) {
      onCancel();
    }
  };

  // Auto-scroll to selected plan when component mounts
  useEffect(() => {
    if (plans.length === 0) return;

    const timer = setTimeout(() => {
      if (scrollViewRef.current) {
        // Find the index of the selected plan
        const selectedPlanIndex = plans.findIndex(
          (plan) => plan.id === selectedPlan
        );

        if (selectedPlanIndex > 0) {
          // Scroll to approximately where the selected plan should be
          // Each plan card is roughly 200px tall with margins
          const estimatedY = selectedPlanIndex * 220 + 200; // 200px offset for header content

          scrollViewRef.current.scrollTo({
            y: estimatedY,
            animated: true,
          });
        }
      }
    }, 500); // Slightly longer delay to ensure layout is complete

    return () => clearTimeout(timer);
  }, [plans, selectedPlan]);

  const handlePlanSelect = (planId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPlan(planId);
  };

  const handlePurchase = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsProcessing(true);

    try {
      // Purchase the selected package (trials are included in packages if configured in RevenueCat)
      // Find the selected plan's rcPackage object
      const selectedPlanObj = plans.find((p) => p.id === selectedPlan);
      if (!selectedPlanObj) {
        console.error(
          "❌ Selected plan not found. selectedPlan:",
          selectedPlan,
          "Available plans:",
          plans.map((p) => p.id)
        );
        throw new Error("Selected plan not found");
      }

      console.log(
        "✅ Purchasing plan:",
        selectedPlanObj.id,
        selectedPlanObj.title
      );

      // In mock mode, rcPackage won't exist - pass the whole plan object
      const result = await subscriptionService.purchasePackage(
        selectedPlanObj.rcPackage || selectedPlanObj
      );

      if (result.isPro) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Refresh subscription status in the store to get the latest status
        await refreshSubscriptionStatus();

        // Show success message and close subscription screen
        console.log("🎯 Subscription successful - calling onSubscribed");

        setIsProcessing(false);

        // Call onSubscribed to update state in _layout
        onSubscribed();

        Alert.alert(
          "🎉 Welcome to DENSE Pro!",
          "Your subscription is now active. Enjoy unlimited access to your personalized workout programs!",
          [
            {
              text: "Start Training",
              onPress: () => {
                console.log(
                  "🎯 Start Training pressed - state already updated"
                );
              },
            },
          ]
        );
      } else if ("cancelled" in result && result.cancelled) {
        // User cancelled the purchase (only in real RevenueCat mode)
        setIsProcessing(false);
      } else {
        Alert.alert("Payment Failed", "Please try again.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Purchase error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsRestoring(true);

    try {
      const result = await subscriptionService.restorePurchases();

      if (result.isPro) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Show option to also restore cloud data
        Alert.alert(
          "Subscription Restored!",
          "Your subscription has been restored successfully. Do you also want to restore your workout data from iCloud backup?",
          [
            {
              text: "Skip for now",
              style: "cancel",
              onPress: () => {
                setIsRestoring(true);
                setTimeout(() => {
                  onSubscribed();
                }, 100);
              },
            },
            {
              text: "Restore Data",
              onPress: () => {
                setIsRestoring(false);
                setShowCloudRestoreModal(true);
              },
            },
          ]
        );
      } else {
        // No subscription found, offer cloud restore only
        Alert.alert(
          "No Subscription Found",
          "No previous purchases were found. Would you like to restore your workout data from iCloud backup instead?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Restore Data",
              onPress: () => {
                setIsRestoring(false);
                setShowCloudRestoreModal(true);
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
      setIsRestoring(false);
    }
  };

  const handleCloudRestore = async () => {
    if (!restoreEmail.trim()) {
      Alert.alert(
        "Email Required",
        "Please enter the email address associated with your iCloud backup."
      );
      return;
    }

    setIsRestoringCloud(true);

    try {
      const result = await restoreFromCloud(restoreEmail.trim());

      if (result.success) {
        Alert.alert(
          "Data Restored!",
          "Your workout data has been successfully restored from iCloud backup.",
          [
            {
              text: "Continue",
              onPress: () => {
                setShowCloudRestoreModal(false);
                setRestoreEmail("");
                setTimeout(() => {
                  onSubscribed();
                }, 100);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Restore Failed",
          result.error || "No backup data found for this email address."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to restore data. Please try again.");
    } finally {
      setIsRestoringCloud(false);
    }
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan === plan.id;

    return (
      <TouchableOpacity
        key={plan.id}
        style={[styles.planCard, isSelected && styles.planCardSelected]}
        onPress={() => handlePlanSelect(plan.id)}
        disabled={isProcessing}
        activeOpacity={1}
      >
        {plan.bestValue && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>BEST VALUE</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <View style={styles.planNameContainer}>
            <Text style={styles.planName}>
              {plan.label} - {plan.title}
            </Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{plan.priceString}</Text>
          {plan.description && (
            <Text style={styles.monthlyPrice}>{plan.description}</Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Icon name="check" size={16} color={colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.selectionIndicator}>
          <View
            style={[
              styles.radioButton,
              isSelected && styles.radioButtonSelected,
            ]}
          >
            {isSelected && <View style={styles.radioButtonInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            {/* X Button - Show if user has active subscription OR cancelled with time remaining */}
            {(userHasActiveSubscription || isCancelledWithTimeLeft) &&
              onCancel && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCancel}
                  activeOpacity={1}
                >
                  <Icon name="x" size={24} color={colors.lightGray} />
                </TouchableOpacity>
              )}

            <View style={styles.iconContainer}>
              <Icon name="zap" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Unlock Your Custom Program</Text>
            <Text style={styles.subtitle}>
              Get unlimited access to AI-generated workout programs tailored
              specifically for your goals
            </Text>
          </View>

          {/* Subscription Plans */}
          <View style={styles.plansContainer}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            {isLoadingPlans ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginVertical: 32 }}
              />
            ) : plans.length > 0 ? (
              plans.map((plan) => renderPlanCard(plan))
            ) : (
              <Text
                style={[
                  styles.sectionTitle,
                  { fontSize: 14, color: colors.lightGray },
                ]}
              >
                No plans available. Please try again later.
              </Text>
            )}
          </View>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Why DENSE Pro?</Text>
            <View style={styles.benefitRow}>
              <Icon name="trending-up" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>
                Real-time progress tracking
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Icon name="smartphone" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>Works completely offline</Text>
            </View>
            <View style={styles.benefitRow}>
              <Icon name="users" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>
                Based on DENSE training philosophy
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              isProcessing && styles.subscribeButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={isProcessing}
            activeOpacity={1}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <>
                <Text style={styles.subscribeButtonText}>
                  {(() => {
                    const plan = plans.find((p) => p.id === selectedPlan);
                    if (!plan) return "Subscribe Now";

                    // Show the plan's price
                    return `Subscribe - ${plan.priceString}`;
                  })()}
                </Text>
                <Icon name="arrow-right" size={20} color={colors.black} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footerLinks}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleRestorePurchases}
              disabled={isRestoring}
              activeOpacity={1}
            >
              <Text style={styles.linkText}>
                {isRestoring ? "Restoring..." : "Restore Purchases"}
              </Text>
            </TouchableOpacity>

            {showSkipOption && onSkip && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={onSkip}
                activeOpacity={1}
              >
                <Text style={styles.linkText}>Maybe Later</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.disclaimer}>
            🔒 Secure payment powered by{" "}
            {Platform.OS === "ios" ? "Apple" : "Google"}{" "}
            {__DEV__ && USE_MOCK_PAYMENTS ? "(Mock Mode - No charges)" : ""}
          </Text>
        </View>

        {/* Loading Overlay */}
        {(isProcessing || isRestoring) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {isProcessing ? "Starting your journey..." : "Loading..."}
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* Cloud Restore Modal */}
      <Modal
        visible={showCloudRestoreModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCloudRestoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Restore from iCloud</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCloudRestoreModal(false)}
                activeOpacity={1}
              >
                <Icon name="x" size={24} color={colors.lightGray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter the email address associated with your iCloud backup to
              restore your workout data, nutrition logs, and progress.
            </Text>

            <TextInput
              style={styles.emailInput}
              placeholder="Enter your iCloud email address"
              placeholderTextColor={colors.lightGray}
              value={restoreEmail}
              onChangeText={setRestoreEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCloudRestoreModal(false)}
                activeOpacity={1}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalRestoreButton,
                  isRestoringCloud && styles.modalRestoreButtonDisabled,
                ]}
                onPress={handleCloudRestore}
                disabled={isRestoringCloud}
                activeOpacity={1}
              >
                {isRestoringCloud ? (
                  <ActivityIndicator size="small" color={colors.black} />
                ) : (
                  <Text style={styles.modalRestoreText}>Restore Data</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 0,
    left: 0,
    padding: 12,
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.darkGray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    color: colors.lighterGray,
    textAlign: "center",
    lineHeight: 24,
  },
  plansContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 20,
    textAlign: "center",
  },
  planCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.darkGray,
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: "center",
  },
  popularText: {
    ...typography.caption,
    color: colors.black,
    textAlign: "center",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginBottom: 12,
    marginRight: 50, // Leave space for the selection circle
  },
  planNameContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
  savingsBadge: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  savingsText: {
    ...typography.caption,
    color: colors.black,
  },
  priceContainer: {
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
  },
  monthlyPrice: {
    fontSize: 16,
    color: colors.lighterGray,
    marginTop: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.lightGray,
    textDecorationLine: "line-through",
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.white,
    marginLeft: 12,
    flex: 1,
  },
  bonusFeatureRow: {
    marginBottom: 6,
  },
  bonusFeatureText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  selectionIndicator: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  benefitsContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 16,
    textAlign: "center",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: colors.white,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    borderRadius: 16,
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    ...typography.button,
    color: colors.black,
    marginRight: 8,
    textAlign: "center",
    lineHeight: 20,
  },

  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.lightGray,
  },
  orText: {
    fontSize: 14,
    color: colors.lightGray,
    marginHorizontal: 16,
    fontWeight: "500",
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginBottom: 16,
  },
  linkButton: {
    padding: 8,
  },
  linkText: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: "center",
  },
  disclaimer: {
    fontSize: 12,
    color: colors.lightGray,
    textAlign: "center",
    fontStyle: "italic",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.white,
    marginTop: 16,
  },

  // Cloud Restore Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.darkGray,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    ...typography.body,
    color: colors.lightGray,
    marginBottom: 24,
    lineHeight: 22,
  },
  emailInput: {
    backgroundColor: colors.dark,
    borderColor: colors.lightGray,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.dark,
    borderColor: colors.lightGray,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.lightGray,
  },
  modalRestoreButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalRestoreButtonDisabled: {
    opacity: 0.6,
  },
  modalRestoreText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.black,
  },
});
