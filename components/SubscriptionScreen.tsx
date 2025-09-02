import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { subscriptionService, SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/services/subscription-service';
import { useSubscriptionStore } from '@/store/subscription-store';
import { useRouter } from 'expo-router';

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
  onCancel 
}) => {
  const router = useRouter();
  const { 
    isResubscription, 
    getSubscriptionCount, 
    refreshSubscriptionStatus, 
    hasActiveSubscription,
    canStartTrial,
    startFreeTrial,
    isTrialActive,
    getDaysUntilExpiry
  } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly'); // Default to popular Annual Pro plan
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [canUserStartTrial, setCanUserStartTrial] = useState(false);
  const [isCancelledWithTimeLeft, setIsCancelledWithTimeLeft] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Check if user has active subscription to show X button
  const userHasActiveSubscription = hasActiveSubscription();

  // Check if user can start trial on component mount  
  useEffect(() => {
    const checkTrialEligibility = async () => {
      try {
        const canStart = await canStartTrial();
        setCanUserStartTrial(canStart);
      } catch (error) {
        console.error('Error checking trial eligibility:', error);
        setCanUserStartTrial(false);
      }
    };

    checkTrialEligibility();
  }, [canStartTrial]);

  // Check if user has cancelled subscription with time remaining
  useEffect(() => {
    const checkCancelledStatus = async () => {
      try {
        const isCancelled = await subscriptionService.isSubscriptionCancelled();
        const daysLeft = getDaysUntilExpiry();
        
        // Show X button if cancelled and has time remaining
        setIsCancelledWithTimeLeft(isCancelled && daysLeft !== null && daysLeft > 0);
      } catch (error) {
        console.error('Error checking cancelled status:', error);
        setIsCancelledWithTimeLeft(false);
      }
    };

    checkCancelledStatus();
  }, [getDaysUntilExpiry]);

  const handleCancel = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (onCancel) {
      onCancel();
    }
  };

  // Auto-scroll to selected plan when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollViewRef.current) {
        // Find the index of the selected plan
        const selectedPlanIndex = SUBSCRIPTION_PLANS.findIndex(plan => plan.id === selectedPlan);
        
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
  }, []);

  const handlePlanSelect = (planId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPlan(planId);
  };

  const handlePurchase = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsProcessing(true);

    try {
      // First, try to start free trial
      const canStart = await canStartTrial();
      
      if (canStart) {
        // Start the 7-day free trial
        const trialResult = await startFreeTrial();
        
        if (trialResult.success) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          
          // Show trial started message
          const plan = subscriptionService.getPlan(selectedPlan);
          const planText = plan?.duration === 1 ? `$${plan?.price}/month` : `$${plan?.price}/year`;
          
          console.log('🎯 Showing Free Trial Started message');
          Alert.alert(
            '🎉 Free Trial Started!',
            `Welcome to your 7-day free trial of DENSE Pro! You now have full access to all premium features. After 7 days, your subscription will continue at ${planText}.`,
            [{ text: 'Start Training', onPress: () => {
              console.log('🎯 Trial Start Training pressed - navigating directly to home');
              setIsProcessing(false);
              
              // Force navigation directly to home page, bypassing any wizard logic
              setTimeout(() => {
                router.replace('/(tabs)');
                console.log('🎯 Direct navigation to home from trial completion');
              }, 200);
              
              // Also call onSubscribed for any cleanup
              onSubscribed();
            }}]
          );
          return;
        }
      }
      
      // If trial can't be started, proceed with regular purchase
      const result = await subscriptionService.purchasePlan(selectedPlan);
      
      if (result.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Refresh subscription status in the store to get the latest status
        await refreshSubscriptionStatus();
        
        // Always show first-time subscription message and go directly to home
        console.log('🎯 Showing Welcome to DENSE Pro message (NOT Welcome Back)');
        Alert.alert(
          '🎉 Welcome to DENSE Pro!',
          'Your subscription is now active. Enjoy unlimited access to your personalized workout programs!',
          [{ text: 'Start Training', onPress: () => {
            console.log('🎯 Start Training pressed - navigating directly to home');
            setIsProcessing(false);
            
            // Force navigation directly to home page, bypassing any wizard logic
            setTimeout(() => {
              router.replace('/(tabs)');
              console.log('🎯 Direct navigation to home from subscription screen');
            }, 200);
            
            // Also call onSubscribed for any cleanup
            onSubscribed();
          }}]
        );
      } else {
        Alert.alert('Payment Failed', result.error || 'Please try again.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };



  const handleRestorePurchases = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsRestoring(true);

    try {
      const result = await subscriptionService.restorePurchases();
      
      if (result.restored > 0) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        Alert.alert(
          'Purchases Restored!',
          'Your subscription has been restored successfully.',
          [{ text: 'Continue', onPress: () => {
            setIsRestoring(true);
            setTimeout(() => {
              onSubscribed();
            }, 100);
          }}]
        );
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
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
      >
        {plan.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <View style={styles.planNameContainer}>
            <Text style={styles.planName}>{plan.name}</Text>
            {plan.savingsPercentage > 0 && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>Save {plan.savingsPercentage}%</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${plan.price}</Text>
          {plan.duration > 1 && (
            <Text style={styles.monthlyPrice}>${plan.monthlyPrice}/month</Text>
          )}
          {plan.originalPrice > plan.price && (
            <Text style={styles.originalPrice}>${plan.originalPrice}</Text>
          )}
        </View>
        
        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Icon name="check" size={16} color={colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          
          {plan.bonusFeatures && plan.bonusFeatures.map((bonus, index) => (
            <View key={`bonus-${index}`} style={styles.bonusFeatureRow}>
              <Text style={styles.bonusFeatureText}>{bonus}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.selectionIndicator}>
          <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
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
            {(userHasActiveSubscription || isCancelledWithTimeLeft) && onCancel && (
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCancel}
              >
                <Icon name="x" size={24} color={colors.lightGray} />
              </TouchableOpacity>
            )}
            
            <View style={styles.iconContainer}>
              <Icon name="zap" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Unlock Your Custom Program</Text>
            <Text style={styles.subtitle}>
              Get unlimited access to AI-generated workout programs tailored specifically for your goals
            </Text>
          </View>

          {/* Program Preview Teaser */}
          {programPreview && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Your Program is Ready!</Text>
              <View style={styles.previewBox}>
                <Text style={styles.previewName}>{programPreview.displayTitle || programPreview.programName}</Text>
                <Text style={styles.previewDescription}>
                  Custom {programPreview.split || 'Split'} • {programPreview.weeks?.length || 12} weeks
                </Text>
                <View style={styles.blurOverlay}>
                  <Icon name="lock" size={32} color={colors.white} />
                  <Text style={styles.blurText}>Subscribe to unlock</Text>
                </View>
              </View>
            </View>
          )}

          {/* Subscription Plans */}
          <View style={styles.plansContainer}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            {SUBSCRIPTION_PLANS.map(plan => renderPlanCard(plan))}
          </View>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Why DENSE Pro?</Text>
            <View style={styles.benefitRow}>
              <Icon name="target" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>AI-powered program generation</Text>
            </View>
            <View style={styles.benefitRow}>
              <Icon name="trending-up" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>Real-time progress tracking</Text>
            </View>
            <View style={styles.benefitRow}>
              <Icon name="smartphone" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>Works completely offline</Text>
            </View>
            <View style={styles.benefitRow}>
              <Icon name="users" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>Based on DENSE training philosophy</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>


          <TouchableOpacity
            style={[styles.subscribeButton, isProcessing && styles.subscribeButtonDisabled]}
            onPress={handlePurchase}
            disabled={isProcessing || isStartingTrial}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <>
                <Text style={styles.subscribeButtonText}>
                  {(() => {
                    const plan = subscriptionService.getPlan(selectedPlan);
                    if (!plan) return 'Start 7-Day Free Trial';
                    
                    if (plan.duration === 1) {
                      return `Start 7-Day Free Trial\nThen $${plan.price}/month`;
                    } else {
                      return `Start 7-Day Free Trial\nThen $${plan.price}/year`;
                    }
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
            >
              <Text style={styles.linkText}>
                {isRestoring ? 'Restoring...' : 'Restore Purchases'}
              </Text>
            </TouchableOpacity>

            {showSkipOption && onSkip && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={onSkip}
              >
                <Text style={styles.linkText}>Maybe Later</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.disclaimer}>
            🔒 {subscriptionService.getPaymentProviderInfo().displayName} - {subscriptionService.getPaymentProviderInfo().provider === 'mock' ? 'No actual charges will be made.' : 'Real charges will occur.'}
          </Text>
        </View>
        
        {/* Loading Overlay */}
        {(isProcessing || isRestoring) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {isProcessing ? 'Starting your journey...' : 'Loading...'}
            </Text>
          </View>
        )}
      </SafeAreaView>
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
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    color: colors.lighterGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  previewContainer: {
    marginBottom: 32,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  previewBox: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  previewName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: colors.lighterGray,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  plansContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.darkGray,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  popularText: {
    ...typography.caption,
    color: colors.black,
    textAlign: 'center',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginRight: 50, // Leave space for the selection circle
  },
  planNameContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  savingsBadge: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
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
    fontWeight: 'bold',
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
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    ...typography.button,
    color: colors.black,
    marginRight: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 16,
  },
  linkButton: {
    padding: 8,
  },
  linkText: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.lightGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.white,
    marginTop: 16,
  },
});
